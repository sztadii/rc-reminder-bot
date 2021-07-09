import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'
import GithubService, { OrganizationRepos } from './services/github-service'
import SlackBotService from './services/slackbot-service'
import { handlePromise, getFirstTrueProperty } from './helpers'

type RepoInfo = {
  repoName: string
  commitsCount: number
  authors: string[]
  delay: number
}

type RCBotConfig = {
  baseBranch: string
  headBranch: string
  organization: string
  sendNotificationEvenAllSuccess?: boolean
}

export default class RCBot {
  constructor(
    private config: RCBotConfig,
    private githubService: GithubService,
    private slackBotService: SlackBotService
  ) {
    this.config = {
      ...config,
      sendNotificationEvenAllSuccess: config.sendNotificationEvenAllSuccess ?? true
    }
    this.validateConfigValues()
  }

  private validateConfigValues(): void {
    const validationMessage = getFirstTrueProperty({
      'organization is empty :(': !this.config.organization.length,
      'headBranch is empty :(': !this.config.headBranch.length,
      'baseBranch is empty :(': !this.config.baseBranch.length
    })

    if (validationMessage) {
      throw new Error(validationMessage)
    }
  }

  public async checkBranches(): Promise<void> {
    console.log('\nStart running checkBranches script \n')

    const [allOrganizationRepos, error] = await handlePromise(
      this.githubService.getAllOrganizationRepos(this.config.organization)
    )

    const validationMessage = getFirstTrueProperty({
      'Something went wrong during fetching organization repos :(': !!error,
      'Organization do not have any repos :(': !allOrganizationRepos?.length
    })

    if (validationMessage) {
      await this.slackBotService.postMessageToReminderChannel(validationMessage)
      return
    }

    const infosFromAffectedBranches = await this.getInfosFromAffectedBranches(allOrganizationRepos)

    if (infosFromAffectedBranches.length) {
      const reminderMessage = this.getReminderMessage(infosFromAffectedBranches)
      await this.slackBotService.postMessageToReminderChannel(reminderMessage)
      return
    }

    if (!this.config.sendNotificationEvenAllSuccess) return

    const goodJobMessage = 'All your repos are looking well. Good job team :)'
    await this.slackBotService.postMessageToReminderChannel(goodJobMessage)
  }

  private async getInfosFromAffectedBranches(repos: OrganizationRepos): Promise<RepoInfo[]> {
    const allBranchesResponses = repos.map(async (repo) => {
      const [compareData] = await handlePromise(
        this.githubService.compareTwoBranches({
          owner: repo.owner.login,
          repo: repo.name,
          base: this.config.baseBranch,
          head: this.config.headBranch
        })
      )

      const { files = [], commits: rawCommits = [] } = compareData?.data || {}
      const commits = rawCommits.filter((rawCommit) => rawCommit.commit.committer.name !== 'Github')
      const allAuthors = commits.map((commit) => commit?.author?.login).filter(Boolean)
      const authors = [...new Set(allAuthors)]
      const hasDataToProcess = files.length && commits.length && !repo.archived

      if (!hasDataToProcess) return

      // TODO Create separate function to get current date and allow to mock returned value
      // It will improve the way that we test the app
      const current = new Date()
      const past = new Date(commits[0].commit.committer.date)
      const firstCommitDelayInDays = differenceInCalendarDays(current, past)

      return {
        repoName: repo.name,
        commitsCount: commits.length,
        authors,
        delay: firstCommitDelayInDays
      }
    })

    const allBranchesInfos = await Promise.all(allBranchesResponses)
    return allBranchesInfos.filter(Boolean)
  }

  private getReminderMessage(repos: RepoInfo[]): string {
    let message =
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. ' +
      `PLEASE MERGE ${this.config.headBranch.toUpperCase()} TO ${this.config.baseBranch.toUpperCase()} BRANCH.\n`

    repos.forEach((repo) => {
      const { authors, repoName, commitsCount } = repo

      const authorTitle = `Author${authors.length > 1 ? 's' : ''}`
      const commitTitle = `commit${commitsCount > 1 ? 's' : ''}`
      const userTitle = `${authors.join(', ')}`
      message += '-----------------\n'
      message += `Repo: ${repoName}\n`
      message += `${authorTitle} of not updated ${commitTitle}: ${userTitle}\n`

      if (repo.delay) message += `Delay: ${repo.delay} day${repo.delay > 1 ? 's' : ''}\n`
    })

    return message
  }
}

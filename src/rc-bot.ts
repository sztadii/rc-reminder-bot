import moment from 'moment'
import GithubService, { OrganizationRepos } from './services/github-service'
import SlackBotService from './services/slackbot-service'
import handlePromise from './helpers/handle-promise'

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
  sendAllSuccessConfirmation?: boolean
}

export default class RCBot {
  constructor(
    private config: RCBotConfig,
    private githubService: GithubService,
    private slackBotService: SlackBotService
  ) {
    this.config = {
      ...config,
      sendAllSuccessConfirmation: config.sendAllSuccessConfirmation ?? true
    }
    this.validateConfigValues(config)
  }

  private validateConfigValues(config: RCBotConfig): void {
    if (!config.organization.length) {
      throw new Error('organization is empty :(')
    }

    if (!config.headBranch.length) {
      throw new Error('headBranch is empty :(')
    }

    if (!config.baseBranch.length) {
      throw new Error('baseBranch is empty :(')
    }
  }

  public async checkBranches(): Promise<void> {
    console.log('\nStart running checkBranches script \n')

    const [allOrganizationRepos, error] = await handlePromise(
      this.githubService.getAllOrganizationRepos(this.config.organization)
    )

    if (error) {
      await this.slackBotService.postMessageToReminderChannel(
        'Something went wrong during fetching organization repos :('
      )
      return
    }

    if (!allOrganizationRepos.length) {
      await this.slackBotService.postMessageToReminderChannel(
        'Organization do not have any repos :('
      )
      return
    }

    const infosFromAffectedBranches = await this.getInfosFromAffectedBranches(allOrganizationRepos)

    if (infosFromAffectedBranches.length) {
      const reminderMessage = this.getReminderMessage(infosFromAffectedBranches)
      await this.slackBotService.postMessageToReminderChannel(reminderMessage)
      return
    }

    if (!this.config.sendAllSuccessConfirmation) return

    const goodJobMessage = 'All your repos are looking well. Good job team :)'
    await this.slackBotService.postMessageToReminderChannel(goodJobMessage)
  }

  private async getInfosFromAffectedBranches(repos: OrganizationRepos): Promise<RepoInfo[]> {
    const allBranchesResponses = repos.map(async (repo) => {
      if (repo.archived) return

      const [compareData, error] = await handlePromise(
        this.githubService.compareTwoBranches({
          owner: repo.owner.login,
          repo: repo.name,
          base: this.config.baseBranch,
          head: this.config.headBranch
        })
      )

      if (error) return

      const { files = [], commits: rawCommits = [] } = compareData.data

      if (!files.length) return

      const commits = rawCommits.filter((rawCommit) => rawCommit.commit.committer.name !== 'Github')
      const allAuthors = commits.map((commit) => commit?.author?.login).filter(Boolean)
      const authors = [...new Set(allAuthors)]

      if (!commits.length) return

      const current = moment()
      const past = moment(commits[0].commit.committer.date)
      const firstCommitDelay = current.diff(past, 'days')

      return {
        repoName: repo.name,
        commitsCount: commits.length,
        authors,
        delay: firstCommitDelay
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

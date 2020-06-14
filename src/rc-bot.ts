import moment from 'moment'
import { getAllOrganizationRepos, compareTwoBranches } from './services/github-service'
import { postMessageToReminderChannel } from './services/slackbot-service'
import { ReposListForOrgResponseData } from '@octokit/types'

type RepoInfo = {
  repoName: string
  commitsCount: number
  authors: string[]
  delay: number
}

const baseBranch = process.env.BASE_BRANCH
const headBranch = process.env.HEAD_BRANCH

export default async function rcBot(): Promise<void> {
  try {
    const organization = process.env.ORGANIZATION_NAME
    const allOrganizationRepos = await getAllOrganizationRepos(organization)
    const infosFromAffectedBranches = await getInfosFromAffectedBranches(allOrganizationRepos)

    if (!infosFromAffectedBranches.length) {
      const goodJobMessage = 'All your repos are looking well. Good job team :)'
      await postMessageToReminderChannel(goodJobMessage)
      return
    }

    const reminderMessage = getReminderMessage(infosFromAffectedBranches)
    await postMessageToReminderChannel(reminderMessage)
  } catch (e) {
    console.error('===')
    console.error('Something went wrong')
    console.error(e)
    console.error('===')
  }
}

async function getInfosFromAffectedBranches(
  repos: ReposListForOrgResponseData
): Promise<RepoInfo[]> {
  const allBranchesResponses = repos.map(async (repo) => {
    if (repo.archived) return null

    try {
      const compareData = await compareTwoBranches({
        owner: repo.owner.login,
        repo: repo.name,
        base: baseBranch,
        head: headBranch
      })

      const { files = [], commits = [] } = compareData.data

      if (!files.length) return null

      const allAuthors = commits.map((commit) => commit?.author?.login).filter(Boolean)
      const authors = [...new Set(allAuthors)]

      const current = moment()
      const past = moment(commits[0].commit.committer.date)
      const firstCommitDelay = current.diff(past, 'days')

      return {
        repoName: repo.name,
        commitsCount: commits.length,
        authors,
        delay: firstCommitDelay
      }
    } catch (e) {
      return null
    }
  })

  const allBranchesInfos = await Promise.all(allBranchesResponses)
  return allBranchesInfos.filter(Boolean)
}

function getReminderMessage(repos: RepoInfo[]): string {
  let message = ''

  if (repos.length) {
    message +=
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. ' +
      `PLEASE MERGE ${headBranch.toUpperCase()} TO ${baseBranch.toUpperCase()} BRANCH.\n`

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
  }

  return message
}

import { Octokit } from '@octokit/rest'
import { ReposListForOrgResponseData } from '@octokit/types/dist-types/generated/Endpoints'

const githubService = new Octokit({ auth: process.env.GH_ACCESS_TOKEN })

export async function getAllOrganizationRepos(
  organization: string
): Promise<ReposListForOrgResponseData> {
  const { data: repos } = await githubService.repos.listForOrg({
    org: organization
  })
  return repos
}

export const compareTwoBranches = githubService.repos.compareCommits

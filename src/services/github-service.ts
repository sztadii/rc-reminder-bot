import { Octokit } from '@octokit/rest'
import { ReposListForOrgResponseData } from '@octokit/types/dist-types/generated/Endpoints'

export default class GithubService {
  private githubService = new Octokit({ auth: process.env.GH_ACCESS_TOKEN })

  async getAllOrganizationRepos(organization: string): Promise<ReposListForOrgResponseData> {
    const { data: repos } = await this.githubService.repos.listForOrg({
      org: organization
    })
    return repos
  }

  compareTwoBranches = this.githubService.repos.compareCommits
}

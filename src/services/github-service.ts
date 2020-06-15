import { Octokit } from '@octokit/rest'
import { ReposListForOrgResponseData } from '@octokit/types/dist-types/generated/Endpoints'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'

type compareTwoBranchesParams = RestEndpointMethodTypes['repos']['compareCommits']['parameters']
type compareTwoBranchesResponse = RestEndpointMethodTypes['repos']['compareCommits']['response']

export default class GithubService {
  private githubService: Octokit

  constructor(accessToken = '') {
    this.githubService = new Octokit({ auth: accessToken })
  }

  async getAllOrganizationRepos(organization: string): Promise<ReposListForOrgResponseData> {
    const { data: repos } = await this.githubService.repos.listForOrg({
      org: organization
    })
    return repos
  }

  compareTwoBranches(params: compareTwoBranchesParams): Promise<compareTwoBranchesResponse> {
    return this.githubService.repos.compareCommits(params)
  }
}

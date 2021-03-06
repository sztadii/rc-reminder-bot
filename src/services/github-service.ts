import { Octokit } from '@octokit/rest'
import { ReposListForOrgResponseData } from '@octokit/types/dist-types/generated/Endpoints'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'

type CompareTwoBranchesParams = RestEndpointMethodTypes['repos']['compareCommits']['parameters']
type CompareTwoBranchesResponse = RestEndpointMethodTypes['repos']['compareCommits']['response']

export type OrganizationRepos = ReposListForOrgResponseData

export default class GithubService {
  private githubService: Octokit

  constructor(accessToken: string) {
    if (!accessToken?.length) {
      throw new Error('accessToken is empty :(')
    }
    this.githubService = new Octokit({ auth: accessToken })
  }

  async getAllOrganizationRepos(organization: string): Promise<OrganizationRepos> {
    const allRepos = []
    let canFetchMoreData = true

    for (let i = 1; canFetchMoreData; i++) {
      console.log(`Fetching repos from page nr ${i}`)

      const { data: repos } = await this.githubService.repos.listForOrg({
        org: organization,
        page: i,
        per_page: 100 // GITHUB API is not allowing to fetch more that 100
      })
      canFetchMoreData = !!repos.length
      allRepos.push(...repos)
    }

    console.log(`Fetched ${allRepos.length} repos \n`)

    return allRepos
  }

  compareTwoBranches(params: CompareTwoBranchesParams): Promise<CompareTwoBranchesResponse> {
    return this.githubService.repos.compareCommits(params)
  }
}

import moment from 'moment'
import rcBot from './rc-bot'
import * as githubService from './services/github-service'
import * as slackService from './services/slackbot-service'

jest.mock('./services/github-service')
jest.mock('./services/slackbot-service')

const mockedGithubService = githubService as jest.Mocked<typeof githubService>
const mockedSlackService = slackService as jest.Mocked<typeof slackService>

function getAllOrganizationReposMock(mockRepos) {
  mockedGithubService.getAllOrganizationRepos.mockResolvedValueOnce(mockRepos)
}

function getAllOrganizationReposErrorMock() {
  mockedGithubService.getAllOrganizationRepos.mockRejectedValue('500 error')
}

function compareTwoBranchesMock(mockCompareData) {
  mockedGithubService.compareTwoBranches.mockResolvedValueOnce(mockCompareData)
}

beforeEach(jest.resetAllMocks)

describe('rc-bot', () => {
  it('send message to the slack channel about not updated repositories', async () => {
    const allRepos = [
      { name: 'react', owner: { login: 'facebook' } },
      { name: 'typescript', owner: { login: 'microsoft' } }
    ]

    const firstCompare = {
      data: {
        files: ['some.js'],
        commits: [
          {
            author: {
              login: 'Iron Man'
            },
            commit: {
              committer: {
                date: moment().subtract(10, 'days')
              }
            }
          }
        ]
      }
    }

    const secondCompare = {
      data: {
        files: ['some.js'],
        commits: [
          {
            author: {
              login: 'Hulk'
            },
            commit: {
              committer: {
                date: moment().subtract(5, 'days')
              }
            }
          }
        ]
      }
    }

    getAllOrganizationReposMock(allRepos)
    compareTwoBranchesMock(firstCompare)
    compareTwoBranchesMock(secondCompare)

    await rcBot()

    expect(mockedSlackService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage =
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. PLEASE MERGE RC TO DEVELOP BRANCH.\n' +
      '-----------------\n' +
      'Repo: react\n' +
      'Author of not updated commit: Iron Man\n' +
      'Delay: 10 days\n' +
      '-----------------\n' +
      'Repo: typescript\n' +
      'Author of not updated commit: Hulk\n' +
      'Delay: 5 days\n'

    expect(mockedSlackService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })

  it('do not send any message to the slack channel if compared branches have no difference', async () => {
    const allRepos = [{ name: 'react', owner: { login: 'facebook' } }]
    const firstCompare = { data: { files: [] } }

    getAllOrganizationReposMock(allRepos)
    compareTwoBranchesMock(firstCompare)

    await rcBot()

    expect(mockedSlackService.postMessageToReminderChannel).toHaveBeenCalledTimes(0)
  })

  it('do not send any message to the slack channel if github api throw an error', async () => {
    getAllOrganizationReposErrorMock()

    await rcBot()

    expect(mockedSlackService.postMessageToReminderChannel).toHaveBeenCalledTimes(0)
  })

  it('send message only about active repos', async () => {
    const allRepos = [
      { name: 'react', owner: { login: 'facebook' } },
      { name: 'angular-js', owner: { login: 'google' }, archived: true }
    ]

    const firstCompare = {
      data: {
        files: ['some.js'],
        commits: [
          {
            author: {
              login: 'Thor'
            },
            commit: {
              committer: {
                date: moment().subtract(666, 'days')
              }
            }
          }
        ]
      }
    }

    getAllOrganizationReposMock(allRepos)
    compareTwoBranchesMock(firstCompare)
    compareTwoBranchesMock(firstCompare)

    await rcBot()

    expect(mockedSlackService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage =
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. PLEASE MERGE RC TO DEVELOP BRANCH.\n' +
      '-----------------\n' +
      'Repo: react\n' +
      'Author of not updated commit: Thor\n' +
      'Delay: 666 days\n'

    expect(mockedSlackService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })
})

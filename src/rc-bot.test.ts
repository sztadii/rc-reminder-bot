import moment from 'moment'
import RCBot from './rc-bot'
import SlackBotService from './services/slackbot-service'
import GithubService from './services/github-service'

describe('RCBot', () => {
  let rcBot: RCBot
  let slackBotService: SlackBotService
  let githubService: GithubService

  beforeEach(() => {
    slackBotService = new SlackBotService()
    githubService = new GithubService()
    rcBot = new RCBot(
      {
        organization: 'Spotify',
        baseBranch: 'develop',
        headBranch: 'master'
      },
      githubService,
      slackBotService
    )

    slackBotService.postMessageToReminderChannel = jest.fn()
  })

  function mockAllValues(allRepos, firstCompare = undefined, secondCompare = undefined) {
    jest.spyOn(githubService, 'getAllOrganizationRepos').mockImplementationOnce(() => allRepos)
    jest.spyOn(githubService, 'compareTwoBranches').mockImplementationOnce(() => firstCompare)
    jest.spyOn(githubService, 'compareTwoBranches').mockImplementationOnce(() => secondCompare)
  }

  it('send message to the slack channel about not updated repositories', async () => {
    const allRepos = [
      { name: 'react', owner: { login: 'facebook' } },
      { name: 'typescript', owner: { login: 'microsoft' } }
    ]

    const firstBranchDiff = {
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

    const secondBranchDiff = {
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

    mockAllValues(allRepos, firstBranchDiff, secondBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage =
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. PLEASE MERGE MASTER TO DEVELOP BRANCH.\n' +
      '-----------------\n' +
      'Repo: react\n' +
      'Author of not updated commit: Iron Man\n' +
      'Delay: 10 days\n' +
      '-----------------\n' +
      'Repo: typescript\n' +
      'Author of not updated commit: Hulk\n' +
      'Delay: 5 days\n'

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })

  it('send `good job` message if all repos are correctly updated', async () => {
    const allRepos = [{ name: 'react', owner: { login: 'facebook' } }]
    const firstBranchDiff = { data: { files: [] } }

    mockAllValues(allRepos, firstBranchDiff)

    await rcBot.checkBranches()

    const expectedMessage = 'All your repos are looking well. Good job team :)'
    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)
    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })

  it('do not send any message to the slack channel if github api throw an error', async () => {
    mockAllValues(() => {
      throw new Error('500')
    })

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(0)
  })

  it('send message only about active repos', async () => {
    const allRepos = [
      { name: 'react', owner: { login: 'facebook' } },
      { name: 'angular-js', owner: { login: 'google' }, archived: true }
    ]

    const firstBranchDiff = {
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

    mockAllValues(allRepos, firstBranchDiff, firstBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage =
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. PLEASE MERGE MASTER TO DEVELOP BRANCH.\n' +
      '-----------------\n' +
      'Repo: react\n' +
      'Author of not updated commit: Thor\n' +
      'Delay: 666 days\n'

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })
})

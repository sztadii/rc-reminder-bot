import moment from 'moment'
import RCBot from './rc-bot'
import SlackBotService from './services/slackbot-service'
import GithubService from './services/github-service'

describe('RCBot', () => {
  let rcBot: RCBot
  let slackBotService: SlackBotService
  let githubService: GithubService

  beforeEach(() => {
    slackBotService = new SlackBotService('mock')
    githubService = new GithubService('mock')
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

  it('call githubService with arguments passed as a config', async () => {
    const allRepos = [{ name: 'typescript', owner: { login: 'Github' } }]

    const firstBranchDiff = {
      data: {
        files: ['some.js'],
        commits: [
          {
            author: {
              login: 'Batman'
            },
            commit: {
              committer: {
                name: 'Chris'
              }
            }
          }
        ]
      }
    }

    mockAllValues(allRepos, firstBranchDiff)

    rcBot = new RCBot(
      {
        organization: 'Github',
        baseBranch: 'replica',
        headBranch: 'main'
      },
      githubService,
      slackBotService
    )
    await rcBot.checkBranches()

    expect(githubService.getAllOrganizationRepos).toHaveBeenCalledTimes(1)
    expect(githubService.getAllOrganizationRepos).toHaveBeenCalledWith('Github')

    expect(githubService.compareTwoBranches).toHaveBeenCalledTimes(1)
    expect(githubService.compareTwoBranches).toHaveBeenCalledWith({
      base: 'replica',
      head: 'main',
      owner: 'Github',
      repo: 'typescript'
    })
  })

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

  it('do not send `good job` message if sendAllSuccessConfirmation flag has false value', async () => {
    const allRepos = [{ name: 'react', owner: { login: 'facebook' } }]
    const firstBranchDiff = { data: { files: [] } }

    mockAllValues(allRepos, firstBranchDiff)

    rcBot = new RCBot(
      {
        organization: 'Spotify',
        baseBranch: 'develop',
        headBranch: 'master',
        sendNotificationEvenAllSuccess: false
      },
      githubService,
      slackBotService
    )

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(0)
  })

  it('send error message when something went wrong during fetching organization repos', async () => {
    mockAllValues(Promise.reject('500'))

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)
    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(
      'Something went wrong during fetching organization repos :('
    )
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

  it('works well with different branches', async () => {
    const allRepos = [{ name: 'react', owner: { login: 'facebook' } }]

    const firstBranchDiff = {
      data: {
        files: ['some.js'],
        commits: [
          {
            author: {
              login: 'Batman'
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

    mockAllValues(allRepos, firstBranchDiff)

    rcBot = new RCBot(
      {
        organization: 'Github',
        baseBranch: 'replica',
        headBranch: 'main'
      },
      githubService,
      slackBotService
    )
    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage =
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. PLEASE MERGE MAIN TO REPLICA BRANCH.\n' +
      '-----------------\n' +
      'Repo: react\n' +
      'Author of not updated commit: Batman\n' +
      'Delay: 5 days\n'

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })

  it('do not display commits delay in slack message if is equal 0', async () => {
    const allRepos = [{ name: 'react', owner: { login: 'facebook' } }]

    const firstBranchDiff = {
      data: {
        files: ['some.js'],
        commits: [
          {
            author: {
              login: 'Capitan America'
            },
            commit: {
              committer: {
                date: moment()
              }
            }
          }
        ]
      }
    }

    mockAllValues(allRepos, firstBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage =
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. PLEASE MERGE MASTER TO DEVELOP BRANCH.\n' +
      '-----------------\n' +
      'Repo: react\n' +
      'Author of not updated commit: Capitan America\n'

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })

  it('throw an error if required dependencies are missing', () => {
    expect(() => {
      rcBot = new RCBot(
        {
          organization: 'Spotify',
          baseBranch: 'develop',
          headBranch: 'master'
        },
        new GithubService(''),
        new SlackBotService('aaa')
      )
    }).toThrow('accessToken is empty :(')

    expect(() => {
      rcBot = new RCBot(
        {
          organization: '',
          baseBranch: 'develop',
          headBranch: 'master'
        },
        new GithubService('aaa'),
        new SlackBotService('aaa')
      )
    }).toThrow('organization is empty :(')

    expect(() => {
      rcBot = new RCBot(
        {
          organization: 'facebook',
          baseBranch: '',
          headBranch: 'master'
        },
        new GithubService('aaa'),
        new SlackBotService('aaa')
      )
    }).toThrow('baseBranch is empty :(')

    expect(() => {
      rcBot = new RCBot(
        {
          organization: 'facebook',
          baseBranch: 'develop',
          headBranch: ''
        },
        new GithubService('aaa'),
        new SlackBotService('aaa')
      )
    }).toThrow('headBranch is empty :(')
  })

  it('send message to the slack channel about non-merge commits', async () => {
    const allRepos = [
      { name: 'react', owner: { login: 'facebook' } },
      { name: 'typescript', owner: { login: 'microsoft' } }
    ]

    // This branch should be ignored
    // cause contains only merge commit made by Github
    const branchDiffWithOnlyPullRequestCommit = {
      data: {
        files: ['some.js'],
        commits: [
          {
            author: {
              login: 'Iron Man'
            },
            commit: {
              committer: {
                name: 'Github'
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

    mockAllValues(allRepos, branchDiffWithOnlyPullRequestCommit, secondBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage =
      'REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. PLEASE MERGE MASTER TO DEVELOP BRANCH.\n' +
      '-----------------\n' +
      'Repo: typescript\n' +
      'Author of not updated commit: Hulk\n' +
      'Delay: 5 days\n'

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })

  it('send message to the slack channel when organization do not have any repos', async () => {
    const allRepos = []

    mockAllValues(allRepos, null, null)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage = 'Organization do not have any repos :('

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })
})

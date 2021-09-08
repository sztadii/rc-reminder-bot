import subDays from 'date-fns/subDays'
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

  it('call githubService with arguments passed as a config', async () => {
    const allRepos = [{ name: 'typescript', owner: { login: 'CleverDevelopment' } }]

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

    mockServicesMethodsOutput(allRepos, firstBranchDiff)

    rcBot = new RCBot(
      {
        organization: 'CleverDevelopment',
        baseBranch: 'replica',
        headBranch: 'main'
      },
      githubService,
      slackBotService
    )
    await rcBot.checkBranches()

    expect(githubService.getAllOrganizationRepos).toHaveBeenCalledTimes(1)
    expect(githubService.getAllOrganizationRepos).toHaveBeenCalledWith('CleverDevelopment')

    expect(githubService.compareTwoBranches).toHaveBeenCalledTimes(1)
    expect(githubService.compareTwoBranches).toHaveBeenCalledWith({
      base: 'replica',
      head: 'main',
      owner: 'CleverDevelopment',
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
                date: subDays(new Date(), 10)
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
                date: subDays(new Date(), 5)
              }
            }
          }
        ]
      }
    }

    mockServicesMethodsOutput(allRepos, firstBranchDiff, secondBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage =
      '2 REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY. PLEASE MERGE MASTER TO DEVELOP BRANCH.\n' +
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

  it('when organization has many repos then display proper heading', async () => {
    const allRepos = [
      { name: 'react', owner: { login: 'facebook' } },
      { name: 'typescript', owner: { login: 'microsoft' } }
    ]

    const branchDiff = {
      data: {
        files: ['some.js'],
        commits: [
          {
            author: {
              login: 'Iron Man'
            },
            commit: {
              committer: {
                date: subDays(new Date(), 10)
              }
            }
          }
        ]
      }
    }

    mockServicesMethodsOutput(allRepos, branchDiff, branchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(
      expect.stringContaining('2 REPOSITORIES LISTED BELOW ARE NOT UPDATED PROPERLY.')
    )
  })

  it('when organization has a one repo then display proper heading', async () => {
    const allRepos = [{ name: 'react', owner: { login: 'facebook' } }]

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
                date: subDays(new Date(), 10)
              }
            }
          }
        ]
      }
    }

    mockServicesMethodsOutput(allRepos, firstBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(
      expect.stringContaining('REPOSITORY LISTED BELOW IS NOT UPDATED PROPERLY.')
    )
  })

  it('send `good job` message if all repos are correctly updated', async () => {
    const allRepos = [{ name: 'react', owner: { login: 'facebook' } }]
    const firstBranchDiff = { data: { files: [] } }

    mockServicesMethodsOutput(allRepos, firstBranchDiff)

    await rcBot.checkBranches()

    const expectedMessage = 'All your repos are looking well. Good job team :)'
    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)
    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })

  it('do not send `good job` message if sendAllSuccessConfirmation flag has false value', async () => {
    const allRepos = [{ name: 'react', owner: { login: 'facebook' } }]
    const firstBranchDiff = { data: { files: [] } }

    mockServicesMethodsOutput(allRepos, firstBranchDiff)

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
    mockServicesMethodsOutput(Promise.reject('500'))

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
                date: subDays(new Date(), 666)
              }
            }
          }
        ]
      }
    }

    mockServicesMethodsOutput(allRepos, firstBranchDiff, firstBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(
      expect.stringContaining('react')
    )

    expect(slackBotService.postMessageToReminderChannel).not.toHaveBeenCalledWith(
      expect.stringContaining('angular-js')
    )
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
                date: subDays(new Date(), 5)
              }
            }
          }
        ]
      }
    }

    mockServicesMethodsOutput(allRepos, firstBranchDiff)

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

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(
      expect.stringContaining('PLEASE MERGE MAIN TO REPLICA BRANCH')
    )
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
                date: new Date()
              }
            }
          }
        ]
      }
    }

    mockServicesMethodsOutput(allRepos, firstBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    expect(slackBotService.postMessageToReminderChannel).not.toHaveBeenCalledWith('Delay')
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
                date: subDays(new Date(), 5)
              }
            }
          }
        ]
      }
    }

    mockServicesMethodsOutput(allRepos, branchDiffWithOnlyPullRequestCommit, secondBranchDiff)

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(
      expect.stringContaining('Repo: typescript')
    )

    expect(slackBotService.postMessageToReminderChannel).not.toHaveBeenCalledWith(
      expect.stringContaining('Repo: react')
    )
  })

  it('send message to the slack channel when organization do not have any repos', async () => {
    mockServicesMethodsOutput([])

    await rcBot.checkBranches()

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledTimes(1)

    const expectedMessage = 'Organization do not have any repos :('

    expect(slackBotService.postMessageToReminderChannel).toHaveBeenCalledWith(expectedMessage)
  })

  function mockServicesMethodsOutput(
    allRepos,
    firstCompare = undefined,
    secondCompare = undefined
  ) {
    jest.spyOn(githubService, 'getAllOrganizationRepos').mockImplementationOnce(() => allRepos)
    jest.spyOn(githubService, 'compareTwoBranches').mockImplementationOnce(() => firstCompare)
    jest.spyOn(githubService, 'compareTwoBranches').mockImplementationOnce(() => secondCompare)
  }
})

import * as core from '@actions/core'
import RCBot from './rc-bot'
import SlackBotService from './services/slackbot-service'
import GithubService from './services/github-service'

function getInputValue(inputKey) {
  return process.env[inputKey] || core.getInput(inputKey)
}

function run() {
  const organizationFromGithubInput = core.getInput('ORGANIZATION_NAME')
  const isNodeEnvProduction = process.env.NODE_ENV === 'production'
  const isProduction = !!(isNodeEnvProduction || organizationFromGithubInput)

  console.log('Running in production mode', isProduction)

  const rcBot = new RCBot(
    {
      organization: getInputValue('ORGANIZATION_NAME'),
      baseBranch: getInputValue('BASE_BRANCH'),
      headBranch: getInputValue('HEAD_BRANCH')
    },
    new GithubService(getInputValue('GH_ACCESS_TOKEN')),
    new SlackBotService(getInputValue('SLACK_CHANNEL_WEBHOOK_URL'), isProduction)
  )

  rcBot.checkBranches()
}

run()

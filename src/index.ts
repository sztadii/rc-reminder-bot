import RCBot from './rc-bot'
import SlackBotService from './services/slackbot-service'
import GithubService from './services/github-service'

const config = {
  organization: process.env.ORGANIZATION_NAME,
  baseBranch: process.env.BASE_BRANCH,
  headBranch: process.env.HEAD_BRANCH
}

const rcBot = new RCBot(config, new GithubService(), new SlackBotService())
rcBot.checkBranches()

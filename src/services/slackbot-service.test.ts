import SlackBotService from './slackbot-service'
import axios from 'axios'

describe('SlackBotService', () => {
  beforeAll(() => {
    jest.mock('axios')
  })

  afterAll(jest.resetAllMocks)

  it('throw an error if webHookURL is empty', () => {
    expect(() => {
      new SlackBotService('')
    }).toThrow('webHookURL is empty :(')
  })

  it('make http call when isProduction flag is true', () => {
    const httpHandler = jest.fn()
    axios.post = httpHandler

    const slackBotService = new SlackBotService('wp.pl', true)
    slackBotService.postMessageToReminderChannel('Some message')

    expect(httpHandler).toBeCalled()
  })

  it('do not make http call when isProduction flag is false', () => {
    const httpHandler = jest.fn()
    axios.post = httpHandler

    const slackBotService = new SlackBotService('wp.pl', false)
    slackBotService.postMessageToReminderChannel('Some message')

    expect(httpHandler).not.toBeCalled()
  })
})

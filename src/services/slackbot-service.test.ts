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

  it('postMessageToReminderChannel will make http call by default', () => {
    const httpHandler = jest.fn()
    axios.post = httpHandler

    const slackBotService = new SlackBotService('wp.pl')
    slackBotService.postMessageToReminderChannel('Some message')

    expect(httpHandler).not.toBeCalled()
  })

  it('when isProduction flag is true, then postMessageToReminderChannel will make http call', () => {
    const httpHandler = jest.fn()
    axios.post = httpHandler

    const slackBotService = new SlackBotService('wp.pl', true)
    slackBotService.postMessageToReminderChannel('Some message')

    expect(httpHandler).toBeCalledTimes(1)
  })

  it('when isProduction flag is false, then postMessageToReminderChannel will not make http call', () => {
    const httpHandler = jest.fn()
    axios.post = httpHandler

    const slackBotService = new SlackBotService('wp.pl', false)
    slackBotService.postMessageToReminderChannel('Some message')

    expect(httpHandler).not.toBeCalled()
  })
})

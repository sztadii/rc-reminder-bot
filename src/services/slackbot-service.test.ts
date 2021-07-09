import SlackBotService from './slackbot-service'

describe('SlackBotService', () => {
  it('throw an error if webHookURL is empty', () => {
    expect(() => {
      new SlackBotService('')
    }).toThrow('webHookURL is empty :(')
  })

  it('when isProduction flag is true, then postMessageToReminderChannel will make http call', () => {
    const httpPostFunc = jest.fn()

    const slackBotService = new SlackBotService('wp.pl', true, httpPostFunc)
    slackBotService.postMessageToReminderChannel('Some message')

    expect(httpPostFunc).toBeCalledTimes(1)
  })

  it('when isProduction flag is false, then postMessageToReminderChannel will not make http call', () => {
    const httpPostFunc = jest.fn()

    const slackBotService = new SlackBotService('wp.pl', false, httpPostFunc)
    slackBotService.postMessageToReminderChannel('Some message')

    expect(httpPostFunc).not.toBeCalled()
  })
})

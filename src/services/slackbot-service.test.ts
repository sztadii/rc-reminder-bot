import SlackBotService from './slackbot-service'

describe('SlackBotService', () => {
  it('throw an error if webHookURL is empty', () => {
    expect(() => {
      new SlackBotService('')
    }).toThrow('webHookURL is empty :(')
  })
})

import axios from 'axios'

export default class SlackBotService {
  constructor(
    private webHookURL: string,
    private isProduction = false,
    private httpPostFunc = axios.post
  ) {
    if (!webHookURL?.length) {
      throw new Error('webHookURL is empty :(')
    }
  }

  async postMessageToReminderChannel(message: string): Promise<void> {
    const wrappedMessage = '```' + message + '```'

    console.log('Sending the message to the channel \n')

    if (!this.isProduction) {
      console.log(message)
      return
    }

    await this.httpPostFunc(this.webHookURL, { text: wrappedMessage })
  }
}

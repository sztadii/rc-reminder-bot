import axios from 'axios'

export default class SlackBotService {
  constructor(private webHookURL: string) {
    if (!webHookURL?.length) {
      throw new Error('webHookURL is empty :(')
    }
  }

  async postMessageToReminderChannel(message: string): Promise<void> {
    const wrappedMessage = '```' + message + '```'

    if (process.env.NODE_ENV !== 'production') {
      return console.log({ text: wrappedMessage })
    }

    await axios.post(this.webHookURL, { text: wrappedMessage })
  }
}

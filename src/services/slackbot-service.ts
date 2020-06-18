import axios from 'axios'

export default class SlackBotService {
  constructor(private webHookURL: string) {
    if (!webHookURL?.length) {
      throw new Error('webHookURL is empty :(')
    }
  }

  async postMessageToReminderChannel(message: string): Promise<void> {
    const wrappedMessage = '```' + message + '```'

    console.log('Sending the message to the channel \n')
    console.log(message)

    if (process.env.NODE_ENV !== 'production') {
      return
    }

    await axios.post(this.webHookURL, { text: wrappedMessage })
  }
}

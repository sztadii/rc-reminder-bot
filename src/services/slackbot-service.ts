import axios, { AxiosPromise } from 'axios'

type PostMessageType = AxiosPromise | void

export default class SlackBotService {
  constructor(private webHookURL: string) {}

  postMessageToReminderChannel(message: string): PostMessageType {
    const wrappedMessage = '```' + message + '```'

    if (process.env.NODE_ENV !== 'production') {
      return console.log({ text: wrappedMessage })
    }

    return axios.post(this.webHookURL, { text: wrappedMessage })
  }
}

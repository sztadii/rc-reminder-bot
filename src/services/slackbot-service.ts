import axios, { AxiosPromise } from 'axios'

type PostMessageType = AxiosPromise | void

export function postMessageToReminderChannel(message: string): PostMessageType {
  const wrappedMessage = '```' + message + '```'
  const webHookURL = process.env.SLACK_CHANNEL_WEBHOOK_URL

  if (process.env.NODE_ENV !== 'production') {
    return console.log({ text: wrappedMessage })
  }

  return axios.post(webHookURL, { text: wrappedMessage })
}

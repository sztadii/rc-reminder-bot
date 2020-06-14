# rc-bot

## Description:

A simple bot that reminds forgetful developers of merging quick fixes also into develop branch

## Requirements:

- NodeJS ( min 12.14.1 ) for app serving and other development process

## Before you will start

Please copy `.env.example` into `.env` file and fill with correct data

## How to run our application ( in development mode )

At first please install NodeJS on your machine, after that please run below commands:

```
npm ci
npm start
```

## How to run our application ( in production mode )

At first please install NodeJS on your machine, after that please run below commands:

```
npm ci
npm run start-prod
```

## How get SLACK_CHANNEL_WEBHOOK_URL

To get SLACK_CHANNEL_WEBHOOK_URL you need to create slack app `https://api.slack.com/apps?new_app=1`. <br/>
When you will create it then you will need to click `Incoming Webhooks` link and active it. <br/>
Then you need to create a new hook by clicking `Add New Webhook to Workspace`. <br/>
After that you need to copy URL from sample curl.

## How get GH_ACCESS_TOKEN

If our repos are private we cannot use GITHUB_TOKEN from github actions env, so we need to create own token. <br/>
At first, you need visit `https://github.com/settings/tokens`. <br/>
Then you need to generate new token. <br/>
So you need to name it and give particular permissions. <br/>
In our case `repo` or `Full control of private repositories` will be enough.

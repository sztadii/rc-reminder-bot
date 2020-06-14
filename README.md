# rc-reminder-bot

## Description:

A simple bot that reminds forgetful developers of merging quick fixes from rc into develop branch

## Problem to solve:

When your company is following git-flow workflow ( or something similar ) you are familiar with quick-fix in the production branch. <br />
So when you are going to merge your fix into master ( or another branch ) then you should merge that change also to develop ( sooner or later ) <br />
If you will forget and someone overrides your changes then you got git conflicts ( which someone needs to solve ). <br />
When you are making a lot of deployments to production with a lot of minor fixes the problem is getting bigger, <br />
cause a lot of time you will be spending on resolving conflicts. <br />
I hope this bot will solve it, cause it will be reminding about that changes on a slack channel.

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
After that you need to copy URL from sample curl. <br />
And should look similar to:

```
https://hooks.slack.com/services/aaa/bbb/ccc
```

## How get GH_ACCESS_TOKEN

If our repos are private we cannot use GITHUB_TOKEN from github actions env, so we need to create own token. <br/>
At first, you need visit `https://github.com/settings/tokens`. <br/>
Then you need to generate new token. <br/>
So you need to name it and give particular permissions. <br/>
In our case `repo` or `Full control of private repositories` will be enough. <br />
And should look similar to:

```
aaa-bbb-ccc-ddd-eee-fff
```

## How to run it via Github workflow cron

At first, you need to update env variables in `daily-job.yml`. <br />
If you need to change time, or the cron you need to specify its value. <br />
For example:
`30 4 * * *`
Means 4:30 UTC time <br />
For of the work will be done by Github so enjoy the free time :)

# rc-reminder-bot

## Description:

This is a simple bot designed to remind forgetful developers about merging quick fixes from the release candidate (rc) branch into the develop branch.

## Problem to Solve:

In companies that follow the git-flow workflow (or similar workflows), developers often encounter quick fixes in the production branch. When merging such fixes into the main branch (e.g., master) or another relevant branch, it's essential to merge those changes into the develop branch as well, sooner or later. Failure to do so may result in conflicting changes if someone overrides your fixes. This situation leads to git conflicts that someone needs to resolve. The problem escalates when there are numerous deployments to production with multiple minor fixes, as the time spent resolving conflicts increases. While a well-tested application can mitigate this problem to some extent, the reality is that not all companies have comprehensive code coverage.

This bot aims to address this challenge by sending reminders about necessary changes to a Slack channel, helping developers stay on top of these merges.

## How to Use:

To set up the bot, follow these steps:

1. Create a new workflow by adding a file inside the `.github/workflows` folder, e.g., `.github/workflows/daily-job.yml`.

2. Configure the workflow content similar to the example below:

   ```yaml
   name: Daily job

   on:
     schedule:
       - cron: '0 6 * * *'  # Set your desired schedule

   jobs:
     trigger:
       runs-on: ubuntu-latest

       steps:
         - name: Trigger script to send proper Slack message
           uses: sztadii/rc-reminder-bot@1
           with:
             ORGANIZATION_NAME: 'facebook'
             BASE_BRANCH: develop
             HEAD_BRANCH: master

             # Use GITHUB_TOKEN for public repos, or create your own access token for private repos
             GH_ACCESS_TOKEN: ${{ secrets.GITHUB_TOKEN }}

             SLACK_CHANNEL_WEBHOOK_URL: ${{ secrets.SLACK_CHANNEL_WEBHOOK_URL }}

             # Set to true to send notifications even if all repos are up to date
             SEND_NOTIFICATION_EVEN_ALL_SUCCESS: true
   ```

## Expected Result:

Once you've set up everything correctly, the bot will send a message like the following to the specified Slack channel:

![Screenshot](slack-channel-screenshot.png)

## How to Obtain SLACK_CHANNEL_WEBHOOK_URL:

To get the `SLACK_CHANNEL_WEBHOOK_URL`, follow these steps:

1. Create a Slack app by visiting [this link](https://api.slack.com/apps?new_app=1).

2. Activate "Incoming Webhooks" for your app.

3. Create a new webhook by clicking "Add New Webhook to Workspace."

4. Copy the URL from the sample curl provided. The URL will look something like:

   ```
   https://hooks.slack.com/services/aaa/bbb/ccc
   ```

## How to Obtain GH_ACCESS_TOKEN:

To obtain the `GH_ACCESS_TOKEN`:

1. If your repo is public, you can use the `GITHUB_TOKEN` environment variable available in secrets.

2. If your repo is private, you'll need to create your own access token:

   a. Visit [this link](https://github.com/settings/tokens).

   b. Generate a new token, providing it a name and the necessary permissions (e.g., `repo` or "Full control of private repositories").

   c. The token will look something like:

      ```
      aaa-bbb-ccc-ddd-eee-fff
      ```

## Development / Contribution Requirements:

Follow these steps to contribute to the development of the bot:

1. Install the specific NodeJS version specified in `engines.node` within the `package.json`. You can use a node manager like [N](https://github.com/tj/n):

   ```
   n auto
   ```

2. Before you start, copy `.env.example` into a `.env` file and fill it with the correct data. This will allow you to run the script locally with real data.

3. To run the application in development mode:

   ```
   npm ci
   npm run start-dev
   ```

4. To run the application in production mode:

   ```
   npm ci
   npm run start-prod
   ```

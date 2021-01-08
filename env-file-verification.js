/* eslint-disable no-console */
const fs = require('fs')

function envFileVerification() {
  if (!fs.existsSync('.env')) {
    console.error('-------')
    console.error('-------')
    console.error('Please create ".env" file in root folder and fill with correct data')
    console.error('As an example please look at .env-example')
    console.error('-------')
    console.error('-------')
    process.exit(1)
  }
}

envFileVerification()

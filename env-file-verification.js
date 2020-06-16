/* eslint-disable no-console */
const fs = require('fs')

function envFileVerification() {
  if (!fs.existsSync('.env')) {
    console.error('-------')
    console.error('-------')
    console.error('Please rename ".env.example" to ".env" and fill with correct data')
    console.error('-------')
    console.error('-------')
    process.exit(1)
  }
}

envFileVerification()

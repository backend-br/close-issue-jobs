#! /usr/bin/env node

const GitHub = require('github-api')
const moment = require('moment')
const Configstore = require('configstore')
const pkg = require('../package.json')
const config = new Configstore(pkg.name)
const inquirer = require('inquirer')
const argv = require('minimist')(process.argv.slice(2))

if (argv._[0] && argv._[0] === 'reset') {
  config.all = {}
}

const timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const main = async () => {
  if (
    !config.has('time') ||
    !config.has('token') ||
    !config.has('repository') ||
    !config.has('period')
  ) {
    const validate = (input) => input !== ''
    const questions = [
      {
        name: 'token',
        message: 'Put your token here'
      },
      {
        name: 'repository',
        message: 'What repository we should watch? <user/repo>'
      },
      {
        name: 'time',
        message: 'What the amount of time?'
      },
      {
        name: 'period',
        message: 'What the unit of time? Valid values are: months, days, years',
        choices: ['years', 'months', 'days', 'year', 'month', 'day']
      }
    ]

    const answers = await inquirer.prompt(questions.map(q => Object.assign(q, { validate })))
    Object.keys(answers).forEach(k => {
      config.set(k, answers[k])
    })
  }

  const github = new GitHub({
    token: config.get('token')
  })

  const issues = github.getIssues(config.get('repository'))
  const list = await issues.listIssues({sort: 'created', state: 'open'})
  const toUpdate = []

  for (i = 0; i <= list.data.length; i++) {
    await timeout(1000)

    console.log('title: ' + list.data[i].title)

    if (list.data[i] == undefined) {
      return
    }

    let lastUpdated = list.data[i].updated_at
    let timePassed = moment(lastUpdated).fromNow(true).split(' ')

    if (timePassed[0] > config.get('time') && timePassed[1] === config.get('period')) {
      toUpdate.push(issues.createIssueComment(list.data[i].number, 'Issue fechada pelo bot. Motivo: Sem interações em um periodo de 3 meses.'))
      toUpdate.push(issues.editIssue(list.data[i].number, {'state': 'closed'}))
    }
  }

  if (toUpdate.length > 0) {
    await Promise.all(toUpdate)
  }

  console.log(`${toUpdate.length / 2} issues were closed!`)
}

main()
  .then()
  .catch(console.error)

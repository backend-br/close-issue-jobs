const Configstore = require('configstore')
const config = new Configstore(pkg.name)
const argv = require('minimist')(process.argv.slice(2))

if (argv._[0] && argv._[0] === 'reset') {
  config.all = {}
}

module.exports = async () => {
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
}

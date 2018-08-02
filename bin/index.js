#! /usr/bin/env node

const GitHub = require('github-api')
const moment = require('moment')
const Configstore = require('configstore')
const pkg = require('../package.json');
const config = new Configstore(pkg.name);

const github = new GitHub({
    username: config.get('username'),
    password: config.get('password')
});

const issues = github.getIssues(config.get('repository'))

if (config.get('time') == "" || config.get('time') == undefined) {
    throw "Time [int] is not defined on config"
}

if (config.get('period') == "" || config.get('period') == undefined) {
    throw "Period [months, years, days, month, year or day] is not defined on config file"
}

issues.listIssues().then(response => {
    for (let i in response.data) {
        let last_updated = response.data[i].updated_at

        let time_passed = moment(last_updated).fromNow(true).split(' ')

        if (time_passed[0] > config.get('time') && time_passed[1] == config.get('period')) {
            issues.createIssueComment(response.data[i].number, 'Issue fechada pelo bot. Motivo: Sem interações em um periodo de 3 meses.')

            issues.editIssue(response.data[i].number, {'state': 'closed'})
        }
    }
}).catch(error => {
    throw "Error verify data login"
})

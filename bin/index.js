#! /usr/bin/env node

const GitHub = require('github-api')
const moment = require('moment')
const Configstore = require('configstore')
const config = new Configstore('close-issues')

const github = new GitHub({
    username: config.get('username'),
    password: config.get('password')
});

const issues = github.getIssues(config.get('repository'))

issues.listIssues().then(response => {
    for (let i in response.data) {
        let last_updated = response.data[i].updated_at

        let time_passed = moment(last_updated).fromNow(true).split(' ')

        if (time_passed[0] > 3 && time_passed[1] == 'months') {
            issues.createIssueComment(response.data[i].number, 'Issue closed by Bot because very time without interation')

            issues.editIssue(response.data[i].number, {'state': 'closed'})
        }
    }
}).catch(error => {
    console.log('error', error)
})

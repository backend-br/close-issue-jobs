#! /usr/bin/env node

const GitHub = require('github-api')
const moment = require('moment')
const pkg = require('../package.json')
const getConfig = require('./config')
const inquirer = require('inquirer')
const Issue = require('./Issue')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise;
const mongooseOptions = {
  useMongoClient: true,
  keepAlive: 300000,
  connectTimeoutMS: 60000
};


const main = async () => {
  mongoose.connect('localhost', mongooseOptions);

  const config = await getConfig()

  const github = new GitHub({
    token: config.get('token')
  })

  const issues = github.getIssues(config.get('repository'))
  const list = await issues.listIssues()

  if (!list || !list.data || !list.data.length) {
    return
  }

  const toUpdate = list.data
    .filter(item => {
      if (!item) {
        return false
      }

      const updatedAt = moment(item.updated_at).fromNow(true).split(' ')

      if (updatedAt[0] < config.get('time') || updatedAt[1] !== config.get('period')) {
        return false
      }

      return true
    })
    .map(async ({ number, ...item }) => {
      const issue = await Issue.findOne({ number }).exec()

      if (!issue) {
        const comment = `Olá ${item.user.login}, essa vaga ainda está aberta?`
        const issueComment = await issues.createIssueComment(number, comment)
        await Issue.create({ number, comment: issueComment.id })
        return
      }

      const comments = (await issues.listIssueComment(number))
        .filter(comment => comment.id >= issue.comment)

      const lastComment = comments[comments.length - 1]

      if (!lastComment) {
        return
      }

      let shouldCloseIssue = false

      if (
        lastComment.id === issue.comment ||
        moment(lastComment.updated_at) > moment(lastComment.updated_at).add(7, 'days')
      ) {
        shouldCloseIssue = true
      }

      if (lastComment.body.match(/não|nao|no|nope/g).length > 0) {
        shouldCloseIssue = true
      }

      if (!shouldCloseIssue) {
        return
      }

      issues.createIssueComment(number, 'Issue fechada pelo bot. Motivo: Sem interações.')
      issues.editIssue(number, {state: 'closed'})
      await Issue.findOneAndUpdate({ number }, { $set: { deletedAt: new Date() } })
    })

  if (toUpdate.length > 0) {
    await Promise.all(toUpdate)
  }

  await (new Promise((resolve, reject) => mongoose.disconnect(err => err ? reject(err) : resolve())))
  console.log(`${toUpdate.length} issues were changed!`)
}

main()
  .then()
  .catch(console.error)

const mongoose = require('mongoose')

module.exports = mongoose.model('Issue', {
  number: { type: Number, required: true },
  comment: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

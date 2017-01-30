'use strict'

const RedisMQ = require('rsmq')

module.exports = class MessageQueue {

  constructor(options) {
    this.queue = new RedisMQ(options)
  }

  close() {
    this.queue.quit()
  }

  process({ name }, send) {
    return new Promise((resolve, reject) => {

      this.queue.receiveMessage({
        qname: name
      }, (err, res) => {
        if (err) return reject(err);

        send(res.message)
      })
    })
  }

  sendAndCreate(message) {
    return new Promise((resolve, reject) => {

      this.queue.listQueues( function (err, queues) {
        if (err) return reject(err);

        resolve(queues.indexOf(message.name) !== -1)
      })
    })
    .then((exists) => {
      return new Promise((resolve, reject) => {
        if (exists) return resolve()

        this.queue.createQueue({
          qname: message.name
        }, (err, res) => {
          if (err) return reject(err);

          resolve(res)
        })
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {

        this.queue.sendMessage({
          qname: message.name,
          message: JSON.stringify(message)
        }, (err, res) => {
          if (err) reject(err);

          resolve(res)
        })
      })
    })
    .catch(console.log)
  }
}

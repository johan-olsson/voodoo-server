'use strict'

var scribe = require('scribe-js')()

const Redisemitter = require('redisemitter')
const Objectstream = require('objectstreamer')
const jwt = require('jsonwebtoken')
const kue = require('kue')
const Rx = require('rxjs')

const uuid = require('uuid').v4

const HttpServer = require('./src/login')

const run = require('./src/rpc/run')
const define = require('./src/rpc/define')

const emit = require('./src/event/emit')
const subscribe = require('./src/event/subscribe')


module.exports = class Server {

  constructor(options) {

    this.options = Object.assign({
      http: {
        port: 5353
      },
      redis: {
        port: 6379,
        host: 'localhost',
        ns: 'voodoo'
      },
      secret: uuid()
    }, options)

    this.redisemitter = new Redisemitter(this.options.redis)
    this.kue = kue.createQueue({
      redis: this.options.redis
    })
    this.kue.watchStuckJobs(1000)

    this._httpServer = new HttpServer(this, scribe)
    this._authenticationHandler = (creds, next) => {
      next(null, {
        type: 'guest'
      })
    }
  }

  close() {
    this._httpServer.close()
  }

  authentication(handler) {
    this._authenticationHandler = handler
  }

  transport(handleTransport) {

    handleTransport((clientConstuctor) => {

      const outstream = new Rx.Subject()
      const instream = new Rx.Subject()

      const refinedstream = instream
        .map((data) => (data instanceof Buffer) ? data.toString() : data)
        .map((data) => (typeof data === 'string') ? JSON.parse(data) : data)
        .map((data) => {
          return new Promise((resolve, reject) => {
            jwt.verify(data.token, this.options.secret, (err, user) => {
              if (err) return outstream.error(err);

              data.user = user
              delete data.token

              resolve(data)
            })
          })
        })
        .filter((data) => {
          console.log(data)
          if (!data.action) return refinedstream.error('Expected param `action` in data')
          if (!data.type) return refinedstream.error('Expected param `type` in data')
          if (!data.name) return refinedstream.error('Expected param `name` in data')
          if (!data.id) return refinedstream.error('Expected param `id` in data')

          return true
        })

      emit(refinedstream, outstream, this.redisemitter)
      subscribe(refinedstream, outstream, this.redisemitter)

      run(refinedstream, outstream, this.redisemitter, this.kue)
      define(refinedstream, outstream, this.redisemitter, this.kue)

      clientConstuctor(instream, outstream
        .map((data) => JSON.stringify(data)), () => {
          instream.dispose()
          outstream.dispose()
        })
    })
  }
}

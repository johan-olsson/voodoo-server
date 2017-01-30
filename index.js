'use strict'

const Redisemitter = require('redisemitter')
const Objectstream = require('objectstream')
const Messageparser = require('message-parser')
const kue = require('kue')

const uuid = require('uuid').v4

const Httpserver = require('./src/login')

const make = require('./src/rpc/make')
const provide = require('./src/rpc/provide')

const emit = require('./src/event/emit')
const subscribe = require('./src/event/subscribe')


module.exports = class Server {

  constructor(options) {

    this.options = Object.assign({
      http: {
        port: 80
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

    this._parser = new Messageparser(this.options)
    this._httpserver = new Httpserver(this)
    this._authenticationHandler = (creds, next) => {
      next(null, {
        type: 'guest'
      })
    }
  }

  close() {
    this._httpserver.close()
  }

  authentication(handler) {
    this._authenticationHandler = handler
  }

  transport(handleTransport) {

    handleTransport((clientConstuctor) => {

      const outstream = new Objectstream()
      const instream = new Objectstream()

      const refinedstream = instream
        .map((data) => (data instanceof Buffer) ? data.toString() : data)
        .map((data) => (typeof data === 'string') ? JSON.parse(data) : data)
        .map((data, next) => {
          this._parser.decode(data.token)
            .then((user) => {
              data.user = user
              delete data.token

              next(data)
            })
            .catch((err) => {
              outstream.error(err)
            })
        })
        .filter((data) => {
          if (!data.action) return refinedstream.error('Expected param `action` in data')
          if (!data.type) return refinedstream.error('Expected param `type` in data')
          if (!data.name) return refinedstream.error('Expected param `name` in data')
          if (!data.id) return refinedstream.error('Expected param `id` in data')

          return true
        })

      emit(refinedstream, outstream, this.redisemitter)
      subscribe(refinedstream, outstream, this.redisemitter)

      make(refinedstream, outstream, this.redisemitter, this.kue)
      provide(refinedstream, outstream, this.redisemitter, this.kue)

      clientConstuctor(instream, outstream
        .map((data) => JSON.stringify(data)))
    })
  }
}

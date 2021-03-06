'use strict'

const assert = require('assert')
const uuid = require('uuid').v4
const Server = require('../')

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImFkbWluIjp0cnVlfQ.lrY7M1jXLfO_NLPCUV40oYuqMrEYYyRVc_4GbM9Uhy0'

describe('event', () => {

  var server = null;
  const options = {
    secret: 'secret'
  }

  beforeEach(() => {
    server = new Server(options)
  })

  afterEach(() => {
    server.close()
  })

  it.only('should handle out- and in-streams', (done) => {

    server.transport((connection) => {

      connection((instream, outstream) => {

        outstream.read((data) => {
          assert.equal(data.type, 'event')
          assert.equal(data.action, 'emit')
          assert.equal(data.name, 'event-name')
          assert.equal(data.payload, 'payload node')
          done()
        })

        instream.write({
          id: uuid(),
          type: 'event',
          action: 'subscribe',
          name: 'event-name',
          token: token
        })
        setTimeout(() => {
          instream.write({
            id: uuid(),
            type: 'event',
            action: 'emit',
            name: 'event-name',
            payload: 'payload node',
            token: token
          })
        }, 10)
      })
    })
  })
})

describe('rpc', () => {

  var server = null;
  const options = {
    secret: 'secret'
  }

  beforeEach(() => {
    server = new Server(options)
  })

  afterEach(() => {
    server.close()
  })

  it.only('should handle out- and in-streams', (done) => {

    server.transport((connection) => {

      connection((instream, outstream) => {

        outstream
          .filter((data) => {
            return data.type === 'rpc' &&
              data.action === 'make'
          })
          .read((data) => {
            instream.write({
              id: data.id,
              type: 'rpc',
              action: 'response',
              name: 'rpc-name',
              payload: 'payload node',
              token: token
            })
          })

        outstream
          .filter((data) => {
            return data.type === 'rpc' &&
              data.action === 'response'
          })
          .read((data) => {
            assert.equal(data.type, 'rpc')
            assert.equal(data.action, 'response')
            assert.equal(data.name, 'rpc-name')
            assert.equal(data.payload, 'payload node')
            assert.equal(data.user.admin, true)
            assert.equal(data.user.name, 'Test User')
            done()
          })

        instream.write({
          id: uuid(),
          type: 'rpc',
          action: 'provide',
          name: 'rpc-name',
          token: token
        })
        setTimeout(() => {
          instream.write({
            id: uuid(),
            type: 'rpc',
            action: 'make',
            name: 'rpc-name',
            payload: 'payload node',
            token: token
          })
        }, 10)
      })
    })
  })
})

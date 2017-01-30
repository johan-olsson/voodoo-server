'use strict'

const Parser = require('message-parser')
const axios = require('axios')
const assert = require('assert')
const uuid = require('uuid').v4
const Server = require('../')

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImFkbWluIjp0cnVlfQ.lrY7M1jXLfO_NLPCUV40oYuqMrEYYyRVc_4GbM9Uhy0'

describe('login', () => {

  describe('handle login request', () => {

    var server;
    const parser = new Parser({
      secret: 'secret'
    })

    beforeEach(() => {
      server = new Server({
        secret: 'secret',
        httpPort: 8383
      })

      server.authentication((credentials, next) => {
        if (credentials.username === 'TheUser')
          return next(null, {
            username: credentials.username,
            admin: false
          })

        next('some-error')
      })
    })

    afterEach(() => {
      server.close()
    })

    it('should respond with token', (done) => {

      axios.post('http://localhost/login', {
          username: 'TheUser'
        })
        .then((res) => {
          return parser.decode(res.data.token)
        })
        .then((user) => {
          assert.equal(user.username, 'TheUser')
          assert.equal(user.admin, false)
          done()
        })
        .catch(console.log)
    })

    it('should respond with error', (done) => {

      axios.post('http://localhost/login', {
          username: 'not TheUser'
        })
        .catch((res) => {
          assert.equal(res.response.status, 401)
          assert.equal(res.response.data, 'some-error')
          done()
        })
    })
  })
})

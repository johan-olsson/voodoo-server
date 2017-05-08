'use strict'

const express = require('express')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')

module.exports = class Httpserver {

  constructor(server, scribe) {

    const app = express()

    app.use('/logs', scribe.webPanel())

    app.use(bodyParser.json({
      type: 'application/json'
    }))

    app.post('/login', (req, res) => {

      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'POST')
      res.header('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept')

      server._authenticationHandler(req.body, (err, user) => {
        if (err) {

          res.send(err)

        } else {

          res.json({
            token: jwt.sign(user, server.options.secret)
          })
        }
      })
    })

    this.server = app.listen(server.options.http.port)
  }

  close() {
    this.server.close()
  }
}

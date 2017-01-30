'use strict'

const express = require('express')
const bodyParser = require('body-parser')

module.exports = class Httpserver {

  constructor(server) {

    const app = express()

    app.use(bodyParser.json({
      type: 'application/json'
    }))

    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'POST')
      res.header('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept')

      next()
    })

    app.post('/login', (req, res) => {

      server._authenticationHandler(req.body, (err, user) => {
        if (err) {
          res.status(401)
          return res.send(err)
        }

        res.status(200)
        res.json({
          token: server._parser.encode(user)
        })
      })
    })

    this.server = app.listen(server.options.http.port)
  }

  close() {
    this.server.close()
  }
}

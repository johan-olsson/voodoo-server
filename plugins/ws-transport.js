'use strict'

const engine = require('engine.io')

module.exports = function(port) {

  return (createClient) => {

    var server = engine.listen(port)

    server.on('connection', (socket) => {

      createClient((writeStream, readStream) => {
        socket.on('data', (data) => {
          writeStream.write(data)
        })

        readStream.read((data) => {
          socket.send(data)
        })
      })
    })
  }
}

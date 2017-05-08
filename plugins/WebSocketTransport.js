'use strict'

const engine = require('engine.io')

module.exports = function(port) {
  console.log('Starting WebSocket Server...')

  return (createClient) => {

    var server = engine.listen(port)
    console.log(`WebSocket Server started at port ${port}!`)

    server.on('connection', (socket) => {
      console.log('New WebSocket client connected!')

      createClient((instream, outstream) => {
        socket.on('data', (data) => {
          outstream.next(data)
        })

        outstream.subscribe((data) => {
          socket.send(data)
        })
      })
    })
  }
}

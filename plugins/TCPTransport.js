'use strict'

const net = require('net')

module.exports = function(options = {}) {
  console.log('Starting TCP Server...')

  return (createClient) => {

    var server = net.createServer((socket) => {

      createClient((instream, outstream, close) => {
        console.log('New TCP client connected!')

        outstream.subscribe((data) => {
          socket.write(data + '·')
        })

        socket.on('data', (data) => {
          data.toString('utf8')
            .split('·')
            .forEach((data) => {
              outstream.next(data)
            })
        })
        socket.on('end', close)
      })
    })

    server.listen(options, () => {
      console.log('TCP Server started with options', options)
    })
    return () => {
      server.close()
    }
  }
}

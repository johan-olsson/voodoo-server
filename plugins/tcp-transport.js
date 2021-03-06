'use strict'

const net = require('net')

module.exports = function(options = {}) {

  return (createClient) => {

    var server = net.createServer((socket) => {

      createClient((instream, outstream) => {
        outstream.read((data) => {
          socket.write(data + '·')
        })

        socket.on('data', (data) => {
          data.toString('utf8')
            .split('·')
            .forEach((data) => {
              instream.write(data)
            })
        })

        return () => {
          socket.end()
        }
      })
    })

    server.listen(options)
    return () => {
      server.close()
    }
  }
}

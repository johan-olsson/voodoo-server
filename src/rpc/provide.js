'use strict'

module.exports = (instream, outstream, redisemitter, kue) => {

  var dispose;

  instream.filter((data) => {
      return data.type === 'rpc' &&
        data.action === 'provide'
    })
    .read((data) => {

      kue.process(data.name, function(job, done) {

        instream.filter((data) => {
            return data.type === 'rpc' &&
              data.action === 'response' &&
              data.id === job.data.id
          })
          .read((data) => {
            redisemitter.emit(data)
            done()
          })

        instream.filter((data) => {
            return data.type === 'rpc' &&
              data.action === 'error' &&
              data.id === job.data.id
          })
          .read((data) => {
            redisemitter.emit(data)
            done()
          })

          outstream.write(job.data)

      })
    })

  instream.filter((data) => {
      return data.type === 'rpc' &&
        data.action === 'unprovide'
    })
    .read(() => {
      if (dispose) dispose()
    })
}

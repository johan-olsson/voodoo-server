'use strict'

module.exports = (instream, outstream, redisemitter, kue) => {

  instream.filter((data) => {
      return data.type === 'rpc' &&
        data.action === 'make'
    })
    .read((data) => {

      redisemitter.on({
        type: 'rpc',
        action: 'response',
        name: data.name,
        id: data.id
      }, (data) => {
        outstream.write(data)
      })

      redisemitter.on({
        type: 'rpc',
        action: 'error',
        name: data.name,
        id: data.id
      }, (data) => {
        outstream.write(data)
      })

      kue.create(data.name, data)
        .removeOnComplete(true)
        .save()

      redisemitter.emit(data)
    })
}

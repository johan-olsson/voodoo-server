'use strict'

module.exports = (instream, outstream, redisemitter) => {

  instream.filter((data) => {
      return data.type === 'event' &&
        data.action === 'emit'
    })
    .read((data) => {

      redisemitter.emit(data)
    })
}

'use strict'

module.exports = (instream, outstream, redisemitter) => {

  const disposers = {}

  instream.filter(data =>
      data.type === 'event' &&
      data.action === 'subscribe')
    .read((data) => {

      disposers[data.name] = redisemitter.on({
        type: 'event',
        action: 'emit',
        name: data.name
      }, (event) => {
        outstream.write(Object.assign({}, event, {
          id: data.id
        }))
      })
    })

  instream.filter(data =>
      data.type === 'event' &&
      data.action === 'unsubscribe')
    .read((data) => {
      if (disposers[data.name]) disposers[data.name]()
    })
}

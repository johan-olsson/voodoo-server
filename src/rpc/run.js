'use strict'

module.exports = (instream, outstream, redisemitter, kue) => {

  instream.filter((data) => {
      return data.type === 'rpc' &&
        data.action === 'run'
    })
    .subscribe((data) => {

      redisemitter.on({
        type: 'rpc',
        name: data.name,
        id: data.id
      }, (data) => {
        console.log(data)
        outstream.write(data)
      })

      kue.create(data.name, data)
        .on('enqueue', console.log.bind(this, 'the job is now queued'))
        .on('start', console.log.bind(this, 'the job is now running'))
        .on('promotion', console.log.bind(this, 'the job is promoted from delayed state to queued'))
        .on('progress', console.log.bind(this, 'the jobs progress ranging from 0-100'))
        .on('failed attempt', console.log.bind(this, 'the job has failed, but has remaining attempts yet'))
        .on('failed', console.log.bind(this, 'the job has failed and has no remaining attempts'))
        .on('complete', console.log.bind(this, 'the job has completed'))
        .on('remove', console.log.bind(this, 'the job has been removed'))
        .removeOnComplete(true)
        .save()

      redisemitter.emit(data)
    })
}

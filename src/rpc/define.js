'use strict'

module.exports = (instream, outstream, redisemitter, kue) => {

  instream.filter((data) => {
      return data.type === 'rpc' &&
        data.action === 'define'
    })
    .subscribe((data) => {

      var worker;

      /* subscribe to unsubscribe requests */
      instream.filter((data) => {
          return data.type === 'rpc' &&
            data.action === 'unsubscribe'
        })
        .subscribe(() => {
          if (worker.shutdown) worker.shutdown()
        })

      /* makes sure the worker does not try to
         process taks when client is disconnected */
      instream.ended(() => {
        if (worker.shutdown) worker.shutdown()
      })

      /* start processing rpc run queue */
      kue.process(data.name, function(task, ctx, done) {
        done()

        worker = ctx

        instream.filter((data) => {
            return data.type === 'rpc' &&
              data.id === task.data.id
          })
          .subscribe((data) => {
            redisemitter.emit(data)
          })

        instream.filter((data) => {
            return data.type === 'rpc' &&
              data.action === 'end' &&
              data.id === task.data.id
          })
          .subscribe((data) => {
            redisemitter.emit(data)
          })

        outstream.write(task.data)
      })
    })
}

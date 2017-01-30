'use strict'

const EventEmitter = require('eventemitter2')
const divider = '›'

module.exports = class Stream {

  constructor() {
    this.events = new EventEmitter({
      wildcard: true,
      delimiter: divider
    })
  }

  on(query, callback) {

    query = Object.assign({
      type: '*',
      action: '*',
      name: '*',
      id: '*'
    }, query)

    const event = [
      query.type,
      query.action,
      query.name,
      query.id].join(divider)

    this.events.on(event, callback)

    return {
      dispose: () => {
        this.events.off(event, callback)
      }
    }
  }

  once(query, callback) {

    query = Object.assign({
      type: '*',
      action: '*',
      name: '*',
      id: '*'
    }, query)

    const event = [
      query.type,
      query.action,
      query.name,
      query.id].join(divider)

    this.events.once(event, callback)

    return {
      dispose: () => {
        this.events.off(event, callback)
      }
    }
  }

  emit(message) {

    this.events.emit([
      message.type,
      message.action,
      message.name,
      message.id].join(divider), message)
  }

  onAny(callback) {

    const handler = (e, message) => {
      callback(message)
    }

    this.events.onAny(handler)

    return {
      dispose: () => {
        this.events.offAny(handler)
      }
    }
  }
}

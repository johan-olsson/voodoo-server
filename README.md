# voodoo-server

## Creating the server

```javascript
const Voodoo = require('voodoo-server')
const vo = new Voodoo({
  http: {
    port: 80
  },
  redis: {
    port: 6379,
    host: 'localhost',
    ns: 'voodoo'
  },
  secret: uuid() // Defaults to generated uuid every time the server is started
})
```

<hr>

You are done, your server is now accepting authentication requests on port `80` and communicate with `redis` at `redis://localhost:6379`.

## vo.transport([function])

For your server to start accepting socket connections you will have to add a transport. You can add as many transports as you want and there is no limits on cross protocol communication.

### Plugins

There are few included transport plugins:

#### tcp

The tcp transport takes the same arguments as [net.createServer](https://nodejs.org/api/net.html#net_net_createserver_options_connectionlistener)

```javascript
const tcptransport = require('voodoo-server/plugins/tcp-transport')

vo.transport(tcptransport({
  path: '/tmp/voodoo.sock'
}))
```

#### websocket

The websocket transport is based on [engine.io](https://github.com/socketio/engine.io) takes the same arguments as [engine.listen](https://github.com/socketio/engine.io)

```javascript
const wstransport = require('voodoo-server/plugins/ws-transport')

vo.transport(wstransport(6344))
```

<hr>

Now you have a voodoo-server that accept connections over both tcp and ws and verifies that they have a valid token from the login request.

## vo.authentication([function])

Example of how to add a authentication handler:

```javascript
authentication((creds, next) => {

  if (creds.username === 'johano')
    next(null, {
      type: 'sudo',
      name: 'Johan Olsson'
    })
  else if (creds.username === 'kid')
    next('Kid\'s are not allowed!') // return error to the client
  else
    next(null, {
      type: 'guest',
      name: 'Not a kid'
    })

})
```

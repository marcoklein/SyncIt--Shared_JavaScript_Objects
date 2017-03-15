# Make Network Communication Easy!
Sync JavaScript objects across the network. Shared JavaScript objects that are available on multiple connected clients.

You don't have to define any kind of protocol. Simply put your objects into **SyncIt** using `SyncIt.sync(id, object)`. With this call `object` is available on all clients and the server associated with the given `id`.

## Architecture
SyncIt is based on [Socket.io](https://socket.io/) to communicate using sockets.

## SyncIt Object
As you created a syncit instance using `var syncit = new SyncIt(webSocket);`, providing a valid `socket.io` object, you can access all shared objects:

* `getObject(id)`: Get the object with the given id.

### Sync Modes
```
// sync everything
syncit.sync("chat", chat);
// update only if local modal changes
syncit.syncOut("player_movement", playerMovement);
// update only if global changes occur
syncit.syncIn("game_state", gameState);
```
## Examples
On the server
```
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var SyncIt = require("./syncit.js");
var syncIt = new SyncIt(io);
```

On the client
```
var webSocket = new WebSocket(url, [protocol] );
var syncit = new SyncIt(webSocket);
// sync with id "game_state"
syncit.sync("game_state", gameState);
```

## Messages
Internally the following messages are used:
 - `handshake`
 - `sync`
 - `sync_object`
 - `initial_data`

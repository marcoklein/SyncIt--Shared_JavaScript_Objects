# Sync It!
Sync JavaScript objects across the network.

## Easy to Use
SyncIt is an easy to use WebSocket based synchronize library.

## SyncIt Object
As you created a syncit instance using `var syncit = new SyncIt(webSocket);`, providing a valid `WebSocket` object, you can access several methods:

* `webSocket`: Get the web socket SyncIt is using.
* `getObject(int)`: Get the object with the given id.

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

#Sync It!
Sync JavaScript objects across the network.

##Easy to Use
SyncIt is an easy to use WebSocket based synchronize library.

##SyncIt Object
As you created a syncit instance using `var syncit = new SyncIt(webSocket);`, providing a valid `WebSocket` object, you can access several methods:

* `webSocket`: Get the web socket SyncIt is using.
* `getObject(int)`: Get the object with the given id.

###Sync Modes
```
// sync everything
syncit.sync(chat);
// update only if local modal changes
syncit.syncOut(playerMovement);
// update only if global changes occur
syncit.syncIn(gameState);
```
##Examples
On the client
```
var webSocket = new WebSocket(url, [protocol] );
var syncit = new SyncIt(webSocket);
// sync with id 42
syncit.sync(42, gameState);
```

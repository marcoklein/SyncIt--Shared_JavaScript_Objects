

var socket = io('http://localhost:3000');


var gameState = {
    name: "player"
};


var SyncIt = new SyncIt(socket);

SyncIt.sync("gameState", gameState);
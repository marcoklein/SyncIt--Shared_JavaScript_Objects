
var socket = io('http://localhost:3000');


var gameState = {
    name: "player"
};


var SyncIt = new SyncIt(socket);
//SyncIt.start(30);

SyncIt.sync("gameState", gameState);


$(document).ready(function () {

    var textChange = function () {
        // send sync request to server
        SyncIt.getObject("gameState").text = $("#text-input").val();
        SyncIt.syncNow();
    };
    // listen for text input changes
    $("#text-input").change(textChange);
    $("#text-input").keydown(textChange);
});






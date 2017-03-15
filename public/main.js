
var socket = io('http://localhost:3000');


var gameState = {
    name: "player"
};


var SyncIt = new SyncIt(socket);
//SyncIt.start(30);

// start a timer loop to sync every interval
var timeOut = function () {

    self.timer = setTimeout(function () {
        timeOut();
        //SyncIt.syncNow();
        //console.log(SyncIt.syncObjectArray);
        //console.log(SyncIt.getObject("game_state"));
        $("#input").text(SyncIt.getObject("game_state").text);

        //$("#text-input").val(SyncIt.getObject("game_state").text);
    }, 100);

};
timeOut();




$(document).ready(function () {

    var textChange = function () {
        // send sync request to server
        SyncIt.getObject("game_state").text = $("#text-input").val();
        SyncIt.syncNow();
    };
    // listen for text input changes
    $("#text-input").change(textChange);
    $("#text-input").keydown(textChange);
});






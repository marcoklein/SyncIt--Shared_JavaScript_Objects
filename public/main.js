
var socket = io('http://localhost:3000');


var SyncIt = new SyncIt(socket);
//SyncIt.start(30);

// start a timer loop to sync every interval
var timeOut = function () {

    self.timer = setTimeout(function () {
        timeOut();
        SyncIt.syncNow();
        //console.log(JSON.stringify(SyncIt.getObject("game_state")));
        //console.log(SyncIt.getObject("game_state").text);
        $("#input").html("" + SyncIt.getObject("game_state").text);

        //$("#text-input").val(SyncIt.getObject("game_state").text);
    }, 30);

};
timeOut();




$(document).ready(function () {

    //document.getElementById("input-title").innerHTML = "test";
    //console.log(document.getElementById("input-title").innerHTML);


    var textChange = function () {
        // send sync request to server
        SyncIt.getObject("game_state").text = $("#text-input").val();
        SyncIt.syncNow();
    };
    // listen for text input changes
    $("#text-input").change(textChange);
    $("#text-input").keyup(textChange);
});






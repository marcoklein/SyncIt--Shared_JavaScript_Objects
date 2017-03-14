

var socket = io('http://localhost:3000');



socket.on('connect', function() {

    console.log("Emit.");
    socket.emit("handshake", { name: "SyncIt Client"});
    socket.emit("event", { name: "asdf"});
    socket.emit({ name: "Sqwer"});

});

socket.on('sync', function(data) {
    console.log("sync: " + JSON.stringify(data));
});

socket.on('disconnect', function() {
    console.log("Disconnected.");
});


var socket = io('http://localhost:3000');



socket.on('connect', function() {

    console.log("Emit.");
    socket.emit("handshake", { name: "SyncIt Client"});
    socket.emit("event", { name: "asdf"});
    socket.emit({ name: "Sqwer"});

});

socket.on('event', function(data) {
    console.log("event");
});

socket.on('disconnect', function() {
    console.log("Disconnected.");
});
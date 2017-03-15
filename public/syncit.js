

function SyncIt(socket) {
    var self = this;

    this.socket = socket;
    this.syncObjectMap = {};
    this.syncObjectArray = [];

    var init = function () {
        socket.on("connect", function() {

            console.log("Emit.");
            socket.emit("handshake", { name: "SyncIt Client"});

        });

        // set up protocol
        socket.on("sync_object", function (data) {
            console.log("New object: " + JSON.stringify(data));

            // store new object
            self.syncObjectMap[data.id] = data.object;
            self.syncObjectArray.push(data.object);
        });

        socket.on("sync", function(data) {
            console.log("sync: " + JSON.stringify(data));
        });

        socket.on("disconnect", function() {
            console.log("Disconnected.");
        });
    };


    init();
}

/**
 * Enables syncing of the given object.
 */
SyncIt.prototype.sync = function (id, object) {

    // send request for syncing
    this.socket.emit("sync_object", { id: id, object: object } );


};

/**
 * Returns the object with the given id.
 *
 * @param id
 */
SyncIt.prototype.getObject = function (id) {
    return this.syncObjectMap[id];
};






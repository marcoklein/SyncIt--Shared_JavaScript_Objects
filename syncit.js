/***********************************
 *
 * Server-side implementation of SyncIt.
 *
 *
 * Author:
 * Marco Dominik Klein
 * http://marco-klein.com
 *
 **********************************/

/* Imports */
var Delta = require("./delta");


/* Constants */

SyncIt.SERVER_RECEIVER_ID = 0;


/* Constructor */

function SyncIt(io) {
    var self = this;
    // constants


    // general
    this.debug = true;

    if (!io) {
        console.error("Can't create SyncIt object with no SocketIO connection.");
        return;
    } else {
        // use given socket io oject
        this.io = io;
    }

    // store which objects to sync
    // format:
    // [id] =
    // {
    //   * object
    //   * receivers
    //   * id
    // }
    this.syncObjectArray = [];
    this.syncObjectMap = {};
    /**
     * Snapshot of all old sync objects of the last sync state.
     *
     * @type {Array}
     */
    this.socketData = {};

    this.socketArray = [];
    this.socketMap = {};


    // init socket io as it gets connected
    this.io.on("connection", function (socket) {

        self.log("New SyncIt connection: " + socket.id);
        // wait for the handshake message of the socket
        socket.on("handshake", function (handshake) {
            self.log("Received handshake message: " + JSON.stringify(handshake));
            // evaluate handshake message
            var name = handshake.name;

            if (!name) {
                console.error("Client with wrong handshake format tried to connect.");
                socket.disconnect();
            }


            // store socketMap in a map so a sync can reach them
            self.socketMap[socket.id] = socket;
            self.socketArray.push(socket);
            self.socketData[socket.id] = {};

            // client accepted
            self.log("Accepted client " + name);

            // send client all shared objects
            for (var i = 0; i < self.syncObjectArray.length; i++) {
                // send sync object requests to inform client about synced objects
                var data = {
                    id: self.syncObjectArray[i].id,
                    object: self.syncObjectArray[i].object
                };
                socket.emit("sync_object", data);
                // store synced object
                self.socketData[socket.id][data.id] = data;
            }

            // INITIALIZE SOCKET AND PROTOCOL

            socket.on("sync", function (delta) {
                self.log("SyncIt event: " + JSON.stringify(delta));
                // TODO check if client has write access

                self.log("game state: " + JSON.stringify(self.getObject("game_state")));
                Delta.applyDelta(self.getObject(delta.id), delta);

                // broadcast change
                socket.broadcast.emit("sync", delta);
            });
            /**
             * Request to sync an object.
             */
            socket.on("sync_object", function (data) {
                self.log("Sync object request: " + JSON.stringify(data));

                self.syncObjectArray.push( { id: data.id, object: data.object });
                self.syncObjectMap[data.id] = { id: data.id, object: data.object };
                self.socketData[socket.id][data.id] = data;

                // TODO check provided data
                //self.syncObjectArray = data;
            });

            socket.on("disconnect", function (socket) {
                self.log("SyncIt disconnected: " + socket.id);

                // remove socket
                delete self.socketMap[socket.id];
                var i = self.socketArray.indexOf(socket);
                self.socketArray.splice(i, 1);

                // TODO WHEN TO DELETE OBJECT?
                //var syncObject = self.syncObjectMap[socket.id];
                //delete self.syncObjectMap[socket.id];

                //var i = self.syncObjectArray.indexOf(socket);
                //self.syncObjectArray.splice(i, 1);
            });

        });
    });
}

/* Methods */


/**
 * Goes through all sync objects and sends sync requests if necessary.
 */
SyncIt.prototype.syncNow = function () {
    var self = this;
    // TODO merge sync messages
    self.syncObjectArray.forEach(function (syncObject, index, syncObjects) {
        self.syncObject(syncObject);
    });
};

/**
 * Syncs the given sync object.
 */
SyncIt.prototype.syncObject = function (syncObject) {
    var self = this;

    // extract receiver information
    var receivers = null;
    if (syncObject.receivers) {
        receivers = syncObject.receivers;
    }

    // calculate delta for every client
    self.socketArray.forEach(function (socket, index) {
        var delta = Delta.getDelta(syncObject.object, self.socketData[socket.id][syncObject.id].object);

        // TODO has something changed?
        //if (delta.added.keys().length > 0 || delta.removed.keys().length > 0 || delta.updated.keys().length > 0) {
            delta.id = syncObject.id;
            socket.emit("sync", delta);

            // store synced object
            self.socketData[socket.id][syncObject.id] = syncObject;
        //}

    });

};


/**
 * Enables syncing of the given object.
 *
 * If receivers are provided the objects gets synced only with them.
 *
 * @param id Identifier of the synced object. Access it using getObject(id).
 * @param object
 * @param receivers
 * @return {*}
 */
SyncIt.prototype.sync = function (id, object, receivers) {
    if (!object) {
        console.warn("Tried to add sync object that is null.");
        console.log(syncObject);
        console.log(JSON.stringify(self.syncObjectArray));
        return false;
    }

    // create sync object
    var syncObject =  {
        object: object,
        receivers: receivers,
        id: id
    };
    // add sync object
    this.syncObjectArray.push(syncObject);
    this.syncObjectMap[id] = syncObject;

    return syncObject;
};

/**
 * Sends given message to all receivers.
 *
 * @param message
 * @param receivers
 */
SyncIt.prototype.sendMessage = function (message, receivers) {
    var self = this;
    // test if receivers are defined
    if (receivers) {
        self.log("Sending to receivers.");
        // who should receive syncs?
        // extract client ids
        receivers.forEach(function (receiverId, index) {
            if (receiverId == SyncIt.SERVER_RECEIVER_ID) {
                // sync with server
                // -> do nothing
            } else {
                // sync with a client
                self.io.connected[receiverId].emit("sync", message);
            }
        });
    } else {
        // sync with everybody
        self.io.emit("sync", message);
    }
};

/**
 * Returns the object with the given id.
 *
 * @param id
 */
SyncIt.prototype.getObject = function (id) {
    if (!this.syncObjectMap[id]) {
        console.log("SyncIt: getObject() - No object with id " + id);
        return null;
    }
    return this.syncObjectMap[id].object;
};


/**
 * Prints the given msg on the console if this.debug = true;
 * @param msg
 */
SyncIt.prototype.log = function (msg) {
    if (this.debug) console.log(msg);
};


/* HELPERS */




module.exports = SyncIt;
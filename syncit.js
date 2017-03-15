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

    this.sockets = {};


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


            // store sockets in a map so a sync can reach them
            self.sockets[socket.id] = socket;
            self.socketData[socket.id] = {};

            // client accepted
            self.log("Accepted client " + name);

            // send client all shared objects
            for (var i = 0; i < self.syncObjectArray.length; i++) {
                socket.emit("new_object", self.syncObjectArray[i]);
            }

            // INITIALIZE SOCKET AND PROTOCOL

            socket.on("sync", function (data, two) {
                self.log("SyncIt event: " + JSON.stringify(data) + ", " + two);
            });
            /**
             * Request to sync an object.
             */
            socket.on("sync_object", function (data) {
                console.log("Sync object request: " + JSON.stringify(data));
                // TODO check provided data
                //self.syncObjectArray = data;
            });

            socket.on("disconnect", function (socket) {
                self.log("SyncIt disconnected: " + socket.id);

                // remove socket
                delete self.sockets[socket.id];
                var syncObject = self.syncObjectMap[socket.id];
                delete self.syncObjectMap[socket.id];

                var i = self.syncObjectArray.indexOf(socket);
                self.syncObjectArray.splice(i, 1);
            });

        });
    });
};

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

    // send sync message
    var syncMessage = {
        id: syncObject.id,
        object: syncObject.object
    };

    self.sendMessage(syncMessage, receivers);
};


/**
 * Enables syncing of the given object.
 *
 * If receivers are provided the objects gets synced only with them.
 *
 * @param object
 * @param receivers
 * @return {*}
 */
SyncIt.prototype.sync = function (id, object, receivers) {
    // create sync object
    var syncObject =  {
        object: object,
        receivers: receivers,
        id: id
    };
    // add sync object
    this.syncObjectArray.push(syncObject);

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
 * Prints the given msg on the console if this.debug = true;
 * @param msg
 */
SyncIt.prototype.log = function (msg) {
    if (this.debug) console.log(msg);
};


/* HELPERS */




module.exports = SyncIt;
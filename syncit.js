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
//var SocketIo = require("socket.io");


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
    this.syncObjects = [];


    // init io as it is connected
    this.io.on('connection', function (socket) {
        self.log("New SyncIt connection.");
        socket.on("handshake", function (handshake) {
            self.log("Received handshake message: " + JSON.stringify(handshake));
            // evaluate handshake message
            var name = handshake.name;

            if (!name) {
                console.error("Client with wrong handshake format tried to connect.");
                socket.disconnect();
                // TODO put socket into right namespace (accepted)
            }

            // client accepted
            self.log("Accepted client " + name);

            // TODO send client all objects
        });
    });
    this.io.on('event', function (data) {
        self.log("SyncIt event: " + JSON.stringify(data));
    });

    this.io.on('disconnect', function (disconnected) {
        self.log("SyncIt disconnected: " + disconnected)
    });
}

/* Methods */


/**
 * Goes through all sync objects and sends sync requests if necessary.
 */
SyncIt.prototype.syncNow = function () {
    var self = this;
    self.syncObjects.forEach(function (syncObject, index, syncObjects) {
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

    // send sync messages
    var syncMessage = {

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
SyncIt.prototype.sync = function (object, receivers, id) {
    id = id || this.createNewId();

    // create sync object
    var syncObject =  {
        object: object,
        receivers: receivers,
        id: id
    };
    // add sync object
    this.syncObjects.push(syncObject);

    return syncObject;
};

SyncIt.prototype.sendSyncMessage = function () {

};

SyncIt.prototype.sendMessage = function (message, receivers) {
    // test if receivers are defined
    if (receivers) {
        // who should receive syncs?
        // extract client ids
        receivers.forEach(function (receiverId, index) {
            if (receiverId == SyncIt.SERVER_RECEIVER_ID) {
                // sync with server
                // -> do nothing
            } else {
                // sync with a client
                io.connected[receiverId].emit("sync", message);
            }
        });
    } else {
        // sync with everybody
        io.broadcast.emit("sync", message);
    }
};

/**
 * Creates a new unique id.
 *
 * @return {number}
 */
SyncIt.prototype.createNewId = function () {
    if (this.lastId == null) {
        this.lastId = -1;
    }
    // increase id
    // TODO test if the id is already in use
    this.lastId++;
    var newId = this.lastId;

    this.log("Created new id: " + newId);
    
    return newId;
};

/**
 * Prints the given msg on the console if this.debug = true;
 * @param msg
 */
SyncIt.prototype.log = function (msg) {
    if (this.debug) console.log(msg);
};

module.exports = SyncIt;
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

    this._statistics = {
        sentMessages: 0
    };

    if (!io) {
        console.error("Can't create SyncIt object with no SocketIO connection.");
        return;
    } else {
        // use given socket io oject
        this.io = io;
    }


    // spaces
    this._globalSpace = {};
    this._oldGlobalSpace = {};
    /**
     * Holds objects associated with a name.
     *
     * F.e. _nameSpace["name of room"].value = "test"
     *
     * @type {{}}
     * @private
     */
    this._nameSpace = {};
    /**
     * Old objects of the name space to get the delta.
     *
     * @type {{}}
     * @private
     */
    this._oldNameSpace = {};
    /**
     * Mapping of the clients to the name store.
     * Each client is associated with a unique id.
     * The value is an array of rooms the client is connected to.
     *
     * F.e. _nameSpaceClients[clientId] = ["room1", "room2", ...]
     *
     * @type {{}}
     * @private
     */
    this._nameSpaceClients = {};
    /**
     * Holds all objects associated with a client id.
     *
     * @type {{}}
     * @private
     */
    this._clientSpace = {};

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


            // store socket in a map so a sync can reach it
            self.socketMap[socket.id] = socket;
            self.socketArray.push(socket);

            // client accepted
            self.log("Accepted client " + name);


            // inform client about the global space
            var initObject = {
                globalSpace: self._globalSpace
            };

            socket.emit("init_objects", initObject);
            self._statistics.sentMessages++;


            // INITIALIZE SOCKET AND PROTOCOL

            /**
             * Called as the socket has changed something in the data.
             * The request contains the name of a space if one is given.
             */
            socket.on("sync", function (msg) {
                self.log("SyncIt event: " + JSON.stringify(msg));
                // TODO check if client has write access

                if (msg.room) {
                    // TODO sync with specific room


                    Delta.applyDelta(self.getObject(msg.id), msg);

                    // broadcast change in room
                    socket.broadcast.emit("sync", msg);
                } else  {
                    // sync with private space
                    Delta.applyDelta(self._clientSpace[socket.id], msg);
                }

            });

            /**
             * Called as a client changes something in the global space.
             */
            socket.on("sync-global", function (delta) {
                // sync global state
                Delta.applyDelta(self._globalSpace, delta);
                // TODO check if applyDelta() would be an alternative
                self._oldGlobalSpace = JSON.parse(JSON.stringify(self._globalSpace));

                socket.broadcast.emit("sync-global", delta);
                self._statistics.sentMessages++;
            });
            /**
             * Request to sync an object.
             */
            socket.on("sync_object", function (data) {

            });

            socket.on("disconnect", function (socket) {
                self.log("SyncIt disconnected: " + socket.id);

                // notify listener
                if (self.onClientDisconnected) {
                    self.onClientDisconnected(socket);
                }

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

            // inform listeners about connection
            if (self.onClientConnected) {
                self.onClientConnected(socket);
            }
        });
    });
}

/* Methods */


/**
 * Goes through all sync objects and sends sync requests if necessary.
 */
SyncIt.prototype.syncNow = function () {
    var self = this;

    // sync the global space
    var delta = Delta.getDelta(self._globalSpace, self._oldGlobalSpace);
    if (delta.added || delta.removed || delta.updated) {
        // something has changed
        // send global sync
        self.io.emit("sync-global", delta);
        self._statistics.sentMessages++;
        console.log("global sync");

        // update old global state
        // TODO test if applyDelta() would be a faster solution?
        // does applyDelta() create a "real" copy?
        self._oldGlobalSpace = JSON.parse(JSON.stringify(self._globalSpace));
    }


    // TODO merge sync messages
    /*self.syncObjectArray.forEach(function (syncObject, index, syncObjects) {
        self._syncObject(syncObject);
    });*/
};


/* Methods for Spaces */

/**
 * Access the global space.
 * The global space is shared with all connected clients and the server.
 */
SyncIt.prototype.globalSpace = function () {
    return this._globalSpace;
};

/**
 * Access a named space through the given name.
 *
 * @param name
 */
SyncIt.prototype.nameSpace = function (name) {
    return this._nameSpace[name];
};

/**
 * Access a private space only shared between the given client and the server.
 *
 * @param clientId
 * @return {*}
 */
SyncIt.prototype.clientSpace = function (clientId) {
    return this._clientSpace[clientId];
};

/**
 * Connects the client with the given id to the space with the given name.
 *
 * @param clientId
 * @param name
 * @private
 */
SyncIt.prototype._connectToSpace = function (clientId, name) {
    var nameSpaceClients = this._nameSpaceClients[name];
    if (!nameSpaceClients) {
        // does not exist yet
        this._nameSpaceClients[name] = [];
        nameSpaceClients = this._nameSpaceClients[name];
    }
    // check if client has already been added
    if (nameSpaceClients.indexOf(clientId) != -1) {
        console.warn("Tried to connect client to space twice. space=" + name + ", client=" + clientId);
        return;
    }
    // add client id
    this._nameSpaceClients[name].push(clientId);
};

/**
 * Disconnects the client with the given id from the space with the given name.
 *
 * If the space is empty it will be deleted if keep alive is set to false.
 *
 * @param clientId
 * @private
 */
SyncIt.prototype._disconnectFromSpace = function (clientId, name) {
    // TODO implement disconnect from space
    // count references on name space
    console.error("Not implemented yet");
};


/* Private Methods */

/**
 * Syncs the given sync object.
 */
SyncIt.prototype._syncObject = function (syncObject) {
    var self = this;

    // extract receiver information
    var receivers = null;
    if (syncObject.receivers) {
        receivers = syncObject.receivers;
    }

    // calculate delta for every client
    self.socketArray.forEach(function (socket, index) {
        var delta = Delta.getDelta(syncObject.object, self.socketData[socket.id][syncObject.id].object);

        // has something changed?
        if (delta.added || delta.removed || delta.updated) {
            delta.id = syncObject.id;
            socket.emit("sync", delta);
            self._statistics.sentMessages++;

            // store synced object
            self.socketData[socket.id][syncObject.id] = syncObject;
        }

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
 * Starts an internal clock that syncs items in the given interval.
 *
 * @param updateInMs
 */
SyncIt.prototype.start = function (updateInMs) {
    var self = this;
    if (self.timer) {
        // a timer is running
        // => already started
        console.log("Tried to start SyncIt twice.");
        return;
    }
    // start a timer loop to sync every interval
    var timeOut = function () {

        self.timer = setTimeout(function () {
            timeOut();
            self.syncNow();
        }, updateInMs);

    };
    timeOut();


    var debugOut = function () {

        self.timer = setTimeout(function () {
            debugOut();
            console.log("Sent messages: " + self._statistics.sentMessages);
        }, 5000);

    };
    debugOut();

    console.log("Started auto sync of SyncIt with an update interval of " + updateInMs + " milliseconds.");
};

/* LISTENERS */
SyncIt.prototype.setOnClientDisconnectedListener = function (listener) {
    this.onClientDisconnected = listener;
};

SyncIt.prototype.setOnClientConnectedListener = function (listener) {
    this.onClientConnected = listener;
};


/* HELPERS */


/**
 * Prints the given msg on the console if this.debug = true;
 * @param msg
 */
SyncIt.prototype.log = function (msg) {
    if (this.debug) console.log(msg);
};


module.exports = SyncIt;
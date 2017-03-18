

var Delta = new Delta();



function SyncIt(socket) {
    var self = this;


    this._statistics = {
        sentMessages: 0
    };

    // for the internal clock
    this.interval = 50;
    /**
     * Reference to the internal timer.
     */
    this.timer = null;

    // spaces

    /**
     * Global space accessible by everyone.
     * A value is set during initialization.
     *
     * @type {null}
     * @private
     */
    this._globalSpace = null;
    this._nameSpace = {};
    this._clientSpace = {};

    // socket
    this.socket = socket;
    this.syncObjectMap = {};
    this.syncObjectArray = [];
    this.oldSyncObjectMap = {};

    // init

    var init = function () {
        socket.on("connect", function() {
            socket.emit("handshake", { name: "SyncIt Client"});
            self._statistics.sentMessages++;
            console.log("Handshake message sent from " + socket.id);
        });

        // SET UP PROTOCOL

        /**
         * Receives an array of all synced objects.
         */
        socket.on("init_objects", function (data) {
            // extract global space
            self._globalSpace = data.globalSpace;

            // SyncIt initialized
            if (self._onReadyListener) {
                // inform listener
                self._onReadyListener();
            }
        });

        /**
         * Sync message for the global space.
         */
        socket.on("sync-global", function (delta) {
            // sync global state
            Delta.applyDelta(self._globalSpace, delta);
            // TODO is applyDelta() an alternative?
            self._oldGlobalSpace = JSON.parse(JSON.stringify(self._globalSpace));
        });

        socket.on("sync_object", function (data) {
            console.log("New object: " + data.id);
            // store new object
            self.syncObjectMap[data.id] = data;
            self.syncObjectArray.push(data);
            self.oldSyncObjectMap[data.id] = { id: data.id, object: JSON.parse(JSON.stringify(data.object))};
        });

        socket.on("sync", function(delta) {
            // merge data
            console.log("sync for " + delta.id + " " + JSON.stringify(delta));
            Delta.applyDelta(self.getObject(delta.id), delta);
        });

        socket.on("disconnect", function () {
            console.log("Disconnected.");
        });
    };


    init();

    return this;
}

/**
 * Define a listener that should be called as SyncIt is initialized.
 */
SyncIt.prototype.setOnReadyListener = function (onReady) {
    this._onReadyListener = onReady;
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

    console.log("Started auto sync of SyncIt.");
};

SyncIt.prototype.globalSpace = function () {
    return this._globalSpace;
};

SyncIt.prototype.nameSpace = function (name) {

};

SyncIt.prototype.clientSpace = function (clientId) {

};

/**
 * Enables syncing of the given object.
 */
SyncIt.prototype.sync = function (id, object) {

    // send request for syncing
    this.socket.emit("sync_object", { id: id, object: object } );

    this.syncObjectArray.push({id: id, object: object});

    // store synced object
    this.syncObjectMap[id] = {id: id, object: object};
    this.oldSyncObjectMap[id] = {id: id, object: JSON.parse(JSON.stringify(object))};
};

/**
 * Performs a sync by sending all delta to the server.
 */
SyncIt.prototype.syncNow = function () {
    var self = this;

    // sync the global space
    var delta = Delta.getDelta(self._globalSpace, self._oldGlobalSpace);
    if (delta.added || delta.removed || delta.updated) {
        // something has changed
        // send global sync
        self.socket.emit("sync-global", delta);
        self._statistics.sentMessages++;

        // update old global state
        // TODO test if applyDelta() would be a faster solution?
        // does applyDelta() create a "real" copy?
        self._oldGlobalSpace = JSON.parse(JSON.stringify(self._globalSpace));
    }

    /*self.syncObjectArray.forEach(function (syncObject, index, syncObjects) {
        self._syncObject(syncObject);
    });*/
};


/**
 * Syncs the given sync object.
 */
SyncIt.prototype._syncObject = function (syncObject) {
    var self = this;

    // calculate delta for every client
    var delta = Delta.getDelta(syncObject.object, self.oldSyncObjectMap[syncObject.id].object);
    // has something changed?
    if (delta.added || delta.removed || delta.updated) {
        delta.id = syncObject.id;
        self.socket.emit("sync", delta);

        // store synced object
        self.oldSyncObjectMap[syncObject.id] = { id: syncObject.id, object: JSON.parse(JSON.stringify(syncObject.object) )};
        //self.socketData[socket.id][syncObject.id] = syncObject.object;
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






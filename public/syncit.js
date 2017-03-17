

var Delta = new Delta();



function SyncIt(socket) {
    var self = this;

    // for the internal clock
    this.interval = 50;
    /**
     * Reference to the internal timer.
     */
    this.timer = null;

    // objects

    this.socket = socket;
    this.syncObjectMap = {};
    this.syncObjectArray = [];
    this.oldSyncObjectMap = {};

    // init

    var init = function () {
        socket.on("connect", function() {
            socket.emit("handshake", { name: "SyncIt Client"});
            console.log("Handshake message sent from " + socket.id);
        });

        /**
         * Receives an array of all synced objects.
         */
        socket.on("init_objects", function (objects) {
            for (var i = 0; i < objects.length; i++) {
                var data = objects[i];
                self.syncObjectMap[data.id] = data;
                self.syncObjectArray.push(data);
                self.oldSyncObjectMap[data.id] = { id: data.id, object: JSON.parse(JSON.stringify(data.object))};
            }
            // SyncIt initialized
            if (self.onReady) {
                // inform listener
                self.onReady();
            }
        });

        // set up protocol
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
}

/**
 * Define a listener that should be called as SyncIt is initialized.
 */
SyncIt.prototype.setOnReadyListener = function (onReady) {
    this.onReady = onReady;
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

    console.log("Started auto sync of SyncIt.");
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
    self.syncObjectArray.forEach(function (syncObject, index, syncObjects) {
        self.syncObject(syncObject);
    });
};


/**
 * Syncs the given sync object.
 */
SyncIt.prototype.syncObject = function (syncObject) {
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






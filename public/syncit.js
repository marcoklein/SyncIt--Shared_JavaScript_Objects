

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

            console.log("Emit.");
            socket.emit("handshake", { name: "SyncIt Client"});

        });

        // set up protocol
        socket.on("sync_object", function (data) {
            console.log("New object: " + JSON.stringify(data));

            // store new object
            self.syncObjectMap[data.id] = data;
            self.syncObjectArray.push(data);
            self.oldSyncObjectMap[data.id] = { id: data.id, object: Object.assign({}, data.object) };
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
    this.oldSyncObjectMap[id] = {id: id, object: Object.assign({}, object)};
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
    console.log("sync object:");
    console.log(JSON.stringify(syncObject.object));
    console.log(JSON.stringify(self.oldSyncObjectMap[syncObject.id].object));
    var delta = Delta.getDelta(syncObject.object, self.oldSyncObjectMap[syncObject.id].object);
    console.log(JSON.stringify(delta));
    // TODO has something changed?
    //if (delta.added.hasChildNodes() || delta.removed.hasChildNodes() || delta.updated.hasChildNodes()) {
        delta.id = self.socket.id;
        self.socket.emit("sync", delta);

        // store synced object
        self.oldSyncObjectMap[syncObject.id] = { id: syncObject.id, object: Object.assign({}, syncObject.object )};
        //self.socketData[socket.id][syncObject.id] = syncObject.object;
    //}


};

/**
 * Returns the object with the given id.
 *
 * @param id
 */
SyncIt.prototype.getObject = function (id) {
    if (!this.syncObjectMap[id]) {
        console.log("SyncIt: getObject() - No object with id " + id);
        return {};
    }
    return this.syncObjectMap[id].object;
};






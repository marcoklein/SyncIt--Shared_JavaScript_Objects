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
    /**
     * Snapshot of all old sync objects of the last sync state.
     *
     * @type {Array}
     */
    this.socketData = [];


    // init socket io as it gets connected
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

    // send sync message
    var syncMessage = {
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


/* HELPERS */


/**
 * Creates a map out of an array be choosing what property to key by
 * @param {object[]} array Array that will be converted into a map
 * @param {string} prop Name of property to key by
 * @return {object} The mapped array. Example:
 *     mapFromArray([{a:1,b:2}, {a:3,b:4}], 'a')
 *     returns {1: {a:1,b:2}, 3: {a:3,b:4}}
 */
function mapFromArray(array, prop) {
    var map = {};
    for (var i=0; i < array.length; i++) {
        map[ array[i][prop] ] = array[i];
    }
    return map;
}

function isEqual(a, b) {
    return a.title === b.title && a.type === b.type;
}

/**
 * @param {object[]} o old array of objects
 * @param {object[]} n new array of objects
 * @param {object} An object with changes
 */
function getDelta(o, n, comparator)  {
    var delta = {
        added: [],
        deleted: [],
        changed: []
    };
    var mapO = mapFromArray(o, 'id');
    var mapN = mapFromArray(n, 'id');
    for (var id in mapO) {
        if (!mapN.hasOwnProperty(id)) {
            delta.deleted.push(mapO[id]);
        } else if (!comparator(mapN[id], mapO[id])){
            delta.changed.push(mapN[id]);
        }
    }

    for (var id in mapN) {
        if (!mapO.hasOwnProperty(id)) {
            delta.added.push( mapN[id] )
        }
    }
    return delta;
}




/**
 * Compares the two objects and returns a delta with the given format:
 *
 *   - added: [{}, {}, ...]
 *   - deleted: [{}, {}, ...]
 *   - changed: [{}, {}, ...]
 *
 * @param currentObject
 * @param oldObject
 * @param parentKey
 * @param delta
 */
function compareDelta(currentObject, oldObject, parentKey, delta) {
    console.log("Parent key: " + parentKey);
    if (!parentKey) {
        parentKey = "";
    }
    if (!delta) {
        delta = {
            added: {},
            removed: {},
            updated: {}
        };
    }

    // helper to determine new parent key
    var parentKeyPrefix = (parentKey === "" ? "" : parentKey + ".");

    // loop through keys of root
    var keys = Object.keys(currentObject);

    // compare keys with keys of old object to detect removals
    if (oldObject) {
        // TODO integrate this into looping through current object keys for better performance
        var oldKeys = Object.keys(oldObject);
        for (var j = 0; j < oldKeys.length; j++) {
            var oldKey = oldKeys[j];
            var oldValue = oldObject[oldKey];
            if (!currentObject.hasOwnProperty(oldKey)) {
                setProperty(delta.removed, parentKeyPrefix + (Array.isArray(oldValue) ? "@" : "") + oldKey, oldValue);
            }
        }
    }

    // compare keys of current object with old object
    for (var i = 0; i < keys.length; i++) {
        // extract current key we are comparing
        var key = keys[i];
        var value = currentObject[key];
        // create the pointer that points to this key
        var newParentKey = parentKeyPrefix + (Array.isArray(value) ? "@" : "") + key;

        // has second object the key?
        if (oldObject && oldObject.hasOwnProperty(key)) {
            // property exists in second object => updated

            // compare properties
            // has property changed?
            if (Array.isArray(value)) {
                // property is an array -> loop through array to compare it
                compareDelta(currentObject[key], oldObject ? oldObject[key] : null, newParentKey, delta);


            } else if (typeof value === "object") {
                // go through object
                compareDelta(currentObject[key], oldObject ? oldObject[key] : null, newParentKey, delta);


            } else if (value !== oldObject[key]) {
                // value has changed
                // => add it to delta
                setProperty(delta.updated, newParentKey, value);
            }
        } else {
            // property does not exist in second object => added

            // loop through property
            // if it contains an object or an array
            if (Array.isArray(value)) {
                // create array in second object
                // loop through array
                compareDelta(currentObject[key], oldObject ? oldObject[key] : null, newParentKey, delta);
            } else if (typeof value === "object") {
                // loop through object
                // go through object
                compareDelta(currentObject[key], oldObject ? oldObject[key] : null, newParentKey, delta);
            }
            // add key if not already added (through array or object looping)
            if (currentObject.hasOwnProperty(key)) {
                setProperty(delta.added, newParentKey, value);
            }
        }
    }

    return delta;
}





/**
 * Sets the value of the given object at the specified location.
 *
 * @param object
 * @param pointer Points to the attribute. F.e. "list.0.name".
 * @param value
 */
function setProperty(object, pointer, value) {
    var element = object;
    var keys = pointer.split(".");
    for (var i = 0; i < keys.length - 1; i++) {
        var key = keys[i];
        if (!element[key]) {
            // object element
            element[key] = {};
        }
        element = element[key];
    }
    element[keys[keys.length - 1]] = value;
}

/**
 * Gets the element using the given pointer -> event possible for arrays.
 *
 * A pointer is an array of keys that eventually lead to the element.
 * ["list", 0, ... ]
 *
 * @param object
 * @param pointer
 */
function getProperty(object, pointer) {
    var element = object;
    var keys = pointer.split(".");
    keys.forEach(function (key) {
        // skip "@” array identifiers
        if (key.charAt(0) === "@") {
            // array element
            key = key.slice(1);
        }
        element = element[key];
    });
    return element;
}

function applyDelta(object, delta) {
    delta.added.forEach(function (item, index) {
    });
    delta.removed.forEach(function (item, index) {

    });
    delta.updated.forEach(function (item, index) {

    });
    return object;
}

/**
 * Delta is an array of three objects:
 *   - added
 *   - updated
 *   - removed
 *
 * @param first
 * @param second
 * @param pointer
 * @param delta
 */
/*function compareDelta(first, second, pointer, delta) {
    if (!pointer) {
        // init pointer if necessary
        pointer = [];
    }



}*/


console.log("Comparing delta.");
var a = {
    object: {
        text: "ttttext",
        number: 10,
        myArray: [
            {
                key1: "prop1",
                key2: 10
            },
            {
                text: "prop1",
                number: 10
            }
        ]
    }
};
var b = {
    object: {
        text: "jkh",
        myArray: [
            {
                text: "prop1",
                number: 10
            },
            {
                text: "prop2",
                number: 10
            }
        ]
    }
};

var delta = compareDelta(a, b);

console.log("Delta: " + JSON.stringify(delta));



//var pointer = ["list", 0];

//setProperty(a, "@list.3", "another");
//console.log("Get element test: asdf === " + getProperty(a, "list.1"));



module.exports = SyncIt;
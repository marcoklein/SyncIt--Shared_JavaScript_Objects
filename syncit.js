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
 * @param first
 * @param second
 * @param root
 * @param delta
 */
function compareDelta(first, second, root, delta, rootElement) {
    var newRoot;
    if (!root) {
        root = "";
        rootElement = first;
        newRoot = true;
    } else if (!rootElement) {
        rootElement = first;
        // TODO get root element at root position (parse dots)
    }
    if (!delta) {
        delta = {
            added: [],
            removed: [],
            updated: []
        };
    }
    // prepare next root (use a . or nothing?)
    var nextRoot = (newRoot ? "" : root + ".");

    console.log("root: " + root);

    // loop through keys of root
    var keys = Object.keys(rootElement);
    console.log("object keys: " + keys);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var newKey = nextRoot + key;
        console.log("new key: " + newKey);

        console.log("Comparing key " + key);
        // has second object the key?

        var objectChange = {};

        // TODO MAP ARRAYS TO OBJECTS FORMAT array.0, array.1, ...


        var value = rootElement[key];
        // compare array elements
        if (Array.isArray(rootElement)) {
            console.log("root is an array");
            // compare array items
            rootElement.forEach(function (item, index) {
                // TODO compare each array item
            });


            // add property if it has not been added
            // TODO test if second object value may be an array or object => then call deleted?
            objectChange[newKey] = [];
            objectChange[newKey].push(value);
            delta.updated.push(objectChange);

        } else if (second.hasOwnProperty(key)) {
            // compare properties
            console.log("has property " + key);
            // has property changed?
            if (Array.isArray(value)) {
                console.log("is array");
                value.forEach(function (item, index) {
                    // compare each item
                    compareDelta(first, second, newKey, delta, rootElement[key]);
                });
                // add property if it has not been added
                if (!rootElement.hasOwnProperty(key)) {
                    // TODO test if second object value may be an array or object => then call deleted?rough array or object looping)
                    objectChange[newKey] = value;
                    delta.updated.push(objectChange);
                }
            } else if (typeof value === "object") {
                // go through object
                compareDelta(first[key], second[key], newKey, delta, rootElement[key]);
                // add property if it has not been added
                if (!rootElement.hasOwnProperty(key)) {
                    objectChange[newKey] = value;
                    delta.updated.push(objectChange);
                }
            } else if (value !== second[key]) {
                // what does the second object has?
                // TODO CHECK FOR SECOND KEY PROPERTIES TO DETECT DELETIONS!
                console.log("Neither array nor object.");
                // value has changed
                // => add it to delta
                if (Array.isArray(rootElement)) {
                    root.push(value);
                } else {
                    objectChange[newKey] = value;
                    delta.updated.push(objectChange);
                }
            }
        } else {
            console.log("new property: " + key)
            // => property added
            // loop through property
            // if it contains an object or an array
            if (Array.isArray(value)) {
                // loop through array
                for (var item in value) {
                    // compare each item
                    compareDelta(first, second, root[key], delta, rootElement);
                }
            } else if (typeof value === "object") {
                // loop through object
                // go through object
                compareDelta(first, second, root[key], delta, rootElement);

                // TODO design decision: should arrays or objects which are empty key be added?
                // if you want to do so, simply add a check if the key exists on the second object
            }
            // add key if not already added (through array or object looping)
            if (Array.isArray(rootElement)) {
                root.push(value);
            } else if (rootElement.hasOwnProperty(key)) {
                objectChange[newKey] = value;
                delta.added.push(objectChange);
            }
        }
    }

    return delta;
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
function getElement(object, pointer) {

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
    test: 10,
    object: {
        text: "prop1",
        number: 10
    },
    list: [
        "asdf",
        12
    ]
};
var b = {
    test: 12,
    object: {
        text: "jkh"
    },
    list: [
        "a",
        1
    ]
};

var realDelta = {
    added: [],
    updated: ["test", 10],
    removed: []
};


console.log(Object.keys(a));
var delta = compareDelta(a, b);

console.log("Delta: " + JSON.stringify(delta));

var testList = [

];

Object.observe(a, function (resp) {
    console.log("observe: " + JSON.stringify(resp));
});



console.log("Second: " + JSON.stringify(delta));



module.exports = SyncIt;
/**
 * Created by marco on 15.03.17.
 */

var Delta = function() {
};

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
 * @return {*}
 */
Delta.prototype.getDelta = function (currentObject, oldObject, parentKey, delta) {
    var self = this;
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

    // getDelta keys with keys of old object to detect removals
    if (oldObject) {
        // TODO integrate this into looping through current object keys for better performance
        var oldKeys = Object.keys(oldObject);
        for (var j = 0; j < oldKeys.length; j++) {
            var oldKey = oldKeys[j];
            var oldValue = oldObject[oldKey];
            if (!currentObject.hasOwnProperty(oldKey)) {
                self.setPropertyNoArray(delta.removed, parentKeyPrefix + (Array.isArray(oldValue) ? "@" : "") + oldKey, oldValue);
            }
        }
    }

    // getDelta keys of current object with old object
    for (var i = 0; i < keys.length; i++) {
        // extract current key we are comparing
        var key = keys[i];
        var value = currentObject[key];
        // create the pointer that points to this key
        var newParentKey = parentKeyPrefix + (Array.isArray(value) ? "@" : "") + key;

        // has second object the key?
        if (oldObject && oldObject.hasOwnProperty(key)) {
            // property exists in second object => updated

            // getDelta properties
            // has property changed?
            if (Array.isArray(value)) {
                // property is an array -> loop through array to getDelta it
                self.getDelta(currentObject[key], oldObject ? oldObject[key] : null, newParentKey, delta);


            } else if (typeof value === "object") {
                // go through object
                self.getDelta(currentObject[key], oldObject ? oldObject[key] : null, newParentKey, delta);


            } else if (value !== oldObject[key]) {
                // value has changed
                // => add it to delta
                self.setPropertyNoArray(delta.updated, newParentKey, value);
            }
        } else {
            // property does not exist in second object => added

            // loop through property
            // if it contains an object or an array
            if (Array.isArray(value)) {
                // create array in second object
                // loop through array
                self.getDelta(currentObject[key], oldObject ? oldObject[key] : null, newParentKey, delta);
            } else if (typeof value === "object") {
                // loop through object
                // go through object
                self.getDelta(currentObject[key], oldObject ? oldObject[key] : null, newParentKey, delta);
            }
            // add key if not already added (through array or object looping)
            if (currentObject.hasOwnProperty(key)) {
                self.setPropertyNoArray(delta.added, newParentKey, value);
            }
        }
    }

    return delta;
};

/**
 * Sets the value of the given object at the specified location.
 *
 * @param object
 * @param pointer Points to the attribute. F.e. "list.0.name".
 * @param value
 */
Delta.prototype.setPropertyNoArray = function (object, pointer, value) {
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
};

Delta.prototype.setProperty = function (object, pointer, value) {
    var element = object;
    var keys = pointer.split(".");
    for (var i = 0; i < keys.length - 1; i++) {
        var key = keys[i];
        if (key.charAt(0) === "@") {
            // array element
            key = key.slice(1);
            if (!element[key]) {
                // create an empty array
                element[key] = [];
            }
        } else if (!element[key]) {
            // object element
            element[key] = {};
        }
        element = element[key];
    }
    element[keys[keys.length - 1]] = value;
};

/**
 * Gets the element using the given pointer -> event possible for arrays.
 *
 * A pointer is an array of keys that eventually lead to the element.
 * ["list", 0, ... ]
 *
 * @param object
 * @param pointer
 */
Delta.prototype.getProperty = function (object, pointer) {
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
};


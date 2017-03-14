/**
 * Created by marco on 14.03.17.
 */


console.log("Testing the performance of delta detection...");
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



var startTime = Date.now();

// code ...

console.log("Elapsed time (ms): " + (Date.now() - startTime));
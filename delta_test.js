/**
 * Created by marco on 14.03.17.
 */

var Delta = require("./delta");

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

var x = {
    arr: [],
    obj: {}
};

var y = {
    arr: [],
    obj: {}
}

var largeString;
for (var i = 0; i<1000; i++) {
    largeString += "halloWelt";
}

for (var j = 0; j < 1000; j++) {

    if(j%2 == 0) {
        x.arr.push("item_" + (j + 1));
        x.obj['key_' + j] = "val_" + largeString;
    }

    y.arr.push("item_"+j);
    y.obj['key_'+j] = "val_"+largeString;
}


var startTime = Date.now();

var delta = Delta.compare(x, y);

var endTime = Date.now();

console.log("Delta: " + JSON.stringify(delta));

console.log("Elapsed time (ms): " + (endTime - startTime));


//var pointer = ["list", 0];

//setProperty(a, "@list.3", "another");
//console.log("Get element test: asdf === " + getProperty(a, "list.1"));



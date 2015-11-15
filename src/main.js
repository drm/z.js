var fs = require('fs');
var z = require('./parser-util');
var parser = require('./parser');

var container = z.parseFile(process.argv[2]);

if (process.argv[3]) {
    var closure = container.get(process.argv[3]);

    closure.resolve(container.context)();
} else {
    console.log("TODO: render help");
}

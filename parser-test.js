var assert = require('assert-diff');
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var z = require('./src/parser-util.js');
var parser = require('./lib/parser.js');

var files;
if (process.argv.length > 2) {
    files = process.argv.slice(2);
} else {
    files = fs.readdirSync('parser-tests');
}

files.forEach(function (fileName) {
    fs.readFile(path.join('parser-tests', fileName), {encoding: 'UTF-8'}, function (err, data) {
        if (err) {
            throw err;
        }
        if (fileName.match(/\.z$/)) {
            console.log("Parsing " + fileName);
            try {
                var result = parser.parse(data);
                var test = path.join('parser-tests', fileName.replace(/\.z/, '.test.js'));
                vm.runInContext(
                    fs.readFileSync(test),
                    vm.createContext({
                        assert: assert,
                        result: result,
                        z: z,
                        console: console
                    })
                );
            } catch (e) {
                if (e instanceof parser.SyntaxError) {
                    console.log(z.renderSyntaxError(fileName, data, e));
                } else {
                    throw e;
                }
            }
            console.log("");
        }
    });
});

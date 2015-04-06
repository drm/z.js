module.exports = (function() {
    var _ = require('lodash');

    var Declaration = function (name, args, body) {
        this.name = name;
        this.args = args;
        this.body = body;
    };

    Declaration.prototype = {
        getValue: function () {
            return this.body;
        },

        resolve: function () {
            return this.body.resolve();
        },

        normalize: function() {
            if (!this.body) {
                this.body = new Noop();
            } else {
                this.body.normalize();
            }
        }
    };

    var Noop = function() {
    };
    Noop.prototype = {
        resolve: function() {
            return true;
        }
    };

    var BinOp = function (op, left, right) {
        this.op = op;
        this.left = left;
        this.right = right;
    };

    var UnOp = function (op, operand) {
        this.op = op;
        this.operand = operand;
    };

    var Arg = function (name, default_value) {
        this.name = name;
        this.default_value = default_value;
    };

    var Container = function (declarations) {
        this.declarations = declarations;
    };

    Container.prototype = {
        get: function(n) {
            return _.find(this.declarations, function(d) {
                return d.name == n;
            });
        },

        resolve: function(v) {
            return this.get(v).resolve();
        },

        normalize: function() {
            this.declarations.forEach(function(d) {
                d.normalize();
            })
        }
    };

    var Task = function(spec) {
        this.spec = spec || {};
    };

    Task.prototype = {
        normalize: function() {
            var self = this;

            ['pre', 'do', 'post'].forEach(function(scope) {
                self[scope] = [];

                self.spec.forEach(function(el) {
                    if (el.name === scope) {
                        self[scope] = self[scope].concat(el.lines);
                    }
                });
            });
        },

        resolve: function () {
            var self = this;
            ['pre', 'do', 'post'].forEach(function(scope) {
                self[scope].forEach(function(k) {
                    k.resolve();
                });
            });
        }
    };

    var Identifier = function(name) {
        this.name = name;
    };

    var TaskLine = function (data) {
        this.data = data;
    };

    TaskLine.prototype = {
        resolve: function() {
            var child_process = require('child_process');
            var s = child_process.spawn('/bin/bash', ['-e']);
            console.log(this.data); 
            s.stdout.on('data', function(data) {
                console.log('' + data);
            });
            s.stdin.write(this.data);
            s.stdin.write("\nexit 0;\n");
        }
    };

    var TaskSection = function(name, lines) {
        this.name = name;
        this.lines = lines;
    };

    TaskSection.prototype = {
        resolve: function() {
            this.lines.forEach(function (l) {
                l.resolve();
            });
        }
    };

    var TaskPrecondition = function(name, expr) {
        this.name = name;
        this.expr = expr;
    };


    return {
        parseFile: function(file) {
            var parser = require('../lib/parser.js'),
                fs = require('fs'),
                ret
            ;

            ret = parser.parse('' + fs.readFileSync(file));
            ret.normalize();
            return ret;
        },
        Declaration: Declaration,
        Arg: Arg,
        Container: Container,
        TaskLine: TaskLine,
        TaskSection: TaskSection,
        TaskPrecondition: TaskPrecondition,
        Task: Task,
        Identifier: Identifier,

        BinOp: BinOp,
        UnOp: UnOp,

        renderSyntaxError: function(fileName, contents, e) {
            var ret = '';
            ret += 'Syntax error in ' + fileName + ' at line ' + e.line + "\n";
            ret += "\n";
            ret += "    " + fileName + ":" + "\n";
            ret += '    ----------------------------------------' + "\n";
            if (e.line > 1) {
                ret += '    ' + (e.line -1) + '. ' + contents.split("\n")[e.line -2] + "\n";
            }
            ret += '    ' + e.line + '. ' + contents.split("\n")[e.line -1] + "\n";
            ret += '    ' + new Array(e.column + 3).join(" ") + '^-- here' + "\n";
            ret += '    ----------------------------------------' + "\n";
            ret += "" + "\n";
            ret += e.message + "\n";
            return ret;
        }
    }
})();

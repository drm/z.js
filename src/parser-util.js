module.exports = (function() {
    var _ = require('lodash');

    var Declaration = function (name, args, body) {
        this.name = name;
        this.args = args;
        this.body = body;
    };

    Declaration.prototype = {
        getValue: function() {
            return this.body;
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
        }
    };

    var Task = function(spec) {
        this.spec = spec || {};
    };

    var Identifier = function(name) {
        this.name = name;
    };

    var TaskLine = function (data) {
        this.data = data;
    };

    var TaskSection = function(name, lines) {
        this.name = name;
        this.lines = lines;
    };

    var TaskPrecondition = function(name, lines) {
        this.name = name;
        this.lines = lines;
    };


    return {
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

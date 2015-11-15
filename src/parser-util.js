import util from 'util';

class Definition {
    constructor(name, body) {
        this.name = name;
        this.expr = body;
    }

    resolve(context) {
        return this.expr.resolve(context);
    }
}

class Decorator {
    constructor(expr, object) {
        this.expr = expr;
        this.decoratee = object;
    }

    resolve(context) {
        var decorator = context.evaluate(this.expr.resolve(context));
        var decorated = decorator(this.decoratee);
        return decorated.resolve(context);
    }
}

class Invocation {
    constructor(args) {
        this.args = args || [];
    }

    setSubject(subject) {
        this.expr = subject;
        return this;
    }

    resolve(context) {
        var target = this.expr.resolve(context);
        return target.apply(context, this.args.map((a) => context.evaluate(a)));
    }
}


class MemberAccess {
    constructor(member) {
        this.member = member;
    }

    setSubject(subject) {
        this.expr = subject;
        return this;
    }

    resolve(context) {
        return this.expr.resolve(context)[context.evaluate(this.member)];
    }
};

class Closure {
    constructor(args, body) {
        this.args = args || [];
        this.body = body || [];
    }

    resolve(context) {
        let body = this.body;
        let argSpec = this.args;

        return function () {
            let closureArgs = arguments;

            argSpec.forEach((a, i) => {
                if (typeof closureArgs[i] !== 'undefined') {
                    context.set(a.name, closureArgs[i]);
                } else if (a.default_value) {
                    context.set(a.name, context.evaluate(a.default_value));
                } else {
                    throw new Error("missing argument " + i);
                }
            });
            let ret = null;
            body.forEach((d) => { ret = context.evaluate(d) } );
            return ret;
        };
    }
}


class BinOp {
    constructor(op, left, right) {
        this.op = op;
        this.left = left;
        this.right = right;
    }

    resolve(context) {
        var lhs = context.evaluate(this.left);
        var rhs = context.evaluate(this.right);

        switch (this.op) {
            case '+': return lhs + rhs;
            case '-': return lhs - rhs;
            case '/': return lhs / rhs;
            case '*': return lhs * rhs;
            case '&&': return lhs && rhs;
            case '||': return lhs || rhs;
        }

        throw new Error("Invalid operator '" + this.op + "'");
    }
}

class UnOp {
    constructor(op, operand) {
        this.op = op;
        this.operand = operand;
    }

    resolve(context) {
        if (this.op == '&') {
            return this.operand;
        }

        var operand = context.evaluate(this.operand);

        switch (this.op) {
            case '!': return !operand;
            case '-': return -operand;
        }
        throw new Error("Invalid operator '" + this.op + "'");
    }
}

class Arg {
    constructor(name, default_value) {
        this.name = name;
        this.default_value = default_value;
    }

    resolve(context) {
        if (!context.exists(this.name)) {
            context.set(this.name, context.evaluate(this.default_value));
        }
    }
}

class Context {
    constructor() {
        this.scope = [];
        this.environment = {};
    }

    set(a, b) {
        this.environment[a] = b;
    }

    get(a) {
        return this.environment[a];
    }

    exists(a) {
        return typeof this.environment[a] !== 'undefined';
    }

    evaluate(expr) {
        switch (true) {
            case typeof expr === 'string':
            case typeof expr === 'number':
            case typeof expr === 'boolean':
            case expr === null:
            case typeof expr === 'function':
                return expr;
            case typeof expr == 'undefined':
                throw new Error("Cannot resolve undefined value");
        }
        if (typeof expr.resolve === 'function') {
           try {
                return expr.resolve(this);
           } catch (e) {
               throw new Error(
                   "Resolution error `" + e + "` while resolve expression " + util.inspect(expr, 1) +
                   (expr.debug ? " at line " + expr.debug.start.line : "") +
                   " (" + e + ")"
               );
           }
        }
        throw new Error("Unmatched type " + (typeof expr) + " (" + expr.constructor.name + ")");
    }
}

class Container {
    constructor() {
        this.context = new Context();
        this.set('SHELL', ['/bin/bash', ['-e']]);
    }

    defaults() {
        var container = this;

        this.set('triggers', function(task) {
            return function(object) {
                var original = object.resolve;

                object.resolve = function(context) {
                    return function() {
                        var ret = original.call(object, context).apply(object, arguments);
                        task.resolve(context).apply(task, arguments);
                        return ret;
                    }
                };

                return object;
            }
        });
        this.set('depends', function(task) {
            return function(object) {
                var original = object.resolve;

                object.resolve = function(context) {
                    return function()  {
                        task.resolve(context).apply(this, arguments);
                        return original.call(object, context).apply(this, arguments);
                    }
                };

                return object;
            }
        });
    }

    addPrelude(prelude) {
        var vm = require('vm');

        vm.runInContext(
            prelude,
            vm.createContext({
                container: this,
                console: console
            })
        );
    }

    get(n) {
        return this.context.get(n);
    }

    set(n, v) {
        return this.context.set(n, v);
    }

    getContext() {
        return this.context;
    }

    resolve(v) {
        if (!this.context.exists(v)) {
            throw new Error("Trying to resolve undefined value '" + v + "'");
        }
        return this.get(v).resolve(this.getContext());
    }
}

class Identifier {
    constructor(name) {
        this.name = name;
    }

    resolve(context) {
        return context.evaluate(context.get(this.name));
    }
}

class Literal {
    constructor(value) {
        this.value = value;
    }

    resolve(context) {
        if (typeof this.value === 'object') {
            var ret, val = this.value;
            if (val.constructor === Array) {
                ret = [];
                val.forEach(function(v, k) {
                    ret[k]= v.resolve(context);
                });
            } else {
                ret = {};
                Object.keys(val).forEach(function(n) {
                    ret[n]= val[n].resolve(context);
                });
            }
            return ret;
        }
        return this.value;
    }
}

class TaskLine {
    constructor(elements) {
        this.elements = elements;
    }

    resolve(context) {
        this.elements = this.elements.map(function (e) {
            var ret = context.evaluate(e);
            if (typeof ret === 'function') {
                ret = ret.call();
            }
            return ret;
        })

        var child_process = require('child_process');
        var s = child_process.spawn.apply(null, context.get('SHELL'));
        s.stdout.on('data', function (data) {
            process.stdout.write(data);
        });
        s.stdin.write(this.elements.join(""));
        s.stdin.end();
    }
}

function renderDebugInfo(fileName, contents, e) {
    var ret = '';
    ret += "    " + fileName + ":" + "\n";
    ret += '    ----------------------------------------' + "\n";
    if (e.line > 1) {
        ret += '    ' + (e.line - 1) + '. ' + contents.split("\n")[e.line - 2] + "\n";
    }
    ret += '    ' + e.line + '. ' + contents.split("\n")[e.line - 1] + "\n";
    ret += '    ' + new Array(e.column + 3).join(" ") + '^-- here' + "\n";
    ret += '    ----------------------------------------' + "\n";
    ret += "" + "\n";

    return ret;
}

function renderSyntaxError(fileName, contents, e) {
    var ret = '';
    ret += 'Syntax error in ' + fileName + ' at line ' + e.line + "\n";
    ret += "\n";

    ret += renderDebugInfo(fileName, contents, e);
    ret += e.message + "\n";
    return ret;
}

function precedence(op) {
    return ['*', '/', '+', '-'].indexOf(op);
}

function parseFile(file, options) {
    var parser = require('../lib/parser.js'),
        fs = require('fs'),
        ret,
        fileContents = fs.readFileSync(file, 'utf-8'),
        options = options || {}
        ;

    try {
        ret = parser.parse(fileContents, options);
    } catch (e) {
        if (e.constructor === parser.SyntaxError) {
            console.log(renderSyntaxError(file, fileContents, e));
        }
        throw e;
    }
    return ret;
}

export {
    Literal,
    Closure,
    Definition,
    Decorator,
    Invocation,
    MemberAccess,
    Arg,
    Container,
    TaskLine,
    Identifier,
    BinOp,
    UnOp,
    Context,
    parseFile,
    precedence,
    renderSyntaxError,
    renderDebugInfo
};

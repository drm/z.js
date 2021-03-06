import util from 'util';
import defaults from './defaults.js';

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

    require(a) {
        if (!this.exists(a)) {
            throw new Error("Undefined value " + a);
        }
        return this.get(a);
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
                if (typeof e.stacktrace === 'undefined') {
                    e.stacktrace = [];
                }
                expr.debug.message = "Resolving " + expr.constructor.name;
                e.stacktrace.push(expr.debug);
                throw e;
           }
        }
        throw new Error("Unmatched type " + (typeof expr) + " (" + expr.constructor.name + ")");
    }
}

class Container {
    constructor() {
        this.context = new Context();
        this.set('SHELL', ['/bin/bash', ['-e']]);
        this.set('RUNNER', (elements) => {
            let child_process = require('child_process');
            let s = child_process.spawn.apply(null, this.get('SHELL'));
            s.stdout.on('data', (data) => process.stdout.write(data));
            s.stdin.write(elements.join("") + "\n");
            s.stdin.end();
        });
    }

    defaults() {
        defaults(this);
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
        this.elements = this.elements.map((e) => context.evaluate(e, true));
        
        context.get('RUNNER')(this.elements);
    }
}

function renderDebugInfo(e) {
    var ret = '';

    ret += "    " + e.file + ":" + (e.message ? " (" + e.message + ")" : "") + "\n";
    ret += '    ----------------------------------------' + "\n";
    if (e.start.line > 1) {
        ret += '    ' + (e.start.line - 1) + '. ' + e.src.split("\n")[e.start.line - 2] + "\n";
    }
    ret += '    ' + e.start.line + '. ' + e.src.split("\n")[e.start.line - 1] + "\n";
    ret += '    ' + new Array(e.start.column + 3).join(" ") + '^-- here' + "\n";
    ret += '    ----------------------------------------' + "\n";
    ret += "" + "\n";

    return ret;
}

function renderSyntaxError(e) {

    var ret = '';
    ret += 'Syntax error in ' + e.file + ' at line ' + e.start.line + "\n";
    ret += "\n";

    ret += renderDebugInfo(e);
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

    options.file = file;
    options.src = fileContents;

    try {
        ret = parser.parse(fileContents, options);
    } catch (e) {
        if (e.constructor === parser.SyntaxError) {
            e.file = file;
            e.src = fileContents;
            console.log(renderSyntaxError(e));
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

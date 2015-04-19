var syntax = {
    //a: new z.Literal(true),
    //b: new z.Literal(false),
    //c: new z.Literal(1234),
    //d: new z.Literal(1234.56789),
    //e: new z.Literal("this is a string"),
    //f: new z.Literal("This is another string containing\n" +
    //   "    newlines"),
    //g: new z.Identifier('identifier'),
    //h: new z.Literal([new z.Literal(1), new z.Literal('b'), new z.Literal("foo"), new z.Literal([])]),
    //i: new z.Literal({a: new z.Literal("b"), c: new z.Literal([new z.Literal("d"), new z.Literal("e"), new z.Literal("f")]), d: new z.Literal([]), e: new z.Literal({})}),
    //j: new z.Invocation().setSubject(new z.Identifier("some_call")),
    //k: new z.Invocation([new z.Literal("one")]).setSubject(new z.Identifier("some_call")),
    //l: new z.Invocation([new z.Literal("one"), new z.Literal("two")]).setSubject(new z.Identifier("some_call")),
    //m: new z.MemberAccess(new z.Literal(0)).setSubject(new z.Literal([new z.Literal('a'), new z.Literal('b'), new z.Literal('c')])),
    //n: new z.MemberAccess(new z.Literal('length')).setSubject(new z.Literal([new z.Literal('a'), new z.Literal('b'), new z.Literal('c')])),
    //o: new z.Invocation([new z.Literal(1), new z.Literal(1)]).setSubject(new z.MemberAccess(new z.Literal('slice')).setSubject(new z.Literal([new z.Literal('a'), new z.Literal('b'), new z.Literal('c')]))),
};

var values = {
    //a: true,
    //b: false,
    //c: 1234,
    //d: 1234.56789,
    //e: "this is a string",
    //f: "This is another string containing\n" +
    //"    newlines",
    ////g: 'value of identifier',
    //h: [1, 'b', "foo", []],
    //i: {a: "b", c: ["d", "e", "f"], d: [], e:{}},
    //j: 'some_call return value()',
    //k: 'some_call return value(one)',
    //l: 'some_call return value(one,two)',
    //m: 'a',
    q: [":)"],
    r: ["\\o/", "\\o/", "\\o/"],

    s: 20
};

result.set('some_call', function() { return 'some_call return value(' + Array.prototype.slice.call(arguments).join(",") +  ')'; });

Object.keys(syntax).forEach(function(n) {
    assert.deepEqual(new z.Definition(n, syntax[n]), result.get(n));
});

Object.keys(values).forEach(function(n) {
    assert.deepEqual(values[n], result.context.evaluate(result.context.get(n)));
});

matrix = result.context.evaluate(result.context.get('matrix'));
matrix.forEach(function (v) {
    assert.equal(v[0], v[1]);
});

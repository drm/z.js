var expectedValues = {
    a: true,
    b: false,
    c: 1234,
    d: 1234.56789,
    e: "this is a string",
    f: "This is another string containing\n" +
       "    newlines",
    g: new z.Identifier('identifier'),
    h: [1, 'b', "foo", []],
    i: {a: "b", c: ["d", "e", "f"], d: [], e:{}},
    j: new z.Invocation().setSubject(new z.Identifier("some_call")),
    k: new z.Invocation(["one"]).setSubject(new z.Identifier("some_call")),
    l: new z.Invocation(["one", "two"]).setSubject(new z.Identifier("some_call")),
    m: new z.MemberAccess(0).setSubject(['a', 'b', 'c']),
    n: new z.MemberAccess('length').setSubject(['a', 'b', 'c']),
    o: new z.Invocation(["invoke"]).setSubject(['a', 'b', 'c'])
};

Object.keys(expectedValues).forEach(function(n) {
    assert.deepEqual(new z.Definition(n, expectedValues[n]), result.get(n));
});



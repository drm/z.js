var expectedValues = {
    a: true,
    b: false,
    c: 1234,
    d: 1234.56789,
    e: "this is a string",
    f: "This is another string containing\n" +
       "    newlines",
    g: new z.Identifier('identifier'),
    h: [1, 'b', 'foo'],
    i: {a: "b", c: ["d", "e", "f"]}
};

['a', 'b', 'c', 'd', 'e', 'f', 'g', 'i'].forEach(function(n) {
    assert.deepEqual(new z.Definition(n, expectedValues[n]), result.get(n));
});



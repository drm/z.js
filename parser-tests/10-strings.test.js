assert.deepEqual(
    new z.Literal([
        '', 'a', "\n", "\\", "\\n", "\""
    ].map(function(v) {
            return new z.Literal(v);
    })),
    result.get('double').expr
);
assert.deepEqual(
    new z.Literal([
        '', 'a', "\\", "\\n", "'"
    ].map(function(v) {
        return new z.Literal(v);
    })),
    result.get('single').expr
);

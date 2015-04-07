assert.deepEqual(
    [
        '', 'a', "\n", "\\", "\\n", "\""
    ],
    result.get('double').expr
);
assert.deepEqual(
    [
        '', 'a', "\\", "\\n", "'"
    ],
    result.get('single').expr
);

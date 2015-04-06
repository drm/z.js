assert.deepEqual(
    [
        '', 'a', "\n", "\\", "\\n", "\""
    ],
    result.get('double').getValue()
);
assert.deepEqual(
    [
        '', 'a', "\\", "\\n", "'"
    ],
    result.get('single').getValue()
);

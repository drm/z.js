assert.deepEqual(new z.Declaration("a", [], new z.Task()).normalize(), result.get('a'));
assert.deepEqual(new z.Declaration("b", [], new z.Task()).normalize(), result.get('b'));

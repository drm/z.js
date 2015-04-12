assert.deepEqual(new z.Definition("a", new z.Closure()).normalize(), result.get('a'));
assert.deepEqual(new z.Definition("b", new z.Closure()).normalize(), result.get('b'));

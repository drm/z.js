var spec = result.get('a').expr;

assert.deepEqual(spec.body[0], new z.TaskLine(['foo']));
assert.deepEqual(spec.body[1], new z.TaskLine(['foo ', new z.Identifier('bar')]));
assert.deepEqual(spec.body[2], new z.TaskLine(['foo ', new z.Identifier('bar'), ' ', new z.Identifier('baz')]));

var spec = result.get('a').expr.body.spec[0];

assert.equal(spec.name, 'do');
assert.deepEqual(spec.lines[0], new z.TaskLine(['foo']));
assert.deepEqual(spec.lines[1], new z.TaskLine(['foo ', new z.Identifier('bar')]));
assert.deepEqual(spec.lines[2], new z.TaskLine(['foo ', new z.Identifier('bar'), ' ', new z.Identifier('baz')]));

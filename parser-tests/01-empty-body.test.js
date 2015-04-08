assert.deepEqual(new z.Definition("a", new z.Closure([], new z.Task())).normalize(), result.get('a'));

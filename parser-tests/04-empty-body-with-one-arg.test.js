assert.deepEqual(new z.Definition("a", new z.Closure([new z.Arg("a", null)], new z.Task())).normalize(), result.get('a'));

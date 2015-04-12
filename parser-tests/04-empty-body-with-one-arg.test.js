assert.deepEqual(new z.Definition("a", new z.Closure([new z.Arg("a", null)])).normalize(), result.get('a'));

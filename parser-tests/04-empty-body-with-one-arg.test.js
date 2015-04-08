assert.deepEqual(new z.Definition("a", new z.Task(null, new z.Closure([new z.Arg("a", null)]))).normalize(), result.get('a'));

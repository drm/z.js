assert.deepEqual(new z.Definition("a", new z.Task(null, new z.Closure([]))).normalize(), result.get('a'));

assert.deepEqual(
    new z.Definition(
        "a",
        new z.Closure(
            [
                new z.Arg("a", "abc"),
                new z.Arg("b", "def"),
            ],
            new z.Task()
        )
    ).normalize(),
    result.get('a')
);

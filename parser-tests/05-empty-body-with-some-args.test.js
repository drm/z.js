assert.deepEqual(
    new z.Definition(
        "a",
        new z.Task(
            null,
            new z.Closure(
                [
                    new z.Arg("a", null),
                    new z.Arg("b", null),
                    new z.Arg("c", null),
                    new z.Arg("d", null),
                    new z.Arg("e", null)
                ]
            )
        )
    ).normalize(),
    result.get('a')
);

assert.deepEqual(
    new z.Definition(
        "a",
        new z.Closure(
            [
                new z.Arg("a", new z.Literal("abc")),
                new z.Arg("b", new z.Literal("def"))
            ]
        )
    ),
    result.get('a')
);

assert.deepEqual(
    new z.Definition(
        "a",
        new z.Closure(
            [
                new z.Arg("a", "abc"),
                new z.Arg("b", "def")
            ]
        )
    ).normalize(),
    result.get('a')
);

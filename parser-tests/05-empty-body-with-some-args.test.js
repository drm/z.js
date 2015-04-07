assert.deepEqual(
    new z.Declaration(
        "a", [
            new z.Arg("a", null),
            new z.Arg("b", null),
            new z.Arg("c", null),
            new z.Arg("d", null),
            new z.Arg("e", null)
        ],
        new z.Task()
    ).normalize(),
    result.get('a')
);

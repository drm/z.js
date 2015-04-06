assert.deepEqual(
    new z.Declaration(
        "a", [
            new z.Arg("a", "abc"),
            new z.Arg("b", "def"),
        ],
        new z.Task()
    ),
    result.get('a')
);

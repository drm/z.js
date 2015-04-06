var expectedSpecs = {
    contains_only_do: [
        {name: 'do', lines: []}
    ],
    contains_all_sections: [
        {name: 'do', lines: []},
        {name: 'pre', lines: []},
        {name: 'post', lines: []}
    ],
    contains_only_task_line: [
        {name: 'do', lines: [new z.TaskLine('Some task')]}
    ],
    contains_all_sections_with_task_lines: [
        {name: 'pre', lines: [new z.TaskLine('pre task line')]},
        {name: 'post', lines: [new z.TaskLine('post task line')]},
        {name: 'do', lines: [new z.TaskLine('do task line')]}
    ]
};

Object.keys(expectedSpecs).forEach(function (v) {
    assert.deepEqual(
        new z.Declaration(v, [], new z.Task(expectedSpecs[v])), result.get(v)
    );
});

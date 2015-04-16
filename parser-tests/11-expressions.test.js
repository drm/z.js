matrix = result.context.evaluate(result.context.get('matrix'));
matrix.forEach(function (v) {
    assert.equal(v[0], v[1]);
});

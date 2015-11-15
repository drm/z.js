export default function(container) {
    container.set('triggers', function (task) {
        return function(object) {
            var original = object.resolve;

            object.resolve = function(context) {
                return function() {
                    var ret = original.call(object, context).apply(object, arguments);
                    task.resolve(context).apply(task, arguments);
                    return ret;
                }
            };

            return object;
        };
    });
    container.set('depends', function (task) {
        return function(object) {
            var original = object.resolve;

            object.resolve = function(context) {
                return function()  {
                    task.resolve(context).apply(this, arguments);
                    return original.call(object, context).apply(this, arguments);
                }
            };

            return object;
        };
    });
}

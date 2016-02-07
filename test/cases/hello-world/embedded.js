angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        template:'<strong>Hello World!</strong>'
    };
});
angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        templateUrl: 'hello-world-template.html'
    };
});
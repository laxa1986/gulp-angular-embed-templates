angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        templateUrl: 'test/cases/hello-world/hello-world-template.html'
    };
});
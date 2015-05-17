angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        templateUrl: 'test/assets/hello-world-template.html'
    };
});
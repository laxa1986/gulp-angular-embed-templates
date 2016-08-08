angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        templateUrl: 'template.html'
    };
});
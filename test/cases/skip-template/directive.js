// several directives in one file
var testModule = angular.module('test');

testModule.directive('helloWorld', function () {
    return {
        restrict: 'E',
        templateUrl: 'a-large.html'
    };
});

testModule.directive('helloWorld', function () {
    return {
        restrict: 'E',
        templateUrl: 'b-small.html'
    };
});

testModule.directive('helloWorld', function () {
    return {
        restrict: 'E',
        templateUrl: 'c-large.html'
    };
});
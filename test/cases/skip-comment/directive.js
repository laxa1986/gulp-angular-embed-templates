// several directives in one file
var testModule = angular.module('test');

testModule.directive('helloWorld1', function () {
    return {
        restrict: 'E',
        templateUrl: 'template1.html'
    };
});

testModule.directive('helloWorld2', function () {
    return {
        restrict: 'E',
        templateUrl: /*!*/'template2.html'
    };
});

testModule.directive('helloWorld3', function () {
    return {
        restrict: 'E',
        templateUrl: 'template3.html'
    };
});
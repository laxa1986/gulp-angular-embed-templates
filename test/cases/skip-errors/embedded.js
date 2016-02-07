// several directives in one file
var testModule = angular.module('test');

testModule.directive('helloWorld1', function () {
    return {
        restrict: 'E',
        template:'<h1>Hello World</h1>'
    };
});

testModule.directive('helloWorld2', function () {
    return {
        restrict: 'E',
        templateUrl: 'not-existing-template.html'
    };
});

testModule.directive('helloWorld3', function () {
    return {
        restrict: 'E',
        template:'<h3>Hello World</h3>'
    };
});
angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        template:'<form class=login id="home form" x=c>My name is\'{{value}}\'</form>'
    };
});
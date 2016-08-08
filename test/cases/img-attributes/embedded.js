angular.module('test').directive('img-attributes', function () {
    return {
        restrict: 'E',
        template:'<img src="/images /foobar.jpg">'
    };
});
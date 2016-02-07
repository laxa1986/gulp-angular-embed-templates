class Directive implements angular.IDirective {
    scope: Object = {};
    restrict: string;

    static Factory(): angular.IDirective {
        return new this();
    };
}

class Component extends Directive {
    restrict: string = "E";
    controller: Controller;
    controllerAs: string = "vm";
    templateUrl: string = "template.html";
}
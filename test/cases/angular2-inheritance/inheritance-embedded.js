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
    template: string = '<todo-cmp [model]="todo" (complete)="onCompletingTodo(todo)"><input [(ngModel)]="todo.text"></input><video-player #player></video-player>{{index}}<div *ngFor="#item in items; var index=index">{{index}</div></todo-cmp>';
}
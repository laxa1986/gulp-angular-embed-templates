@View({
    template:'<div *ngIf="errorCount > 0" class=error someAttr=1 data-Attr=2>{{errorCount}} errors detected</div>'
})
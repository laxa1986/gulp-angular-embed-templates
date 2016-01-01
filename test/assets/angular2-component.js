/// <reference path="../../typings/_custom.d.ts" />

import { Component, View } from 'angular2/angular2';
import { RouteConfig, RouterLink, RouterOutlet } from 'angular2/router';

import { Search } from '../components/search/search';
import { Artist } from '../components/artist/artist';

@Component({
    selector: 'app'
})

@View({
    directives: [RouterLink, RouterOutlet],
    templateUrl: `test/assets/angular2-template.html`
})

@RouteConfig([
    { path: '/',                  redirectTo: '/search' },
    { path: '/search',            as: 'search',     component: Search },
    { path: '/artist/:id',        as: 'artist',     component: Artist }
])

export class App {
    title: string;
    constructor() {
        this.title = 'App title';
    }
}
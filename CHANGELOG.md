1.1.0 / 2016-01-09
==================
  * Do not change html attributes case (previously ngIf changed to ngif, which causes errors in Angular2.0 beta)

1.0.0 / 2016-01-01
==================
  * Escape only single quotes. Before: `template:'\'\"'`, Now: `template:'\'"'`
  * Checked support of Angular2.0 templates like `<a [router-link]="['/search']">Search</a>`

0.2.1 / 2015-12-31
==================
  * Bug fix: remove \`templateUrl\` support

0.2.0 / 2015-12-31
==================
  * Added ES6 template string quotes \` support (templateUrl: \`/path/to/template.html\`)

0.1.7 / 2015-12-31
==================
  * Added important note into in README.md (embed templates should be used before source maps initialization)
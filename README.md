# gulp-angular-embed-templates
gulp plugin to include the contents of angular templates inside directive's code

Plugin searches for `templateUrl: {template url}` and replace it with `template: {minified template content}`. To archive this template first minified with [minimize](https://www.npmjs.com/package/minimize)

Nearest neighbours are:

*   gulp-angular-templates - good for single page applications, combine all templates in one module. *gulp-angular-embed-templates* is better for **multi page applications**, where different pages use different set of angular directives so combining all templates in one is not an option. For single page applications they are similar but *angular-inject-templates* doesn't forces you to change your code for using some additional module: just replace template reference with the template code.
*   gulp-include-file - can be used for the same purpose (file include) with *minimize* plugin as transform functions. *gulp-angular-embed-templates* do all of this out of the box.

## Versions / Release Notes

[CHANGELOG on GitHub](https://github.com/laxa1986/gulp-angular-embed-templates/blob/master/CHANGELOG.md)

## Install

    npm install --save-dev gulp-angular-embed-templates

## Usage

Given the following file structure

```javascript
src
+-hello-world
  |-hello-world-directive.js
  +-hello-world-template.html
```

`hello-world-directive.js`:

```javascript
angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        // relative path to template
        templateUrl: 'hello-world-template.html'
    };
});
```

`hello-world-template.html`:

```html
<strong>
    Hello world!
</strong>
```

*gulp-angular-embed-templates* will generate the following file:

```javascript
angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        template:'<strong>Hello world!</strong>'
    };
});
```

Using this example gulpfile:

```javascript
var gulp = require('gulp');
var embedTemplates = require('gulp-angular-embed-templates');

gulp.task('js:build', function () {
    gulp.src('src/scripts/**/*.js')
        .pipe(embedTemplates())
        .pipe(gulp.dest('./dist'));
});
```
**Note**: call _embedTemplates_ before source maps initialization.

## API

### embedTemplates(options)

#### options.minimize
Type: `Object`
Default value: {parser: customParser}

settings to pass in minimize plugin. Please see all settings on [minimize official page](https://www.npmjs.com/package/minimize)

#### options.skipErrors
Type: `Boolean`
Default value: 'false'

should plugin brake on errors (file not found, error in minification) or skip errors and go to next template

#### options.jsEncoding
Type: `String`
Default value: 'utf-8'

js code files encoding (angular directives)

#### options.templateEncoding
Type: `String`
Default value: 'utf-8'

angular template files encoding

#### options.basePath
Type: `String`
By default plugin use path specified in 'templateUrl' as a relative path to corresponding '.js' file (file with 'templateUrl')
This option allow to specify another basePath to search templates as 'basePath'+'templateUrl'

#### options.maxSize
Type: `Number`
Default value: Null

define the max size limit in bytes for the template be embeded. Ignore templates which size exceed this limit

## License
This module is released under the MIT license.



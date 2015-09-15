# gulp-angular-embed-templates
gulp plugin to include the contents of angular templates inside directive's code

Plugin searches for `templateUrl: {template url}` and replace it with `template: {minified template content}`. To archive this template first minified with [minimize](https://www.npmjs.com/package/minimize)

Nearest neighbours are:

*   gulp-angular-templates - good for single page applications, combine all templates in one module. *gulp-angular-embed-templates* is better for **multi page applications**, where different pages use different set of angular directives so combining all templates in one is not an option. For single page applications they are similar but *angular-inject-templates* doesn't forces you to change your code for using some additional module: just replace template reference with the template code.
*   gulp-include-file - can be used for the same purpose (file include) with *minimize* plugin as transform functions. *gulp-angular-embed-templates* do all of this out of the box.

## Install

    npm install --save-dev gulp-angular-embed-templates

## Usage

Given the following javascript file:

```javascript
angular.module('test').directive('helloWorld', function () {
    return {
        restrict: 'E',
        templateUrl: 'hello-world-template.html'
    };
});
```

And the following `hello-world-template.html` in the same directory (actually it can be anywhere):

```html
<strong>
    Hello world!
</strong>
```

This module will generate the following file:

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

## API

### embedTemplates(options)

#### options.minimize
Type: `Object`
Default value: '{}'

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
Default value: based on the path for the current file

define the base path for the templates, useful when you are using absolute path

#### options.maxSize
Type: `Number` in bytes
Default value: Null

define the max size limit for the template be embeded

## License
This module is released under the MIT license.



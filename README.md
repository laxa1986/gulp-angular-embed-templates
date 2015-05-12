# angular-inject-templates
gulp plugin to include the contents of angular templates inside directive's code.
Plugin searches for 'templateUrl: {template url}' and replace it with 'template: {minified template content}'
To archive this template first minified with 'minimize' 

## Install

    npm install angular-inject-templates

## Example
Given the following javascript file:

```javascript
angular.module('test').directive('customTag', function () {
    return {
        restrict: 'E',
        templateUrl: 'custom-tag-template.html'
    };
});
```

And the following `custom-tag-template.html` in the same directory:

```html
<strong>
    Hello world!
</strong>
```

This module will generate the following file:

```javascript
angular.module('test').directive('customTag', function () {
    return {
        restrict: 'E',
        template:'<strong>Hello world!</strong>'
    };
});
```

Using this example gulpfile:

```javascript
var gulp = require('gulp');
var injectTemplates = require('angular-inject-templates');
gulp.task('js:build', function () {
    gulp.src('src/scripts/**/*.js')
        .pipe(injectTemplates())
        .pipe(gulp.dest('./dist'));
});
```

## Options

* **minimize**: (Object) settings to pass in minimize plugin. Please see all settings on it's page https://www.npmjs.com/package/minimize
* **skipErrors**: (boolean) default=false should plugin brake on errors (file not found, error in minification) or skip errors and go to next template

## License
This module is released under the MIT license.

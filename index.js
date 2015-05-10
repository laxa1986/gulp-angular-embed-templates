var through = require('through2');
var gutil = require('gulp-util');
var pathModule = require('path');
var jsStringEscape = require('js-string-escape');
var fs = require('fs');
var PluginError = gutil.PluginError;
var Minimize = require('minimize');

// Constants
const PLUGIN_NAME = 'angular-include-template';

module.exports = function (options) {
    options = options || {};
    if (!options.minimize) {
        options.minimize = {};
    }
    if (options.brakeOnErrors === undefined) {
        options.brakeOnErrors = true;
    }

    const DIRECTIVE_SUFFIX = 'r-directive.js';

    function isDirective(filename) {
        var position = filename.length - DIRECTIVE_SUFFIX.length;
        var lastIndex = filename.indexOf(DIRECTIVE_SUFFIX, position);
        return lastIndex !== -1 && lastIndex === position;
    }

    var minimizer = new Minimize(options.minimize);

    const TEMPLATE_PATTERN = /templateUrl:[\W]*['"]([^'"]+)['"]/;
    const CODE_EXIT = 0;
    const CODE_CAN_GO_NEXT = 1;

    /**
     * replace one template url with minified template text
     * @param {String} base
     * @param {String} content
     * @param {Function} cb
     */
    function replace(base, content, cb) {
        var matches = TEMPLATE_PATTERN.exec(content);

        console.log('matches: ' + matches);

        if (matches === null) {
            cb(CODE_EXIT, content);
            return;
        }

        var relativeTemplatePath = matches[1];
        var path = pathModule.join(base, relativeTemplatePath);

        console.log('template path: ' + path);

        fs.readFile(path, {encoding: 'utf8'}, function(err, templateContent) {
            if (err) {
                var errMsg = 'Can\'t open file: ' + path + ', error: ' + err;
                if (options.brakeOnErrors) {
                    // TODO: check
                    throw new PluginError(PLUGIN_NAME, errMsg);
                } else {
                    gutil.log(PLUGIN_NAME, '[WARN]', gutil.colors.magenta(errMsg));
                    cb(CODE_EXIT, content);
                    return;
                }
            }

            console.log('templateContent: ' + templateContent);

            minimizer.parse(templateContent, function (err, minifiedContent) {
                if (err) {
                    var errMsg = 'error while minifying ' + path + '. Error from minimize plugin: ' + err;
                    if (options.brakeOnErrors) {
                        throw new PluginError(PLUGIN_NAME, errMsg);
                    } else {
                        gutil.log(PLUGIN_NAME, '[WARN]', gutil.colors.magenta(errMsg));
                        cb(CODE_EXIT, content);
                        return;
                    }
                }

                var before = content.substr(0, matches.index);
                var template = jsStringEscape(minifiedContent);
                var after = content.substr(matches.index + matches[0].length);
                var newContent = before + 'template:\'' + template + '\'' + after;

                console.log('newContent: ' + newContent);

                cb(CODE_CAN_GO_NEXT, newContent);
            });
        });
    }

    function transform(file, enc, cb) {
        // ignore empty files
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            throw new PluginError(PLUGIN_NAME, 'Streaming not supported. particular file: ' + file.path);
        }

        // check that file name ends with '-directive.js'
        if (!isDirective(file.path)) {
            cb(null, file);
            return;
        }

        console.log('file.path: ' + file.path);

        var content = file.contents.toString('utf8');
        var base = pathModule.dirname(file.path);
        replace(base, content, replaceCallback);

        function replaceCallback(code, content) {
            if (code === CODE_CAN_GO_NEXT) {
                replace(base, content, replaceCallback);
                return;
            }
            // code === CODE_EXIT
            file.contents = new Buffer(content);
            cb(null, file);
        }
    }

    return through.obj(transform);
};
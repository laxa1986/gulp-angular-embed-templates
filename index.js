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

    var minimizer = new Minimize(options.minimize);

    // regexp uses 'g' flag to be able to match several occurrences
    // so it should be reset for each file
    const TEMPLATE_URL_PATTERN = 'templateUrl:[\\s]*[\'"]([^\'"]+)[\'"]';

    // variables which reset for each file
    var content;
    var templateUrlRegexp;

    const FOUND_SUCCESS = {};
    const FOUND_ERROR = {};
    const CODE_EXIT = {};

    const TEMPLATE_BEGIN = Buffer('template:\'');
    const TEMPLATE_END = Buffer('\'');

    /**
     * replace one template url with minified template text
     * @param {String} filePath
     * @param {Function} cb
     */
    function replace(filePath, cb) {
        var matches = templateUrlRegexp.exec(content);

        console.log('matches: ' + matches);

        if (matches === null) {
            cb(CODE_EXIT);
            return;
        }

        var relativeTemplatePath = matches[1];
        var path = pathModule.join(filePath, relativeTemplatePath);

        console.log('template path: ' + path);

        fs.readFile(path, {encoding: 'utf8'}, function(err, templateContent) {
            if (err) {
                var errMsg = 'Can\'t open file: ' + path + ', error: ' + err;
                if (options.brakeOnErrors) {
                    // TODO: check
                    throw new PluginError(PLUGIN_NAME, errMsg);
                } else {
                    gutil.log(PLUGIN_NAME, '[WARN]', gutil.colors.magenta(errMsg));
                    cb(FOUND_ERROR);
                    return;
                }
            }

            minimizer.parse(templateContent, function (err, minifiedContent) {
                if (err) {
                    var errMsg = 'error while minifying ' + path + '. Error from minimize plugin: ' + err;
                    if (options.brakeOnErrors) {
                        throw new PluginError(PLUGIN_NAME, errMsg);
                    } else {
                        gutil.log(PLUGIN_NAME, '[WARN]', gutil.colors.magenta(errMsg));
                        cb(FOUND_ERROR);
                        return;
                    }
                }

                cb(FOUND_SUCCESS, {
                    regexpMatch : matches,
                    template: minifiedContent
                });
            });
        });
    }

    function joinParts(entrances) {
        var parts = [];
        var index = 0;
        for (var i=0; i<entrances.length; i++) {
            var entrance = entrances[i];
            var matches = entrance.regexpMatch;

            parts.push(Buffer(content.substring(index, matches.index)));
            parts.push(TEMPLATE_BEGIN);
            parts.push(Buffer(jsStringEscape(entrance.template)));
            parts.push(TEMPLATE_END);

            index = matches.index + matches[0].length;
        }
        parts.push(Buffer(content.substr(index)));
        return Buffer.concat(parts);
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

        content = file.contents.toString('utf8');
        templateUrlRegexp = new RegExp(TEMPLATE_URL_PATTERN, 'g');
        var entrances = [];

        console.log('file.path: ' + file.path);

        var base = pathModule.dirname(file.path);
        replace(base, replaceCallback);

        function replaceCallback(code, entrance) {
            if (code === FOUND_SUCCESS) {
                entrances.push(entrance);
                replace(base, replaceCallback);
                return;
            }

            if (code === FOUND_ERROR) {
                replace(base, replaceCallback);
                return
            }

            /* if (code === CODE_EXIT) */
            if (entrances.length) {
                file.contents = joinParts(entrances);
            }

            cb(null, file);
        }
    }

    return through.obj(transform);
};
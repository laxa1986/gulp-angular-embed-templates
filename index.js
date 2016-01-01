var through = require('through2');
var gutil = require('gulp-util');
var pathModule = require('path');
var fs = require('fs');
var PluginError = gutil.PluginError;
var Minimize = require('minimize');

// Constants
const PLUGIN_NAME = 'gulp-angular-embed-template';

var debug = false;
function log() {
    if (debug) {
        console.log.apply(console, arguments);
    }
}

function escapeSingleQuotes(string) {
    const ESCAPING = {
        '\'': '\\\'',
        '\\': '\\\\',
        '\n': '\\n',
        '\r': '\\r',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029'
    };
    return string.replace(/['\\\n\r\u2028\u2029]/g, function (character) {
        return ESCAPING[character];
    });
}

module.exports = function (options) {
    options = options || {};
    if (!options.minimize) {
        options.minimize = {};
    }
    if (options.skipErrors === undefined) {
        options.skipErrors = false;
    }
    if (!options.jsEncoding) {
        options.jsEncoding = 'utf-8';
    }
    if (!options.templateEncoding) {
        options.templateEncoding = 'utf-8';
    }
    if (options.debug === true) {
        debug = true;
    }

    var minimizer = new Minimize(options.minimize);

    // regexp uses 'g' flag to be able to match several occurrences
    // so it should be reset for each file
    const TEMPLATE_URL_PATTERN = '[\'"]?templateUrl[\'"]?[\\s]*:[\\s]*[\'"`]([^\'"`]+)[\'"`]';

    // variables which reset for each file
    var content;
    var templateUrlRegexp;

    const FOUND_SUCCESS = {};
    const FOUND_ERROR = {};
    const FOUND_IGNORE = {};
    const CODE_EXIT = {};

    const TEMPLATE_BEGIN = Buffer('template:\'');
    const TEMPLATE_END = Buffer('\'');

    /**
     * Find next "templateUrl:", and try to replace url with content if template available, less then maximum size.
     * And finally (in any case) call 'cb' function with proper code
     *
     * @param {String} filePath path to original .js file
     * @param {Function} cb callback function to call when
     */
    function replace(filePath, cb) {
        var matches = templateUrlRegexp.exec(content);

        log('matches: ' + matches);

        if (matches === null) {
            cb(CODE_EXIT);
            return;
        }

        var relativeTemplatePath = matches[1];
        var path = pathModule.join(filePath, relativeTemplatePath);

        log('template path: ' + path);

        if (options.maxSize) {
            var fileStats = fs.statSync(path);
            if (fileStats && fileStats.size > options.maxSize) {
                return cb(FOUND_IGNORE, {
                    path: relativeTemplatePath,
                    size: fileStats.size
                });
            }
        }

        fs.readFile(path, {encoding: options.templateEncoding}, function(err, templateContent) {
            if (err) {
                cb(FOUND_ERROR, 'Can\'t read template file: "' + path + '". Error details: ' + err);
                return;
            }

            minimizer.parse(templateContent, function (err, minifiedContent) {
                if (err) {
                    cb(FOUND_ERROR, 'Error while minifying angular template "' + path + '". Error from "minimize" plugin: ' + err);
                    return;
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
            parts.push(Buffer(escapeSingleQuotes(entrance.template)));
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

        var pipe = this;
        content = file.contents.toString(options.jsEncoding);
        templateUrlRegexp = new RegExp(TEMPLATE_URL_PATTERN, 'g');
        var entrances = [];

        log('\nfile.path: ' + file.path);

        var base = options.basePath ? options.basePath : pathModule.dirname(file.path);
        replace(base, replaceCallback);

        function replaceCallback(code, data) {
            if (code === FOUND_SUCCESS) {
                entrances.push(data);
                replace(base, replaceCallback);
            }

            else if (code === FOUND_ERROR) {
                var msg = data;

                if (options.skipErrors) {
                    gutil.log(
                        PLUGIN_NAME, 
                        gutil.colors.yellow('[Warning]'),
                        gutil.colors.magenta(msg)
                    );
                    replace(base, replaceCallback);
                } else {
                    pipe.emit('error', new PluginError(PLUGIN_NAME, msg));
                }
            }

            else if (code === FOUND_IGNORE) {
                gutil.log(
                    PLUGIN_NAME,
                    gutil.colors.yellow('[Template ignored]'),
                    gutil.colors.blue(data.path),
                    'maximum size reached',
                    gutil.colors.magenta(data.size + ' bytes')
                );
                replace(base, replaceCallback);
            }

            else if (code === CODE_EXIT) {
                if (entrances.length) {
                    file.contents = joinParts(entrances);
                }
                cb(null, file);
            }
        }
    }

    return through.obj(transform);
};
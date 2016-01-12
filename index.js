var through = require('through2');
var gutil = require('gulp-util');
var pathModule = require('path');
var fs = require('fs');
var PluginError = gutil.PluginError;
var Minimize = require('minimize');
var html = require('htmlparser2');

// Constants
const PLUGIN_NAME = 'gulp-angular-embed-template';

const TEMPLATE_BEGIN = Buffer('template:\'');
const TEMPLATE_END = Buffer('\'');

// regexp uses 'g' flag to be able to match several occurrences
// so it should be reset for each file
const TEMPLATE_URL_PATTERN = '[\'"]?templateUrl[\'"]?[\\s]*:[\\s]*[\'"`]([^\'"`]+)[\'"`]';

var debug = false;
function log() {
    if (debug) {
        console.log(console, arguments);
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

/**
 * join parts [before] ['template':] [template] [after]
 * @param {String} fileContent
 * @param {Array} entrances
 * @return Buffer
 */
function joinParts(fileContent, entrances) {
    var parts = [];
    var index = 0;
    for (var i=0; i<entrances.length; i++) {
        var entrance = entrances[i];
        var matches = entrance.regexpMatch;

        parts.push(Buffer(fileContent.substring(index, matches.index)));
        parts.push(TEMPLATE_BEGIN);
        parts.push(Buffer(escapeSingleQuotes(entrance.template)));
        parts.push(TEMPLATE_END);

        index = matches.index + matches[0].length;
    }
    parts.push(Buffer(fileContent.substr(index)));
    return Buffer.concat(parts);
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
    if (!options.minimize.parser) {
        minimizer.htmlparser = new html.Parser(
            new html.DomHandler(minimizer.emits('read')), {lowerCaseAttributeNames:false}
        );
    }

    var onError = options.skipErrors ?
        function (msg) {
            gutil.log(
                PLUGIN_NAME,
                gutil.colors.yellow('[Warning]'),
                gutil.colors.magenta(msg)
            );
            replaceNext();
        } :
        function (msg) {
            filePipe.emit('error', new PluginError(PLUGIN_NAME, msg));
        };

    // variables which reset for each file

    /**
     * @type {String} path to original .js file
     */
    var filePath;

    /**
     * @type {String} source file (directive/component) content
     */
    var fileContent;

    /**
     * @type {RegExp} we create a regexp each time with 'g' flag to hold current position
     * and search second time from previous position + 1
     */
    var fileRegexp;

    /**
     * @type {Array} parts of source file with templateUrl replaced by template body
     */
    var fileEntrances;

    /**
     * reference to current gulp steam to emit events
     */
    var filePipe;

    /**
     * @type {Function}
     */
    var fileCallback;

    /**
     * Find next "templateUrl:", and try to replace url with content if template available, less then maximum size.
     * This is recursive function: it call itself until one of two condition happens:
     * - error happened (error emitted in pipe and stop recursive calls)
     * - no 'templateUrl' left (call 'fileCallback' and stop recursive calls)
     */
    function replaceNext() {
        var matches = fileRegexp.exec(fileContent);

        log('matches: %s', matches);

        if (matches === null) {
            fileCallback();
            return;
        }

        var relativeTemplatePath = matches[1];
        var templatePath = pathModule.join(filePath, relativeTemplatePath);

        log('template path: %s', templatePath);

        if (options.maxSize) {
            var fileStats = fs.statSync(templatePath);
            if (fileStats && fileStats.size > options.maxSize) {
                gutil.log(
                    PLUGIN_NAME,
                    gutil.colors.yellow('[Template ignored]'),
                    gutil.colors.blue(relativeTemplatePath),
                    'maximum size reached',
                    gutil.colors.magenta(fileStats + ' bytes')
                );
                replaceNext();
                return;
            }
        }

        fs.readFile(templatePath, {encoding: options.templateEncoding}, function(err, templateContent) {
            if (err) {
                onError('Can\'t read template file: "' + templatePath + '". Error details: ' + err);
                return;
            }

            minimizer.parse(templateContent, function (err, minifiedContent) {
                if (err) {
                    onError('Error while minifying angular template "' + templatePath + '". Error from "minimize" plugin: ' + err);
                    return;
                }

                fileEntrances.push({
                    regexpMatch : matches,
                    template: minifiedContent
                });
                replaceNext();
            });
        });
    }

    /**
     * This function is 'through' callback, so it has predefined arguments
     * @param {File} file file to analyse
     * @param {String} enc encoding (unused)
     * @param {Function} cb callback
     */
    function transform(file, enc, cb) {
        // ignore empty files
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            throw new PluginError(PLUGIN_NAME, 'Streaming not supported. particular file: ' + file.path);
        }

        log('\nfile.path: %', file.path);

        filePath = options.basePath ? options.basePath : pathModule.dirname(file.path);
        fileContent = file.contents.toString(options.jsEncoding);
        fileRegexp = new RegExp(TEMPLATE_URL_PATTERN, 'g');
        fileEntrances = [];
        filePipe = this;
        fileCallback = function() {
            if (fileEntrances.length) {
                file.contents = joinParts(fileContent, fileEntrances);
            }
            cb(null, file);
        };

        replaceNext();
    }

    return through.obj(transform);
};
var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var ProcessorEngine = require('./lib/ProcessorEngine');
var AngularTemplateProcessor = require('./lib/AngularTemplateProcessor');
var Angular2TypeScriptTemplateProcessor = require('./lib/Angular2TypeScriptTemplateProcessor');
var utils = require('./lib/utils');

const PLUGIN_NAME = 'gulp-angular-embed-template';

module.exports = function (options) {
    options = options || {};

    if (options.processors === undefined) {
        options.processors = [new AngularTemplateProcessor(), new Angular2TypeScriptTemplateProcessor()];
    }

    var logger = options.logger = utils.createLogger();
    if (options.debug !== true) {
        logger.debug = function () {}
    }
    logger.warn = function(msg) {
        gutil.log(
            PLUGIN_NAME,
            gutil.colors.yellow('[Warning]'),
            gutil.colors.magenta(msg)
        );
    };

    var processorEngine = new ProcessorEngine();
    processorEngine.init(options);

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

        logger.debug('\nfile.path: %s', file.path || 'fake');

        var pipe = this;
        processorEngine.process(file, cb, function onErr(msg) {
            pipe.emit('error', new PluginError(PLUGIN_NAME, msg));
        });
    }

    return through.obj(transform);
};
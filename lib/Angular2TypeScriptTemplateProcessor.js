var extend = require('./utils').extend;
var AngularTemplateProcessor = require('./AngularTemplateProcessor');

const TEMPLATE_BEGIN = Buffer('template:string=\'');
const TEMPLATE_END = Buffer('\'');

var Angular2TypeScriptTemplateProcessor = extend(AngularTemplateProcessor, {
    /**
     * @returns {String} pattern to search
     */
    getPattern : function() {
        // for typescript: 'templateUrl: string = "template.html"'
        return '[\'"]?templateUrl[\'"]?[\\s]*:[\\s]*string[\\s]*=[\\s]*[\'"`]([^\'"`]+)[\'"`]';
    },

    embedTemplate : function(match, templateBuffer) {
        return {
            start : match.index,
            length: match[0].length,
            replace: [TEMPLATE_BEGIN, templateBuffer, TEMPLATE_END]
        }
    }
});

module.exports = Angular2TypeScriptTemplateProcessor;
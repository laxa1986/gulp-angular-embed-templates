var extend = require('./utils').extend;
var Processor = require('./Processor');

var RegexpProcessor = extend(Processor, {
    init : function(config) {
        this._super.init(config);
    },

    /**
     * @return {String} return regexp pattern
     */
    getPattern : function() {
        throw 'not implemented';
    },

    process : function(fileContext, cb, onErr) {
        /**
         * @type {RegExp} we create a regexp each time with 'g' flag to hold current position
         * and search second time from previous position + 1
         */
        var pattern = this.getPattern();
        var regexp = new RegExp(pattern, 'g');

        function next() {
            var match = regexp.exec(fileContext.content);
            if (match === null) {
                cb();
                return;
            }
            this.replaceMatch(fileContext, match, next, onErr);
        }
        next.call(this);
    },

    replaceMatch : function(fileContent, match, cb, onErr) {
        throw 'not implemented';
    }
});

module.exports = RegexpProcessor;
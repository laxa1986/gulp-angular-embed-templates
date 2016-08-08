// import test runner and assertion library with plugins
require('mocha');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
chai.use(require('chai-string'));
// import 'gulp-angular-embed-templates' related dependencies
var embedTemplates = require('../');
var PluginError = require('gulp-util').PluginError;
var fs = require('fs');
var File = require('gulp-util').File;
var testDir = __dirname;
var fakeDir = testDir + '/cases/hello-world';

describe('gulp-angular-embed-templates', function () {
    var sut;

    /**
     * synchronously read file
     *
     * @param {String} path path ot file
     * @returns {*} File object
     */
    function readFile(path) {
        return new File({
            contents: new Buffer(fs.readFileSync(path)),
            path: path
        });
    }

    /**
     * test that after embedding template in `dirName.directive` it content equals to `dirName.embedded`
     * @param {String} dirName test case directory name
     * @param {Function} done mocha 'done' handler
     * @param {Object} [config]
     */
    function testEmbed(dirName, done, config) {
        var testCases = testDir + '/cases/';
        var directiveFile = readFile(testCases + dirName + '/directive.js');
        var embeddedFile = readFile(testCases + dirName + '/embedded.js');

        if (config === undefined) config = {};
        if (config.debug === undefined) config.debug = true;

        sut = embedTemplates(config);
        sut.write(directiveFile);
        sut.once('data', function (file) {
            assert(file.isBuffer());
            assert.equal(file.contents.toString('utf8'), embeddedFile.contents.toString('utf8'));
            done();
        });
    }

    /**
     * Build fake file with specified content and path == fakeDir
     * @param content
     */
    function buildFakeFile(content) {
        return new File({
            contents: new Buffer(content),
            path: fakeDir + '/fake.js'
        })
    }

    beforeEach(function() {
        // Create a 'gulp-angular-embed-templates' plugin stream
        sut = embedTemplates({debug: true});
    });

    it('should dial with single quoted template paths', function (done) {
        var fakeFile = buildFakeFile('templateUrl: \'template.html\'');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with double quoted template paths', function (done) {
        var fakeFile = buildFakeFile('templateUrl: "template.html"');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with new quotes ` in template paths', function (done) {
        var fakeFile = buildFakeFile('templateUrl: `template.html`');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with single quoted templateUrl key', function (done) {
        var fakeFile = buildFakeFile('\'templateUrl\': \'template.html\'');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with double quoted templateUrl key', function (done) {
        var fakeFile = buildFakeFile('"templateUrl": \'template.html\'');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with templateUrl {SPACES} : {SPACES} {url}', function (done) {
        var fakeFile = buildFakeFile('"templateUrl" \t\r\n:\r\n\t  \'template.html\'');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should skip errors if particular flag specified', function (done) {
        testEmbed('skip-errors', done, {skipErrors: true});
    });

    it('should not skip errors if skipErrors not defined', function(done) {
        testEmbed('skip-errors');

        sut.once('error', function(error) {
            assert.instanceOf(error, PluginError, 'error should be gulp PluginError');
            assert.equal(error.plugin, 'gulp-angular-embed-template');
            expect(error.message).to.startWith('Can\'t read template file');
            done();
        });
    });

    it('should use basePath to find the templates if specified', function (done) {
        // TODO: this is the path on my local machine
        sut = embedTemplates({basePath: testDir, debug: true});
        var entry = JSON.stringify({
            templateUrl: '/cases/hello-world/template.html'
        });
        var fakeFile = buildFakeFile(entry);
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), '{template:\'<strong>Hello World!</strong>\'}');
            done();
        });
    });

    it('should ignore files bigger than the maxSize specified', function (done) {
        testEmbed('max-size', done, {maxSize: 400})
    });

    it('should embed template with quotes properly', function(done) {
        testEmbed('hard-attributes', done);
    });

    it('should embed hello-world template', function (done) {
        testEmbed('hello-world', done);
    });

    it('should embed Angular 2.0 templates with <a [router-link]="[\'/search\']">Search</a>', function (done) {
        testEmbed('angular2-typescript', done, {sourceType: 'ts'});
    });

    it('should not change attributes case (for Angular2.0 beta)', function (done) {
        testEmbed('angular2-ngIf', done);
    });

    it('should embed template when find pattern "templateUrl: string = \'path\'"', function (done) {
        testEmbed('angular2-inheritance', done, {sourceType: 'ts'});
    });

    it('should skip files if config.skipFiles function specified', function(done) {
        testEmbed('skip-file', done, {skipFiles: function(file) {
            var path = file.path;
            return path.endsWith('skip-file/directive.js');
        }});
    });

    it('should skip files if config.skipFiles pattern specified', function(done) {
        testEmbed('skip-file', done, {skipFiles: /skip-file\/directive\.js$/});
    });

    it('should skip certain template if config.skipTemplates regexp specified', function(done) {
        testEmbed('skip-template', done, {skipTemplates: /\-large\.html$/});
    });

    it('should skip certain template if config.skipTemplates function specified', function(done) {
        testEmbed('skip-template', done, {skipTemplates: function(templatePath, fileContext) {
            return templatePath.endsWith('-large.html') && fileContext.path.indexOf('skip-template') !== -1;
        }});
    });

    it('should skip certain template if /*!*/ comment specified', function(done) {
        testEmbed('skip-comment', done);
    });

    it('should embed only Angular1.x templates if sourceType "js" specified', function(done) {
        testEmbed('angular2-ignore', done, {sourceType: 'js'});
    });

    it('should embed templateUrl: path in Angular2.x just fine', function(done) {
        testEmbed('angular2-templateUrl', done);
    });

    it('should embed templateUrl: strign = \'path\' in class definition', function(done) {
        testEmbed('angular2-class', done, {sourceType: 'ts'});
    });

    it('should keep quotes if html attribute has space', function (done) {
        testEmbed('img-attributes', done);
    });

    it('should allow to remove attribute quotes', function (done) {
        testEmbed('attr-quotes-remove', done, {minimize:{quotes: false}});
    })
});
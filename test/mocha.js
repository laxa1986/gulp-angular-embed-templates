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
     * test that after embedding template in `originalFile` it content equals to `expectEmbedFile`
     * @param {String} originalFile original file path
     * @param {String} expectEmbedFile expected file path
     * @param {Function} done mocha 'done' handler
     */
    function testEmbed(originalFile, expectEmbedFile, done) {
        var testCases = testDir + '/cases/';
        var directiveFile = readFile(testCases + originalFile);
        var embeddedFile = readFile(testCases + expectEmbedFile);

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
        var fakeFile = buildFakeFile('templateUrl: \'hello-world-template.html\'');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with double quoted template paths', function (done) {
        var fakeFile = buildFakeFile('templateUrl: "hello-world-template.html"');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with new quotes ` in template paths', function (done) {
        var fakeFile = buildFakeFile('templateUrl: `hello-world-template.html`');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with single quoted templateUrl key', function (done) {
        var fakeFile = buildFakeFile('\'templateUrl\': \'hello-world-template.html\'');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with double quoted templateUrl key', function (done) {
        var fakeFile = buildFakeFile('"templateUrl": \'hello-world-template.html\'');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with templateUrl {SPACES} : {SPACES} {url}', function (done) {
        var fakeFile = buildFakeFile('"templateUrl" \t\r\n:\r\n\t  \'hello-world-template.html\'');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should skip errors if particular flag specified', function (done) {
        sut = embedTemplates({skipErrors: true});
        var fakeFile = buildFakeFile(JSON.stringify({
            templateUrl: 'hello-world-template.html',
            l2: {templateUrl: 'hello-world-template2.html'},
            l3: {templateUrl: 'hello-world-template.html'}
        }));
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), '{template:\'<strong>Hello World!</strong>\',"l2":{"templateUrl":"hello-world-template2.html"},"l3":{template:\'<strong>Hello World!</strong>\'}}');
            done();
        });
    });

    it('should use basePath to find the templates if specified', function (done) {
        // TODO: this is the path on my local machine
        sut = embedTemplates({ basePath: testDir });
        var entry = JSON.stringify({
            templateUrl: '/cases/hello-world/hello-world-template.html'
        });
        var fakeFile = buildFakeFile(entry);
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), '{template:\'<strong>Hello World!</strong>\'}');
            done();
        });
    });

    it('should ignore files bigger than the maxSize specified', function (done) {
        var tplStats = fs.statSync(testDir + '/cases/hello-world/hello-world-template.html');
        sut = embedTemplates({maxSize: tplStats.size - 1});
        var entry = JSON.stringify({
            templateUrl: 'hello-world-template.html'
        });
        var fakeFile = buildFakeFile(entry);
        var contentBefore = fakeFile.contents.toString('utf8');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), contentBefore);
            done();
        });
    });

    it('should not skip errors if skipErrors not defined', function(done) {
        sut = embedTemplates({skipErrors: false});
        var fakeFile = buildFakeFile(JSON.stringify({
            templateUrl: 'unexisting.html'
        }));
        sut.write(fakeFile);
        sut.once('error', function(error) {
            assert.instanceOf(error, PluginError, 'error should be gulp PluginError');
            assert.equal(error.plugin, 'gulp-angular-embed-template');
            expect(error.message).to.startWith('Can\'t read template file');
            done();
        });
    });

    it('should embed template with quotes properly', function(done) {
        testEmbed(
            'hard-attributes/hard-attributes-directive.js',
            'hard-attributes/hard-attributes-embedded.js', done
        );
    });

    it('should embed hello-world template', function (done) {
        testEmbed(
            'hello-world/hello-world-directive.js',
            'hello-world/hello-world-embedded.js', done);
    });

    it('should embed Angular 2.0 templates with <a [router-link]="[\'/search\']">Search</a>', function (done) {
        testEmbed(
            'angular2-typescript/angular2-component.ts',
            'angular2-typescript/angular2-embedded.ts', done);
    });

    it('should not change attributes case (for Angular2.0 beta)', function (done) {
        testEmbed(
            'angular2-ngIf/angular2-ngIf-component.js',
            'angular2-ngIf/angular2-ngIf-embedded.js', done);
    });

    it('should embed template when find pattern "templateUrl: string = \'path\'"', function (done) {
        testEmbed(
            'angular2-inheritance/inheritance-component.js',
            'angular2-inheritance/inheritance-embedded.js', done);
    });
});
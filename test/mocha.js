var embedTemplates = require('../');
var assert = require('assert');
require('mocha');
var fs = require('fs');
var File = require('gulp-util').File;

//var fixtures = function (glob) { return path.join(__dirname, 'fixtures', glob); };

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
            contents: new Buffer(fs.readFileSync(path))
        });
    }

    /**
     * test that after embedding template in `originalFile` it content equals to `expectEmbedFile`
     * @param {String} originalFile original file path
     * @param {String} expectEmbedFile expected file path
     * @param {Function} done mocha 'done' handler
     */
    function testEmbed(originalFile, expectEmbedFile, done) {
        var directiveFile = readFile(originalFile);
        var embeddedFile = readFile(expectEmbedFile);

        sut.write(directiveFile);

        sut.once('data', function (file) {
            assert(file.isBuffer());
            assert.equal(file.contents.toString('utf8'), embeddedFile.contents.toString('utf8'));
            done();
        });
    }

    beforeEach(function() {
        // Create a 'gulp-angular-embed-templates' plugin stream
        sut = embedTemplates();
    });

    it('should dial with single quoted template paths', function (done) {
        var fakeFile = new File({contents: new Buffer('templateUrl: \'test/cases/hello-world/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with double quoted template paths', function (done) {
        var fakeFile = new File({contents: new Buffer('templateUrl: "test/cases/hello-world/hello-world-template.html"')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with new quotes ` in template paths', function (done) {
        var fakeFile = new File({contents: new Buffer('templateUrl: `test/cases/hello-world/hello-world-template.html`')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with single quoted templateUrl key', function (done) {
        var fakeFile = new File({contents: new Buffer('\'templateUrl\': \'test/cases/hello-world/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with double quoted templateUrl key', function (done) {
        var fakeFile = new File({contents: new Buffer('"templateUrl": \'test/cases/hello-world/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with templateUrl {SPACES} : {SPACES} {url}', function (done) {
        var fakeFile = new File({contents: new Buffer('"templateUrl" \t\r\n:\r\n\t  \'test/cases/hello-world/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should skip errors if particular flag specified', function (done) {
        sut = embedTemplates({skipErrors: true});
        var fakeFile = new File({contents: new Buffer(JSON.stringify({
            templateUrl: 'test/cases/hello-world/hello-world-template.html',
            l2: {templateUrl: 'test/assets/hello-world-template2.html'},
            l3: {templateUrl: 'test/cases/hello-world/hello-world-template.html'}
        }))});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), '{template:\'<strong>Hello World!</strong>\',"l2":{"templateUrl":"test/assets/hello-world-template2.html"},"l3":{template:\'<strong>Hello World!</strong>\'}}');
            done();
        });
    });

    it('should use basePath to find the templates if specified', function (done) {
        sut = embedTemplates({ basePath: 'test' });
        var entry = JSON.stringify({
            templateUrl: '/cases/hello-world/hello-world-template.html'
        });
        var fakeFile = new File({contents: new Buffer(entry)});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), '{template:\'<strong>Hello World!</strong>\'}');
            done();
        });
    });

    it('should ignore files bigger than the maxSize specified', function (done) {
        var tplStats = fs.statSync('test/cases/hello-world/hello-world-template.html');
        sut = embedTemplates({maxSize: tplStats.size - 1});
        var entry = JSON.stringify({
            templateUrl: 'test/cases/hello-world/hello-world-template.html'
        });
        var fakeFile = new File({contents: new Buffer(entry)});
        var contentBefore = fakeFile.contents.toString('utf8');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), contentBefore);
            done();
        });
    });

    it('should embed template with quotes properly', function(done) {
        testEmbed(
            'test/cases/hard-attributes/hard-attributes-directive.js',
            'test/cases/hard-attributes/hard-attributes-embedded.js', done
        );
    });

    it('should embed hello-world template', function (done) {
        testEmbed(
            'test/cases/hello-world/hello-world-directive.js',
            'test/cases/hello-world/hello-world-embedded.js', done);
    });

    it('should embed Angular 2.0 templates with <a [router-link]="[\'/search\']">Search</a>', function (done) {
        testEmbed(
            'test/cases/angular2-typescript/angular2-component.ts',
            'test/cases/angular2-typescript/angular2-embedded.ts', done);
    });

    it('should not change attributes case (for Angular2.0 beta)', function (done) {
        testEmbed(
            'test/cases/angular2-ngIf/angular2-ngIf-component.js',
            'test/cases/angular2-ngIf/angular2-ngIf-embedded.js', done);
    });
});
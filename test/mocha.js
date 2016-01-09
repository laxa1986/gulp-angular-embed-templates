var embedTemplates = require('../');
var assert = require('assert');
require('mocha');
var fs = require('fs');
var File = require('gulp-util').File;

//var fixtures = function (glob) { return path.join(__dirname, 'fixtures', glob); };

describe('gulp-angular-embed-templates', function () {
    var sut;

    /**
     * Build fake file with content '{templateUrl:"test/assets/{templateName}"}'
     * @param {String} templateName
     * @returns {*} File object
     */
    function buildFakeFile(templateName) {
        var entry = JSON.stringify({
            templateUrl: 'test/assets/'+templateName
        });
        return new File({contents: new Buffer(entry)});
    }

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

    it('should embed template content whenever specified templateUrl', function (done) {
        // create the fake file
        var directiveFile = readFile('test/assets/hello-world-directive.js');

        // write the fake file to it
        sut.write(directiveFile);

        // wait for the file to come back out
        sut.once('data', function (file) {
            // make sure it came out the same way it went in
            assert(file.isBuffer());

            // check the contents
            assert.equal(file.contents.toString('utf8'),
                'angular.module(\'test\').directive(\'helloWorld\', function () {\n' +
                '    return {\n' +
                '        restrict: \'E\',\n' +
                '        template:\'<strong>Hello World!</strong>\'\n' +
                '    };\n' +
                '});'
            );
            done();
        });
    });

    it('should dial with single quoted template paths', function (done) {
        var fakeFile = new File({contents: new Buffer('templateUrl: \'test/assets/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with double quoted template paths', function (done) {
        var fakeFile = new File({contents: new Buffer('templateUrl: "test/assets/hello-world-template.html"')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with new quotes ` in template paths', function (done) {
        var fakeFile = new File({contents: new Buffer('templateUrl: `test/assets/hello-world-template.html`')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with single quoted templateUrl key', function (done) {
        var fakeFile = new File({contents: new Buffer('\'templateUrl\': \'test/assets/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with double quoted templateUrl key', function (done) {
        var fakeFile = new File({contents: new Buffer('"templateUrl": \'test/assets/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with templateUrl {SPACES} : {SPACES} {url}', function (done) {
        var fakeFile = new File({contents: new Buffer('"templateUrl" \t\r\n:\r\n\t  \'test/assets/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should skip errors if particular flag specified', function (done) {
        sut = embedTemplates({skipErrors: true});
        var fakeFile = new File({contents: new Buffer(JSON.stringify({
            templateUrl: 'test/assets/hello-world-template.html',
            l2: {templateUrl: 'test/assets/hello-world-template2.html'},
            l3: {templateUrl: 'test/assets/hello-world-template.html'}
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
            templateUrl: '/assets/hello-world-template.html'
        });
        var fakeFile = new File({contents: new Buffer(entry)});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), '{template:\'<strong>Hello World!</strong>\'}');
            done();
        });
    });

    it('should ignore files bigger than the maxSize specified', function (done) {
        var tplStats = fs.statSync('test/assets/hello-world-template.html');
        sut = embedTemplates({maxSize: tplStats.size - 1});
        var fakeFile = buildFakeFile('hello-world-template.html');
        var contentBefore = fakeFile.contents.toString('utf8');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), contentBefore);
            done();
        });
    });

    it('should embed template with quotes properly', function(done) {
        var fakeFile = buildFakeFile('hard-template.html');
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), '{template:\'<form class=login id="home form" x=c>My name is\\\'{{value}}\\\'</form>\'}');
            done();
        });
    });

    it('should embed Angular 2.0 templates with <a [router-link]="[\'/search\']">Search</a>', function (done) {
        testEmbed('test/assets/angular2-component.js', 'test/assets/angular2-embedded.js', done);
    });

    it('should not change attributes case (for Angular2.0 beta)', function (done) {
        testEmbed('test/assets/angular2-ngIf-component.js', 'test/assets/angular2-ngIf-embedded.js', done);
    });
});
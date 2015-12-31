var embedTemplates = require('../');
//var gulp = require('gulp');
//var should = require('should');
var assert = require('assert');
//var streamAssert = require('stream-assert');
require('mocha');
var fs = require('fs');
var File = require('gulp-util').File;

//var fixtures = function (glob) { return path.join(__dirname, 'fixtures', glob); };

describe('gulp-angular-embed-templates', function () {
    var sut;

    function buildFakeFile(templateName) {
        var entry = JSON.stringify({
            templateUrl: 'test/assets/'+templateName
        });
        return new File({contents: new Buffer(entry)});
    }

    beforeEach(function() {
        // Create a 'gulp-angular-embed-templates' plugin stream
        sut = embedTemplates();
    });

    it('should embed template content whenever specified templateUrl', function (done) {
        // create the fake file
        var fakeFile = new File({
            contents: new Buffer(fs.readFileSync('test/assets/hello-world-directive.js'))
        });

        // write the fake file to it
        sut.write(fakeFile);

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

    it('should dial with new quotes ` in templateUrl key', function (done) {
        var fakeFile = new File({contents: new Buffer('`templateUrl`: \'test/assets/hello-world-template.html\'')});
        sut.write(fakeFile);
        sut.once('data', function (file) {
            assert.equal(file.contents.toString('utf8'), 'template:\'<strong>Hello World!</strong>\'');
            done();
        });
    });

    it('should dial with templateUrl {SPACES} : {SPACES} {url} ', function (done) {
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
            assert.equal(file.contents.toString('utf8'), '{template:\'<form class=login id=\\\"home form\\\" x=c>My name is\\\'{{value}}\\\'</form>\'}');
            done();
        });
    });
});
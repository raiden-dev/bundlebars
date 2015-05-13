/*jshint maxlen:false*/

var fs = require('fs'),
    path = require('path'),
    stream = require('stream'),
    assert = require('assert'),
    hooker = require('hooker'),
    rimraf = require('rimraf'),
    cli = require('../../src/bundlebars-cli'),
    Bundlebars = require('../../src/Bundlebars');

describe('Bundlebars cli', function () {

  var DIRNAME = 'test.tmp';

  it('should require compile options', function () {
    var filename = 'foo',
        filedata = 'module.exports = {};',
        filepath = path.join(DIRNAME, filename),
        modulepath = path.join(process.cwd(), filepath);

    function beforeOne() {
      fs.mkdirSync(DIRNAME);
      fs.writeFileSync(filepath, filedata);
    }

    function afterOne() {
      rimraf.sync(DIRNAME);
    }

    beforeOne();

    var err;
    var argv = {
      _: [],
      options: modulepath
    };

    try {
      cli(argv);
    }
    catch (x) {
      err = x;
    }

    afterOne();

    if (err) throw err;
  });

  it('should resolve wrappers', function () {
    var argv = {
      _: []
    };

    argv.wrapper = 'amd';
    cli(argv);
    assert.equal(argv.wrapper,
      path.join(process.cwd(), 'wrappers/amd.hbs'));

    argv.wrapper = 'amd-bundle';
    cli(argv);
    assert.equal(argv.wrapper,
      path.join(process.cwd(), 'wrappers/amd-bundle.hbs'));

    argv.wrapper = 'node';
    cli(argv);
    assert.equal(argv.wrapper,
      path.join(process.cwd(), 'wrappers/node.hbs'));

    argv.wrapper = 'node-bundle';
    cli(argv);
    assert.equal(argv.wrapper,
      path.join(process.cwd(), 'wrappers/node-bundle.hbs'));

    argv.wrapper = 'es6';
    cli(argv);
    assert.equal(argv.wrapper,
      path.join(process.cwd(), 'wrappers/es6.hbs'));

    argv.wrapper = 'es6-bundle';
    cli(argv);
    assert.equal(argv.wrapper,
      path.join(process.cwd(), 'wrappers/es6-bundle.hbs'));

    argv.wrapper = 'jst';
    cli(argv);
    assert.equal(argv.wrapper,
      path.join(process.cwd(), 'wrappers/jst.hbs'));

    argv.wrapper = '../foo-bar';
    cli(argv);
    assert.equal(argv.wrapper,
      path.resolve(process.cwd(), argv.wrapper));
  });

  it('should precompile when "--precompile" option specified', function (done) {
    var argv = {
      _: ['-'],
      precompile: true
    };

    hooker.hook(Bundlebars.prototype, 'precompile', function (src) {
      hooker.unhook(Bundlebars.prototype, 'precompile');
      done();
    });

    cli(argv, Bundlebars);
  });

  it('should use stdin stream for "-" source', function (done) {
    var argv = {
      _: ['-'],
      compile: true
    };

    hooker.hook(Bundlebars.prototype, 'compile', function (src) {
      if (src !== process.stdin) {
        done(new Error('src is not stdin'));
      }
      else {
        done();
      }

      hooker.unhook(Bundlebars.prototype, 'compile');
    });

    cli(argv, Bundlebars);
  });

});

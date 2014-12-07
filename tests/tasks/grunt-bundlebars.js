/*jshint maxlen:false*/
var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    grunt = require('grunt'),
    hooker = grunt.util.hooker,
    Promise = require('es6-promise').Promise,
    Bundlebars = require('../../src/Bundlebars'),
    bundlebarsTask = require('../../tasks/grunt-bundlebars');

describe('Grunt task', function () {

  var task = null,
      dirname = 'tmp_test',
      filename = path.join(dirname, 'tmp.test'),
      src = path.join(dirname, 'foo.test'),
      dest = path.join(dirname, 'bar.test');

  var config = function (options, srcArg) {
    return {
      async: function () {},

      options: function () {
        return options || {};
      },

      files: [{
        src: [srcArg || src],
        dest: dest
      }]
    };
  };

  var stub = function () {
    return hooker.preempt(
      new Promise(function (resolve) { resolve(); })
    );
  };

  after(function () {
    rimraf.sync(dirname);
  });

  beforeEach(function () {
    rimraf.sync(dirname);

    fs.mkdirSync(dirname);
    fs.writeFileSync(filename, '');

    task = bundlebarsTask(grunt);

    hooker.hook(Bundlebars.prototype, 'compile', function (template, data) {
      return stub();
    });

    hooker.hook(Bundlebars.prototype, 'precompile', function (template, data) {
      return stub();
    });

    hooker.hook(grunt.file, ['read', 'write'], function () {
      return hooker.preempt();
    });

    hooker.hook(grunt.log, ['ok'], function () {
      return hooker.preempt();
    });
  });

  afterEach(function () {
    hooker.unhook(Bundlebars.prototype);
    hooker.unhook(grunt.file);
    hooker.unhook(grunt.log);
  });

  it('task should exists', function () {
    if (!grunt.task.exists('bundlebars')) {
      throw new Error('task "bundlebars" was not found');
    }
  });

  describe('options', function () {

    it('should pass parameters to Bundlebars constructor', function () {
      var FakeConstructor = function (params) {
        this.compile = function () {
          return new Promise(function (resolve) { resolve(); });
        };

        if (typeof params.partialsDir !== 'string') {
          throw new Error('partialsDir param was not passed');
        }

        if (typeof params.partialsExt !== 'string') {
          throw new Error('partialsExt param was not passed');
        }

        if (typeof params.helpersDir !== 'string') {
          throw new Error('helpersDir param was not passed');
        }

        if (typeof params.noPartials !== 'boolean') {
          throw new Error('noPartials param was not passed');
        }

        if (typeof params.compilerOptions !== 'object') {
          throw new Error('compilerOptions param was not passed');
        }
      };

      task.call(config({
        partials: 'partials/$0.test',
        helpers: 'helpers/',
        noPartials: true,
        compilerOptions: {}
      }), FakeConstructor);
    });

    it('should know all built-in wrappers', function () {
      hooker.hook(Bundlebars.prototype, 'precompile',
        function (template, wrapper) {

        if (!fs.existsSync(wrapper)) {
          throw new Error('wrapper was not resolved as built-in');
        }

        return stub();
      });

      [
        'amd',
        'amd-bundle',
        'node',
        'node-bundle',
        'es6',
        'es6-bundle',
        'jst'

      ].forEach(function (name) {
        task.call(config({
          precompile: true,
          wrapper: name
        }), Bundlebars);
      });
    });

    it('should resolve user-defined wrapper', function () {
      hooker.hook(Bundlebars.prototype, 'precompile', function (template, wrapper) {
        if (!fs.existsSync(wrapper)) {
          throw new Error('custom wrapper was not resolved');
        }

        return stub();
      });

      task.call(config({
        precompile: true,
        wrapper: filename
      }), Bundlebars);
    });

    it('should resolve references in data option', function () {
      fs.mkdirSync(path.join(dirname, 'foo'));
      fs.writeFileSync(path.join(dirname, 'foo', 'foo.test'), '{}');

      hooker.hook(Bundlebars.prototype, 'compile', function (template, data) {
        if (!fs.existsSync(data)) {
          throw new Error('data option references not parsed');
        }

        return stub();
      });

      task.call(config({
        data: path.join(dirname, '$0', '$0.test')
      }), Bundlebars);
    });

    it('should resolve data option as path', function () {
      hooker.hook(Bundlebars.prototype, 'compile', function (template, data) {
        if (!fs.existsSync(data)) {
          throw new Error('data file was not resolved');
        }

        return stub();
      });

      task.call(config({
        data: filename
      }), Bundlebars);
    });

    it('should resolve data option as boolean', function () {
      var filename = path.join(dirname, 'foo.json'),
          src = path.join(dirname, 'foo'),
          srcExt = path.join(dirname, 'foo.test');

      fs.writeFileSync(filename, '{}');

      hooker.hook(Bundlebars.prototype, 'compile', function (template, data) {
        if (!fs.existsSync(data)) {
          if (path.extname(template)) {
            throw new Error('data file was not resolved');
          }
          else {
            throw new Error('data file was not resolved for src with no extension');
          }
        }

        return stub();
      });

      task.call(config({
        data: true
      }, src), Bundlebars);

      task.call(config({
        data: true
      }, srcExt), Bundlebars);
    });

    it('should resolve data option as dirname', function () {
      var filename = path.join(dirname, 'foo.json');

      fs.writeFileSync(filename, '{}');

      hooker.hook(Bundlebars.prototype, 'compile', function (template, data) {
        if (!fs.existsSync(data)) {
          throw new Error('data file was not resolved');
        }

        return stub();
      });

      task.call(config({
        data: dirname
      }), Bundlebars);
    });

    it('should resolve yaml data when json not exists', function () {
      var filename = path.join(dirname, 'foo.yaml');

      fs.writeFileSync(filename, '');

      hooker.hook(Bundlebars.prototype, 'compile', function (template, data) {
        if (!fs.existsSync(data)) {
          throw new Error('data file was not resolved');
        }

        return stub();
      });

      task.call(config({
        data: true
      }), Bundlebars);

      fs.unlinkSync(filename, '');
      fs.writeFileSync(filename.replace('.yaml', '.yml'), '');

      task.call(config({
        data: true
      }), Bundlebars);
    });

    it('should write compile result to file', function (done) {
      hooker.hook(Bundlebars.prototype, 'compile', function (template, data) {
        return stub();
      });

      hooker.hook(grunt.file, 'write', function (destArg) {
        if (path.resolve(process.cwd(), dest) !== destArg) {
          done(new Error('writing to wrong destination'));
        }
        else {
          done();
        }

        return hooker.preempt();
      });

      task.call(config());
    });

    it('should write precompile result to file', function (done) {
      hooker.hook(grunt.file, 'write', function (destArg) {
        if (path.resolve(process.cwd(), dest) !== destArg) {
          done(new Error('writing to wrong destination'));
        }
        else {
          done();
        }

        return hooker.preempt();
      });

      task.call(config({
        precompile: true
      }));
    });

  });

});

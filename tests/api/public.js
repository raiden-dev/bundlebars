/*jshint maxlen:false*/
var fs = require('fs'),
    Bundlebars = require('../../src/Bundlebars');

describe('Bundlebars public API', function () {

  var bundlebars = null;

  beforeEach(function () {
    bundlebars = new Bundlebars();
  });

  describe('Bundlebars#compile method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.compile() instanceof Promise)) {
        throw new Error('Bundlebars#compile not returned a Promise');
      }
    });

    it('should reject Promise when error occured on any level', function (done) {
      bundlebars.compile(undefined)
        .then(function () {
          done(new Error('Bundlebars#compile resolved instead of rejecting'));
        },

        function (err) {
          if (!(err instanceof Error)) {
            done(new Error('Bundlebars#compile rejected with not an Error object'));
          }
          else {
            done();
          }
        });
    });

    it('should resolve Promise with result', function (done) {
      var filename = 'tmp.test',
          filedata = '{{foo}} {{{bar}}}',
          context = {
            foo: 'foo',
            bar: '<bar>'
          },
          expectedResult = 'foo <bar>';

      function beforeOne() {
        fs.writeFileSync(filename, filedata);
      }

      function afterOne() {
        fs.unlinkSync(filename);
      }

      beforeOne();

      bundlebars.compile(filename, context)
        .then(function (result) {
          if (result !== expectedResult) {
            done(new Error('Resolved with unexpected result'));
          }
          else {
            done();
          }
        }, done)
        .then(afterOne, afterOne);
    });

  });

  describe('Bundlebars#precompile method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.precompile() instanceof Promise)) {
        throw new Error('Bundlebars#precompile not returned a Promise');
      }
    });

    it('should reject Promise when error occured on any level', function (done) {
      bundlebars.precompile(undefined)
        .then(function () {
          done(new Error('Bundlebars#precompile resolved instead of rejecting'));
        },

        function (err) {
          if (!(err instanceof Error)) {
            done(new Error('Bundlebars#precompile rejected with not an Error object'));
          }
          else {
            done();
          }
        });
    });

    it('should resolve Promise with result', function (done) {
      var filename = 'tmp.test',
          filedata = '{{foo}}';

      function beforeOne() {
        fs.writeFileSync(filename, filedata);
      }

      function afterOne() {
        fs.unlinkSync(filename);
      }

      beforeOne();

      bundlebars.precompile(filename)
        .then(function (result) {
          if (!result.length) {
            done(new Error('resolved with unexpected result'));
          }
          else {
            done();
          }
        }, done)
        .then(afterOne, afterOne);
    });

  });

});

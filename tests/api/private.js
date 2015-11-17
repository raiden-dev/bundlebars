/*jshint maxlen:false*/
var fs = require('fs'),
    path = require('path'),
    stream = require('stream'),
    yaml = require('js-yaml'),
    Bundlebars = require('../../src/Bundlebars');

describe('Bundlebars private API', function () {

  var bundlebars = null;

  beforeEach(function () {
    bundlebars = new Bundlebars();
  });

  it('constructor should always return an instance', function () {
    if (!(new Bundlebars() instanceof Bundlebars)) {
      throw new Error('new Bundlebars() returned not an instance of Bundlebars');
    }

    /*jshint newcap:false*/
    if (!(Bundlebars() instanceof Bundlebars)) {
      throw new Error('Bundlebars() returned not an instance of Bundlebars');
    }
  });

  it('checking known instance properties existence', function () {
    if (!bundlebars.hasOwnProperty('handlebars')) {
      throw new Error('Bundlebars instance have no handlebars property');
    }

    if (!bundlebars.hasOwnProperty('compilerOptions')) {
      throw new Error('Bundlebars instance have no compilerOptions property');
    }

    if (!bundlebars.hasOwnProperty('partialsDir')) {
      throw new Error('Bundlebars instance have no partialsDir property');
    }

    if (!bundlebars.hasOwnProperty('partialsExt')) {
      throw new Error('Bundlebars instance have no partialsExt property');
    }

    if (!bundlebars.hasOwnProperty('partials')) {
      throw new Error('Bundlebars instance have no partials property');
    }

    if (!bundlebars.hasOwnProperty('helpersDir')) {
      throw new Error('Bundlebars instance have no helpersDir property');
    }

    if (!bundlebars.hasOwnProperty('noPartials')) {
      throw new Error('Bundlebars instance have no noPartials property');
    }
  });

  describe('Bundlebars#resolveTemplate method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.resolveTemplate() instanceof Promise)) {
        throw new Error('Bundlebars#resolveTemplate not returned a Promise');
      }
    });

    it('should reject Promise with error object when failed to read template file', function (done) {
      bundlebars.resolveTemplate({
        template: ''
      })
        .then(function () {
          done(new Error('Bundlebars#resolveTemplate resolved instead of rejecting'));
        },

        function (err) {
          if (!(err instanceof Error)) {
            done(new Error('Bundlebars#resolveTemplate rejected with not an Error object'));
          }
          else {
            done();
          }
        });
    });

    it('should reject Promise with error object when template stream is broken', function (done) {
      var templateStream = new stream.Readable();
      templateStream._read = function () {};

      setTimeout(function () {
        templateStream.emit('error', new Error());
      }, 0);

      bundlebars.resolveTemplate({
        template: templateStream
      })
        .then(function () {
          done(new Error('Bundlebars#resolveTemplate resolved instead of rejecting'));
        },

        function (err) {
          if (!(err instanceof Error)) {
            done(new Error('Bundlebars#resolveTemplate rejected with not an Error object'));
          }
          else {
            done();
          }
        });
    });

    it('should resolve promise with updated state for string template', function (done) {
      var dirname = 'test.tmp',
          filename = 'foo',
          filedata = 'test test',
          filepath = path.join(dirname, filename);

      function beforeOne() {
        fs.mkdirSync(dirname);
        fs.writeFileSync(filepath, filedata);
      }

      function afterOne() {
        fs.unlinkSync(filepath);
        fs.rmdirSync(dirname);
      }

      beforeOne();

      bundlebars.resolveTemplate({
        template: filepath,
        unrelated: 'foo bar'
      })
        .then(function (state) {
          if (state.templateFilename !== filepath) {
            done(new Error('state.templateFilename was updated with incorrect value'));
          }
          else if (state.template !== filedata) {
            done(new Error('state.template was updated with incorrect value'));
          }
          else if (state.templateName !== path.basename(filename)
            .replace(path.extname(filename), '')) {

            done(new Error('state.templateName was updated with incorrect value'));
          }
          else if (state.unrelated !== 'foo bar') {
            done(new Error('state.unrelated was unexpectedly changed'));
          }
          else {
            done();
          }
        }, done)
        .then(afterOne, afterOne);
    });

    it('should resolve promise with updated state for stream template', function (done) {
      var templateStream = new stream.Readable();
      templateStream._read = function () {};

      templateStream.push('test test');
      templateStream.push(null);

      bundlebars.resolveTemplate({
        template: templateStream,
        unrelated: 'foo bar'
      })
        .then(function (state) {
          if (state.templateStream !== templateStream) {
            done(new Error('state.templateStream was updated with incorrect value'));
          }
          else if (state.template !== 'test test') {
            done(new Error('state.template was updated with incorrect value'));
          }
          else if (state.unrelated !== 'foo bar') {
            done(new Error('state.unrelated was unexpectedly changed'));
          }
          else {
            done();
          }
        }, done);
    });

  });

  describe('Bundlebars#resolveContext method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.resolveContext() instanceof Promise)) {
        throw new Error('Bundlebars#resolveContext not returned a Promise');
      }
    });

    it('should reject Promise if read error occurred', function (done) {
      var filedir = 'tmp';

      fs.mkdirSync(filedir);

      bundlebars.resolveContext({ context: 'tmp' })
        .then(function () {
          done(new Error('Bundlebars#resolveContext resolved instead of rejecting'));
          fs.rmdirSync(filedir);
        },

        function (err) {
          if (!(err instanceof Error)) {
            done(new Error('Bundlebars#resolveContext rejected with not an Error object'));
          }
          else {
            done();
          }

          fs.rmdirSync(filedir);
        });
    });

    it('should resolve Promise with state.context as empty object if state.context file not found', function (done) {
      bundlebars.resolveContext({ context: 'test' })
        .then(function (state) {
          if (JSON.stringify(state.context) === '{}') {
            done();
          }
          else {
            done(new Error('Bundlebars#resolveContext not resolved with an empty object'));
          }
        }, done);
    });

    it('should resolve Promise with state.context as empty object if no state.context passed', function (done) {
      bundlebars.resolveContext()
        .then(function (state) {
          if (JSON.stringify(state.context) === '{}') {
            done();
          }
          else {
            done(new Error('Bundlebars#resolveContext not resolved with an empty object'));
          }
        }, done);
    });

    it('should resolve Promise as is if state.context is already an object', function (done) {
      bundlebars.resolveContext({ context: { foo: 'bar' } })
        .then(function (state) {
          if (JSON.stringify(state.context) !== '{"foo":"bar"}') {
            done(new Error('Bundlebars#resolveContext not resolved with the same state'));
          }
          else {
            done();
          }
        }, done);
    });

    it('should resolve Promise with updated state for JSON data file', function (done) {
      var filename = 'tmp.test',
          filedata = { foo: 'bar' };

      function beforeOne() {
        fs.writeFileSync(filename, JSON.stringify(filedata));
      }

      function afterOne() {
        fs.unlinkSync(filename);
      }

      beforeOne();

      bundlebars.resolveContext({
        context: filename,
        unrelated: 'test test'
      })
        .then(function (state) {
          if (state.contextFilename !== filename) {
            done(new Error('state.contextFilename was updated with incorrect value'));
          }
          else if (JSON.stringify(state.context) !== JSON.stringify(filedata)) {
            done(new Error('state.context was updated with incorrect value'));
          }
          else if (state.unrelated !== 'test test') {
            done(new Error('state.unrelated was unexpectedly changed'));
          }
          else {
            done();
          }
        }, done)
        .then(afterOne, afterOne);
    });

    it('should resolve Promise with updated state for YAML data file', function (done) {
      var filename = 'tmp.test.yaml',
          filedata = { foo: 'bar' };

      function beforeOne() {
        fs.writeFileSync(filename, yaml.safeDump(filedata));
      }

      function afterOne() {
        fs.unlinkSync(filename);
      }

      beforeOne();

      bundlebars.resolveContext({
        context: filename,
        unrelated: 'test test'
      })
        .then(function (state) {
          if (state.contextFilename !== filename) {
            done(new Error('state.contextFilename was updated with incorrect value'));
          }
          else if (yaml.safeDump(state.context) !== yaml.safeDump(filedata)) {
            done(new Error('state.context was updated with incorrect value'));
          }
          else if (state.unrelated !== 'test test') {
            done(new Error('state.unrelated was unexpectedly changed'));
          }
          else {
            done();
          }
        }, done)
        .then(afterOne, afterOne);
    });

  });

  describe('Bundlebars#registerPartials method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.registerPartials() instanceof Promise)) {
        throw new Error('Bundlebars#registerPartials not returned a Promise');
      }
    });

    it('should perform short circuit when noPartials option is set', function (done) {
      bundlebars = new Bundlebars({ noPartials: true });

      bundlebars.registerPartials({
        template: '{{>foo}}',
        unrelated: 'test test'
      })
        .then(function (state) {
          if (state.unrelated !== 'test test') {
            done(new Error('Bundlebars#registerPartials was not resolved with the same state'));
          }
          else if (bundlebars.partials.length) {
            done(new Error('Bundlebars#registerPartials was not performed short circuit'));
          }
          else {
            done();
          }
        }, done);
    });

    it('should reject Promise when partial was not found', function (done) {
      bundlebars.registerPartials({ template: '{{>foo}}' })
        .then(function () {
          done(new Error('Bundlebars#registerPartials resolved instead of rejecting'));
        },

        function (err) {
          if (!(err instanceof Error)) {
            done(new Error('Bundlebars#registerPartials rejected with not an Error object'));
          }
          else {
            done();
          }
        });
    });

    it('should update instance and register all partials', function (done) {
      function beforeOne() {
        fs.writeFileSync('foo', 'foo');
        fs.writeFileSync('bar', 'bar');
        fs.writeFileSync('baz', 'baz');
      }

      function afterOne() {
        fs.unlinkSync('foo');
        fs.unlinkSync('bar');
        fs.unlinkSync('baz');
      }

      beforeOne();

      bundlebars.registerPartials({
        template: '{{>foo}} {{> "bar" }} {{>\'baz\'}}'
      })
        .then(function () {
          if (bundlebars.partials.length !== 3) {
            done(new Error('Not all partials was added to instance'));
          }
          else if (!(
            bundlebars.handlebars.partials.hasOwnProperty('foo') &&
            bundlebars.handlebars.partials.hasOwnProperty('bar') &&
            bundlebars.handlebars.partials.hasOwnProperty('baz')
          )) {
            done(new Error('Not all partials was registered'));
          }
          else {
            done();
          }
        })
        .then(afterOne, afterOne);
    });

  });

  describe('Bundlebars#registerHelpers method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.registerHelpers() instanceof Promise)) {
        throw new Error('Bundlebars#registerHelpers not returned a Promise');
      }
    });

    it('should reject Promise when directory read failed', function (done) {
      bundlebars = new Bundlebars({ helpersDir: 'foo/bar' });

      bundlebars.registerHelpers()
        .then(function () {
          done(new Error('Bundlebars#registerPartials resolved instead of rejecting'));
        },

        function (err) {
          if (!(err instanceof Error)) {
            done(new Error('Bundlebars#registerPartials rejected with not an Error object'));
          }
          else {
            done();
          }
        });
    });

  });

  describe('Bundlebars#compileTemplate method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.compileTemplate({ template: '' }) instanceof Promise)) {
        throw new Error('Bundlebars#compileTemplate not returned a Promise');
      }
    });

    it('should resolve Promise with updated state.result', function (done) {
      bundlebars.compileTemplate({
        template: '{{foo}} {{{bar}}}',
        context: { foo: 'foo', bar: '<bar>' }
      })
        .then(function (state) {
          if (state.result !== 'foo <bar>') {
            done(new Error('state.result was updated in unexpected way'));
          }
          else {
            done();
          }
        }, done);
    });

  });

  describe('Bundlebars#precompileTemplate method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.precompileTemplate({ template: '' }) instanceof Promise)) {
        throw new Error('Bundlebars#precompileTemplate not returned a Promise');
      }
    });

    it('should perform short circuit when noPartials option is set', function (done) {
      bundlebars = new Bundlebars({ noPartials: true });
      bundlebars.partials = [{ name: 'foo', src: 'foo' }];

      bundlebars.precompileTemplate({
        template: ''
      })
        .then(function (state) {
          if (state.partials.length) {
            done(new Error('Bundlebars#precompileTemplate was not performed short circuit'));
          }
          else {
            done();
          }
        }, done);
    });

    it('should resolve Promise with updated state.partials', function (done) {
      bundlebars.partials = [
        { name: 'foo', src: '{{foo}}' },
        { name: 'bar', src: '{{bar}}' }
      ];

      bundlebars.precompileTemplate({
        template: '{{>foo}} {{>bar}}'
      })
        .then(function (state) {
          if (state.partials.length !== 2) {
            done(new Error('state.partials was updated in unexpected way'));
          }
          else {
            done();
          }
        }, done);
    });

    it('should resolve Promise with updated state.result', function (done) {
      bundlebars.precompileTemplate({
        template: '{{foo}}'
      })
        .then(function (state) {
          if (!state.result.length) {
            done(new Error('state.result was updated in unexpected way'));
          }
          else {
            done();
          }
        }, done);
    });

  });

  describe('Bundlebars#wrapTemplate method', function () {

    it('should return a Promise', function () {
      if (!(bundlebars.wrapTemplate() instanceof Promise)) {
        throw new Error('Bundlebars#wrapTemplate not returned a Promise');
      }
    });

    it('should resolve Promise as is when no state.wrapper was passed', function (done) {
      bundlebars.wrapTemplate({ result: 'test test' })
        .then(function (state) {
          if (state.result !== 'test test') {
            done(new Error('state.result was changed'));
          }
          else {
            done();
          }
        }, done);
    });

    it('should resolve Promise with updated state.result', function (done) {
      var filename = 'tmp.test',
          filedata = '{{#each partials}}{{name}}{{src}}{{/each}} {{name}} {{src}}';

      function beforeOne() {
        fs.writeFileSync(filename, filedata);
      }

      function afterOne() {
        fs.unlinkSync(filename);
      }

      beforeOne();

      bundlebars.wrapTemplate({
        wrapper: filename,
        partials: [{ name: 'foo', src: 'bar' }],
        templateName: 'baz',
        result: 'test test'
      })
        .then(function (state) {
          if (state.result !== 'foobar baz test test') {
            done(new Error('state.result was updated in unexpected way'));
          }
          else {
            done();
          }
        }, done)
        .then(afterOne, afterOne);
    });

  });

});

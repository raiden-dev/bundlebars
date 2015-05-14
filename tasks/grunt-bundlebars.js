var path = require('path'),
    clc = require('cli-color'),
    Promise = require('es6-promise').Promise,
    Bundlebars = require('../src/Bundlebars');

module.exports = function (grunt) {
  grunt.registerMultiTask('bundlebars', 'Compile Handlebars templates.', task);

  function task(Env) {
    Env = Env || Bundlebars;

    var done = this.async(),
        queue = [];

    var options = this.options(),
        wrappersPath = path.join(__dirname, '..', 'wrappers'),
        partialsDir = options.partials,
        partialsExt;

    if (path.extname(options.partials)) {
      partialsDir = path.dirname(options.partials);
      partialsExt = path.extname(options.partials);
    }

    /*jshint newcap:false*/
    var bundlebars = new Env({
      partialsDir: partialsDir,
      partialsExt: partialsExt,
      helpersDir: options.helpers,
      noPartials: options.noPartials,
      compilerOptions: options.compilerOptions
    });

    switch (options.wrapper) {
      case 'amd':
        wrapper = path.join(wrappersPath, 'amd.hbs');
        break;

      case 'amd-bundle':
        wrapper = path.join(wrappersPath, 'amd-bundle.hbs');
        break;

      case 'node':
        wrapper = path.join(wrappersPath, 'node.hbs');
        break;

      case 'node-bundle':
        wrapper = path.join(wrappersPath, 'node-bundle.hbs');
        break;

      case 'es6':
        wrapper = path.join(wrappersPath, 'es6-bundle.hbs');
        break;

      case 'es6-bundle':
        wrapper = path.join(wrappersPath, 'es6-bundle.hbs');
        break;

      case 'jst':
        wrapper = path.join(wrappersPath, 'jst.hbs');
        break;

      default:
        if (typeof options.wrapper === 'string') {
          wrapper = path.resolve(process.cwd(), options.wrapper);
        }
    }

    this.files.forEach(function (filePair) {
      var dest = path.resolve(process.cwd(), filePair.dest);

      filePair.src.forEach(function (src) {
        src = path.resolve(process.cwd(), src);

        var name = path.basename(src).replace(path.extname(src), ''),
            data = '';

        if (options.data === true ||
          (typeof options.data === 'undefined' && !options.precompile)) {

          if (path.extname(src)) {
            data = src.replace(path.extname(src), '.json');
          }
          else {
            data = src + '.json';
          }
        }
        else if (typeof options.data === 'string') {
          if (/\$0/g.test(options.data)) {
            data = path.resolve(process.cwd(),
              options.data.replace(/\$0/g, name));
          }
          else {
            data = path.resolve(process.cwd(), options.data);
          }

          if (grunt.file.isDir(data)) {
            data = path.resolve(data, name + '.json');
          }
        }

        if (!grunt.file.exists(data)) {
          if (grunt.file.exists(data.replace('.json', '.yml'))) {
            data = data.replace('.json', '.yml');
          }
          else if (grunt.file.exists(data.replace('.json', '.yaml'))) {
            data = data.replace('.json', '.yaml');
          }
        }

        if (options.precompile) {
          queue.push(
            bundlebars.precompile(src, wrapper)
              .then(function (result) {
                grunt.file.write(dest, result);

                grunt.log.ok('Writing ' +
                  clc.cyan(dest) + ' ' + clc.green('OK'));
              })
              .catch(grunt.fail.warn)
          );
        }
        else {
          queue.push(
            bundlebars.compile(src, data)
              .then(function (result) {
                grunt.file.write(dest, result);

                grunt.log.ok('Writing ' +
                  clc.cyan(dest) + ' ' + clc.green('OK'));
              })
              .catch(grunt.fail.warn)
          );
        }
      });
    });

    Promise.all(queue).then(done, grunt.fail.warn);
  }

  return task;
};

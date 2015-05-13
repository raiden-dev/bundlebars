var fs = require('fs'),
    path = require('path'),
    clc = require('cli-color'),
    mkdirp = require('mkdirp'),
    Bundlebars = require('./Bundlebars');

module.exports = function (argv, Env) {
  Env = Env || Bundlebars;

  var params = {
    partialsDir: argv.partials,
    helpersDir: argv.helpers,
    noPartials: !argv.partials
  };

  if (argv.options) {
    params.compilerOptions = require(argv.options);
  }

  /* Built-in wrappers */
  var wrappersPath = path.join(__dirname, '..', 'wrappers');

  switch (argv.wrapper) {
    case 'amd':
      argv.wrapper = path.join(wrappersPath, 'amd.hbs');
      break;

    case 'amd-bundle':
      argv.wrapper = path.join(wrappersPath, 'amd-bundle.hbs');
      break;

    case 'node':
      argv.wrapper = path.join(wrappersPath, 'node.hbs');
      break;

    case 'node-bundle':
      argv.wrapper = path.join(wrappersPath, 'node-bundle.hbs');
      break;

    case 'es6':
      argv.wrapper = path.join(wrappersPath, 'es6.hbs');
      break;

    case 'es6-bundle':
      argv.wrapper = path.join(wrappersPath, 'es6-bundle.hbs');
      break;

    case 'jst':
      argv.wrapper = path.join(wrappersPath, 'jst.hbs');
      break;

    default:
      if (typeof argv.wrapper === 'string') {
        argv.wrapper = path.resolve(process.cwd(), argv.wrapper);
      }
    }

  return Promise.all(argv._.map(function (src) {
    src = (src !== '-') ? src : process.stdin;

    var bundlebars = new Env(params);

    if (argv.precompile) {
      return bundlebars.precompile(src, argv.wrapper)
        .then(writeResult.bind(null, src))
        .catch(console.warn);
    }
    else {
      return bundlebars.compile(src, argv.data)
        .then(writeResult.bind(null, src))
        .catch(console.warn);
    }
  }));

  function writeResult(src, result) {
    if (typeof src !== 'string') {
      src = 'bb.out';
    }

    if (argv.out) {
      return new Promise(function (resolve, reject) {
        mkdirp(argv.out, function (err) {
          if (err) {
            reject(err);
            return;
          }

          var dest = path.join(argv.out, path.basename(src));

          fs.writeFile(dest, result, function (err) {
            if (err) {
              reject(err);
              return;
            }

            console.log([
              'Writing result to ',
              clc.cyan(dest),
              '...',
              clc.green('OK')
            ].join(''));

            resolve();
          });
        });
      });
    }
    else {
      process.stdout.write(result);
      return Promise.resolve();
    }
  }
};

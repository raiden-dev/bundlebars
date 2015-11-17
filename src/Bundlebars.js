 /**
 * Bundlebars core module.
 *
 * @module Bundlebars
 * @requires fs
 * @requires path
 * @requires handlebars
 * @requires js-yaml
 */
var fs = require('fs'),
    path = require('path'),
    Handlebars = require('handlebars'),
    yaml = require('js-yaml');

// Object.assign polyfill
if (typeof Object.assign !== 'function') {
  Object.assign = require('object-assign');
}

/**
 * Bundlebars constructor.
 *
 * @class Bundlebars
 * @param {Object} params  Instantiation parameters.
 */
  function Bundlebars(params) {
    params = params || {};

    if (!(this instanceof Bundlebars)) {
      return new Bundlebars(params);
    }

  /**
   * Local Handlebars instance.
   *
   * @property {Handlebars} handlebars
   */
    this.handlebars = Handlebars.create();

  /**
   * Compiler options.
   *
   * @property {Object} compilerOptions
   */
    this.compilerOptions = params.compilerOptions;

  /**
   * Path to partials directory.
   *
   * @property {String} partialsDir
   */
    this.partialsDir = params.partialsDir;

  /**
   * Partial's extension.
   *
   * @property {String} partialsExt
   */
    this.partialsExt = params.partialsExt;

  /**
   * List of registered partials.
   *
   * @property {Array} partials
   */
    this.partials = [];

  /**
   * Path to helpers directory.
   *
   * @property {String} helpersDir
   */
    this.helpersDir = params.helpersDir;

  /**
   * No partials switch.
   *
   * @property {Boolean} noPartials
   */
    this.noPartials = params.noPartials;

  }

  Bundlebars.prototype = {

  /**
   * Gets template string.
   *
   * @private
   * @method resolveTemplate
   * @param {Object} state  Promise chain state.
   * @returns {Promise}     Fulfilled with updated state.template,
   *                        state.templateName and state.templateFilename.
   */
    resolveTemplate: function (state) {
      state = state || {};

      if (typeof state.template === 'string' && !state.templateFilename) {
        state.templateFilename = state.template || '';

        state.templateName = path.basename(state.templateFilename)
          .replace(path.extname(state.templateFilename), '');
      }
      else if (typeof state.template === 'object' && !state.templateStream) {
        state.templateStream = state.template;
        state.templateName = '';
      }

      return new Promise(function (resolve, reject) {
        var data = '';

        if (state.templateStream) {
          state.templateStream.setEncoding('utf8');

          state.templateStream.on('data', function (chunk) {
            data += chunk;
          });

          state.templateStream.on('end', function () {
            state.template = data;
            resolve(state);
          });

          state.templateStream.on('error', function (err) {
            reject(err);
          });
        }
        else {
          fs.readFile(state.templateFilename, 'utf8', function (err, data) {
            if (err) {
              reject(err);
              return;
            }

            state.template = data;
            resolve(state);
          });
        }
      });
    },

  /**
   * Gets context object.
   *
   * @private
   * @method resolveContext
   * @param {Object}        Promise chain state.
   * @returns {Promise}     Fulfilled with updated
   *                        state.context and state.contextFilename.
   */
    resolveContext: function (state) {
      state = state || {};

      return new Promise(function (resolve, reject) {
        if (!state.context) {
          state.context = {};
          resolve(state);
        }
        else if (typeof state.context === 'object') {
          resolve(state);
        }
        else if (typeof state.context === 'string') {
          if (!state.contextFilename) {
            state.contextFilename = state.context;
          }

          fs.readFile(state.contextFilename, 'utf8', function (err, data) {
            if (err) {
              if (err.code === 'ENOENT') {
                state.context = {};
                resolve(state);
              }
              else {
                reject(err);
              }

              return;
            }

            if (isYaml(state.contextFilename)) {
              state.context = yaml.safeLoad(data);
            }
            else {
              state.context = JSON.parse(data);
            }

            resolve(state);
          });
        }
      });
    },

  /**
   * Registers all template's partials.
   *
   * @private
   * @method registerPartials
   * @param {Object}     Promise chain state.
   * @returns {Promise}  Fulfilled with state.
   */
    registerPartials: function (state) {
      state = state || {};

      if (this.noPartials ||
        (state.templateStream && (!this.partialsDir || !this.partialsExt))) {

        return new Promise(function (resolve) {
          resolve(state);
        });
      }

      var partials = [];

      var partialsDir = this.partialsDir ||
        (this.partialsDir = path.dirname(state.templateFilename));

      var partialsExt = this.partialsExt ||
        (this.partialsExt = path.extname(state.templateFilename));

      var register = function () {
        partials.reverse().forEach(function (item) {
          this.handlebars.registerPartial(item.name, item.src);

          this.partials.push({
            name: item.name,
            src: item.src
          });

        }.bind(this));
      }.bind(this);

      return new Promise(function (resolve, reject) {
        var queue = [],
            done = [];

        (function lookup(data) {
          data = ' ' + data.replace(/\\/gm, '\\\\');

          var re = /[^\\]{{>\s*['"]?([^'"\s}]+)/gm,
              match,
              names = [];

          /*jshint boss:true*/
          while (match = re.exec(data)) {
            names.push(match[1]);
          }

          // Unique and not resolved yet
          names = names.filter(function (value, index, arr) {
            return arr.indexOf(value) === index && done.indexOf(value) === -1;
          });

          queue = queue.concat(names);

          if (!queue.length) {
            register();
            resolve(state);
          }

          names.forEach(function (name, index) {
            var template = path.join(partialsDir.replace(/\$0/g, name),
              name + partialsExt);

            fs.readFile(template, 'utf8', function (err, data) {
              if (err) {
                reject(err);
                return;
              }

              partials.push({
                name: name,
                src: data
              });

              done.push(name);
              queue.splice(queue.indexOf(name), 1);

              lookup(data);
            });
          });
        }(state.template));
      });
    },

  /**
   * Registers all template's helpers.
   *
   * @private
   * @method registerHelpers
   * @param {Object} state  Promise chain state.
   * @returns {Promise}     Fulfilled with state.
   */
    registerHelpers: function (state) {
      state = state || {};

      var helpersDir = (this.helpersDir) ?
        path.resolve(process.cwd(), this.helpersDir) :
          (this.helpersDir = path.resolve(__dirname, '../helpers'));

      var handlebars = this.handlebars;

      return new Promise(function (resolve, reject) {
        fs.readdir(helpersDir, function (err, files) {
          if (err) {
            reject(err);
            return;
          }

          files.forEach(function (name) {
            var filepath = path.join(helpersDir, name);

            require(filepath)(handlebars);
          });

          resolve(state);
        });
      });
    },

  /**
   * Compiles template.
   *
   * @private
   * @method compileTemplate
   * @param {Object} state  Promise chain state.
   * @returns {Promise}     Fulfilled with updated state.result.
   */
    compileTemplate: function (state) {
      state = state || {};

      var template = this.handlebars.compile(state.template,
        this.compilerOptions);

      state.result = template(state.context);

      return new Promise(function (resolve) {
        resolve(state);
      });
    },

  /**
   * Precompiles template with partials.
   *
   * @private
   * @method precompileTemplate
   * @param {Object} state  Promise chain state.
   * @returns {Promise}     Fulfilled with updated state.partials
   *                        and state.result.
   */
    precompileTemplate: function (state) {
      state = state || {};

      if (!state.partials) {
        state.partials = [];
      }

      if (!this.noPartials) {
        state.partials = this.partials.map(function (item) {
          return {
            name: item.name,
            src: this.handlebars.precompile(item.src, this.compilerOptions)
          };
        }.bind(this));
      }

      state.result = this.handlebars.precompile(state.template,
        this.compilerOptions);

      return new Promise(function (resolve) {
        resolve(state);
      });
    },

  /**
   * Wraps template and partials.
   *
   * @private
   * @method wrapTemplate
   * @param {Object} state  Promise chain state.
   * @returns {Promise}     Fulfilled with updated state.result.
   */
    wrapTemplate: function (state) {
      state = state || {};

      return new Promise(function (resolve, reject) {
        if (!state.wrapper) {
          resolve(state);
          return;
        }

        var bundlebars = new Bundlebars({
          compilerOptions: { noEscape: true }
        });

        bundlebars.compile(state.wrapper, {
          partials: state.partials,
          src: state.result,
          name: state.templateName
        })
          .then(function (result) {
            state.result = result;
            resolve(state);
          }, reject);

      });
    },

  /**
   * Compiles template with data.
   *
   * @method compile
   * @param {String|Stream} template   Template's filename or stream.
   * @param {String|Object} [context]  Template's context filename
   *                                   or data object.
   * @returns {Promise}                Fulfilled with {String} result.
   */
    compile: function (template, context) {
      return new Promise(function (resolve, reject) {
        Promise.all([
          this.resolveTemplate({ template: template }),
          this.resolveContext({ context: context }),
          this.registerHelpers()
        ])
          .then(promiseAllProxy)
          .then(this.registerPartials.bind(this))
          .then(this.compileTemplate.bind(this))
          .then(function (state) {
            return new Promise(function (resolve) {
              resolve(state.result);
            });
          })
          .then(resolve, reject);

      }.bind(this));
    },

  /**
   * Precompiles template and applies wrapper.
   *
   * @method precompile
   * @param {String|Stream} template  Template's filename.
   * @params {String} [wrapper]       Wrapper's filename.
   * @returns {Promise}               Fulfilled with {String} result.
   */
    precompile: function (template, wrapper) {
      return new Promise(function (resolve, reject) {
        Promise.all([
          this.resolveTemplate({
            template: template,
            wrapper: wrapper
          }),
          this.registerHelpers()
        ])
          .then(promiseAllProxy)
          .then(this.registerPartials.bind(this))
          .then(this.precompileTemplate.bind(this))
          .then(this.wrapTemplate.bind(this))
          .then(function (state) {
            return new Promise(function (resolve) {
              resolve(state.result);
            });
          })
          .then(resolve, reject);

      }.bind(this));
    }

  };

  /**
   * Takes the array of values from Promise#all,
   * assigns each to an object value and passes on.
   *
   * @protected
   * @method promiseAllProxy
   * @param {Promise[]} all  The results of Promise#all.
   * @returns {Promise}      Fulfilled with single value.
   */
    function promiseAllProxy(all) {
      var value = {};

      all.forEach(function (item) {
        value = Object.assign(value, item);
      });

      return new Promise(function (resolve) {
        resolve(value);
      });
    }

  /**
   * Detects YAML file by its extension.
   *
   * @protected
   * @method isYaml
   * @param {String} filename  Target filename.
   * @returns {Boolean}        true for yaml files, false for others.
   */
    function isYaml(filename) {
      var ext = path.extname(filename);
      return (ext === '.yml' || ext === '.yaml') ? true : false;
    }

module.exports = Bundlebars;

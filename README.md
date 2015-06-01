# <img src="https://wallarm.com/bundlebars.svg" alt="" width="60" height="52" valign="middle"> Bundlebars

[![Build Status](https://travis-ci.org/wallarm/bundlebars.svg?branch=master)](https://travis-ci.org/wallarm/bundlebars) [![Coverage Status](https://coveralls.io/repos/wallarm/bundlebars/badge.svg?branch=master)](https://coveralls.io/r/wallarm/bundlebars?branch=master) [![Dependencies](https://david-dm.org/wallarm/bundlebars.svg)](https://david-dm.org/wallarm/bundlebars)

> Handlebars templates compiler & bundler

Bundlebars is a helper tool for Handlebars templates engine to compile static templates with JSON or YAML data and precompile templates using wrappers (which is actually Handlebars templates too).

Bundlebars provides you with easy way to build static sites from bunch of templates and effectively deliver precompiled templates to your single page applications, exactly in the way you want it to be.


## Features

  - Compile Handlebars templates to HTML/Markdown/_anystring_ with JSON or YAML data
  - Precompile Handlebars templates and wrap them to AMD/Node/ES6/JST/_your-wrapper_ bundles
  - Easily extensible; Simple Promise-based API; Tested; Covered
  - CLI interface supporting unix pipes
  - Grunt task already included


## Getting Started

Bundlebars itself is a node module. So you certainly need [node.js](http://nodejs.org/) to use it. If you haven't got it yet just choose the best method to install in the [official documentation](https://github.com/joyent/node/wiki/installation) and do it, cause node is awesome!

If you wish to use Bundlebars only with the [Grunt](http://gruntjs.com/) build system, install it through npm locally for project:
`npm install bundlebars --save-dev`

For console fans Bundlebars would make more sense if installed globally. Use npm with __-g__ flag (may require superuser privileges): `npm install -g bundlebars`. Afterwards use `bb` command anywhere to call for Bundlebars executable.


## CLI

The shorthand to Bundlebars executable is `bb`. But `bundlebars` command will also work. Who knows if you like to have original [bb](http://youtu.be/9ukhOAUseKY) in your system for some reason :)

So see the usage help:

```
$ bb --help

Usage: bin/bb [options] templates/*.hbs

Options:
  -o, --out         Output directory                                    [string]
  -c, --compile     Compile template                                   [boolean]
  -p, --precompile  Precompile template                                [boolean]
  -w, --wrapper     Wrapper template                                    [string]
  -d, --data        Data file                                           [string]
  -a, --partials    Partials path
  -e, --helpers     Helpers path                                        [string]
  -O, --options     Compiler options module                             [string]
  -v, --version     Show version number
  -h, --help        Show help
```

Bundlebars CLI is useful in non-JS build environments such as **Make** or **Ant**. And it supports standard unix pipes as well.

By default, `bb` reads template from file or STDIN and writes resulting string to STDOUT. Specify `--out` option to save output to directory.

Take a note about `--options` flag. You could specify path to node module here exporting object that could be passed directly to **Handlebars#compile** or **Handlebars#precompile** methods. For instance:

```
module.exports = {
  knownHelpers: {
    foo: true,
    bar: true
  },
  knownHelpersOnly: true
};
```

See the full list of [supported options](http://handlebarsjs.com/reference.html#base-compile).


## Grunt

Grunt task is already bundled in and ready to use, no need to install anything extra.

Load it from your Gruntfile using following line:

```js
grunt.loadNpmTasks('bundlebars');
```

Then declare new task called `bundlebars` in the config. The following example will work for compiling all __*.hbs__ templates inside __pages/__ directory and place results to __public/__:

```js
bundlebars: {
  static: {
    options: {
      compile: true,
      partials: 'partials/',
      helpers: 'helpers/',
      data: 'data/'
    },

    files: [{
      expand: true,
      cwd: 'pages/',
      src: '*.hbs',
      dest: 'public/',
      ext: '.html'
    }]
  }
}
```

It's very handy to use dynamic files object notation with Bundlebars, [read more](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically) about this.

Available task options:

Option          | Type                  |  Description
----------------|-----------------------|-------------
compile         | `Boolean`             | Compile is the default action
precompile      | `Boolean`             | Switch action to precompile
data            | `Boolean`, `String`   | Lookup for data or use defined path
wrapper         | `String`              | Built-in wrapper name or path to custom wrapper. Built-ins: `amd`, `amd-bundle`, `node`, `node-bundle`, `es6`, `es6-bundle`, `jst`
partials        | `String`              | Directory to lookup partials
helpers         | `String`              | Path to directory with helper modules
noPartials      | `Boolean`             | Do not perform partials lookup (for speed purpose)
compilerOptions | `Object`              | Options that will be passed directly to Handlebars compiler


## API

Bundlebars uses [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) massively. Every API method returns a Promise object which will be resolved with result or rejected with `Error`.

Basically you need only two methods of Bundlebars which are pretty smart and self-explaining:

  - **compile** `filename: String, [data]: String | Object`  
    Takes template filename as first argument, template data (filename or object) as second argument and compiles the template.

  - **precompile** `filename: String, [wrapper]: String`  
    Takes template filename as first argument, wrapper filename as second argument and perform precompiling and wrapping of the template.

Options you could pass to `Bundlebars()` constructor:

Option          | Type      |  Description
----------------|-----------|-------------
partialsDir     | `String`  | Path to partials directory
partialsExt     | `String`  | Partial extension
helpersDir      | `String`  | Path to helpers directory
noPartials      | `Boolean` | No partials switch
compilerOptions | `Object`  | Compiler options

To learn on private API and other internals run `grunt doc` command. Then generated documentation could be found in `doc/` directory of the project.


## Usage Examples

Take a look of what you can do with Bundlebars with this examples and then apply some of yours project-specific fantasy.

First of all, initialize new instance. You can make them as many as you need.

```js
var Bundlebars = require('bundlebars');
var bb = new Bundlebars(params);
```

Compile template with external data and write result to file.

```js
bb.compile('template.html', 'data.json')
  .then(fs.writeFile.bind('result.html'));
```

Compile template with inline data and do something with result string.

```js
bb.compile('template.html', { foo: 'bar' })
  .then(function (result) {
    tidy(result, function (err, tidyresult) {
      fs.writeFile('result.html', tidyresult);
    })
  });
```

Precompile template and all of its partials into AMD bundle.

```js
bb.precompile('template.html', 'amd-bundle')
  .then(fs.writeFile.bind('bundle.js'));
```

Precompile using custom wrapper template.

```js
bb.precompile('template.html', 'supersmartbundle.html')
  .then(fs.writeFile.bind('bundle.js'));
```

Precompile and do any kind of magic right in place.

```js
bb.precompile('template.html')
  .then(function (result) {
    var minresult = UglifyJS.minify(result, { fromString: true });
    fs.writeFile('template.js', minresult);
  });
```

You can see more usage examples in the following projects:

  * [bundlebars-static-site-seed](https://github.com/rd5/bundlebars-static-site-seed)  
    Seed project explaining how to make a simple static site using Bundlebars.

In case you know more projects with Bundlebars used, feel free to update this list!


## Contributing

  Issues and PRs are highly welcomed as well as feature requests!

  If you intend to create a PR, please follow the code style you see and use [JSHint](http://jshint.com/) for code check before committing.

  Some grunt tasks to make the hack easier:

  - `grunt doc` Generates documentation from the sources. Saves to `doc/` directory.
  - `grunt test` Runs Mocha tests and generates coverage report in `coverage/` directory.


## License

This is MIT licensed software created in Wallarm Inc. See [LICENSE](https://raw.githubusercontent.com/wallarm/bundlebars/master/LICENSE) file for details.

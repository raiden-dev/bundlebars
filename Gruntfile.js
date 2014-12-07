module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      doc: 'doc/',
      coverage: 'coverage/'
    },

    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        logo: '../graphics/bundlebars.svg',
        options: {
          paths: 'src/',
          outdir: 'doc/'
        }
      }
    },

    mochaTest: {
      spec: {
        options: {
          reporter: 'spec',
          require: 'blanket'
        },
        src: ['tests/**/*.js']
      },

      coverage: {
        options: {
          reporter: 'html-cov',
          quiet: true,
          captureFile: 'coverage/coverage.html'
        },
        src: ['tests/**/*.js']
      },

      lcov: {
        options: {
          reporter: 'mocha-lcov-reporter',
          quiet: true,
          captureFile: 'coverage/lcov.info'
        },
        src: ['tests/**/*.js']
      }
    },

    coveralls: {
      options: {
        force: true
      },

      all: {
        src: 'coverage/lcov.info'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-coveralls');

  grunt.registerTask('doc', ['clean:doc', 'yuidoc']);
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['test', 'doc']);
  grunt.registerTask('ci', ['default', 'coveralls']);

};

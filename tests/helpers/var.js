/*jshint maxlen:false*/
var Handlebars = require('handlebars'),
    varHelper = require('../../helpers/var');

describe('Built-in helpers', function () {
  var handlebars = null;

  beforeEach(function () {
    handlebars = Handlebars.create();
    varHelper(handlebars);
  });

  describe('var', function () {

    it('should convert minuses to undescores', function () {
      if (handlebars.helpers.var('foo-bar') !== 'foo_bar') {
        throw new Error('unexpected convert result');
      }
    });

  });

});

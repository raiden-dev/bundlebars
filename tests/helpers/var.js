/*jshint maxlen:false*/

var should = require('should'),
    Handlebars = require('handlebars'),
    varHelper = require('../../helpers/var');

describe('Built-in helpers', function () {

  describe('var', function () {
    var handlebars = Handlebars.create();
    varHelper(handlebars);

    it('should convert minuses to undescores', function () {
      handlebars.helpers.var('foo-bar').should.equal('foo_bar');
    });

  });

});

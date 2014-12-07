module.exports = function (Handlebars) {
  Handlebars.registerHelper('var', function (name) {
    return name.replace(/-/g, '_');
  });
};

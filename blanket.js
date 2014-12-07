var path = require('path');

var srcDir = path.join(__dirname, 'src'),
    helpersDir = path.join(__dirname, 'helpers'),
    tasksDir = path.join(__dirname, 'tasks');

require('blanket')({
  pattern: new RegExp([
    srcDir,
    helpersDir,
    tasksDir,

  ].join('|'))
});

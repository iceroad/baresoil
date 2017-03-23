var _ = require('lodash')
  , col = require('./colutil')
  , fmt = require('util').format
  , stripAnsi = require('strip-ansi')
  ;

module.exports = function(prefix) {
  var colors = require('colors');
  return function(dataChunk) {
    var lines = dataChunk.toString('utf-8').split('\n');
    console.log(_.filter(_.map(lines, function(line) {
      line = line.replace(/[\n\r]/mgi, '');
      if (!colors.enabled) {
        line = stripAnsi(line);
      }
      if (line.length) {
        return [prefix, line].join(' ');
      }
    })).join('\n'));
  };
};

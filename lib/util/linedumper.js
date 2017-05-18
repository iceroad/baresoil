const _ = require('lodash'),
  col = require('colors'),
  stripAnsi = require('strip-ansi')
  ;

module.exports = function linedumper(prefix) {
  return (dataChunk) => {
    const lines = dataChunk.toString('utf-8').split('\n');
    console.log(_.filter(_.map(lines, (line) => {
      line = line.replace(/[\n\r]/mgi, '');
      if (!col.enabled) {
        // line = stripAnsi(line);
      }
      if (line.length) {
        return [prefix, line].join(' ');
      }
    })).join('\n'));
  };
};

const _ = require('lodash'),
  col = require('./colutil'),
  Table = require('cli-table2')
;

function cliTable(rows, title) {
  const table = new Table();
  _.forEach(rows, row => table.push(row));
  const titleUnderline = title ? new Array(title.length + 1).join('─') : null;
  return _.filter([
    title ? '\n' : null,
    title ? `  ${col.primary(title)}` : null,
    titleUnderline ? `  ${titleUnderline}` : null,
    table.toString(),
  ]).join('\n');
}

module.exports = cliTable;

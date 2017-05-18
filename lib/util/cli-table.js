const assert = require('assert'),
  /* eslint-disable no-unused-vars */ col = require('colors'),
  stripAnsi = require('strip-ansi'),
  _ = require('lodash')
  ;


module.exports = function cliTable(rows, padding, margin) {
  assert(_.isArray(rows) && rows.length);
  padding = padding || 1;
  margin = margin || 1;

  const cellWidths = _.map(rows, (row) => {
    return _.map(row, (cell) => {
      return stripAnsi(cell).length;
    });
  });

  const colWidths = Array(rows[0].length);
  _.forEach(cellWidths, (row) => {
    _.forEach(row, (cellWidth, idx) => {
      colWidths[idx] = Math.max(cellWidth, colWidths[idx] || 0);
    });
  });
  const numCols = colWidths.length;
  const tableWidth = _.sum(colWidths) + (padding * numCols * 4) + 1;
  const vsep = '│'.gray;
  const padSpaces = Array(padding + 1).join(' ');
  const marginSpaces = Array(margin + 1).join(' ');
  const marginLines = Array(margin).join('\n');  // Note: no + 1
  const hrTop = marginSpaces + (`┌${Array(tableWidth + 1).join('─')}┐`).gray;
  const hrBottom = marginSpaces + (`└${Array(tableWidth + 1).join('─')}┘`).gray;

  return _.flattenDeep([
    marginLines,
    hrTop,
    _.map(rows, (row) => {
      return marginSpaces + vsep + padSpaces + _.map(row, (cell, colIdx) => {
        /* eslint-disable no-mixed-operators */
        const cellpad = Array(colWidths[colIdx] - stripAnsi(cell).length + 1).join(' ');
        return padSpaces + cell + cellpad + padSpaces;
      }).join(padSpaces + vsep + padSpaces) + padSpaces + vsep;
    }),
    hrBottom,
    marginLines,
  ]).join('\n');
};


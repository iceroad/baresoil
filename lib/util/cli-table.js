var assert = require('assert')
  , col = require('colors')
  , stripAnsi = require('strip-ansi')
  , _ = require('lodash')
  ;


module.exports = function(rows, padding, margin) {
  assert(_.isArray(rows) && rows.length);
  padding = padding || 1;
  margin = margin || 1;

  var cellWidths = _.map(rows, function(row) {
    return _.map(row, function(cell) {
      return stripAnsi(cell).length;
    });
  });

  var colWidths = Array(rows[0].length);
  _.forEach(cellWidths, function(row) {
    _.forEach(row, function(cellWidth, idx) {
      colWidths[idx] = Math.max(cellWidth, colWidths[idx] || 0);
    });
  });
  var numCols = colWidths.length;
  var tableWidth = _.sum(colWidths) + padding * numCols * 4 + 1;
  var vsep = '│'.gray;
  var padSpaces = Array(padding + 1).join(' ');
  var marginSpaces = Array(margin + 1).join(' ');
  var marginLines = Array(margin).join('\n');  // Note: no + 1
  var hrTop = marginSpaces + ('┌' + Array(tableWidth + 1).join('─') + '┐').gray;
  var hrBottom = marginSpaces + ('└' + Array(tableWidth + 1).join('─') + '┘').gray;

  return _.flattenDeep([
    marginLines,
    hrTop,
    _.map(rows, function(row) {
      return marginSpaces + vsep + padSpaces + _.map(row, function(cell, colIdx) {
        var cellpad = Array(colWidths[colIdx] - stripAnsi(cell).length + 1).join(' ');
        return padSpaces + cell + cellpad + padSpaces;
      }).join(padSpaces + vsep + padSpaces) + padSpaces + vsep;
    }),
    hrBottom,
    marginLines,
  ]).join('\n');
};


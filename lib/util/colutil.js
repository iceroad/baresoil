/* eslint-disable func-names */
const _ = require('lodash'),
  col = require('colors')
;


exports.action = function (s) {
  return col.yellow(_.toString(s));
};

exports.data = function (s) {
  return col.gray(_.toString(s));
};

exports.error = function (s) {
  return col.bgRed(col.white(_.toString(s)));
};

exports.help = function (s) {
  return col.dim(_.toString(s));
};

exports.bold = function (s) {
  return col.bold(_.toString(s));
};

exports.success = function (s) {
  return col.green(_.toString(s));
};

exports.danger = function (s) {
  return col.red(_.toString(s));
};

exports.mildDanger = function (s) {
  return col.dim(col.red(_.toString(s)));
};

exports.muted = function (s) {
  return col.gray(_.toString(s));
};

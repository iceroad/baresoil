const _ = require('lodash'),
  chalk = require('chalk')
;

const ERROR = '#FF1914';
const PRIMARY = '#ECB500';
const SECONDARY = '#FFD84B';
const SUCCESS = '#008912';

class ColUtil {
  bold(s) {
    return chalk.bold(s);
  }

  error(s) {
    return chalk.hex(ERROR)(`☒ ${s}`);
  }

  starting(s) {
    return chalk.hex(PRIMARY)(`… ${_.toString(s)}`);
  }

  status(s) {
    return chalk.gray(`↳ ${_.toString(s)}`);
  }

  success(s) {
    return chalk.hex(SUCCESS)(`☑ ${_.toString(s)}`);
  }

  thead(s) {
    return chalk.hex(PRIMARY)(s);
  }

  primary(s) {
    return chalk.hex(PRIMARY)(s);
  }

  fatal(s) {
    return `${chalk.hex(ERROR).bold('fatal:')} ${s}`;
  }

  dim(s) {
    return chalk.dim(_.toString(s));
  }

  command(s) {
    return chalk.hex(SECONDARY)(_.toString(s));
  }

  warning(s) {
    return chalk.hex(SECONDARY)(_.toString(s));
  }

  mildDanger(s) {
    return chalk.hex(SECONDARY)(_.toString(s));
  }
}

module.exports = new ColUtil();

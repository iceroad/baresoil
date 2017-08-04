// Console logger with levels and callsite.
const _ = require('lodash'),
  assert = require('assert'),
  callsite = require('./callsite'),
  chalk = require('chalk'),
  fmt = require('util').format
  ;

const NATIVE = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
};

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  warning: 2,
  error: 3,
  fatal: 4,
  quiet: 10,
};

const COLORS = {
  debug: chalk.gray,
  info: chalk.white,
  warn: chalk.yellow,
  warning: chalk.yellow,
  error: chalk.red,
  fatal: chalk.red,
};

class ConsoleLog {
  constructor() {
    this.minLevel_ = (
      process.env.LOG in LEVELS ? LEVELS[process.env.LOG] : LEVELS.info);
  }

  enhance() {
    this.addCallsite_ = true;
    this.addLevel_ = true;
  }

  enable() {
    console.log = this.info.bind(this);
    console.error = this.error.bind(this);
    console.info = this.info.bind(this);
    console.warn = this.warning.bind(this);
    console.warning = this.warning.bind(this);
    console.fatal = this.fatal.bind(this);
    console.debug = this.debug.bind(this);
    return this;
  }

  restore() {
    console.log = NATIVE.log.bind(console);
    console.error = NATIVE.error.bind(console);
    console.warn = NATIVE.warn.bind(console);
  }

  setLevel(level) {
    assert(level in LEVELS, `Unknown logging level "${level}".`);
    this.minLevel_ = LEVELS[level];
  }

  disableLevel() {
    delete this.addLevel_;
  }

  disableCallsite() {
    delete this.addCallsite_;
  }

  enableCallsite() {
    this.addCallsite_ = true;
  }

  testMode() {
    this.enable();
    if (!process.env.LOG) {
      this.restore();
      this.minLevel_ = LEVELS.error;
    } else {
      this.minLevel_ = LEVELS[process.env.LOG];
    }
    return this;
  }

  // Base logging function.
  log(level, ...args) {
    assert(level in LEVELS, `Unknown logging level "${level}".`);
    if (LEVELS[level] < this.minLevel_) return;
    const msg = _.filter([
      this.addLevel_ ? COLORS[level](level) : null,
      this.addCallsite_ ? chalk.gray(`[${callsite().summary}]`) : null,
      COLORS[level](fmt(...args)),
    ]).join(' ');
    NATIVE.log(msg);
  }


  //
  // Stream aliases
  //
  debug(...args) {
    this.log('debug', ...args);
  }


  info(...args) {
    this.log('info', ...args);
  }


  fatal(...args) {
    this.log('fatal', ...args);
  }


  error(...args) {
    this.log('error', ...args);
  }


  warn(...args) {
    this.log('warn', ...args);
  }


  warning(...args) {
    this.log('warn', ...args);
  }
}


module.exports = new ConsoleLog();

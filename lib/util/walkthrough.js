const _ = require('lodash'),
  assert = require('assert'),
  inquirer = require('inquirer')
  ;


function walkthrough(argSpec, args, cb) {
  assert(_.isObject(argSpec));
  assert(_.isObject(args));
  assert(_.isFunction(cb));

  const questions = [];
  const outputs = {};

  _.forEach(argSpec, (argDef) => {
    const argName = _.first(argDef.flags);
    const defVal = argDef.default;
    outputs[argName] = (argName in args) ? args[argName] : defVal;

    if (argDef.prompt !== false) {
      questions.push({
        type: argDef.type || 'input',
        name: argName,
        message: argDef.prompt || argDef.desc,
        validate: argDef.validate,
        default: outputs[argName],
        filter: argDef.filter,
      });
    }
  });

  if (!questions.length) {
    return cb(null, outputs);
  }

  return inquirer.prompt(questions).then((answers) => {
    _.merge(outputs, answers);
    return cb(null, outputs);
  });
}


module.exports = walkthrough;

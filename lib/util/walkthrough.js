const _ = require('lodash'),
  assert = require('assert'),
  inquirer = require('inquirer')
  ;


function walkthrough(argspec, args, cb) {
  assert(_.isObject(argspec));
  assert(_.isObject(args));
  assert(_.isFunction(cb));

  const questions = [];
  const outputs = {};

  try {
    // Iterate over all required parameters.
    _.forEach(argspec, (argDef) => {
      const argName = _.first(argDef.flags);
      assert(_.isFunction(argDef.validator), `Missing validator for ${argName}`);

      // Is this parameter specified as a flag in "args"?
      if (argName in args) {
        const valResult = argDef.validator(args[argName]);
        if (valResult !== true) {
          throw new Error(valResult);
        }
        outputs[argName] = args[argName];
      } else {
        if (argDef.prompt !== false) {
          questions.push({
            type: argDef.type || 'input',
            name: argName,
            message: argDef.prompt || argDef.desc,
            validate: argDef.validator,
          });
        }
      }
    });
  } catch (e) {
    return cb(e);
  }

  if (!questions.length) {
    return cb(null, outputs);
  }

  return inquirer.prompt(questions).then((answers) => {
    _.merge(outputs, answers);
    return cb(null, outputs);
  });
}


module.exports = walkthrough;

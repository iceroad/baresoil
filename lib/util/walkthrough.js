var _ = require('lodash')
  , assert = require('assert')
  , colutil = require('./colutil')
  , inquirer = require('inquirer')
  ;


function walkthrough(argspec, args, cb) {
  assert(_.isObject(argspec));
  assert(_.isObject(args));
  assert(_.isFunction(cb));

  var questions = [];
  var outputs = {};

  try {
    // Iterate over all required parameters.
    _.forEach(argspec, function(argDef) {
      assert(argDef.flags.length === 1, 'Only 1 flag alias allowed');
      var argName = _.first(argDef.flags);
      assert(
          _.isFunction(argDef.validator), 'Missing validator for ' + argName);

      // Is this parameter specified as a flag in "args"?
      if (argName in args) {
        var valResult = argDef.validator(args[argName]);
        if (valResult !== true) {
          throw new Error(colutil.error(valResult));
        }
        outputs[argName] = args[argName];
      } else {
        questions.push({
          type: argDef.type || 'input',
          name: argName,
          message: argDef.prompt || argDef.desc,
          validate: argDef.validator,
        });
      }
    });
  } catch(e) {
    return cb(e);
  }

  if (!questions.length) {
    return cb(null, outputs);
  }

  return inquirer.prompt(questions).then(function(answers) {
    _.merge(outputs, answers);
    return cb(null, outputs);
  });
}


module.exports = walkthrough;

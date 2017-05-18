const _ = require('lodash'),
  assert = require('assert')
;


module.exports = function argparse(argspec, args) {
  assert(_.isObject(argspec), 'require an object argument for "argspec".');
  assert(_.isObject(args), 'require an object argument for "args".');

  //
  // Build a map of all flag aliases.
  //
  const allAliases = _.fromPairs(_.map(_.flatten(_.map(argspec, 'flags')), (flagAlias) => {
    return [flagAlias, true];
  }));

  //
  // Make sure all provided flags are specified in the argspec.
  //
  _.forEach(args, (argVal, argKey) => {
    if (argKey === '_') return;  // ignore positional arguments
    if (!(argKey in allAliases)) {
      throw new Error(`Unknown command-line argument '${argKey}' specified.`);
    }
  });

  //
  // Handle boolean flags specified as string values on the command line.
  //
  args = _.mapValues(args, (flagVal) => {
    if (_.isString(flagVal)) {
      if (flagVal === 'true') {
        return true;
      }
      if (flagVal === 'false') {
        return false;
      }
    }
    return flagVal;
  });

  //
  // For each flag in the argspec, see if any alias of the flag is
  // present in `args`. If it is, then assign that value to *all*
  // aliases of the flag. If it is not present, then assign the
  // default value. Throw on unspecified required flags.
  //
  const finalFlags = {};
  _.forEach(argspec, (aspec, idx) => {
    // Find the first alias of this flag that is specified in args, if at all.
    const foundAlias = _.find(aspec.flags, (flagAlias) => {
      return flagAlias && (flagAlias in args);
    });
    let assignValue = foundAlias ? args[foundAlias] : aspec.defVal;

    // If defVal is an object, then we need to execute a function to get the
    // default value.
    if (_.isObject(assignValue)) {
      assert(
          _.isFunction(assignValue.fn),
          `Argspec entry ${idx} has an invalid 'defVal' property.`);
      assignValue = assignValue.fn.call(argspec);
    }

    if (!_.isUndefined(assignValue)) {
      // Assign value to all aliases of flag.
      _.forEach(aspec.flags, (flagAlias) => {
        finalFlags[flagAlias] = assignValue;
      });
    }
  });

  // Copy positional arguments to finalFlags.
  finalFlags._ = args._;

  return finalFlags;
};

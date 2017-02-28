var _ = require('lodash')
  , fmt = require('util').format
  ;


module.exports = function argparse(argspec, args) {
  if (!_.isObject(argspec)) {
    throw new Error('require an object argument for "argspec".');
  }
  if (!_.isObject(args)) {
    throw new Error('require an object argument for "args".');
  }

  //
  // Build a map of all flag aliases.
  //
  var allAliases = _.fromPairs(_.map(_.flatten(_.map(argspec, 'flags')), function(flagAlias) {
    return [flagAlias, true];
  }));

  //
  // Make sure all provided flags are specified in the argspec.
  //
  _.forEach(args, function(argVal, argKey) {
    if (argKey === '_') return;  // ignore positional arguments
    if (argKey === 'h' || argKey === 'help') return;  // ignore -h and --help
    if (!(argKey in allAliases)) {
      throw new Error(fmt(
          'unknown command-line argument \'%s\' specified.', argKey));
    }
  });

  //
  // Handle boolean flags specified as string values on the command line.
  //
  args = _.mapValues(args, function(flagVal) {
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
  var finalFlags = {};
  _.forEach(argspec, function(aspec) {
    // Find the first alias of this flag that is specified in args, if at all.
    var foundAlias = _.find(aspec.flags, function(flagAlias) {
      return flagAlias && (flagAlias in args);
    });
    var assignValue = foundAlias ? args[foundAlias] : aspec.defVal;

    // If defVal is an object, then we need to execute a function to get the
    // default value.
    if (_.isObject(assignValue)) {
      if (!_.isFunction(assignValue.fn) || !assignValue.desc) {
        throw new Error(fmt(
            'specification has an unrecognized "defVal" entry.'));
      }
      assignValue = assignValue.fn.call(argspec);
    }

    // Assign value to all aliases of flag.
    if (assignValue) {
      _.forEach(aspec.flags, function(flagAlias) {
        finalFlags[flagAlias] = assignValue;
      });
    }
  });

  // Copy positional arguments to finalFlags.
  finalFlags._ = args._;

  // Copy help flags to finalArgs.
  if (args.h || args.help) {
    finalFlags.help = finalFlags.h = true;
  }

  return finalFlags;
};

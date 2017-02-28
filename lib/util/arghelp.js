var _ = require('lodash')
  , col = require('colors')
  , fmt = require('util').format
  , path = require('path')
  ;


module.exports = function help(cmd, args) {
  var argspec = cmd.argspec;
  var cmdName = cmd.name;

  //
  // Help message header.
  //
  var header = [
    cmd.desc.yellow,
    fmt(
        'Usage: '.dim + '%s' + ' [options]'.dim,
        'baresoil ' + cmdName),
  ];

  //
  // Flag details.
  //
  var publicFlags = _.filter(argspec, function(aspec) {
    return !aspec.private;
  });
  var flagAliases = _.map(publicFlags, function(aspec) {
    return _.map(aspec.flags, function(alias) {
      if (!alias) return alias;
      return '-' + (alias.length > 1 ? '-' : '') + alias;
    }).join(', ');
  });
  var flagDescriptions = _.map(publicFlags, 'desc');
  var longestAliasStr = _.max([10, _.max(_.map(flagAliases, _.size))]);

  var flagDetails = _.map(_.zip(
      flagAliases, flagDescriptions, publicFlags), function(ftriple) {
    var flagDefVal = ftriple[2].defVal;

    // Indent multi-line descriptions
    var flagDesc = ftriple[2].desc;
    var descLines = _.map(flagDesc.split('\n'), function(lineStr, idx) {
      return ((idx ? _.padEnd('', longestAliasStr + 5) : '' ) + lineStr);
    });
    var longestDescStr = _.max(_.map(descLines, 'length'));
    descLines = descLines.join('\n');

    if (_.isObject(flagDefVal)) {
      flagDefVal = flagDefVal.value;
    }

    return [
      ' ',
      _.padEnd(ftriple[0], longestAliasStr).yellow,
      ' ',
      descLines,
    ].join(' ') + '\n' + _.filter([
      '   ',
      _.padEnd('', longestAliasStr),
      _.isUndefined(flagDefVal) ? flagDefVal : 'Default: '.gray + (
             flagDefVal.toString().yellow.dim),
    ]).join(' ') + '\n     ' +
    _.padEnd('', longestAliasStr) + _.padEnd('', longestDescStr, '─') + '\n';
  });

  if (flagDetails.length) {
    header.push([
      'Options:'.dim,
      '',
    ].join('\n'));
  }

  return _.concat(header, flagDetails).join('\n') + '\n';
};

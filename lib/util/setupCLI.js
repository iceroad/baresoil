const _ = require('lodash'),
  assert = require('assert'),
  col = require('./colutil'),
  os = require('os'),
  spawnSync = require('child_process').spawnSync,
  stripAnsi = require('strip-ansi')
  ;

//
// Check for latest package version on npm, return warning on outdated version.
//
function ShowVersion(packageJson) {
  const pkgName = packageJson.name;
  let latestVer = spawnSync(`npm show ${pkgName} version`, {
    shell: true,
    stdio: ['inherit', 'pipe', 'inherit'],
  }).stdout;

  let latestVerStr = '';
  if (latestVer) {
    latestVer = latestVer.toString('utf-8').replace(/\s/gm, '');
    if (latestVer !== packageJson.version) {
      const osType = os.type();
      const sudo = (osType === 'Linux' || osType === 'Darwin') ? 'sudo ' : '';
      latestVerStr = `Latest version on npm: ${col.warning(latestVer).bold}
Run "${col.warning(`${sudo}npm install -g ${pkgName}@latest`)}" to upgrade.`;
    } else {
      latestVerStr = `${col.success('up-to-date!')}`;
    }
  }
  return `${packageJson.version}\n${latestVerStr}`;
}

//
// Get list of available sub-commands for package.
//
function GetCommandList(execName, packageJson, Commands) {
  const header = `\
${packageJson.title || packageJson.name || execName} ${packageJson.version}
Usage:    ${execName} ${col.bold('<command>')} [options]
Commands:`;

  const grouped = _.groupBy(Commands, 'helpGroup');
  const sorted = _.mapValues(grouped, arr => _.sortBy(arr, 'helpPriority'));
  const sortedGroups = _.sortBy(sorted, grp => grp[0].helpPriority);
  const longestCmd = _.max(_.map(Commands, cmd => cmd.name.length));
  const commandListStr = _.map(sortedGroups, (helpGroup) => {
    const groupName = _.first(helpGroup).helpGroup;
    return _.flatten([
      `\n  * ${col.primary(groupName)}`,
      _.map(helpGroup, (cmd) => {
        const cmdName = _.padEnd(cmd.name, longestCmd);
        return `    ${col.bold(cmdName)} ${cmd.desc}`;
      }),
    ]).join('\n');
  }).join('\n');

  return `\
${header}
${commandListStr}

Use ${col.bold(`${execName} <command> -h`)} for command-specific help.`;
}

//
// Get command-specific help.
//
function GetCommandUsage(execName, packageJson, cmdSpec, args) {
  const argSpec = cmdSpec.argSpec || [];
  const optStr = argSpec.length ? ' [options]' : '';
  const header = `\
Usage:   ${execName} ${cmdSpec.name}${optStr}
Purpose: ${cmdSpec.desc}
Options: ${argSpec.length ? '' : 'none.'}
`;

  const usageTableRows = _.map(cmdSpec.argSpec, (argDef) => {
    const dashify = flag => (flag.length === 1 ? `-${col.primary(flag)}` : `--${col.primary(flag)}`);
    const lhs = _.map(argDef.flags, dashify).join(', ');
    const rhs = argDef.desc || '';
    return [lhs, rhs, argDef];
  });

  const firstColWidth = _.max(
    _.map(usageTableRows, row => stripAnsi(row[0]).length)) + 1;

  const body = _.map(usageTableRows, (row) => {
    const rhsLines = row[1].split(/\n/mg);
    const firstRhsLine = rhsLines[0];
    rhsLines.splice(0, 1);

    const lhsSpacer = new Array((firstColWidth - stripAnsi(row[0]).length) + 1).join(' ');
    const paddedLhs = `${lhsSpacer}${row[0]}`;
    const firstLine = `${paddedLhs}: ${firstRhsLine}`;

    const skipLeft = new Array(firstColWidth + 1).join(' ');
    const paddedRhs = rhsLines.length ? _.map(rhsLines, line => `${skipLeft}${line}`).join('\n') : '';

    const argDef = row[2];
    let curVal = _.find(argDef.flags, flag => (flag in args ? args[flag] : null));
    if (!curVal) curVal = argDef.defVal || argDef.default || '';
    if (curVal) {
      curVal = `${skipLeft}  ${col.dim('Current:')} "${col.primary(curVal)}"`;
    }
    return _.filter([
      firstLine,
      paddedRhs,
      curVal,
    ]).join('\n');
  }).join('\n\n');

  return `\
${header}
${body}
`;
}

//
// Parse command-line arguments.
//
function ParseArguments(cmd, args) {
  assert(_.isObject(cmd), 'require an object argument for "cmd".');
  assert(_.isObject(args), 'require an object argument for "args".');
  const argSpec = cmd.argSpec || [];
  const cmdName = cmd.name;

  //
  // Build a map of all flag aliases.
  //
  const allAliases = _.fromPairs(_.map(_.flatten(_.map(argSpec, 'flags')), (flagAlias) => {
    return [flagAlias, true];
  }));

  //
  // Make sure all provided flags are specified in the argSpec.
  //
  _.forEach(args, (argVal, argKey) => {
    if (argKey === '_') return; // ignore positional arguments
    if (!(argKey in allAliases)) {
      const d = argKey.length === 1 ? '-' : '--';
      throw new Error(
        `Unknown command-line option "${col.bold(d + argKey)}" specified ` +
        `for command "${col.bold(cmdName)}".`);
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
  // For each flag in the argSpec, see if any alias of the flag is
  // present in `args`. If it is, then assign that value to *all*
  // aliases of the flag. If it is not present, then assign the
  // default value. Throw on unspecified required flags.
  //
  const finalFlags = {};
  _.forEach(argSpec, (aspec, idx) => {
    // Find the first alias of this flag that is specified in args, if at all.
    const foundAlias = _.find(aspec.flags, (flagAlias) => {
      return flagAlias && (flagAlias in args);
    });
    let assignValue = foundAlias ? args[foundAlias] : (aspec.defVal || aspec.default);

    // If defVal is an object, then we need to execute a function to get the
    // default value.
    if (_.isObject(assignValue)) {
      assert(
        _.isFunction(assignValue.fn),
        `Argspec entry ${idx} has an invalid 'defVal'/'default' property.`);
      assignValue = assignValue.fn.call(argSpec);
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
}


//
// CLI setup: help messages, --version check.
// Return parsed command-line arguments with defaults and aliases filled in.
//
function SetupCLI(execName, packageJson, Commands, args) {
  assert(_.isString(execName), 'execName must be a string.');
  assert(_.isObject(packageJson), 'packageJson must be an object.');
  assert(_.isObject(Commands), 'Command collection must be an object.');
  assert(_.isObject(args), 'Arguments must be an object.');

  // --version or -v triggers npm version check.
  if (args.version || args.v) {
    const progName = packageJson.title || packageJson.name || process.argv[0];
    console.log(`${progName} ${ShowVersion(packageJson)}`);
    return process.exit(0);
  }

  // The first positional (non-option) argument is the sub-command to run.
  const cmdName = _.first(args._);
  if (!cmdName) {
    console.error(GetCommandList(execName, packageJson, Commands));
    return process.exit(1);
  }
  const cmd = global.COMMAND = Commands[cmdName];
  if (!cmd) {
    console.error(col.fatal(`Unknown command "${col.bold(cmdName)}".`));
    return process.exit(1);
  }

  // Show command-specific help.
  if (args.help || args.h) {
    console.error(GetCommandUsage(execName, packageJson, cmd, args));
    return process.exit(1);
  }

  // Parse command-line parameters
  try {
    args = ParseArguments(cmd, args);
  } catch (e) {
    console.error(col.fatal(e.message));
    return process.exit(1);
  }

  return args;
}

module.exports = SetupCLI;

#!/usr/bin/env node
//
// Baresoil CLI
//
// Create and develop Baresoil projects, and interact with Baresoil Cloud.
//
const _ = require('lodash'),
  appdata = require('./util/appdata'),
  arghelp = require('./util/arghelp'),
  argparse = require('./util/argparse'),
  col = require('colors'),
  colutil = require('./util/colutil'),
  fs = require('fs'),
  minimist = require('minimist'),
  path = require('path'),
  pkgVer = require('../package.json').version,
  spec = require('./util/spec'),
  runtype = require('runtype'),
  ws = require('ws'),
  BaresoilClient = require('baresoil-client'),
  Commands = require('./commands'),
  ShowVersion = require('./util/version'),
  TypeLibrary = require('./types')
  ;


function ShowCLIUsage() {
  const maxCmdLen = _.max([10, _.max(_.map(Commands, (cmdDef) => {
    return cmdDef.name.length;
  }))]);
  const cmdGroups = _.orderBy(_.toPairs(_.groupBy(Commands, 'helpGroup')),
      pair => _.min(_.map(pair[1], 'helpPriority')));
  const cmdGroupHelp = _.map(cmdGroups, (pair) => {
    const groupName = pair[0];
    const cmdList = pair[1];
    return [
      `  * ${col.yellow(groupName)}`,
      _.map(_.orderBy(_.values(cmdList), 'helpPriority'), (cmdDef) => {
        return `${_.padStart(cmdDef.name, maxCmdLen).bold}: ${cmdDef.desc.dim}`;
      }).join('\n'),
      '',
    ].join('\n');
  }).join('\n');

  console.error([
    (`Baresoil CLI ${pkgVer}: create, develop, and deploy Baresoil` +
     ' projects.').yellow,
    'Usage: '.dim + 'baresoil <command>'.bold + ' [options]'.dim,
    'Commands:'.dim,
    '',
    cmdGroupHelp,
    `Use ${'baresoil <command> -h'.bold}${' to see command-specific help.'.dim}`,
  ].join('\n'));
}


function SetupCLI(args) {
  // Handle special flags.
  if ('colors' in args) {
    col.enabled = !!((args.colors && args.colors !== 'false'));
  }
  if (args.version || args.v) {
    console.log(`Baresoil CLI ${ShowVersion('baresoil')}`);
    return process.exit(0);
  }

  // The first positional (non-option) argument must be a sub-command to run.
  const cmdName = _.first(args._);
  if (!cmdName || !Commands[cmdName]) {
    ShowCLIUsage();
    return process.exit(1);
  }
  const cmd = global.COMMAND = Commands[cmdName];

  // Load types.
  _.extend(runtype.library, TypeLibrary);

  // Parse command line arguments using the sub-command's argspec.
  if (args.help || args.h) {
    console.log(arghelp(cmd, args));
    return process.exit(0);
  }
  try {
    args = argparse(cmd.argspec, args);
  } catch (e) {
    console.error(`Invalid command-line arguments: ${e.message.red}`);
    return process.exit(1);
  }

  // Load authentication data from system's app data location, and write it
  // back to disk on process exit.
  global.APP_DATA = appdata.read();
  process.once('exit', () => {
    appdata.write(global.APP_DATA);
  });

  return args;
}


function main(argv) {
  const args = SetupCLI(argv);
  const appData = global.APP_DATA;
  const cmd = global.COMMAND;

  //
  // Check authentication state.
  // Delete the authentication token if it has expired.
  //
  if (!appData.authToken || appData.authToken.expires <= Date.now()) {
    appData.authToken = {};
  }
  if (cmd.requiresAuth && !appData.authToken.expires) {
    console.error(
        `Not logged into Baresoil Cloud. Please run ${'baresoil login'.green} and try again.`);
    return process.exit(1);
  }
  if (cmd.requiresNoAuth && appData.authToken.expires) {
    console.error(
        `Already have an active logged-in session. Please run ${
        'baresoil logout'.green} to logout first.`);
    return process.exit(1);
  }

  // For certain commands, ensure that the working directory is a valid
  // Baresoil project by ensuring that spec.get() does not throw.
  if (cmd.requiresProject) {
    // spec.get() will throw if its argument is not a valid project.
    try {
      spec.get(process.cwd());
    } catch (e) {
      console.error([
        `Error reading baresoil.json: ${colutil.error(e)}`,
        'This command requires a valid baresoil.json file.',
        '',
        colutil.help(
            'To create a new Baresoil project, run "baresoil init" ' +
            ' in an empty directory.'),
      ].join('\n'));
      return process.exit(1);
    }
  }

  // Load the app token from the current directory if one is found.
  let appToken;
  const appTokenPath = path.join(process.cwd(), '.baresoil-deploy.json');
  try {
    if (fs.existsSync(appTokenPath)) {
      /* eslint-disable global-require, import/no-dynamic-require */
      appToken = require(appTokenPath);
    }
  } catch (e) {
    console.error('Invalid deployment key in file %s.', appTokenPath.yellow);
    return process.exit(1);
  }
  if (cmd.requiresApp && !appToken) {
    console.error(`Error: ${colutil.error('No deployment key found for this project.')}
Ensure that you have registered a subdomain for your project using ${'baresoil register'.yellow}.`);
    return process.exit(1);
  }
  global.DEPLOY_KEY = appToken;


  // Configure a BaresoilClient instance.
  global.WebSocket = ws;
  const bsClient = new BaresoilClient({
    serverUrl: process.env.BS_SERVER || 'wss://baresoil.cloud/__bs__/live',
    failFast: true,
    connect: 'auto',
    verbose: !!process.env.VERBOSE,
    sessionRequest: appData.authToken,
  });
  bsClient.on('error', (err) => {
    console.error(`BaresoilClient error: ${err}`);
    return process.exit(1);
  });
  if (process.env.VERBOSE) {
    bsClient.on('connection_status', (connStatus) => {
      if (connStatus !== 'offline') {
        console.log(`${connStatus}…`.blue.dim);
      }
    });
  }
  if (process.env.DEBUG) {
    bsClient.on('*', (...args) => {
      console.log('baresoil-client:', JSON.stringify(args, null, 2));
    });
  }

  // Hand over process control to sub-command.
  try {
    return cmd.impl(args, bsClient);
  } catch (e) {
    console.error(`Unable to run command "${cmd.name}": ${e.message.bold}`.red);
    if (process.env.VERBOSE) {
      console.error(e.stack.toString().gray);
    }
    return process.exit(2);
  }
}


if (require.main === module) {
  main(minimist(process.argv.slice(2), {
    string: [
      'cellphone',
      'email',
      'password',
    ],
  }));
} else {
  module.exports = main;
}

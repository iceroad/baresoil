#!/usr/bin/env node
//
// Baresoil CLI
//
// Create and develop Baresoil projects, and interact with Baresoil Cloud.
//
var _ = require('lodash')
  , appdata = require('./util/appdata')
  , arghelp = require('./util/arghelp')
  , argparse = require('./util/argparse')
  , col = require('colors')
  , fmt = require('util').format
  , fs = require('fs')
  , minimist = require('minimist')
  , path = require('path')
  , pkgVer = require('../package.json').version
  , spawnSync = require('child_process').spawnSync
  , ws = require('ws')
  , BaresoilClient = require('baresoil-client')
  , Commands = require('./commands')
  ;


function main(args) {
  // The first positional (non-option) argument must be a sub-command to run.
  var cmdName = _.first(args._);
  if (!cmdName || !Commands[cmdName]) {
    if (args.v || args.version) {
      return ShowVersion();
    }
    return ShowCLIUsage();
  }
  var cmd = Commands[cmdName];

  // Load authentication data from system's app data location, and write it
  // back to disk on process exit.
  var appData = global.APP_DATA = appdata.read();
  process.once('exit', function() {
    appdata.write(appData);
  });

  // Parse command line arguments using the sub-command's argspec.
  try {
    args = argparse(cmd.argspec, args);
  } catch(e) {
    console.error(fmt(
        'Invalid command-line arguments: %s', e.message));
    return process.exit(1);
  }
  if (args.help || args.h) {
    console.error(arghelp(cmd, args));
    return process.exit(1);
  }

  // Delete the authentication token if it has expired.
  if (!appData.authToken || appData.authToken.expires <= Date.now()) {
    appData.authToken = {};
  }
  if (cmd.requiresAuth && !appData.authToken.expires) {
    console.error(
        'No authentication token found in credentials file %s. Please run ' +
        'baresoil login'.yellow + ' and try again.', appdata.path.yellow);
    return process.exit(1);
  }
  if (cmd.requiresNoAuth && appData.authToken.expires) {
    console.error(
        'Already have an active logged-in session. Please run ' +
        'baresoil logout'.yellow + ' to logout first.');
    return process.exit(1);
  }

  // Load the app token from the current directory if one is found.
  var appToken;
  var appTokenPath = path.join(process.cwd(), '.baresoil-deploy.json');
  try {
    if (fs.existsSync(appTokenPath)) {
      appToken = require(appTokenPath);
    }
  } catch(e) {
    console.error('Invalid deployment key in file %s.', appTokenPath.yellow);
    return process.exit(1);
  }
  if (cmd.requiresApp && !appToken) {
    console.error(
        'No deployment key found in location %s.', appTokenPath.yellow);
    return process.exit(1);
  }
  global.DEPLOY_KEY = appToken;


  // Configure a BaresoilClient instance.
  global.WebSocket = ws;
  var bsClient = new BaresoilClient({
    serverUrl: process.env.BS_SERVER || 'wss://baresoil.cloud/__bs__/live',
    reconnect: false,
    connect: 'auto',
    verbose: process.env.VERBOSE ? true : false,
    sessionRequest: appData.authToken,
  });
  bsClient.on('error', function(err) {
    console.error(fmt('BaresoilClient error: %s', err));
    return process.exit(1);
  });
  if (process.env.VERBOSE) {
    bsClient.on('connection_status', function(connStatus) {
      if (connStatus !== 'offline') {
        console.log(fmt('%s...', connStatus).blue.dim);
      }
    });
  }
  if (process.env.DEBUG) {
    bsClient.on('*', function() {
      var args = Array.prototype.slice.call(arguments);
      console.log('baresoil-client:', JSON.stringify(args, null, 2));
    });
  }

  // Hand over process control to sub-command.
  try {
    return cmd.impl.call(cmd, args, bsClient);
  } catch(e) {
    console.error(fmt(
        'Unable to run command \'%s\': %s'.red, cmd.name, e.message.bold));
    if (process.env.VERBOSE) {
      console.error(e.stack.toString().gray);
    }
    return process.exit(2);
  }
}


function ShowVersion() {
  var latestVer = spawnSync('npm show baresoil version', {
    shell: true,
    stdio: 'pipe',
  }).stdout;
  var latestVerStr;
  if (latestVer) {
    latestVer = latestVer.toString('utf-8').replace(/\s/gm, '');
    latestVerStr = fmt(' latest npm version: %s', latestVer);
  }
  console.error('Baresoil CLI ' + pkgVer + latestVerStr);
}


function ShowCLIUsage() {
  var maxCmdLen = _.max([10, _.max(_.map(Commands, function(cmdDef) {
    return cmdDef.name.length;
  }))]);
  var cmdGroups = _.orderBy(_.toPairs(_.groupBy(Commands, 'helpGroup')),
      function(pair) {
    return _.min(_.map(pair[1], 'helpPriority'));
  });
  var cmdGroupHelp = _.map(cmdGroups, function(pair) {
    var groupName = pair[0];
    var cmdList = pair[1];
    return [
      fmt('  * %s'.yellow, groupName),
      _.map(_.orderBy(_.values(cmdList), 'helpPriority'), function(cmdDef) {
        return fmt(
            '  %s: %s',
            _.padStart(cmdDef.name, maxCmdLen).bold,
            cmdDef.desc.dim);
      }).join('\n'),
      '',
    ].join('\n');
  }).join('\n');

  console.error([
    ('Baresoil CLI ' + pkgVer + ': create, develop, and deploy Baresoil' +
     ' projects.').yellow,
    'Usage: '.dim + 'baresoil <command>'.bold + ' [options]'.dim,
    'Commands:'.dim,
    '',
    cmdGroupHelp,
    'Use ' + 'baresoil <command> -h'.bold + ' to see command-specific help.'.dim,
  ].join('\n'));
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

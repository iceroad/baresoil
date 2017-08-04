#!/usr/bin/env node
//
// Baresoil CLI
//
// Create and develop Baresoil projects, and interact with Baresoil Cloud.
//
const appdata = require('./util/appdata'),
  setupCLI = require('./util/setupCLI'),
  assert = require('assert'),
  col = require('./util/colutil'),
  clog = require('./util/clog'),
  fs = require('fs'),
  jsonlint = require('jsonlint'),
  minimist = require('minimist'),
  runtype = require('runtype'),
  Commands = require('./commands'),
  PackageJson = require('../package.json'),
  TypeLibrary = require('./types')
  ;


//
// Check authentication state.
// Delete the authentication token if it has expired.
//
function CheckUserSession() {
  assert(global.CLI_DATA, 'require CLI_DATA to be set');
  const cliData = global.CLI_DATA;
  try {
    const activeServer = cliData.activeServer;
    if ((!activeServer.userSession.expires) ||
        activeServer.userSession.expires > Date.now()) {
      global.ACTIVE_SERVER = activeServer;
      global.USER_SESSION = activeServer.userSession;
    } else {
      console.log(col.status(
        `Stored user session for ${col.bold(activeServer.server)} has expired.`));
      delete cliData.activeServer;
    }
  } catch (e) {
    // No user session.
    delete global.USER_SESSION;
    delete global.ACTIVE_SERVER;
  }
}

//
// Check project status in working directory.
//
function CheckProjectStatus() {
  assert(global.CLI_DATA, 'require CLI_DATA to be set');

  // Read baresoil.json from root directory.
  let baresoilJson;
  if (fs.existsSync('baresoil.json')) {
    try {
      const raw = fs.readFileSync('baresoil.json', 'utf-8');
      baresoilJson = jsonlint.parse(raw);
    } catch (e) {
      throw new Error(col.fatal(
        `Cannot load ${col.bold('baresoil.json')}: ${e.message}`));
    }
  }

  // Get server app info for this folder.
  global.CLI_DATA.projects = global.CLI_DATA.projects || {};
  const appConfig = global.CLI_DATA.projects[process.cwd()];

  // Ensure that project configuration exists before setting PROJECT.
  if (baresoilJson) {
    global.PROJECT = {
      appConfig,
      baresoilJson,
    };
  }
}


function main(argv) {
  let args;
  try {
    global.CLI_DATA = appdata.readSync();
    runtype.loadIntoLibrary(TypeLibrary);
    args = setupCLI('baresoil', PackageJson, Commands, argv);
    CheckUserSession();
    CheckProjectStatus();
  } catch (e) {
    console.error(e.message);
    return process.exit(1);
  }

  const project = global.PROJECT;
  const userSession = global.USER_SESSION;
  const cmd = global.COMMAND;

  // Commands can specify whether they need an active server token or explicitly not.
  if (cmd.requiresAuth && !userSession) {
    console.error(col.error(
      `Not logged into any server. Please run ${col.command('baresoil login')} first.`));
    return process.exit(1);
  }
  if (cmd.requiresNoAuth && userSession) {
    console.error(col.error(
      `Already logged in to a server. Please run ${col.command('baresoil logout')} first.`));
    return process.exit(1);
  }

  // For certain commands, ensure that the working directory is a valid
  // Baresoil project by ensuring that spec.get() does not throw.
  if (cmd.requiresProject && !project) {
    console.error(col.fatal(
      'No Baresoil project found in current directory; please re-run in your ' +
      'project\'s root directory.'));
    return process.exit(1);
  }

  // Some commands require the project to have a registered server app.
  if (cmd.requiresApp && (!project || !project.appConfig)) {
    console.error(col.fatal(
      'Project directory is not registered to a server application; ' +
      `please run ${col.command('baresoil register')} in this directory.`));
    return process.exit(1);
  }

  process.once('exit', () => {
    appdata.writeSync(global.CLI_DATA);
  });

  // Hand over process control to sub-command.
  clog.enable();
  try {
    assert(
      typeof cmd.impl === 'string',
      `Command ${cmd.name} has a non-string 'impl' attribute.`);
    cmd.impl = require(cmd.impl);
    return cmd.impl(args);
  } catch (e) {
    console.error(col.fatal(
      `Unable to run command "${col.command(cmd.name)}": ${e.message}`));
    if (process.env.VERBOSE) {
      console.error(e.stack.toString().gray);
    }
    return process.exit(2);
  }
}


if (require.main === module) {
  main(minimist(process.argv.slice(2)));
} else {
  module.exports = main;
}

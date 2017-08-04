const async = require('async'),
  col = require('../../util/colutil'),
  makeClient = require('../../util/makeClient'),
  walkthrough = require('../../util/walkthrough')
  ;


function register(args) {
  const argSpec = this.argSpec;
  const appConfig = global.PROJECT.appConfig;

  if (appConfig) {
    if (appConfig.hostname === args.hostname) {
      console.log(col.success(
        `Project already registered to ${col.bold(args.hostname)}:` +
        `${appConfig.appId}`));
      return process.exit(0);
    }

    console.error(col.fatal(
      `This project directory is already registered to app ${appConfig.appId} at ` +
      `"${col.bold(appConfig.hostname)}"; ` +
      `run ${col.command('baresoil unregister')} to unlink directory from app.`));
    return process.exit(1);
  }

  return async.auto({

    registerArgs(cb) {
      walkthrough(argSpec, args, cb);
    },

    client: ['registerArgs', (deps, cb) => makeClient(global.ACTIVE_SERVER, cb)],

    appConfig: ['registerArgs', 'client', (deps, cb) => {
      const client = deps.client;
      const registerArgs = deps.registerArgs;
      console.log(col.starting(
        `Creating a new application at ${col.bold(registerArgs.hostname)}…`));
      client.run('app.create', {
        hostname: registerArgs.hostname,
        name: registerArgs.name || registerArgs.hostname,
      }, (err, appConfig) => {
        if (err && err.code === 'conflict') {
          console.log(col.starting(
            'Hostname already registered, attempting to retrieve application…'));
          return client.run('app.get', {
            hostname: registerArgs.hostname,
          }, cb);
        }
        return cb(err, appConfig);
      });
    }],

  }, (err, result) => {
    if (err) {
      console.error(col.fatal(err.message));
    } else {
      const appConfig = result.appConfig;
      console.log(col.success(
        `Project linked to application ${col.bold(appConfig.appId)} at ` +
        `${col.bold(appConfig.hostname)}`));

      // Save working directory to authorized project directories.
      const projects = global.CLI_DATA.projects = global.CLI_DATA.projects || {};
      projects[process.cwd()] = appConfig;
    }
    return process.exit(err ? 1 : 0);
  });
}


module.exports = register;

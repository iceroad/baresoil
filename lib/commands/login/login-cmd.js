const async = require('async'),
  col = require('../../util/colutil'),
  makeClient = require('../../util/makeClient'),
  walkthrough = require('../../util/walkthrough')
  ;


function login(args, client, cb) {
  const argSpec = this.argSpec;

  return async.auto({

    loginArgs(cb) {
      return walkthrough(argSpec, args, cb);
    },

    client: ['loginArgs', (deps, cb) => makeClient(deps.loginArgs, cb)],

    userSession: ['loginArgs', 'client', (deps, cb) => {
      const loginArgs = deps.loginArgs;
      const loginReq = {
        username: loginArgs.username,
        password: loginArgs.password,
      };

      console.log(col.starting(
        `Logging into account "${col.bold(loginArgs.username)}" on ` +
        `server ${col.bold(loginArgs.server)}…`));

      return deps.client.run('account.login', loginReq, cb);
    }],

  }, (err, results) => {
    if (err) {
      // Login failed.
      console.error(col.error(`Cannot log in to account: ${err.message}`));
    } else {
      // Save AuthToken to CLI data.
      const servers = global.CLI_DATA.servers = global.CLI_DATA.servers || {};
      const loginArgs = results.loginArgs;
      const endpoint = results.client.getEndpoint();
      servers[endpoint] = {
        server: loginArgs.server,
        endpoint,
        userSession: results.userSession,
        username: loginArgs.username,
      };
      global.CLI_DATA.activeServer = servers[endpoint];

      console.log(col.success(
        `Logged into ${col.bold(loginArgs.server)} as ${col.bold(loginArgs.username)}`));
    }

    if (cb) {
      return cb(err, results.userSession);
    }
    return process.exit(err ? 1 : 0);
  });
}

module.exports = login;

const async = require('async'),
  col = require('../../util/colutil'),
  makeClient = require('../../util/makeClient'),
  walkthrough = require('../../util/walkthrough')
  ;


function signup(args) {
  const argSpec = this.argSpec;

  return async.auto({

    signupArgs(cb) {
      return walkthrough(argSpec, args, cb);
    },

    client: ['signupArgs', (deps, cb) => {
      makeClient(deps.signupArgs, cb);
    }],

    newAccount: ['signupArgs', 'client', (deps, cb) => {
      const client = deps.client;
      const signupArgs = deps.signupArgs;
      console.log(col.starting(
        `Creating a new account on server ${col.bold(signupArgs.server)}`));
      client.run('account.create', {
        username: signupArgs.username,
        password: signupArgs.password,
      }, (err) => {
        if (err) return cb(err);
        console.log(col.success(
          `User account ${col.bold(signupArgs.username)} created.`));
        return cb();
      });
    }],

    userSession: ['signupArgs', 'newAccount', (deps, cb) => {
      const client = deps.client;
      const signupArgs = deps.signupArgs;
      console.log(col.starting(
        `Logging in to account "${signupArgs.username}" on ` +
        `server ${col.bold(signupArgs.server)}`));
      client.run('account.login', {
        username: signupArgs.username,
        password: signupArgs.password,
      }, (err, userSession) => {
        if (err) return cb(err);
        console.log(col.success(
          `Logged into ${col.bold(signupArgs.server)} as ${col.bold(signupArgs.username)}`));

        // Save AuthToken to CLI data.
        const servers = global.CLI_DATA.servers = global.CLI_DATA.servers || {};
        const endpoint = client.getEndpoint();
        servers[endpoint] = {
          server: signupArgs.server,
          endpoint,
          userSession,
          username: signupArgs.username,
        };
        global.CLI_DATA.activeServer = servers[endpoint];

        return cb(null, userSession);
      });
    }],

  }, (err) => {
    if (err) {
      console.error(col.fatal(
        `Cannot create account: ${col.bold(err.message)}`));
    }
    return process.exit(err ? 1 : 0);
  });
}


module.exports = signup;

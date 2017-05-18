const appdata = require('../../util/appdata'),
  async = require('async'),
  colutil = require('../../util/colutil'),
  walkthrough = require('../../util/walkthrough')
  ;


function login(args, client, cb) {
  const argspec = this.argspec;

  return async.auto({

    loginArgs(cb) {
      return walkthrough(argspec, args, cb);
    },

    authToken: ['loginArgs', (deps, cb) => {
      const loginArgs = deps.loginArgs;
      const loginReq = {
        email: loginArgs.email,
        password: loginArgs.password,
      };
      console.log(
          'Logging you into your Baresoil Cloud account...'.bgBlue.white);
      return client.run('account.login', loginReq, (
          err, authToken) => {
        if (err) {
          return cb(new Error(colutil.error(err.message)));
        }
        return cb(null, authToken);
      });
    }],

  }, (err, results) => {
    if (err) {
      // Login failed.
      console.error(
          'Cannot login to Baresoil Cloud account:', err.message);
    } else {
      // Save authentication token to app data.
      global.APP_DATA.authToken = results.authToken;
      console.log(
          'Authentication token saved to credentials store %s',
          appdata.path.yellow);
    }

    if (cb) {
      return cb(err, results.authToken);
    }
    return process.exit(err ? 1 : 0);
  });
}

module.exports = login;

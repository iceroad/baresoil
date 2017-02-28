var _ = require('lodash')
  , appdata = require('../../util/appdata')
  , async = require('async')
  , colutil = require('../../util/colutil')
  , fmt = require('util').format
  , fs = require('fs')
  , inquirer = require('inquirer')
  , json = JSON.stringify
  , path = require('path')
  , walkthrough = require('../../util/walkthrough')
  , validators = require('../../util/validators')
  ;


function login(args, client, cb) {
  var argspec = this.argspec;

  return async.auto({

    loginArgs: function(cb) {
      return walkthrough(argspec, args, cb);
    },

    authToken: ['loginArgs', function(deps, cb) {
      var loginArgs = deps.loginArgs;
      var loginReq = {
        email: loginArgs.email,
        password: loginArgs.password,
      };
      console.log(
          'Logging you into your Baresoil Cloud account...'.bgBlue.white);
      return client.run('account.login', loginReq, function(
          err, authToken) {
        if (err) {
          return cb(new Error(colutil.error(err.message)));
        }
        return cb(null, authToken);
      });
    }],

  }, function(err, results) {
    if (err) {
      // Login failed.
      console.error(
          'Cannot login to Baresoil Cloud account:', err.message);
    } else {
      // Save authentication token to app data.
      APP_DATA.authToken = results.authToken;
      console.log(
          'Authentication token saved to credentials store %s',
          appdata.path.yellow);
    }

    if (cb) {
      return cb(err, results.authToken);
    } else {
      return process.exit(err ? 1 : 0);
    }
  });
}

module.exports = login;

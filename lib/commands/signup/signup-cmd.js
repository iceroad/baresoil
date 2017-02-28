var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , colutil = require('../../util/colutil')
  , fmt = require('util').format
  , fs = require('fs')
  , json = JSON.stringify
  , path = require('path')
  , walkthrough = require('../../util/walkthrough')
  ;


function signup(args, client) {
  var argspec = this.argspec;
  return async.auto({

    signupArgs: function(cb) {
      return walkthrough(argspec, args, cb);
    },

    runCmd: ['signupArgs', function(deps, cb) {
      console.log('Creating a new Baresoil Cloud account...'.bgBlue.white);
      return client.run('account.create', deps.signupArgs, function(err, result) {
        if (err) {
          return cb(new Error(colutil.error(err.message)));
        }
        return cb();
      });
    }],

  }, function(err, results) {
    if (err) {
      console.error('Cannot create Baresoil Cloud account: '.red + err.message);
    } else {
      var signupArgs = results.signupArgs;
      console.log([
        'Account pending verification.'.bgBlue.white,
        'Verification codes were sent to the following places:',
        '',
        fmt('  Email:     %s', signupArgs.email.yellow.bold),
        fmt('  Cellphone: %s', signupArgs.cellphone.yellow.bold),
        '',
        'Please verify your account using "baresoil verify" and the verification'.yellow,
        'codes before attempting to create or deploy apps to Baresoil Cloud.'.yellow,
        '',
        'Type ' + 'baresoil verify -h'.bold + ' for more detailed help.',
      ].join('\n'));
    }
    return process.exit(err ? 1 : 0);
  });
}


module.exports = signup;

var _ = require('lodash')
  , async = require('async')
  , colutil = require('../../util/colutil')
  , fmt = require('util').format
  , fs = require('fs')
  , inquirer = require('inquirer')
  , json = JSON.stringify
  , path = require('path')
  , walkthrough = require('../../util/walkthrough')
  , validators = require('../../util/validators')
  , LoginCmd = require('../login')
  ;


function verify(args, client) {
  var argspec = this.argspec;

  return async.auto({

    verifyArgs: function(cb) {
      return walkthrough(argspec, args, cb);
    },

    password: ['verifyArgs', function(deps, cb) {
      var questions = [
        {
          type: 'password',
          name: 'password',
          message: 'Enter a new password for this account.',
          validate: validators.password,
        },
        {
          type: 'password',
          name: 'password_2',
          message: 'Re-enter password to verify.',
          validate: validators.password,
        },
      ];
      return inquirer.prompt(questions).then(function(answers) {
        if (answers.password !== answers.password_2) {
          return cb(new Error('Entered passwords do not match.'));
        }
        return cb(null, answers.password);
      });
    }],

    runVerify: ['password', function(deps, cb) {
      var verifyArgs = deps.verifyArgs;
      var verifyReq = {
        email: verifyArgs.email,
        smsAuthCode: _.toInteger(verifyArgs.sms_code),
        emailAuthCode: _.toInteger(verifyArgs.email_code),
        password: deps.password,
      };
      console.log(
          'Verifying Baresoil Cloud account "%s"...'.bgBlue.white,
          verifyReq.email.bold);
      return client.run('account.resetPassword', verifyReq, function(
          err, result) {
        if (err) {
          return cb(new Error(colutil.error(err.message)));
        }
        return cb(null, verifyReq);
      });
    }],

    runLogin: ['runVerify', function(deps, cb) {
      var verifyReq = deps.runVerify;
      var loginReq = {
        email: verifyReq.email,
        password: verifyReq.password,
      };
      return LoginCmd.impl.call(LoginCmd, loginReq, client, cb);
    }.bind(this)],

  }, function(err, results) {
    if (err) {
      console.error('Cannot verify Baresoil Cloud account: '.red + err.message);
    } else {
      console.log('Account verified!'.bgGreen.white);
    }
    return process.exit(err ? 1 : 0);
  });
}


module.exports = verify;

const _ = require('lodash'),
  async = require('async'),
  colutil = require('../../util/colutil'),
  inquirer = require('inquirer'),
  walkthrough = require('../../util/walkthrough'),
  validators = require('../../util/validators'),
  LoginCmd = require('../login')
  ;


function verify(args, client) {
  const argspec = this.argspec;

  return async.auto({

    verifyArgs(cb) {
      return walkthrough(argspec, args, cb);
    },

    password: ['verifyArgs', (deps, cb) => {
      const questions = [
        {
          type: 'password',
          name: 'password',
          message: 'Enter a new password:',
          validate: validators.password,
        },
        {
          type: 'password',
          name: 'password_2',
          message: 'Re-enter password to verify:',
          validate: validators.password,
        },
      ];
      return inquirer.prompt(questions).then((answers) => {
        if (answers.password !== answers.password_2) {
          return cb(new Error('Entered passwords do not match.'));
        }
        return cb(null, answers.password);
      });
    }],

    runVerify: ['password', (deps, cb) => {
      const verifyArgs = deps.verifyArgs;
      const verifyReq = {
        email: verifyArgs.email,
        smsAuthCode: _.toInteger(verifyArgs.sms_code),
        emailAuthCode: _.toInteger(verifyArgs.email_code),
        password: deps.password,
      };
      console.log(
          'Verifying Baresoil Cloud account "%s"...'.bgBlue.white,
          verifyReq.email.bold);
      return client.run('account.resetPassword', verifyReq, (err) => {
        if (err) {
          return cb(new Error(colutil.error(err.message)));
        }
        return cb(null, verifyReq);
      });
    }],

    runLogin: ['runVerify', (deps, cb) => {
      const verifyReq = deps.runVerify;
      const loginReq = {
        email: verifyReq.email,
        password: verifyReq.password,
      };
      return LoginCmd.impl.call(LoginCmd, loginReq, client, cb);
    }],

  }, (err) => {
    if (err) {
      console.error('Cannot verify Baresoil Cloud account: '.red + err.message);
    } else {
      console.log('Account verified!'.bgGreen.white);
    }
    return process.exit(err ? 1 : 0);
  });
}


module.exports = verify;

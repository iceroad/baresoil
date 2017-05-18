/* eslint-disable global-require */
const validators = require('../../util/validators');

module.exports = {
  name: 'login',
  desc: 'Log in to your Baresoil Cloud account.',
  helpPriority: 102,
  helpGroup: 'Baresoil Cloud Account',
  requiresNoAuth: true,
  argspec: [
    {
      flags: ['email', 'user'],
      desc: 'Baresoil Cloud username (email address):',
      validator: validators.email,
    },
    {
      flags: ['password'],
      desc: 'Password:',
      type: 'password',
      validator: validators.password,
    },
  ],
  impl: require('./login-cmd.js'),
};

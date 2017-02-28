var validators = require('../../util/validators');

module.exports = {
  name: 'login',
  desc: 'Get an access token for the current project using an email and password.',
  helpPriority: 102,
  helpGroup: 'Baresoil Cloud Account',
  requiresNoAuth: true,
  argspec: [
    {
      flags: ['email'],
      desc: 'Email address for account',
      validator: validators.email,
    },
    {
      flags: ['password'],
      desc: 'Password',
      type: 'password',
      validator: validators.password,
    },
  ],
  impl: require('./login-cmd.js'),
};

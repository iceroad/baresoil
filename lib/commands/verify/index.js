var validators = require('../../util/validators');

module.exports = {
  name: 'verify',
  desc: 'Verify your Baresoil account with email and SMS codes, and set your password.',
  helpPriority: 101,
  helpGroup: 'Baresoil Cloud Account',
  requiresNoAuth: true,
  argspec: [
    {
      flags: ['email'],
      desc: 'Email address for the account.',
      validator: validators.email,
    },
    {
      flags: ['email_code'],
      desc: 'Authentication code sent to registered email address.',
      validator: validators.security_code,
    },
    {
      flags: ['sms_code'],
      desc: 'Authentication code sent to registered cellphone number via SMS.',
      validator: validators.security_code,
    },
  ],
  impl: require('./verify-cmd.js'),
};

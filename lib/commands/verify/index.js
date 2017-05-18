const validators = require('../../util/validators');

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
      prompt: 'Enter email address to verify:',
      validator: validators.email,
    },
    {
      flags: ['email_code'],
      desc: 'Authentication code sent to email address:',
      prompt: 'Email authentication code:',
      validator: validators.security_code,
    },
    {
      flags: ['sms_code'],
      desc: 'Authentication code sent via SMS to cellphone number.',
      prompt: 'SMS authentication code:',
      validator: validators.security_code,
    },
  ],
  impl: require('./verify-cmd.js'),
};

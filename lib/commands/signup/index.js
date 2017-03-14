var validators = require('../../util/validators');

module.exports = {
  name: 'signup',
  desc: 'Sign up for a free Baresoil Cloud account using an email and SMS-capable cellphone number.',
  helpPriority: 100,
  helpGroup: 'Baresoil Cloud Account',
  requiresNoAuth: true,
  argspec: [
    {
      flags: ['email'],
      desc: [
        '* Email address for the new account (must not be previously registered).',
        '* An email authentication code will be sent to this email address.',
      ].join('\n'),
      prompt: 'Enter your email address:',
      validator: validators.email,
    },
    {
      flags: ['cellphone'],
      desc: [
        '* Cellphone number capable of receiving SMS messages for account authentication',
        '  and urgent account alerts.',
        '* A phone authentication code will be sent to this number as an SMS.',
        '* Numbers must be specified in E164 format, starting with a country code.',
        '  Example: +15553013092 (a number in the United States)',
      ].join('\n'),
      prompt: 'Enter an SMS-capable cellphone number starting with the country code (e.g. +15551117777):',
      validator: validators.cellphone,
    },
  ],
  impl: require('./signup-cmd.js'),
};

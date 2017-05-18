const _ = require('lodash'),
  col = require('colors'),
  domains = require('../../util/domains'),
  fmt = require('util').format,
  validators = require('../../util/validators')
  ;

module.exports = {
  name: 'register',
  desc: 'Register a Baresoil Cloud app and choose its subdomain.',
  helpPriority: 200,
  helpGroup: 'Baresoil Cloud App',
  requiresAuth: true,
  requiresProject: true,
  argspec: [
    {
      flags: ['name', 'n'],
      desc: 'A short, private name for this application.',
      prompt: 'Enter a name for this application (private):',
      validator: validators.app_name,
      optional: true,
    },
    {
      flags: ['domain', 'd'],
      prompt: 'Enter a Baresoil Cloud subdomain to register:',
      desc: [
        'An unregistered Baresoil Cloud subdomain to use to serve application.',
        'Must be globally unique, and is subject to availability.',
        '',
        'Choose from the following list of top-level domains:',
        '',
        _.map(domains, (domain) => {
          return fmt('  * %s', domain.green);
        }).join('\n'),
        '',
        `Example: ${col.bold('myapp.baresoil.cloud')} or ${col.bold('kittens.runapp.io')}`,
      ].join('\n'),
      validator: validators.baresoil_subdomain,
    },
  ],
  impl: require('./register-cmd.js'),
};

var col = require('colors')
  , validators = require('../../util/validators')
  ;

module.exports = {
  name: 'register',
  desc: 'Register a Baresoil Cloud app.',
  helpPriority: 200,
  helpGroup: 'Baresoil Cloud App',
  requiresAuth: true,
  argspec: [
    {
      flags: ['name'],
      desc: 'A short, private name for this application',
      prompt: 'Enter a name for this application',
      validator: validators.app_name,
    },
    {
      flags: ['domain'],
      prompt: 'Enter a Baresoil Cloud subdomain to register',
      desc: [
        'An unregistered Baresoil Cloud subdomain to use to serve application.',
        'Must be globally unique, and is subject to availability.',
        '',
        'Choose from the following list of top-level domains:',
        '',
        '  * ' + 'baresoil.cloud'.green,
        '  * ' + 'proj.live'.green,
        '  * ' + 'runapp.io'.green,
        '',
        'Example: ' + 'myapp.proj.live'.bold,
      ].join('\n'),
      validator: validators.fqdn,
    },
  ],
  impl: require('./register-cmd.js'),
};

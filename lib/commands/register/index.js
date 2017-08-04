const fqdnescape = require('../../util/fqdnescape'),
  path = require('path')
;

module.exports = {
  name: 'register',
  desc: 'Register a new application on the server.',
  helpPriority: 200,
  helpGroup: 'App Management',
  requiresAuth: true,
  requiresProject: true,
  argSpec: [
    {
      flags: ['name'],
      desc: 'Internal name for application.',
      prompt: false,
      optional: true,
      filter: inStr => inStr.trim().replace(/\s+/mg, ''),
    },
    {
      flags: ['hostname'],
      desc: 'Domain or subdomain for application',
      filter: inStr => fqdnescape(inStr),
      validate: inStr => (inStr.length ? true : 'Domain too short'),
    },
  ],
  impl: path.join(__dirname, 'register-cmd'),
};

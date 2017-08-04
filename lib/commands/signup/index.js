const os = require('os'),
  path = require('path')
;

module.exports = {
  name: 'signup',
  desc: 'Create a developer account on a Baresoil server.',
  helpPriority: 100,
  helpGroup: 'Server Account',
  requiresNoAuth: true,
  argSpec: [
    {
      flags: ['server'],
      desc: 'Baresoil server URL',
      filter: inStr => inStr.trim().replace(/\s+/mg, ''),
      validate: inStr => (inStr.length ? true : false),
      default: 'ws://localhost:8086',
    },
    {
      flags: ['username'],
      desc: 'Account username',
      filter: inStr => inStr.trim().replace(/\s+/mg, ''),
      validate: inStr => (inStr.length > 2 ? true : 'Username too short.'),
      default: os.userInfo().username,
    },
    {
      flags: ['password'],
      desc: 'Account password',
      type: 'password',
      filter: inStr => inStr.trim(),
      validate: inStr => (inStr.length > 6 ? true : 'Password too short.'),
    },
    {
      flags: ['sysPrefix'],
      prompt: false,
      desc: 'Server\'s system-reserved URL prefix',
      default: '/__bs__',
    },
  ],
  impl: path.join(__dirname, 'signup-cmd'),
};

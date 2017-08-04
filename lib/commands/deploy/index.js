const path = require('path'),
  os = require('os')
;

module.exports = {
  name: 'deploy',
  desc: 'Deploy your application code to the server.',
  helpPriority: 201,
  helpGroup: 'App Management',
  requiresAuth: true,
  requiresApp: true,
  requiresProject: true,
  argSpec: [
    {
      flags: ['message', 'm'],
      desc: 'Comment for this deployment.',
      prompt: false,
      validate: inStr => inStr.length && inStr.length < 256,
      filter: inStr => inStr.trim(),
      default: `${os.userInfo().username}@${os.hostname()} at ${new Date()}`,
    },
    {
      flags: ['extra'],
      desc: 'Optional extra arguments to pass to hook programs.',
      prompt: false,
      validate: inStr => inStr.length && inStr.length < 2048,
      filter: inStr => inStr.trim(),
      optional: true,
    },
  ],
  impl: path.join(__dirname, 'deploy-cmd'),
};

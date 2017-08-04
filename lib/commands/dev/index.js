const path = require('path');

module.exports = {
  name: 'dev',
  desc: 'Starts a local development server in the working directory.',
  helpPriority: 2,
  helpGroup: 'Project',
  argSpec: [
    {
      flags: ['port'],
      desc: 'Port for development HTTP server to listen on.',
      defVal: 8086,
    },
    {
      flags: ['address'],
      desc: 'Network interface to bind to.',
      defVal: '0.0.0.0',
    },
    {
      flags: ['extra'],
      desc: 'Optional extra arguments to pass to project hooks.',
    },
    {
      flags: ['provider', 'p'],
      desc: 'Custom provider specifications.',
    },
    {
      flags: ['config', 'c'],
      desc: 'Configuration overrides file.',
    },
  ],
  impl: path.join(__dirname, 'dev-cmd'),
};

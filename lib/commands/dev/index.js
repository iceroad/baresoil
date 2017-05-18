module.exports = {
  name: 'dev',
  desc: 'Starts the Baresoil Development Environment.',
  helpPriority: 2,
  helpGroup: 'Baresoil Development',
  argspec: [
    {
      flags: ['project'],
      desc: 'Directory containing Baresoil project.',
      defVal: process.cwd(),
    },
    {
      flags: ['port'],
      desc: 'Port for development HTTP server to listen on.',
      defVal: 8086,
    },
    {
      flags: ['data'],
      desc: 'Persistent data directory (defaults to temporary directory).',
    },
    {
      flags: ['address'],
      desc: 'Network interface to bind to.',
      defVal: '0.0.0.0',
    },
    {
      flags: ['colors'],
      desc: 'Colors in console output.',
      defVal: true,
    },
    {
      flags: ['autorefresh'],
      desc: 'Automatically refresh browser clients on local file changes.',
      defVal: true,
    },
    {
      flags: ['extra'],
      desc: 'Optional extra arguments to pass to hooks.',
      defVal: '',
    },
    {
      flags: ['verbose'],
      desc: 'Extra logging for debugging.',
      defVal: false,
    },
    {
      flags: ['quiet'],
      desc: 'No console output at all.',
      defVal: false,
    },
  ],
  impl: require('./dev-cmd.js'),
};

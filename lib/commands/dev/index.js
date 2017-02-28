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
      desc: 'Persistent data directory (created if it does not exist).',
      defVal: 'baresoil_data',
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
  ],
  impl: require('./dev-cmd.js'),
};

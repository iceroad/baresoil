module.exports = {
  name: 'init',
  desc: 'Creates an empty Baresoil project in a directory.',
  helpPriority: 1,
  helpGroup: 'Baresoil Development',
  argspec: [
    {
      flags: ['dir'],
      desc: 'Directory to initialize, defaults to working directory.',
      defVal: process.cwd(),
    },
  ],
  impl: require('./init-cmd.js'),
};

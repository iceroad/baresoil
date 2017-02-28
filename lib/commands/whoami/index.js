module.exports = {
  name: 'whoami',
  desc: 'Shows the currently logged in user.',
  requiresAuth: true,
  helpPriority: 104,
  helpGroup: 'Baresoil Cloud Account',
  argspec: [],
  impl: require('./whoami-cmd.js'),
};

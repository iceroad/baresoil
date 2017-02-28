module.exports = {
  name: 'logout',
  desc: 'Removes all authentication data stored locally.',
  requiresAuth: true,
  helpPriority: 199,
  helpGroup: 'Baresoil Cloud Account',
  argspec: [],
  impl: require('./logout-cmd.js'),
};

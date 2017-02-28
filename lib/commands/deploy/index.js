var validators = require('../../util/validators');

module.exports = {
  name: 'deploy',
  desc: 'Deploy current project to Baresoil Cloud.',
  helpPriority: 201,
  helpGroup: 'Baresoil Cloud App',
  requiresAuth: true,
  requiresApp: true,
  argspec: [
    {
      flags: ['message'],
      desc: 'Private description of deployment.',
      validator: validators.varchar(256),
    },
  ],
  impl: require('./deploy-cmd.js'),
};

var validators = require('../../util/validators');

module.exports = {
  name: 'deploy',
  desc: 'Deploy current project to Baresoil Cloud.',
  helpPriority: 201,
  helpGroup: 'Baresoil Cloud App',
  requiresAuth: true,
  requiresApp: true,
  requiresProject: true,
  argspec: [
    {
      flags: ['message', 'm'],
      desc: 'Private description of deployment.',
      prompt: 'Describe this deployment for your logs:',
      validator: validators.varchar(256),
    },
    {
      flags: ['extra'],
      desc: 'Optional extra arguments to pass to hooks.',
      prompt: false,
      defVal: '',
      validator: validators.varchar(256),
    },
  ],
  impl: require('./deploy-cmd.js'),
};

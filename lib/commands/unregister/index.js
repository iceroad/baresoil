const path = require('path');

module.exports = {
  name: 'unregister',
  desc: 'Unlink current project directory from any registered server apps.',
  requiresAuth: false,
  requiresProject: true,
  requiresApp: true,
  helpPriority: 204,
  helpGroup: 'App Management',
  argSpec: [],
  impl: path.join(__dirname, 'unregister-cmd'),
};

const path = require('path');

module.exports = {
  name: 'status',
  desc: 'Shows details of current project.',
  requiresAuth: false,
  helpPriority: 104,
  helpGroup: 'Project',
  requiresProject: true,
  argSpec: [],
  impl: path.join(__dirname, 'status-cmd'),
};

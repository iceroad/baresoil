const path = require('path');

module.exports = {
  name: 'whoami',
  desc: 'Shows details of current logged in session.',
  requiresAuth: true,
  helpPriority: 104,
  helpGroup: 'Server Account',
  argSpec: [],
  impl: path.join(__dirname, 'whoami-cmd'),
};

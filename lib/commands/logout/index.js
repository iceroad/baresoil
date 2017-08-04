const path = require('path');

module.exports = {
  name: 'logout',
  desc: 'Removes all authentication data stored locally.',
  helpPriority: 199,
  helpGroup: 'Server Account',
  argSpec: [
    {
      flags: ['all'],
      desc: 'Delete all locally stored authentication data for all accounts.',
      default: false,
    },
  ],
  impl: path.join(__dirname, 'logout-cmd'),
};

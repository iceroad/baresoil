const _ = require('lodash');

function logout(args, client, cb) {
  const cliData = global.CLI_DATA;

  delete cliData.activeServer;

  if (args.all) {
    _.forEach(cliData, (v, k) => delete cliData[k]);
  }

  if (cb) return cb();
}

module.exports = logout;

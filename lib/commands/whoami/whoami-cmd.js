var _ = require('lodash')
  , fmt = require('util').format
  , col = require('colors')
  , clitable = require('../../util/cli-table')
  ;


function whoami() {
  var authToken = APP_DATA.authToken;
  console.log(clitable([
    ['Email'.green, authToken.email],
    ['User ID'.green, _.toString(authToken.userId)],
    ['Logged in till'.green, (new Date(authToken.expires)).toString()],
  ]));
  return process.exit(0);
}

module.exports = whoami;

var _ = require('lodash')
  , fmt = require('util').format
  , col = require('colors')
  ;


function whoami() {
  var authToken = APP_DATA.authToken;
  console.log([
    fmt('Email:   '.green + '%s', authToken.email.bold),
    fmt('User ID: '.green + '%s', _.toString(authToken.userId).bold),
    fmt('Expires: '.green + '%s', (new Date(authToken.expires)).toString().bold),
  ].join('\n'));
  return process.exit(0);
}

module.exports = whoami;


function logout(args, client, cb) {
  // Destroy authentication token.
  APP_DATA.authToken = {};
  cb && cb();
}

module.exports = logout;

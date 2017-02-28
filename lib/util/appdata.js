var assert = require('assert')
  , fmt = require('util').format
  , fs = require('fs')
  , path = require('path')
  , os = require('os')
  ;


var APP_DATA_LOCATION;

if (os.type().match(/linux|darwin|freebsd/i)) {
  APP_DATA_LOCATION = path.join(process.env.HOME, '.baresoil-cli');
}

if (os.type().match(/windows/i)) {
  APP_DATA_LOCATION = path.join(process.env.APPDATA, 'baresoil-cli.json');
}

assert(APP_DATA_LOCATION, 'Unknown OS type: ' + os.type())
assert(
    fs.existsSync(path.dirname(APP_DATA_LOCATION)),
    'Invalid user data location: ' + path.dirname(APP_DATA_LOCATION));


var AppData = module.exports = {
  path: APP_DATA_LOCATION,
  read: function() {
    var appData = {};
    try {
      if (fs.existsSync(AppData.path)) {
        appData = JSON.parse(fs.readFileSync(AppData.path, 'utf-8'));
      }
    } catch(e) {
      console.error(fmt(
          'Cannot read authentication store file %s: %s',
          AppData.path, e.message));
      return process.exit(1);
    }
    return appData;
  },
  write: function(val) {
    fs.writeFileSync(AppData.path, JSON.stringify(val, null, 2), 'utf-8');
    if (os.type().match(/linux|darwin|freebsd/i)) {
      fs.chmodSync(AppData.path, 0o600)
    }
  }
};

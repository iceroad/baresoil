//
// Loads credentials from an OS-specific user data folder.
//
const _ = require('lodash'),
  assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  os = require('os')
  ;


//
// Compute system-specific user data folder and filename.
//
let APP_DATA_LOCATION;
const osType = os.type();
if (osType.match(/linux|darwin|freebsd/i)) {
  APP_DATA_LOCATION = path.join(process.env.HOME, '.baresoil-cli');
}
if (osType.match(/windows/i)) {
  APP_DATA_LOCATION = path.join(process.env.APPDATA, 'baresoil-cli.json');
}
assert(APP_DATA_LOCATION, `Unsupported OS type: ${osType}`);
assert(
    fs.existsSync(path.dirname(APP_DATA_LOCATION)),
    `Invalid user data directory: ${path.dirname(APP_DATA_LOCATION)}`);


module.exports = {
  path: APP_DATA_LOCATION,
  read() {
    let appData = {};
    try {
      if (fs.existsSync(APP_DATA_LOCATION)) {
        appData = JSON.parse(fs.readFileSync(APP_DATA_LOCATION, 'utf-8'));
      }
      assert(_.isObject(appData), 'Authentication store is not an object.');
    } catch (e) {
      console.error(
          `Cannot read authentication store file ${APP_DATA_LOCATION}: ${e}`);
      return process.exit(1);
    }
    return appData;
  },
  write(val) {
    fs.writeFileSync(APP_DATA_LOCATION, JSON.stringify(val, null, 2), 'utf-8');
    if (osType.match(/linux|darwin|freebsd/i)) {
      fs.chmodSync(APP_DATA_LOCATION, 0o600);
    }
  },
};

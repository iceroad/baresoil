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
let CLI_DATA_LOCATION;
const osType = os.type();
if (osType.match(/linux|darwin|freebsd/i)) {
  CLI_DATA_LOCATION = path.join(process.env.HOME, '.baresoil-cli.json');
}
if (osType.match(/windows/i)) {
  CLI_DATA_LOCATION = path.join(process.env.APPDATA, 'baresoil-cli.json');
}
assert(CLI_DATA_LOCATION, `Unsupported OS type: ${osType}`);
assert(
  fs.existsSync(path.dirname(CLI_DATA_LOCATION)),
  `Invalid user data directory: ${path.dirname(CLI_DATA_LOCATION)}`);


module.exports = {
  path: CLI_DATA_LOCATION,
  readSync() {
    let appData = {};
    try {
      appData = JSON.parse(fs.readFileSync(CLI_DATA_LOCATION, 'utf-8'));
      assert(_.isObject(appData), 'Authentication store is not an object.');
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(
          `Cannot read authentication store file ${CLI_DATA_LOCATION}: ${e.message}`);
        return process.exit(1);
      }
    }
    return appData;
  },
  writeSync(val) {
    fs.writeFileSync(CLI_DATA_LOCATION, JSON.stringify(val, null, 2), 'utf-8');
    if (osType.match(/linux|darwin|freebsd/i)) {
      fs.chmodSync(CLI_DATA_LOCATION, 0o600);
    }
  },
};

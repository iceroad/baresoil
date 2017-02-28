var _ = require('lodash')
  , fs = require('fs')
  , crypto = require('crypto')
  , os = require('os')
  , path = require('path')
  ;


var CACHE_PATH = path.join(os.tmpdir(), '.baresoil-hashcache.json');

var CACHE = (function loadCache() {
  if (fs.existsSync(CACHE_PATH)) {
    try {
      return require(CACHE_PATH);
    } catch(e) {
      console.warn('Unable to read file hash cache from', CACHE_PATH, e);
      return process.exit(2);
    }
  }
  return {};
})();


process.once('exit', function() {
  if (!_.isEmpty(CACHE)) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(CACHE, null, 2), 'utf-8');
  }
});


module.exports = function(absPath, curMtime) {
  var realPath = fs.realpathSync(absPath);
  var cacheItem = CACHE[realPath];
  if (cacheItem) {
    if (cacheItem.mtime === curMtime) {
      return cacheItem.hash;
    }
  }

  var hasher = crypto.createHash('sha256');
  hasher.update(fs.readFileSync(absPath));
  var hash = hasher.digest('base64');

  CACHE[realPath] = {
    mtime: curMtime,
    hash: hash,
  };

  return hash;
};


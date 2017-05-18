const _ = require('lodash'),
  fmt = require('util').format,
  hashcache = require('./hashcache'),
  path = require('path'),
  walk = require('walk')
  ;


function fstate(dir, cb) {
  const files = [];
  const errors = [];
  const walker = walk.walk(dir, {
    followLinks: true,
  });

  walker.on('file', (root, fileStat, next) => {
    // Filter out files in the source tree.
    if (fileStat.name[0] !== '.' &&        // no hidden files
        fileStat.type === 'file') {        // only files
      // Assemble return structure.
      const absPath = path.resolve(path.join(root, fileStat.name));
      const relPath = path.relative(dir, absPath);
      files.push({
        absPath,
        relPath,
        size: fileStat.size,
        mtime: fileStat.mtime.getTime(),
        name: fileStat.name,
        hash: hashcache(absPath, fileStat.mtime.getTime()),
      });
    }
    return next();
  });

  walker.on('errors', (root, nodeStatsArray, next) => {
    const firstErr = nodeStatsArray[0];
    errors.push(fmt(
      'File: %s, Error: "%s"',
      firstErr.error.path, firstErr.error.code));
    return next();
  });

  walker.once('end', () => {
    return cb(null, _.sortBy(files, 'relPath'));
  });
}


module.exports = fstate;

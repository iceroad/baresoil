const _ = require('lodash'),
  path = require('path'),
  walk = require('walk')
  ;


function dstate(dir, cb) {
  const files = [];
  const errors = [];
  const walker = walk.walk(dir, {
    followLinks: true,
  });

  walker.on('directory', (root, dirStat, next) => {
    const absPath = path.join(root, dirStat.name);
    const relPath = path.relative(dir, absPath);
    files.push({
      absPath,
      relPath,
      mtime: dirStat.mtime,
      name: dirStat.name,
      type: 'dir',
    });
    return next();
  });

  walker.on('file', (root, fileStat, next) => {
    // Assemble return structure.
    const absPath = path.join(root, fileStat.name);
    const relPath = path.relative(dir, absPath);
    files.push({
      absPath,
      relPath,
      size: fileStat.size,
      mtime: fileStat.mtime,
      name: fileStat.name,
      type: 'file',
    });
    return next();
  });

  walker.on('errors', (root, nodeStatsArray, next) => {
    const firstErr = nodeStatsArray[0];
    errors.push(`File: ${firstErr.error.path}, error: "${firstErr.error.code}"`);
    return next();
  });

  walker.once('end', () => {
    return cb(null, _.sortBy(files, 'type'), errors);
  });
}


module.exports = dstate;

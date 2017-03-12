var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , clitable = require('../../util/cli-table')
  , col = require('colors')
  , fmt = require('util').format
  , fs = require('fs')
  , fstate = require('../../util/fstate')
  , fse = require('fs-extra')
  , json = JSON.stringify
  , path = require('path')
  , spec = require('../../util/spec')
  ;


function init(args) {
  var targetDir = path.resolve(args.dir) || process.cwd();
  var templatesRoot = path.join(__dirname, '../../../templates');
  var templateName = 'basic';  // Only a single template for now.
  var srcDir = path.join(templatesRoot, templateName);

  return async.auto({
    // Template directory must exist. Walk it to get a list of files to copy.
    srcFiles: function(cb) {
      if (!fs.existsSync(srcDir)) {
        return cb(new Error(fmt(
            'Directory "%s" does not exist.'.red, srcDir.bold)));
      }
      return fstate(srcDir, cb);
    },

    // Target directory must be empty. Do not pollute existing directories on
    // fat fingering commands in the shell.
    targetDir: function(cb) {
      if (!fs.existsSync(targetDir)) {
       return cb(new Error(fmt(
          'Directory "%s" does not exist.'.red, targetDir.bold)));
      }
      if (fs.readdirSync(targetDir).length && !args.force) {
        return cb(new Error(fmt(
            ('Directory "%s" is not empty, specify ' + '--force '.bold +
            'to initialize anyway.').red, targetDir.bold)));
      }
      return cb(null, targetDir);
    },

    // Copy template files over.
    doCopy: ['srcFiles', 'targetDir', function(deps, cb) {
      console.log(fmt(
          'Creating a new Baresoil project in "%s"...'.yellow, targetDir.bold));
      return async.parallelLimit(_.map(deps.srcFiles, function(fileInfo) {
        return function(cb) {
          console.log('Copying %s'.gray, fileInfo.relPath.yellow);
          var destPath = path.join(targetDir, fileInfo.relPath);
          fse.ensureDirSync(path.dirname(destPath));
          return fse.copy(fileInfo.absPath, destPath, cb);
        };
      }), 5, cb);
    }],

    // Create Development Environment temporary data directory.
    tempDataRoot: ['doCopy', function(deps, cb) {
      // Create data directory.
      var dataRoot = path.join(targetDir, 'baresoil_data');
      console.log('Creating %s'.gray, 'baresoil_data'.yellow);
      fse.ensureDirSync(dataRoot);
      return cb();
    }],

  }, function(err) {
    if (err) {
      console.error(err.message);
      return process.exit(1);
    }

    console.log('Done.'.green);
    console.log(clitable([
      [
        'Next Steps'.dim,
        'Start the Development Environment with ' + 'baresoil dev'.yellow.bold
      ],
      [
        'Documentation'.dim,
        'https://docs.baresoil.com/'
      ],
    ]));

    return process.exit(0);
  });
}


module.exports = init;

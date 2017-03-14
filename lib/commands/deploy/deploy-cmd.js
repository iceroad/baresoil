var _ = require('lodash')
  , async = require('async')
  , colutil = require('../../util/colutil')
  , fmt = require('util').format
  , fs = require('fs')
  , fstate = require('../../util/fstate')
  , inquirer = require('inquirer')
  , json = JSON.stringify
  , path = require('path')
  , spec = require('../../util/spec')
  , walkthrough = require('../../util/walkthrough')
  , validators = require('../../util/validators')
  ;


function deploy(args, client) {
  var argspec = this.argspec;

  // Allow empty deploy messages.
  if (_.isBoolean(args.message) || _.isBoolean(args.m)) {
    args.message = args.m = '';
  }

  //
  // Asynchronous stages.
  //
  return async.auto({
    deployArgs: function(cb) {
      return walkthrough(argspec, args, cb);
    },

    //
    // Get client and server directory manifests.
    //
    manifests: ['deployArgs', function(deps, cb) {
      console.log(
          'Deploying app to %s...'.gray, global.DEPLOY_KEY.domain.yellow);
      try {
        var projSpec = spec.get(process.cwd());
      } catch(e) { return cb(e); }
      return async.auto({
        client: fstate.bind({}, projSpec.client.path),
        server: fstate.bind({}, projSpec.server.path),
      }, cb);
    }],

    //
    // Ensure that the project manifests are valid.
    //
    validity: ['manifests', function(deps, cb) {
      var clientManifest = deps.manifests.client;
      var serverManifest = deps.manifests.server;
      var clientSize = _.sum(_.map(clientManifest, 'size'));
      var serverSize = _.sum(_.map(serverManifest, 'size'));
      var totalSize = clientSize + serverSize;
      return cb(null, {
        metrics: {
          clientSize: clientSize,
          serverSize: serverSize,
          clientFiles: clientManifest.length,
          serverFiles: serverManifest.length,
        },
      });
    }],

    //
    // Set up a server-side stage.
    //
    stage: ['deployArgs', 'manifests', 'validity', function(deps, cb) {
      var stageReq = {
        message: deps.deployArgs.message,
        deployKey: global.DEPLOY_KEY,
        metrics: deps.validity.metrics,
      };
      return client.run('deploy.stage', stageReq, cb);
    }],

    //
    // We have server-side package manifests. Compare to local versions and
    // execute mutations required to synchronize.
    //
    mutations: ['stage', function(deps, cb) {
      var clientOps = ComputeChanges(
          deps.manifests.client,        // Local manifest
          deps.stage.clientManifest);   // Remote manifest
      var serverOps = ComputeChanges(
          deps.manifests.server,        // Local manifest
          deps.stage.serverManifest);   // Remote manifest
      return async.auto({
        client: GenMutation('client', clientOps, client),
        server: GenMutation('server', serverOps, client),
      }, cb);
    }],

    //
    // Commit the deployment. Last chance to bail out without impact.
    //
    commit: ['mutations', function(deps, cb) {
      var mutations = deps.mutations;
      var numMutations = _.sum([
        _.size(mutations.client.deletes),
        _.size(mutations.client.uploads),
        _.size(mutations.server.deletes),
        _.size(mutations.server.uploads),
      ]);
      if (numMutations)  {
        return client.run('deploy.commit', function(err) {
          if (err) return cb(err);
          console.log(
            'Deployed project to '.green +
            global.DEPLOY_KEY.domain.yellow.bold);
          return cb();
        });
      } else {
        return client.run('deploy.abort', function(err) {
          if (err) return cb(err);
          console.log('Project is up-to-date, no changes to commit.'.green);
          return cb();
        });
      }
    }],

  }, function(err, result) {
    if (err) {
      console.error(err.message.red);
    }
    return process.exit(err ? 2 : 0);
  });

  function GenMutation(component, opSet, client) {
    var deleteOps = opSet.remoteDelete;
    var uploadOps = opSet.localUpload;
    return function(cb) {
      return async.auto({
        deletes: function(cb) {
          if (!deleteOps) return cb();
          var runners = _.filter(_.map(deleteOps, MakeDeleteOp));
          return async.parallelLimit(runners, 5, cb);
        },
        uploads: ['deletes', function(deps, cb) {
          if (!uploadOps) return cb();
          var runners = _.filter(_.map(uploadOps, MakeUploadOp));
          return async.parallelLimit(runners, 5, cb);
        }],
      }, cb);
    };

    function MakeDeleteOp(relPath) {
      return function(cb) {
        var arg = {
          component: component,
          path: relPath,
        };
        console.log('Deleting'.red, fmt('%s/%s', component, relPath).red.dim);
        return client.run('deploy.remove', arg, cb);
      };
    }

    function MakeUploadOp(fstat) {
      // Disallow empty client-side files, since it does not make sense to
      // serve them.
      if (component === 'client' && !fstat.size) {
        console.log(fmt(
            'Skipping empty client file %s/%s'.gray, component, fstat.relPath));
        return;
      }

      // Allow empty server-side files, mainly for Python's __init__.py.
      return function(cb) {
        var arg = {
          component: component,
          path: fstat.relPath,
          size: fstat.size,
          mtime: fstat.mtime,
          hash: fstat.hash,
          data: fstat.size ? fs.readFileSync(fstat.absPath).toString('base64') : '',
        };
        console.log(fmt(
            'Uploading %s'.gray, fstat.relPath.yellow));
        return client.run('deploy.upload', arg, cb);
      };
    }
  }
}


function ComputeChanges(localFileList, remoteFileManifest) {
  var localManifest = _.keyBy(localFileList, 'relPath');
  var ops = {
    localUpload: [],
    remoteDelete: [],
  };
  _.forEach(localManifest, function(fstat, localFilePath) {
    if (localFilePath in remoteFileManifest) {
      // Existing file, check hash.
      if (fstat.hash !== remoteFileManifest[localFilePath].hash) {
        // Files have changed, add a delete and upload op.
        ops.remoteDelete.push(localFilePath);
        ops.localUpload.push(fstat);
      }
    } else {
      // New file.
      ops.localUpload.push(fstat);
    }
  });
  _.forEach(remoteFileManifest, function(fstat, remoteFilePath) {
    if (!(remoteFilePath in localManifest)) {
      ops.remoteDelete.push(remoteFilePath);
    }
  });
  return ops;
}


module.exports = deploy;

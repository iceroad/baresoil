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
      console.log('Starting app deployment to Baresoil Cloud...'.gray);
      try {
        var projSpec = spec.get(process.cwd());
      } catch(e) { return cb(e); }
      return async.auto({
        client: fstate.bind({}, projSpec.client.path),
        server: fstate.bind({}, projSpec.server.path),
      }, cb);
    }],

    //
    // Set up a server-side stage.
    //
    stage: ['deployArgs', 'manifests', function(deps, cb) {
      var stageReq = {
        message: deps.deployArgs.message,
        deployKey: global.DEPLOY_KEY,
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
      return client.run('deploy.commit', cb);
    }],

  }, function(err, result) {
    if (err) {
      console.error(err.message.red);
      return process.exit(2);
    } else {
      var mutations = result.mutations;
      var numMutations = _.sum([
        _.size(mutations.client.deletes),
        _.size(mutations.client.uploads),
        _.size(mutations.server.deletes),
        _.size(mutations.server.uploads),
      ]);
      console.log(
          'Commit has %s mutations.'.gray, _.toString(numMutations).bold);
      console.log(
          'Deployed project to '.green + global.DEPLOY_KEY.domain.yellow.bold);
      return process.exit(0);
    }
  });


  function GenMutation(component, opSet, client) {
    var deleteOps = opSet.remoteDelete;
    var uploadOps = opSet.localUpload;
    return function(cb) {
      // Run all uploads *after* deletes to handle changes.
      return async.auto({
        deletes: function(cb) {
          if (!deleteOps) return cb();
          // TODO: generate deletes.
          return cb();
        },
        uploads: ['deletes', function(deps, cb) {
          if (!uploadOps) return cb();
          var runners = _.map(uploadOps, MakeUploadOp);
          return async.parallelLimit(runners, 5, cb);
        }],
      }, cb);
    };

    function MakeUploadOp(fstat) {
      return function(cb) {
        var arg = {
          component: component,
          path: fstat.relPath,
          size: fstat.size,
          hash: fstat.hash,
          mtime: fstat.mtime,
          data: fs.readFileSync(fstat.absPath).toString('base64'),
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

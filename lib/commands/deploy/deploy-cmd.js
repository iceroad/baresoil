/* eslint-disable no-use-before-define */
const _ = require('lodash'),
  async = require('async'),
  col = require('../../util/colutil'),
  fmt = require('util').format,
  fs = require('fs'),
  fstate = require('../../util/fstate'),
  linedumper = require('../../util/linedumper'),
  spawn = require('child_process').spawn,
  spec = require('../../util/spec'),
  walkthrough = require('../../util/walkthrough')
  ;


function deploy(args, client) {
  const argspec = this.argspec;
  const baresoilJson = spec.get(process.cwd());

  // Allow empty deploy messages.
  if (_.isBoolean(args.message) || _.isBoolean(args.m)) {
    args.message = args.m = '';
  }

  //
  // Asynchronous stages.
  //
  return async.auto({
    deployArgs(cb) {
      return walkthrough(argspec, args, cb);
    },

    //
    // Run build hooks if specified.
    //
    buildHooks: ['deployArgs', (deps, cb) => {
      const buildHooks = _.filter(_.get(baresoilJson, 'client.hooks', []),
          (hook) => {
            return hook.type === 'build';
          });
      if (!buildHooks.length) {
        // No hooks to execute, continue.
        return cb();
      }

      //
      // Execute any "build" client hooks found in baresoil.json
      //
      const runners = _.map(buildHooks, (hook) => {
        return (cb) => {
          // Pass extra arguments to build hook, if specified.
          let cmd = hook.command;
          if (args.extra) {
            cmd += ` ${args.extra}`;
          }
          console.log(
              '%s[%s] %s', col.action('spawning'), col.data(hook.name),
              col.data(cmd));
          const child = spawn(cmd, {
            shell: true,
            cwd: hook.workingDir,
            stdio: 'pipe',
          });
          child.stdout.on('data', linedumper(
              fmt('%s[%s]', col.action('stdout'), col.data(hook.name))));
          child.stderr.on('data', linedumper(
              fmt('%s[%s]', col.error('stderr'), col.data(hook.name))));
          child.once('exit', (code, signal) => {
            if (code || signal) {
              return cb(new Error(fmt('%s[%s] code=%s signal=%s',
                  col.error('EXIT'), col.data(hook.name),
                  col.data(code), col.data(signal))));
            }
            return cb();
          });
        };
      });
      console.log(col.success(
          `Running ${runners.length} build hooks found in baresoil.json...`));
      return async.series(runners, cb);
    }],

    //
    // Get client and server directory manifests.
    //
    manifests: ['buildHooks', (deps, cb) => {
      console.log(
          col.action('Deploying app to %s...'),
          col.bold(global.DEPLOY_KEY.domain));
      return async.auto({
        client: fstate.bind({}, baresoilJson.client.path),
        server: fstate.bind({}, baresoilJson.server.path),
      }, cb);
    }],

    //
    // Ensure that the project manifests are valid.
    //
    validity: ['manifests', (deps, cb) => {
      const clientManifest = deps.manifests.client;
      const serverManifest = deps.manifests.server;
      const clientSize = _.sum(_.map(clientManifest, 'size'));
      const serverSize = _.sum(_.map(serverManifest, 'size'));
      return cb(null, {
        metrics: {
          clientSize,
          serverSize,
          clientFiles: clientManifest.length,
          serverFiles: serverManifest.length,
        },
      });
    }],

    //
    // Set up a server-side stage.
    //
    stage: ['deployArgs', 'manifests', 'validity', (deps, cb) => {
      const stageReq = {
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
    mutations: ['stage', (deps, cb) => {
      const clientOps = ComputeChanges(
          deps.manifests.client,        // Local manifest
          deps.stage.clientManifest);   // Remote manifest
      const serverOps = ComputeChanges(
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
    commit: ['mutations', (deps, cb) => {
      const mutations = deps.mutations;
      const numMutations = _.sum([
        _.size(mutations.client.deletes),
        _.size(mutations.client.uploads),
        _.size(mutations.server.deletes),
        _.size(mutations.server.uploads),
      ]);
      if (numMutations) {
        return client.run('deploy.commit', (err) => {
          if (err) return cb(err);
          console.log(fmt(
            col.success('Deployed project to %s'),
            col.bold(global.DEPLOY_KEY.domain)));
          return cb();
        });
      }
      return client.run('deploy.abort', (err) => {
        if (err) return cb(err);
        console.log(col.success(
              'Project is up-to-date, no changes to commit.'));
        return cb();
      });
    }],

  }, (err) => {
    if (err) {
      console.error(err.message.red);
    }
    return process.exit(err ? 2 : 0);
  });

  function GenMutation(component, opSet, client) {
    const deleteOps = opSet.remoteDelete;
    const uploadOps = opSet.localUpload;
    return (cb) => {
      return async.auto({
        deletes(cb) {
          if (!deleteOps) return cb();
          const runners = _.filter(_.map(deleteOps, MakeDeleteOp));
          return async.parallelLimit(runners, 5, cb);
        },
        uploads: ['deletes', (deps, cb) => {
          if (!uploadOps) return cb();
          const runners = _.filter(_.map(uploadOps, MakeUploadOp));
          return async.parallelLimit(runners, 5, cb);
        }],
      }, cb);
    };

    function MakeDeleteOp(relPath) {
      return (cb) => {
        const arg = {
          component,
          path: relPath,
        };
        console.log(
            col.mildDanger('Deleting'),
            col.bold(col.mildDanger(fmt('%s/%s', component, relPath))));
        return client.run('deploy.remove', arg, cb);
      };
    }

    function MakeUploadOp(fstat) {
      // Disallow empty client-side files, since it does not make sense to
      // serve them.
      if (component === 'client' && !fstat.size) {
        console.log(fmt(col.muted(
            'Skipping empty client file %s/%s'), component, fstat.relPath));
        return;
      }

      // Get caching policy for path.
      const cachePolicy = GetCachePolicyForFile(fstat.relPath);
      const cacheMs = _.get(cachePolicy, 'maxAge', 0) * 1000;

      // Allow empty server-side files, mainly for Python's __init__.py.
      return (cb) => {
        const arg = {
          component,
          path: fstat.relPath,
          size: fstat.size,
          mtime: fstat.mtime,
          hash: fstat.hash,
          data: fstat.size ? fs.readFileSync(fstat.absPath).toString('base64') : '',
          cacheMs,
        };
        console.log(
            col.action('Uploading'),
            col.bold(col.action(fmt('%s/%s', component, fstat.relPath))),
            cacheMs ? `max-age: ${Math.floor(cacheMs / 1000)} sec` : '');
        return client.run('deploy.upload', arg, cb);
      };
    }
  }

  function ComputeChanges(localFileList, remoteFileManifest) {
    const localManifest = _.keyBy(localFileList, 'relPath');
    const ops = {
      localUpload: [],
      remoteDelete: [],
    };
    _.forEach(localManifest, (fstat, localFilePath) => {
      const cachePolicy = GetCachePolicyForFile(localFilePath);

      if (localFilePath in remoteFileManifest) {
        // Existing file, check hash and cache policy.
        const remoteManifest = remoteFileManifest[localFilePath];
        const contentsChanged = fstat.hash !== remoteManifest.hash;
        const expiryChanged = (cachePolicy &&
              remoteManifest.cacheMs !== cachePolicy.maxAge * 1000);
        if (contentsChanged || expiryChanged) {
          // Files have changed, add a delete and upload op.
          ops.localUpload.push(fstat);
        }
      } else {
        // New file.
        ops.localUpload.push(fstat);
      }
    });
    _.forEach(remoteFileManifest, (fstat, remoteFilePath) => {
      if (!(remoteFilePath in localManifest)) {
        ops.remoteDelete.push(remoteFilePath);
      }
    });
    return ops;
  }

  function GetCachePolicyForFile(filePath) {
    const cachePolicies = _.get(baresoilJson, 'client.cachePolicies', []);
    return _.find(cachePolicies, (policy) => {
      if (_.isString(policy.match)) {
        policy.match = new RegExp(policy.match);
      }
      return policy.match.test(filePath);
    });
  }
}


module.exports = deploy;

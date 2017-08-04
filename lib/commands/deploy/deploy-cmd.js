/* eslint-disable no-use-before-define */
const _ = require('lodash'),
  async = require('async'),
  col = require('../../util/colutil'),
  fs = require('fs'),
  fstate = require('../../util/fstate'),
  json = JSON.stringify,
  linedumper = require('../../util/linedumper'),
  makeClient = require('../../util/makeClient'),
  spawn = require('child_process').spawn,
  walkthrough = require('../../util/walkthrough')
  ;


function deploy(args) {
  const argSpec = this.argSpec;
  const appConfig = global.PROJECT.appConfig;
  const baresoilJson = global.PROJECT.baresoilJson;

  //
  // Asynchronous stages.
  //
  return async.auto({
    deployArgs(cb) {
      return walkthrough(argSpec, args, cb);
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

      // Execute all client "build" hooks listed in baresoil.json.
      const runners = _.map(buildHooks, (hook) => {
        return (cb) => {
          // Pass extra arguments to build hook, if specified.
          let cmd = hook.command;
          if (args.extra) {
            cmd += ` ${args.extra}`;
          }
          console.log(col.starting(
            `starting ${col.bold(hook.name)}: ${col.dim(cmd)}`));
          const child = spawn(cmd, {
            shell: true,
            cwd: hook.workingDir,
            stdio: 'pipe',
          });
          child.stdout.on('data', linedumper(`stdout: ${col.status(hook.name)}`));
          child.stderr.on('data', linedumper(`stderr: ${col.status(hook.name)}`));
          child.once('exit', (code, signal) => {
            if (code || signal) {
              return cb(new Error(
                `Hook ${hook.name} exited with code=${code}, signal=${signal}.`));
            }
            return cb();
          });
        };
      });
      console.log(col.starting(
        `Running ${runners.length} build hooks found in baresoil.json`));
      return async.series(runners, cb);
    }],

    //
    // Get local client and server directory manifests.
    //
    manifests: ['buildHooks', (deps, cb) => {
      console.log(col.starting('Reading project server and client directories'));
      return async.auto({
        client: cb => fstate(baresoilJson.client.path, cb),
        server: cb => fstate(baresoilJson.server.path, cb),
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
      console.debug(`Server project size is ${Math.ceil(serverSize / 1024)} kb`);
      console.debug(`Client project size is ${Math.ceil(clientSize / 1024)} kb`);
      return cb();
    }],

    //
    // Create client.
    //
    client: ['validity', (deps, cb) => makeClient(global.ACTIVE_SERVER, cb)],

    //
    // Set up a server-side stage.
    //
    stage: ['deployArgs', 'manifests', 'validity', 'client', (deps, cb) => {
      console.log(col.starting(
        `Deploying app to ${col.bold(appConfig.hostname)} at ` +
        `${col.bold(global.ACTIVE_SERVER.server)}`));

      const client = deps.client;
      const stageReq = {
        appId: appConfig.appId,
      };
      return client.run('deploy.stage', stageReq, cb);
    }],

    //
    // We have server-side package manifests. Compare to local versions and
    // execute mutations required to synchronize.
    //
    mutations: ['stage', (deps, cb) => {
      const client = deps.client;
      const clientOps = ComputeChanges(
        deps.manifests.client, // Local manifest
        deps.stage.clientManifest.files); // Remote manifest
      const serverOps = ComputeChanges(
        deps.manifests.server, // Local manifest
        deps.stage.serverManifest.files); // Remote manifest

      return async.auto({
        client: GenMutation('client', clientOps, client),
        server: GenMutation('server', serverOps, client),
      }, cb);
    }],

    //
    // Commit the deployment. Last chance to bail out without impact.
    //
    commit: ['mutations', (deps, cb) => {
      const client = deps.client;
      const mutations = deps.mutations;
      const numMutations = _.sum([
        _.size(mutations.client.deletes),
        _.size(mutations.client.uploads),
        _.size(mutations.server.deletes),
        _.size(mutations.server.uploads),
      ]);
      if (numMutations) {
        console.log(col.starting(`Committing "${col.bold(args.message)}"`));
        return client.run('deploy.commit', {
          message: args.message,
          serverConfig: baresoilJson.server,
        }, (err) => {
          if (err) return cb(err);
          console.log(col.success(
            `Deployed project to ${col.bold(appConfig.hostname)}.`));
          return cb();
        });
      }

      // No mutations, nothing to deploy.
      return client.run('deploy.abort', (err) => {
        if (err) return cb(err);
        console.log(col.success(
          'Project is up-to-date, no changes to commit.'));
        return cb();
      });
    }],

  }, (err) => {
    if (err) {
      console.error(col.fatal(err.message));
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

    function MakeDeleteOp(file) {
      return (cb) => {
        const arg = {
          component,
          path: file.path,
        };
        console.log(col.status(
          `${col.bold('delete-remote:')} ${component}/${col.bold(file.path)}`));
        return client.run('deploy.remove', arg, cb);
      };
    }

    function MakeUploadOp(fstat) {
      // Disallow empty client-side files.
      if (component === 'client' && !fstat.size) {
        console.log(col.status(
          `${col.bold('skip-empty:')} ${component}/${col.thead(fstat.relPath)}`));
        return;
      }

      // Get caching policy for path.
      const cachePolicy = GetCachePolicyForFile(fstat.relPath);
      const cacheMaxAgeSec = _.get(cachePolicy, 'maxAge', 0);

      // Allow empty server-side files, mainly for Python's __init__.py.
      return (cb) => {
        const arg = {
          component,
          path: fstat.relPath,
          size: fstat.size,
          lastModified: fstat.mtime,
          data: fstat.size ? fs.readFileSync(fstat.absPath).toString('base64') : '',
          cacheMaxAgeSec,
        };
        const maxAgeStr = cacheMaxAgeSec ? ` (max-age: ${cacheMaxAgeSec})` : '';
        console.log(col.status(
          `${col.bold('upload:')} ${component}/${col.thead(fstat.relPath)}${maxAgeStr}`));
        return client.run('deploy.upload', arg, cb);
      };
    }
  }

  function ComputeChanges(localFileList, remoteFileList) {
    const localFileIdx = _.keyBy(localFileList, 'path');
    const remoteFileIdx = _.keyBy(remoteFileList, 'path');

    const filesToUpload = _.filter(_.map(localFileList, (file) => {
      const remoteFile = remoteFileIdx[file.path];
      const cachePolicy = GetCachePolicyForFile(file.path);
      if (remoteFile) {
        const contentsChanged = (file.hash !== remoteFile.etag);
        const expiryChanged = (cachePolicy &&
              remoteFile.cacheMs !== cachePolicy.maxAge * 1000);
        if (contentsChanged || expiryChanged) {
          // File contents have changed, re-upload the file.
          return file;
        }
      } else {
        // New file, upload it.
        return file;
      }
    }));

    const filesToDelete = _.filter(_.map(remoteFileList, (file) => {
      if (!(file.path in localFileIdx)) {
        return file;
      }
    }));

    return {
      localUpload: filesToUpload,
      remoteDelete: filesToDelete,
    };
  }

  function GetCachePolicyForFile(filePath) {
    const cachePolicies = _.get(baresoilJson, 'client.cachePolicies', []);
    const policy = _.find(cachePolicies, (policy) => {
      if (_.isString(policy.match)) {
        policy.match = new RegExp(policy.match);
      }
      return policy.match.test(filePath);
    });
    return policy;
  }
}


module.exports = deploy;

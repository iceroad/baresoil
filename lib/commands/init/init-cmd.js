const _ = require('lodash'),
  async = require('async'),
  col = require('../../util/colutil'),
  cliTable = require('../../util/cli-table'),
  dstate = require('../../util/dstate'),
  fs = require('fs'),
  fse = require('fs-extra'),
  linedumper = require('../../util/linedumper'),
  nextSteps = require('../../util/next-steps'),
  path = require('path'),
  spawn = require('child_process').spawn
  ;


function init(args) {
  const targetDir = path.resolve(args.dir) || process.cwd();
  const templatesRoot = path.resolve(__dirname, '../../../templates');
  const templateName = args.template;
  const srcDir = path.join(templatesRoot, templateName);

  return async.auto({
    // Template directory must exist. Walk it to get a list of files to copy.
    srcFiles(cb) {
      if (!fs.existsSync(srcDir)) {
        return cb(new Error(col.error(
          `Template directory "${col.bold(srcDir)}" does not exist.`)));
      }
      return dstate(srcDir, (err, files) => cb(err, files));
    },

    // Target directory must be empty. Do not pollute existing directories on
    // fat fingering commands in the shell.
    targetDir(cb) {
      if (!fs.existsSync(targetDir)) {
        return cb(new Error(col.error(
          `Target directory "${col.bold(targetDir)}" does not exist.`)));
      }
      if (fs.readdirSync(targetDir).length && !args.force) {
        return cb(new Error(
          `Directory "${col.bold(targetDir)}" is not empty, specify ` +
          `${col.command('--force')} to initialize anyway.`));
      }
      return cb(null, targetDir);
    },

    // Copy template files over.
    doCopy: ['srcFiles', 'targetDir', (deps, cb) => {
      console.log(col.starting(
        `Initializing template "${templateName}" in directory "${targetDir}"`));
      return async.parallelLimit(_.map(deps.srcFiles, fileInfo => (cb) => {
        if (fileInfo.type === 'file') {
          // Copy file.
          const destPath = path.join(targetDir, fileInfo.relPath);
          console.log(col.status(`Copy: ${fileInfo.relPath}`));
          fse.ensureDirSync(path.dirname(destPath));
          return fse.copy(fileInfo.absPath, destPath, cb);
        }
        if (fileInfo.type === 'dir') {
          // Ensure directory exists.
          console.log(col.status(`MkDir: ${fileInfo.relPath}/`));
          const destPath = path.join(targetDir, fileInfo.relPath);
          return fse.ensureDir(destPath, cb);
        }
      }), 5, cb);
    }],

    // Run init hooks.
    runHooks: ['doCopy', (deps, cb) => {
      //
      // Read project's baresoil.json
      //
      let baresoilJson;
      try {
        baresoilJson = require(path.join(targetDir, 'baresoil.json'));
      } catch (e) {
        return cb(new Error(`Error validating baresoil.json: ${e.message}`));
      }

      //
      // Collect "init" hooks, if any.
      //
      const hooks = _.get(baresoilJson, 'client.hooks', []);
      const initHooks = _.filter(hooks, (hook) => {
        return hook.type === 'init';
      });

      //
      // Execute "init" hooks sequentially.
      //
      const runners = _.map(initHooks, (hook) => {
        return (cb) => {
          // Pass extra arguments to init hook, if specified.
          let cmd = hook.command;
          if (args.extra) {
            cmd += ` ${args.extra}`;
          }
          console.log(
            `${col.starting('starting')}[${col.dim(hook.name)}]: please wait, ` +
              'this may take some time...');
          const child = spawn(cmd, {
            shell: true,
            cwd: hook.workingDir,
            stdio: 'pipe',
          });
          child.stdout.on('data', linedumper(
            `${col.starting('stdout')}[${col.dim(hook.name)}]`));
          child.stderr.on('data', linedumper(
            `${col.starting('stderr')}[${col.dim(hook.name)}]`));
          child.once('exit', (code, signal) => {
            if (code || signal) {
              return cb(new Error(
                `${col.error('EXIT')}[${col.dim(hook.name)}] ` +
                  `code=${col.dim(code)} signal=${col.dim(signal)}`));
            }
            return cb();
          });
        };
      });
      if (runners.length) {
        console.log(col.starting(
          `Running ${runners.length} post-init hooks found in baresoil.json...`));
      }
      return async.series(runners, cb);
    }],
  }, (err) => {
    if (err) {
      console.error(err.message);
      return process.exit(1);
    }

    console.log(col.success('Done.'));
    console.log(cliTable([
      nextSteps.runDevEnv(),
      nextSteps.deployApp(),
      nextSteps.documentation(),
    ], 'Next Steps'));

    return process.exit(0);
  });
}

module.exports = init;

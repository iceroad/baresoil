const _ = require('lodash'),
  async = require('async'),
  clitable = require('../../util/cli-table'),
  /* eslint-disable no-unused-vars */ col = require('../../util/colutil'),
  dstate = require('../../util/dstate'),
  fs = require('fs'),
  fse = require('fs-extra'),
  linedumper = require('../../util/linedumper'),
  path = require('path'),
  spec = require('../../util/spec'),
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
        return cb(new Error(
            `Template directory "${srcDir.bold}" does not exist.`.red));
      }
      return dstate(srcDir, (err, files, errors) => cb(err, files));
    },

    // Target directory must be empty. Do not pollute existing directories on
    // fat fingering commands in the shell.
    targetDir(cb) {
      if (!fs.existsSync(targetDir)) {
        return cb(new Error(
            `Target directory "${targetDir.bold}" does not exist.`.red));
      }
      if (fs.readdirSync(targetDir).length && !args.force) {
        return cb(new Error(
            `Directory "${targetDir.bold}" is not empty, specify ` +
            `${'--force'.yellow.bold} to initialize anyway.`));
      }
      return cb(null, targetDir);
    },

    // Copy template files over.
    doCopy: ['srcFiles', 'targetDir', (deps, cb) => {
      console.log(
          `Creating a new Baresoil project in "${targetDir.bold}"...`.green);
      return async.parallelLimit(_.map(deps.srcFiles, fileInfo => (cb) => {
        if (fileInfo.type === 'file') {
          // Copy file.
          const destPath = path.join(targetDir, fileInfo.relPath);
          console.log(`Copy:  ${fileInfo.relPath.yellow}`.gray);
          fse.ensureDirSync(path.dirname(destPath));
          return fse.copy(fileInfo.absPath, destPath, cb);
        }
        if (fileInfo.type === 'dir') {
          // Ensure directory exists.
          console.log(`MkDir: ${fileInfo.relPath.yellow}/`.gray);
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
        baresoilJson = spec.get(targetDir);
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
              `${col.action('starting')}[${col.data(hook.name)}]: please wait, ` +
              'this may take some time...');
          const child = spawn(cmd, {
            shell: true,
            cwd: hook.workingDir,
            stdio: 'pipe',
          });
          child.stdout.on('data', linedumper(
              `${col.action('stdout')}[${col.data(hook.name)}]`));
          child.stderr.on('data', linedumper(
              `${col.action('stderr')}[${col.data(hook.name)}]`));
          child.once('exit', (code, signal) => {
            if (code || signal) {
              return cb(new Error(
                  `${col.error('EXIT')}[${col.data(hook.name)}] ` +
                  `code=${col.data(code)} signal=${col.data(signal)}`));
            }
            return cb();
          });
        };
      });
      console.log(col.success(
          `Running ${runners.length} post-init hooks found in baresoil.json...`));
      return async.series(runners, cb);
    }],
  }, (err) => {
    if (err) {
      console.error(err.message);
      return process.exit(1);
    }

    console.log('Done.'.green);
    console.log(clitable([
      [
        'Next Steps'.dim,
        `Start the Development Environment with ${'baresoil dev'.yellow.bold}`,
      ],
      [
        'Documentation'.dim,
        'https://docs.baresoil.com/',
      ],
    ]));

    return process.exit(0);
  });
}

module.exports = init;

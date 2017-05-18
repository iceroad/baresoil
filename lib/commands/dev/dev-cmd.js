const _ = require('lodash'),
  col = require('../../util/colutil'),
  fmt = require('util').format,
  linedumper = require('../../util/linedumper'),
  spawn = require('child_process').spawn,
  spec = require('../../util/spec'),
  temp = require('temp').track(),
  BaresoilDevenv = require('baresoil-devenv')
  ;


function dev(args) {
  //
  // Read project's baresoil.json
  //
  let baresoilJson;
  try {
    baresoilJson = spec.get(args.project);
  } catch (e) {
    console.error('Error validating baresoil.json:', e.message);
  }

  //
  // Collect "dev-server" hooks, if any.
  //
  const hooks = _.get(baresoilJson, 'client.hooks', []);
  const devServerHooks = _.filter(hooks, (hook) => {
    return hook.type === 'dev-server';
  });

  //
  // Start Dev Env asynchronously
  //
  const devEnvArgs = _.clone(args);
  if (!devEnvArgs.data) {
    devEnvArgs.data = temp.mkdirSync();
  }
  delete devEnvArgs.extra;
  if (devServerHooks.length) {
    //
    // Pass some extra parameters to the DevEnv if there are project hooks.
    //
    devEnvArgs.colors = true;
    devEnvArgs['external-server'] = true;
  }
  BaresoilDevenv(devEnvArgs);

  //
  // Execute any "dev-server" client hooks found in baresoil.json
  //
  _.forEach(devServerHooks, (hook) => {
    // Pass extra arguments to dev-server hook, if specified.
    let cmd = hook.command;
    if (args.extra) {
      cmd += ` ${args.extra}`;
    }
    if (process.env.VERBOSE) {
      console.log('%s[%s]', 'spawning:dev-server'.yellow, cmd.gray);
    }
    const child = spawn(cmd, {
      shell: true,
      cwd: hook.workingDir,
      stdio: 'pipe',
    });
    child.stdout.on('data', linedumper(
        fmt('%s[%s]', col.action('stdout'), col.data(hook.name))));
    child.stderr.on('data', linedumper(
        fmt('%s[%s]', col.error('stderr'), col.data(hook.name))));
    child.stderr.on('data', (dataChunk) => {
      const lines = dataChunk.toString('utf-8').split('\n');
      console.log(_.filter(_.map(lines, (line) => {
        line = line.replace(/[\n\r]/mgi, '');
        if (line.length) {
          return fmt('%s[%s] %s', 'stderr'.red, hook.command.gray, line);
        }
      })).join('\n'));
    });
  });
}


module.exports = dev;

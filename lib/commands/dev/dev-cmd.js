var _ = require('lodash')
  , col = require('../../util/colutil')
  , fmt = require('util').format
  , linedumper = require('../../util/linedumper')
  , spawn = require('child_process').spawn
  , spec = require('../../util/spec')
  , temp = require('temp').track()
  , BaresoilDevenv = require('baresoil-devenv')
  ;


function dev(args) {
  //
  // Read project's baresoil.json
  //
  try {
    var baresoilJson = spec.get(args.project);
  } catch(e) {
    console.error('Error validating baresoil.json:', e.message);
  }

  //
  // Collect "dev-server" hooks, if any.
  //
  var hooks = _.get(baresoilJson, 'client.hooks', []);
  var devServerHooks = _.filter(hooks, function(hook) {
    return hook.type === 'dev-server';
  });

  //
  // Start Dev Env asynchronously
  //
  var devEnvArgs = _.clone(args);
  if (!devEnvArgs.data) {
    devEnvArgs.data = temp.mkdirSync();
  }
  delete devEnvArgs.extra;
  if (devServerHooks.length) {
    //
    // Pass some extra parameters to the DevEnv if there are project hooks.
    //
    devEnvArgs['external-server'] = true;
    devEnvArgs['colors'] = args.colors;
  }
  BaresoilDevenv(devEnvArgs);

  //
  // Execute any "dev-server" client hooks found in baresoil.json
  //
  var children = _.map(devServerHooks, function(hook) {
    // Pass extra arguments to dev-server hook, if specified.
    var cmd = hook.command;
    if (args.extra) {
      cmd += ' ' + args.extra;
    }
    if (process.env.VERBOSE) {
      console.log('%s[%s]', 'spawning:dev-server'.yellow, cmd.gray);
    }
    var child = spawn(cmd, {
      shell: true,
      cwd: hook.workingDir,
      stdio: 'pipe'
    });
    child.stdout.on('data', linedumper(
        fmt('%s[%s]', col.action('stdout'), col.data(hook.name))));
    child.stderr.on('data', linedumper(
        fmt('%s[%s]', col.error('stderr'), col.data(hook.name))));
    child.stderr.on('data', function(dataChunk) {
      var lines = dataChunk.toString('utf-8').split('\n');
      console.log(_.filter(_.map(lines, function(line) {
        line = line.replace(/[\n\r]/mgi, '');
        if (line.length) {
          return fmt('%s[%s] %s', 'stderr'.red, hook.command.gray, line);
        }
      })).join('\n'));
    });
  });
}


module.exports = dev;

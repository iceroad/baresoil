const _ = require('lodash'),
  col = require('../../util/colutil'),
  linedumper = require('../../util/linedumper'),
  path = require('path'),
  spawn = require('child_process').spawn,
  BaresoilServer = require('baresoil-server')
  ;


function dev(args) {
  //
  // Read project specification from "baresoil.json" in working directory.
  //
  let baresoilJson;
  try {
    baresoilJson = require(path.join(process.cwd(), 'baresoil.json'));
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
  // Create a BaresoilServer instance with the devenv provider added to the end.
  //
  const bsServer = new BaresoilServer(null, [
    path.resolve(__dirname, 'provider.js'),
  ], args);
  return bsServer.init((err) => {
    if (err) {
      console.error(err);
      return process.exit(1);
    }

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
        `${col.bold('stdout')}[${col.dim(hook.name)}]`));

      child.stderr.on('data', linedumper(
        `${col.error('stderr')}[${col.dim(hook.name)}]`));
    });
  });
}


module.exports = dev;

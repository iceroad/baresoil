const _ = require('lodash'),
  async = require('async'),
  colutil = require('../../util/colutil'),
  clitable = require('../../util/cli-table'),
  fs = require('fs'),
  json = JSON.stringify,
  path = require('path'),
  walkthrough = require('../../util/walkthrough')
  ;


function register(args, client) {
  const argspec = this.argspec;
  return async.auto({
    registerArgs(cb) {
      walkthrough(argspec, args, cb);
    },

    runCmd: ['registerArgs', (deps, cb) => {
      console.log('Sending app registration request to Baresoil Cloud...'.gray);
      return client.run('app.create', deps.registerArgs, (err, deployKey) => {
        if (err) {
          const msg = [
            `Error: ${colutil.error(err.message)}`,
            '',
          ].join('\n');
          return cb(new Error(msg));
        }

        const domain = deployKey.domain;
        const appId = deployKey.appId;

        // Write app deploy key to disk.
        const appIdPath = path.join(process.cwd(), '.baresoil-deploy.json');
        fs.writeFileSync(appIdPath, json(deployKey, null, 2), 'utf-8');

        console.log('Done.'.gray);
        console.log(clitable([
          ['Domain'.dim, domain.yellow.bold],
          ['App ID'.dim, _.toString(appId).green],
          ['Deploy Key ID'.dim, _.toString(deployKey.keyId).green],
          ['Key File'.dim, path.basename(appIdPath).green],
        ]));

        console.log([
          `You can now run ${'baresoil deploy'.green.bold} in this directory ` +
          'to deploy your project.',
        ].join('\n'));
        return cb();
      });
    }],

  }, (err) => {
    if (err) {
      console.error(err.message);
    }
    return process.exit(err ? 1 : 0);
  });
}


module.exports = register;

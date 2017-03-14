var _ = require('lodash')
  , async = require('async')
  , colutil = require('../../util/colutil')
  , clitable = require('../../util/cli-table')
  , fmt = require('util').format
  , fs = require('fs')
  , inquirer = require('inquirer')
  , json = JSON.stringify
  , path = require('path')
  , walkthrough = require('../../util/walkthrough')
  , validators = require('../../util/validators')
  ;


function register(args, client) {
  var argspec = this.argspec;
  return async.auto({
    registerArgs: function(cb) {
      walkthrough(argspec, args, cb);
    },

    runCmd: ['registerArgs', function(deps, cb) {
      console.log('Sending app registration request to Baresoil Cloud...'.gray);
      return client.run('app.create', deps.registerArgs, function(err, deployKey) {
        if (err) {
          var msg = [
            'Error: ' + colutil.error(err.message),
            '',
          ].join('\n');
          return cb(new Error(msg));
        }

        var domain = deployKey.domain;
        var appId = deployKey.appId;

        // Write app deploy key to disk.
        var appIdPath = path.join(process.cwd(), '.baresoil-deploy.json');
        fs.writeFileSync(appIdPath, json(deployKey, null, 2), 'utf-8');

        console.log('Done.'.gray);
        console.log(clitable([
          [ 'Domain'.dim, domain.yellow.bold ],
          [ 'App ID'.dim, _.toString(appId).green ],
          [ 'Deploy Key ID'.dim, _.toString(deployKey.keyId).green ],
          [ 'Key File'.dim, path.basename(appIdPath).green ],
        ]));

        console.log([
          'You can now run ' + 'baresoil deploy'.green.bold + ' in this directory ' +
          'to deploy your project.',
        ].join('\n'));
        return cb();
      });
    }],

  }, function(err) {
    if (err) {
      console.error(err.message);
    }
    return process.exit(err ? 1 : 0);
  });
}


module.exports = register;

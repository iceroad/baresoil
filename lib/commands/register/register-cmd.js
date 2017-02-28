var _ = require('lodash')
  , async = require('async')
  , colutil = require('../../util/colutil')
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
      return walkthrough(argspec, args, cb);
    },

    runCmd: ['registerArgs', function(deps, cb) {
      console.log('Sending app creation request to Baresoil Cloud...'.gray);
      return client.run('app.create', deps.registerArgs, function(err, deployKey) {
        if (err) {
          console.error('Error registering app:'.red + ' ' + err.message.bgRed.white);
          return process.exit(2);
        }

        var domain = deployKey.domain;
        var appId = deployKey.appId;

        // Write app deploy key to disk.
        var appIdPath = path.join(process.cwd(), '.baresoil-deploy.json');
        fs.writeFileSync(appIdPath, json(deployKey, null, 2), 'utf-8');
        console.log([
          'Deployment key written to: ' + path.basename(appIdPath).green.bold,
          'You can now run ' + 'baresoil deploy'.green.bold + ' in this directory ' +
          'to deploy your project to Baresoil Cloud.',
        ].join('\n'));
        return process.exit(0);
      });
    }],

  });

}


module.exports = register;

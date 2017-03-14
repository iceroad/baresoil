//
// A project specification. Overrides to the defaults are stored in
// the file `baresoil.json` in a project's root directory.
//
var _ = require('lodash')
  , assert = require('assert')
  , fs = require('fs')
  , path = require('path')
  ;


exports.default = function() {
  return {
    server: {
      path: 'server',
    },
    client: {
      path: 'client',
    },
  };
};


exports.get = function(projRootPath) {
  var specPath = path.join(projRootPath, 'baresoil.json');
  var diskSpec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  var buildJson = _.merge(exports.default(), diskSpec);

  var serverPath = path.join(projRootPath, buildJson.server.path);
  var clientPath = path.join(projRootPath, buildJson.client.path);

  // Projects must have either a client or a server component
  assert(
      fs.existsSync(serverPath) || fs.existsSync(clientPath),
      'Projects must have at least a client or a server component.');

  return buildJson;
};

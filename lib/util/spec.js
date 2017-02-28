//
// A project specification. Overrides to the defaults are stored in
// the file `baresoil.json` in a project's root directory.
//
var _ = require('lodash')
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
  return _.merge(exports.default(), diskSpec);
};

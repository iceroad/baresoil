//
// A project specification. Overrides to the defaults are stored in
// the file `baresoil.json` in a project's root directory.
//
var _ = require('lodash')
  , assert = require('assert')
  , construct = require('runtype').construct
  , fmt = require('util').format
  , fs = require('fs')
  , path = require('path')
  ;


//
// Schema for baresoil.json
//
var BaresoilJsonSchema = {
  type: 'object',
  fields: {
    server: {
      type: 'object',
      fields: {
        path: { type: 'string',  minLength: 1 }
      }
    },
    client: {
      type: 'object',
      fields: {
        path: { type: 'string', minLength: 1 },
        cachePolicies: {
          type: 'array',
          optional: true,
          elementType: {
            type: 'object',
            fields: {
              pathPrefix: { type: 'string', minLength: 1 },
              maxAge: { type: 'integer', minValue: 0 }
            }
          }
        },
        hooks: {
          type: 'array',
          optional: true,
          elementType: {
            type: 'object',
            fields: {
              type: { type: 'factor', factors: ['dev-server', 'build'] },
              command: { type: 'string' },
              workingDir: { type: 'string' },
              name: { type: 'string', optional: true},
            }
          }
        }
      }
    }
  }
}


//
// Default, minimal schema.
//
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


//
// Read, parse, validate build.json from disk.
//
exports.get = function(projRootPath) {
  assert(_.isString(projRootPath));
  var specPath = path.join(projRootPath, 'baresoil.json');

  // Parse and validate baresoil.json according to schema, throws exceptions.
  var rawSpec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  var baresoilJson = _.merge(exports.default(), rawSpec);
  construct(BaresoilJsonSchema, baresoilJson, fmt('<%s>', specPath));

  // Convert relative project paths to absolute, ensure they exist.
  var serverPath = path.isAbsolute(baresoilJson.server.path) ?
      baresoilJson.server.path :
      path.resolve(projRootPath, baresoilJson.server.path);
  assert(
      fs.existsSync(serverPath),
      fmt('Server project path "%s" does not exist.', serverPath));

  var clientPath = path.isAbsolute(baresoilJson.client.path) ?
      baresoilJson.client.path :
      path.join(projRootPath, baresoilJson.client.path);
  assert(
      fs.existsSync(clientPath),
      fmt('Client project path "%s" does not exist.', clientPath));

  // Convert client-side hook paths to absolute paths, ensure they exist.
  var hooks = _.get(baresoilJson, 'client.hooks', []);
  _.forEach(hooks, function(hook, idx) {
    hook.workingDir = path.isAbsolute(hook.workingDir) ?
        hook.workingDir : path.resolve(projRootPath, hook.workingDir);
    assert(
        fs.existsSync(hook.workingDir),
        fmt('Client hook %d specifies a non-existent working directory "%s".',
            idx, hook.workingDir));
  });

  return baresoilJson;
};

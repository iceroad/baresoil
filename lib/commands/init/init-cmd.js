var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , col = require('colors')
  , fmt = require('util').format
  , fs = require('fs')
  , fse = require('fs-extra')
  , json = JSON.stringify
  , path = require('path')
  , spec = require('../../util/spec')
  ;


function init(args) {
  var dir = path.resolve(args.dir) || process.cwd();

  // Target directory must be empty. Do not pollute existing directories on
  // fat fingering commands in the shell.
  try {
    assert(fs.existsSync(dir),
           fmt('Directory "%s" does not exist.'.red, dir.bold));
    assert(!fs.readdirSync(dir).length || args.force, fmt(
        ('Directory "%s" is not empty, specify ' + '--force '.bold +
        'to initialize anyway.').red, dir.bold));
  } catch(e) {
    console.error(e.message);
    return process.exit(1);
  }
  console.log(fmt('Creating a Baresoil project in "%s"'.yellow, dir.bold));

  // Write project spec.
  var defaultSpec = spec.default();
  var projSpecPath = path.join(dir, 'baresoil.json');
  fs.writeFileSync(projSpecPath, json(defaultSpec, null, 2), 'utf-8');
  console.log('↳ ' + 'baresoil.json'.white.bold,
              ('       Configuration options for your' +
              ' project.').dim);

  // Create client-side project.
  var clientRoot = path.join(dir, 'client');
  fse.ensureDirSync(clientRoot);
  console.log('↳ ' + 'client'.white.bold + '/'.bold,
              ('             Subdirectory for frontend HTML, CSS, JS, ' +
               'and static assets.').dim);

  var clientHtmlRaw = defaultHtml();
  var clientHtmlPath = path.join(dir, 'client', 'index.html');
  fs.writeFileSync(clientHtmlPath, clientHtmlRaw, 'utf-8');
  console.log('  ↳ ' + 'index.html'.white,
              ('        Project\'s home page.').dim);

  var clientJsLib = fs.readFileSync(
      require.resolve('baresoil-client'), 'utf-8');
  var clientJsLibPath = path.join(dir, 'client', 'BaresoilClient.js');
  fs.writeFileSync(clientJsLibPath, clientJsLib, 'utf-8');
  console.log('  ↳ ' + 'BaresoilClient.js'.white,
              ' Baresoil Javascript Client Library.'.dim);

  var clientJsApp = defaultClientApp();
  var clientJsPath = path.join(dir, 'client', 'app.js');
  fs.writeFileSync(clientJsPath, clientJsApp, 'utf-8');
  console.log('  ↳ ' + 'app.js'.white,
              ('            Entry point for client-side Javascript' +
              ' application.').dim);

  // Create server-side project.
  var serverRoot = path.join(dir, 'server');
  fse.ensureDirSync(serverRoot);
  console.log('↳ ' + 'server'.white.bold + '/'.bold,
              ('             Subdirectory for server-side handler' +
              ' functions and associated files.').dim);

  var srvJsRaw = defaultHandler();
  var srvJsPath = path.join(dir, 'server', 'fn-$session.js');
  fs.writeFileSync(srvJsPath, srvJsRaw, 'utf-8');
  console.log('  ↳ ' + 'fn-$session.js'.white,
              ('    Server-side handler function to be invoked at the ' +
              'start of a new session.').dim);

  // Create data directory.
  var dataRoot = path.join(dir, 'baresoil_data');
  fse.ensureDirSync(dataRoot);
  console.log('↳ ' + 'baresoil_data/'.white.bold,
              ('      Stores data between restarts, can be safely deleted or ' +
               'ignored.').dim);

  console.log(fmt(
      ('You can now start the Baresoil Development Environment by ' +
      'running "%s".').yellow,
      'baresoil dev'.bold));
}


function defaultHtml() {
  return [
    '<!doctype html>',
    '<html>',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <title>New Project</title>',
    '  </head>',
    '  <body>',
    '    <h1>New Project</h1>',
    '    <strong>Source:</strong><code>client/index.html</code>',
    '    <script src="BaresoilClient.js"></script>',
    '    <script src="app.js"></script>',
    '  </body>',
    '</html>'
  ].join('\n') + '\n';
}


function defaultHandler() {
  return [
    'module.exports = function(arg, cb) {',
    '  return cb();',
    '};',
  ].join('\n') + '\n';
}


function defaultClientApp() {
  return [
    'function main() {',
    '};',
  ].join('\n') + '\n';
}


module.exports = init;

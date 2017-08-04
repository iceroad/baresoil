const _ = require('lodash'),
  assert = require('assert'),
  digest = require('./digest'),
  fs = require('fs'),
  mime = require('mime'),
  path = require('path'),
  url = require('url')
  ;


class AppManager {
  get(baseConnection, appGetRequest, cb) {
    const appConfig = _.cloneDeep(this.getSysappConfig());
    appConfig.appId = 1000;
    appConfig.name = 'Application under development.';
    return cb(null, appConfig);
  }

  loadSysapp(cb) {
    return cb();
  }

  getAppPackage(appConfig, cb) {
    // Look in working directory's server project.
    let serverProjPath;
    try {
      const baresoilJson = JSON.parse(fs.readFileSync('baresoil.json', 'utf-8'));
      serverProjPath = _.get(baresoilJson, 'server.path', 'server');
    } catch (e) {
      return cb(this.makeError_('not_found', {
        message: `Cannot find server project: ${e.message}`,
      }));
    }

    // Create server project tarball.
    this.deps_.SerDe.createArchive(serverProjPath, cb);
  }

  getClientFile(baseConnection, httpRequest, cb) {
    assert(this.isAppManager);

    // Parse and URL-decode request URL.
    let reqUrl = httpRequest.url || '/';
    if (reqUrl.match(/\/$/)) {
      reqUrl += 'index.html';
    }
    const parsedUrl = url.parse(reqUrl);
    const reqPath = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, '');

    // Look in working directory's client project for file.
    let fileBlob, fileStat;
    try {
      const baresoilJson = JSON.parse(fs.readFileSync('baresoil.json', 'utf-8'));
      const clientProjPath = _.get(baresoilJson, 'client.path', 'client');
      const clientPath = path.join(clientProjPath, reqPath);
      fileBlob = fs.readFileSync(clientPath);
      fileStat = fs.statSync(clientPath);
    } catch (e) {
      return cb(this.makeError_('not_found', {
        message: `Error reading ${reqPath}: ${e.message}`,
      }));
    }

    // Create manifest.
    const fileMetadata = {
      path: reqPath,
      mimeType: mime.lookup(reqPath) || 'application/octet-stream',
      etag: digest(fileBlob, 'base64'),
      size: fileBlob.length,
      lastModified: fileStat.mtime.getTime(),
      cacheMaxAgeSec: 0,
    };

    return cb(null, {
      fileMetadata,
      fileBlob: fileBlob.toString('base64'),
    });
  }
}

module.exports = AppManager;

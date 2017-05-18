const col = require('colors'),
  os = require('os'),
  pkgVer = require('../../package.json').version,
  spawnSync = require('child_process').spawnSync
  ;


function ShowVersion(pkgName) {
  let latestVer = spawnSync(`npm show ${pkgName} version`, {
    shell: true,
    stdio: 'pipe',
  }).stdout;
  let latestVerStr = '';
  if (latestVer) {
    latestVer = latestVer.toString('utf-8').replace(/\s/gm, '');
    if (latestVer !== pkgVer) {
      const osType = os.type();
      const sudo = (osType === 'Linux' || osType === 'Darwin') ? 'sudo ' : '';
      latestVerStr = `Latest version on npm: ${col.yellow(latestVer).bold}
Run "${col.yellow(`${sudo}npm install -g ${pkgName}@latest`).bold}" to upgrade.`;
    } else {
      latestVerStr = ` (${col.green('up-to-date!')})`;
    }
  }
  return `${pkgVer}${latestVerStr}`;
}


module.exports = ShowVersion;

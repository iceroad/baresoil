const col = require('../../util/colutil'),
  Table = require('cli-table2')
;


function status() {
  const project = global.PROJECT;
  const appConfig = project.appConfig || {};

  const table = new Table();
  table.push([col.thead('Project path'), process.cwd()]);
  table.push([col.thead('Server app ID'), appConfig.appId]);
  table.push([col.thead('Server app name'), appConfig.name]);
  table.push([col.thead('Server hostname'), appConfig.hostname]);
  console.log(table.toString());

  return process.exit(0);
}

module.exports = status;

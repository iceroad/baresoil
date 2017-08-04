const col = require('../../util/colutil'),
  moment = require('moment'),
  Table = require('cli-table2')
  ;


function whoami() {
  const activeServer = global.ACTIVE_SERVER;
  const userSession = global.USER_SESSION;
  const table = new Table();

  table.push([col.thead('Server'), activeServer.server]);
  table.push([col.thead('Username'), activeServer.username]);
  table.push([col.thead('User ID'), userSession.userId]);
  if (userSession.expires) {
    table.push([
      col.thead('Session expires'),
      moment(userSession.expires).fromNow()]);
  }

  console.log(table.toString());
  return process.exit(0);
}

module.exports = whoami;

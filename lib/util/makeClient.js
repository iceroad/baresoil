const _ = require('lodash'),
  json = JSON.stringify,
  ws = require('ws'),
  BaresoilClient = require('baresoil-client')
  ;

global.WebSocket = ws;

function makeClient(args, cb) {
  const client = new BaresoilClient(args);
  const cbOnce = _.once(cb);

  if (args.userSession) {
    client.setSessionRequest(args.userSession);
  }

  client.connect();
  client.once('connected', () => cbOnce(null, client));
  client.once('error', (err) => {
    console.error(`BaresoilClient error: ${err}`);
    return cbOnce(err);
  });

  if (process.env.LOG === 'debug') {
    client.on('connection_status',
      connStatus => console.log(`BaresoilClient: connection_status ${connStatus}`));

    client.on('error',
      error => console.error(`BaresoilClient: error ${error}`));

    client.on('close',
      error => console.error(`BaresoilClient: error ${error}`));

    client.on('incoming_message_raw', (msgStr) => {
      const prefix = `${msgStr.substr(0, 140)} (total: ${msgStr.length})`;
      console.log(`BaresoilClient: incoming_message_raw ${prefix}`);
    });

    client.on('outgoing_message_raw', (msgStr) => {
      const prefix = `${msgStr.substr(0, 140)} (total: ${msgStr.length})`;
      console.log(`BaresoilClient: outgoing_message_raw ${prefix}`);
    });

    client.on('user_event', (evtName) => {
      console.log(`BaresoilClient: user_event ${evtName}`);
    });
  }
}

module.exports = makeClient;

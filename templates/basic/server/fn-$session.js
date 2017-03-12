module.exports = function(fnArgs, cb) {
  var baseConnection = this.baseConnection;
  var sendEventFn = this.sendEvent.bind(this);
  var RealtimeBus = this.svclib.RealtimeBus;

  //
  // Subscribe to realtime channel and bounce any received messages back
  // to the client as user events.
  //
  var channelId = 'global-chat';
  RealtimeBus.listen([{
    channelId: channelId,
  }], function(err) {
    if (err) {
      // This log message will appear in your logs at
      // https://baresoil.cloud/
      console.error('Could not subscribe to realtime channel:', e);
    }
  });

  //
  // When a message is received on the RealtimeBus, use sendEvent() to relay
  // it to the client as a "channel_message" user event.
  //
  RealtimeBus.on('message', function(channelMessage) {
    sendEventFn('channel_message', channelMessage);
  });

  //
  // Allow client to connect by returning no error on the
  // $fn-session handler. Passing an error to the callback here rejects
  // the client's session.
  //
  return cb();
};

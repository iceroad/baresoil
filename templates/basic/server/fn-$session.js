module.exports = function(sessionRequest, cb) {
  var baseConnection = this.baseConnection;
  var sendEventFn = this.sendEvent.bind(this);
  var RealtimeBus = this.svclib.RealtimeBus;
  var KVDataStore = this.svclib.KVDataStore;
  this.username = (sessionRequest || {}).username;

  //
  // Subscribe to realtime channel and bounce any received messages back
  // to the client as user events.
  //
  var channelId = 'global-chat';

  RealtimeBus.on('message', function(channelMessage) {
    sendEventFn('channel_message', channelMessage);
  });

  RealtimeBus.listen([{
    channelId: channelId,
  }], function(err) {
    if (err) {
      console.error('Could not subscribe to realtime channel:', e);
    }
    return cb();
  });

  //
  // Retrieve chat history.
  //
  KVDataStore.get([{
    table: 'history',
    key: 'global-chat-history'
  }], (err, items) => {
    if (err) {
      console.error(err);
    } else {
      this.sendEvent('chat_history', items[0].value || []);
    }
  });
};


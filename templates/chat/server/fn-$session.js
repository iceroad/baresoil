module.exports = function fnSession(sessionRequest, cb) {
  const sendEventFn = this.sendEvent.bind(this);
  const RealtimeBus = this.svclib.RealtimeBus;
  const KVDataStore = this.svclib.KVDataStore;
  this.username = (sessionRequest || {}).username;

  //
  // Subscribe to realtime channel and bounce any received messages back
  // to the client as user events.
  //
  const channelId = 'global-chat';

  RealtimeBus.on('message', (channelMessage) => {
    sendEventFn('channel_message', channelMessage);
  });

  RealtimeBus.listen([{
    channelId,
  }], (err) => {
    if (err) {
      console.error('Could not subscribe to realtime channel:', err);
    }
    return cb();
  });

  //
  // Retrieve chat history.
  //
  KVDataStore.get([{
    table: 'history',
    key: 'global-chat-history',
  }], (err, items) => {
    if (err) {
      console.error(err);
    } else {
      this.sendEvent('chat_history', items[0].value || []);
    }
  });
};


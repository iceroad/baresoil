module.exports = function fnPostMessage(messageText, cb) {
  const KVDataStore = this.svclib.KVDataStore;

  // Save message text and some metadata.
  const msgObj = {
    source: this.baseConnection.remoteAddress,
    text: (messageText || '').toString().substr(0, 200),
    time: Date.now(),
    username: this.username,
  };

  // Write to sandbox log by writing to stderr.
  console.error(`User "${msgObj.username}" said: "${msgObj.text}"`);

  // Broadcast message on the "global-chat" channel.
  this.svclib.RealtimeBus.broadcast({
    channelList: ['global-chat'],
    message: msgObj,
  }, (err) => {
    if (err) console.error(err);
  });

  // Update conversation history.
  KVDataStore.get([{
    table: 'history',
    key: 'global-chat-history',
  }], (err, items) => {
    if (err) {
      console.error(err);  // To sandbox log.
    } else {
      items[0].value = items[0].value || [];
      items[0].value.push(msgObj);

      // Keep only 50 most recent messages.
      if (items[0].value.length > 50) {
        items[0].value.splice(0, items[0].value.length - 50);
      }
      KVDataStore.update(items, cb);
    }
  });
};

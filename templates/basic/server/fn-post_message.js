module.exports = function(messageText, cb) {
  const KVDataStore = this.svclib.KVDataStore;
  const msgObj = {
    source: this.baseConnection.remoteAddress,
    text: (messageText || '').toString().substr(0, 200),
    time: Date.now(),
    username: this.username,
  };

  this.svclib.RealtimeBus.broadcast({
    channelList: ['global-chat'],
    message: msgObj,
  }, (err) => {
    if (err) console.error(err);
  });

  KVDataStore.get([{
    table: 'history',
    key: 'global-chat-history'
  }], (err, items) => {
    if (err) {
      console.error(err);
    } else {
      items[0].value = items[0].value || [];
      items[0].value.push(msgObj);
      if (items[0].value.length > 50) {
        items[0].value.splice(0, items[0].value.length - 50);
      }
      KVDataStore.update(items, cb);
    }
  });
};

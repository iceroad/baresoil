module.exports = function(messageText, cb) {
  this.svclib.RealtimeBus.broadcast({
    channelList: ['global-chat'],
    message: {
      source: this.baseConnection.remoteAddress,
      text: (messageText || '').toString(),
    },
  }, cb);
};

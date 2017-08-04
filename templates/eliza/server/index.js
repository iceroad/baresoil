const ElizaBot = require('elizabot');

module.exports = {
  // Create a new ElizaBot instance at the start of a WebSocket connection.
  $websocket(sessionRequest, cb) {
    this.eliza_ = new ElizaBot();
    setTimeout(() => {
      this.sendEvent('addToTranscript', [{
        who: 'ELIZA',
        text: 'Hello, I am process ' + process.pid + '. I am ready to talk.',
      }]);
    }, Math.floor(Math.random() * 200));
    return cb();  // Allow connection.
  },

  // Expose the "tell_eliza" function to clients.
  tell_eliza(userInput, cb) {
    userInput = (userInput || '').substr(0, 140);
    if (userInput.length < 2) {
      return cb(new Error('Please type something longer.'));
    }
    const response = this.eliza_.transform(userInput).substr(0, 140);
    const delay = 400 + Math.floor((response.length / 140) * 5000);
    setTimeout(() => {
      return cb(null, response);
    }, delay);
  },
}

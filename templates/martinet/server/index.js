module.exports = {
  $websocket: (sessionRequest, cb) => {
    return cb();  // Allow WebSocket connections.
  },
}

module.exports = function fnSession(sessionRequest, cb) {
  return cb();  // Allow all clients.
};

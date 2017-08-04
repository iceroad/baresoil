const crypto = require('crypto');

module.exports = function sha256(str, encoding) {
  const hasher = crypto.createHash('sha256');
  hasher.update(str);
  return hasher.digest(encoding);
};

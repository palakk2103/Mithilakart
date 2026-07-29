const crypto = require('crypto');

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function randomUuid() {
  return crypto.randomUUID();
}

module.exports = {
  sha256,
  randomToken,
  randomUuid,
};

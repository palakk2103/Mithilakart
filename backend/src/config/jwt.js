const fs = require('fs');
const path = require('path');
const { PORTALS } = require('../constants/portals');
const { JWT } = require('../constants/auth');

function readKeyFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf8');
}

function readKeyFromEnv(value) {
  if (!value) {
    return null;
  }

  return Buffer.from(value, 'base64').toString('utf8');
}

function loadPortalKeys(portal, envPrefix) {
  const privateKey = readKeyFromEnv(process.env[`${envPrefix}_PRIVATE_KEY`])
    || readKeyFile(process.env[`${envPrefix}_PRIVATE_KEY_PATH`])
    || readKeyFile(path.join(process.cwd(), 'keys', `${portal}-private.pem`));

  const publicKey = readKeyFromEnv(process.env[`${envPrefix}_PUBLIC_KEY`])
    || readKeyFile(process.env[`${envPrefix}_PUBLIC_KEY_PATH`])
    || readKeyFile(path.join(process.cwd(), 'keys', `${portal}-public.pem`));

  return { privateKey, publicKey };
}

function buildJwtConfig(isTest = false) {
  const portals = [
    { portal: PORTALS.CUSTOMER, prefix: 'JWT_CUSTOMER' },
    { portal: PORTALS.SELLER, prefix: 'JWT_SELLER' },
    { portal: PORTALS.ADMIN, prefix: 'JWT_ADMIN' },
    { portal: PORTALS.DELIVERY, prefix: 'JWT_DELIVERY' },
  ];

  const keys = {};

  portals.forEach(({ portal, prefix }) => {
    keys[portal] = {
      ...loadPortalKeys(portal, prefix),
      accessExpiry: JWT.ACCESS_EXPIRY,
      refreshExpiry: JWT.REFRESH_EXPIRY,
      algorithm: JWT.ALGORITHM,
    };
  });

  if (isTest) {
    const { generateKeyPairSync } = require('crypto');

    Object.keys(keys).forEach((portal) => {
      if (!keys[portal].privateKey || !keys[portal].publicKey) {
        const pair = generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        keys[portal].privateKey = pair.privateKey;
        keys[portal].publicKey = pair.publicKey;
      }
    });

    return keys;
  }

  const missing = Object.entries(keys).filter(([, value]) => !value.privateKey || !value.publicKey);

  if (missing.length > 0) {
    const names = missing.map(([portal]) => portal).join(', ');
    throw new Error(
      `Missing JWT keys for portals: ${names}. Run "node scripts/generate-jwt-keys.js" and configure keys/.`
    );
  }

  return keys;
}

module.exports = {
  buildJwtConfig,
  loadPortalKeys,
};

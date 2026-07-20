const fs = require('fs');
const path = require('path');
const { generateKeyPairSync } = require('crypto');

const portals = ['customer', 'seller', 'admin', 'delivery'];
const keysDir = path.join(process.cwd(), 'keys');

if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

portals.forEach((portal) => {
  const privatePath = path.join(keysDir, `${portal}-private.pem`);
  const publicPath = path.join(keysDir, `${portal}-public.pem`);

  if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
    process.stdout.write(`Skipping ${portal} — keys already exist\n`);
    return;
  }

  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.writeFileSync(privatePath, pair.privateKey, { mode: 0o600 });
  fs.writeFileSync(publicPath, pair.publicKey, { mode: 0o644 });

  process.stdout.write(`Generated JWT keys for ${portal}\n`);
});

process.stdout.write(`JWT keys written to ${keysDir}\n`);

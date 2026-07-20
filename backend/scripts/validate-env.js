require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const config = require('../src/config');

function validateEnvironment() {
  const required = ['MONGODB_URI'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    valid: true,
    environment: config.env,
    port: config.port,
  };
}

try {
  const result = validateEnvironment();
  process.stdout.write(`Environment validation passed (${result.environment}, port ${result.port})\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}

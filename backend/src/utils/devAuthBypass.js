/**
 * Single switch for every "test convenience" auth shortcut: universal OTPs
 * (123456 / 999999 / ...), hard-coded seller passwords, and auto-approval of
 * sellers / delivery partners.
 *
 * Disabled unconditionally when NODE_ENV=production, and whenever
 * ALLOW_DEFAULT_OTP=false. Everything that previously read
 * `process.env.ALLOW_DEFAULT_OTP !== 'false'` directly must call this instead,
 * otherwise an unset variable silently turns the shortcut ON in production.
 */
function devAuthBypassAllowed() {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEFAULT_OTP !== 'false';
}

module.exports = { devAuthBypassAllowed };

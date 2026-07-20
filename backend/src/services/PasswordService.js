const bcrypt = require('bcrypt');
const { PASSWORD } = require('../constants/auth');
const { AppError } = require('../utils/AppError');

class PasswordService {
  async hash(plainText) {
    return bcrypt.hash(plainText, PASSWORD.BCRYPT_ROUNDS);
  }

  async compare(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  }

  validateStrength(password) {
    if (!password || password.length < PASSWORD.MIN_LENGTH) {
      throw AppError.validation('Password must be at least 8 characters long');
    }

    if (!PASSWORD.PATTERN.test(password)) {
      throw AppError.validation(
        'Password must include uppercase, lowercase, number, and special character'
      );
    }
  }

  isLocked(account) {
    return Boolean(account.lockUntil && account.lockUntil > new Date());
  }

  getLockoutRemainingMinutes(account) {
    if (!this.isLocked(account)) {
      return 0;
    }

    return Math.ceil((account.lockUntil.getTime() - Date.now()) / 60000);
  }

  shouldLockAccount(failedAttempts) {
    return failedAttempts >= PASSWORD.MAX_FAILED_ATTEMPTS;
  }

  getLockUntilDate() {
    return new Date(Date.now() + PASSWORD.LOCKOUT_MINUTES * 60 * 1000);
  }

  assertNotInHistory(password, passwordHistory = []) {
    const recent = passwordHistory.slice(-PASSWORD.HISTORY_COUNT);

    return recent.some(async (hash) => bcrypt.compare(password, hash));
  }

  async assertNotReused(password, passwordHistory = []) {
    const recent = passwordHistory.slice(-PASSWORD.HISTORY_COUNT);

    for (const hash of recent) {
      const matches = await bcrypt.compare(password, hash);
      if (matches) {
        throw AppError.validation('Password was used recently. Choose a different password.');
      }
    }
  }

  buildUpdatedHistory(currentHash, passwordHistory = []) {
    return [...passwordHistory, currentHash].slice(-PASSWORD.HISTORY_COUNT);
  }
}

module.exports = {
  PasswordService,
};

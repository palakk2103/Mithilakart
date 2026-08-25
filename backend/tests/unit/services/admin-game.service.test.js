const { AdminGameService } = require('../../../src/services/admin/AdminGameService');
const { DEFAULT_PLATFORM_SETTINGS } = require('../../../src/constants/platformSettings');

function build({ stored = {} } = {}) {
  const settings = { ...stored };

  const platformConfigService = {
    getConfig: jest.fn(async () => ({ ...DEFAULT_PLATFORM_SETTINGS, ...settings })),
  };

  const adminPlatformSettingsService = {
    updateSettings: jest.fn(async (updates) => {
      Object.assign(settings, updates);
      return Object.keys(updates);
    }),
  };

  return {
    service: new AdminGameService({ adminPlatformSettingsService, platformConfigService }),
    adminPlatformSettingsService,
    settings,
  };
}

describe('AdminGameService — "Catch Your Delivery" configuration', () => {
  describe('validation', () => {
    it('accepts a valid full settings patch', () => {
      const { service } = build();
      const clean = service.validate({
        gameEnabled: false,
        gameDurationSeconds: 60,
        gameMaxPlaysPerOrder: 2,
        gameWinProbability: 0.4,
        gameCoinRewardMin: 5,
        gameCoinRewardMax: 50,
      });

      expect(clean.gameEnabled).toBe(false);
      expect(clean.gameDurationSeconds).toBe(60);
      expect(clean.gameWinProbability).toBe(0.4);
    });

    it('rejects a duration outside the allowed range', () => {
      const { service } = build();
      expect(() => service.validate({ gameDurationSeconds: 200 })).toThrow('Invalid game settings');
      try {
        service.validate({ gameDurationSeconds: 200 });
      } catch (err) {
        expect(err.details[0]).toMatchObject({
          field: 'gameDurationSeconds',
          message: expect.stringContaining('between 15 and 90'),
        });
      }
    });

    it('rejects a win probability outside 0..1', () => {
      const { service } = build();
      expect(() => service.validate({ gameWinProbability: 1.5 })).toThrow();
      expect(() => service.validate({ gameWinProbability: -0.1 })).toThrow();
    });

    it('rejects a coin-reward min greater than the max', () => {
      const { service } = build();
      try {
        service.validate({ gameCoinRewardMin: 50, gameCoinRewardMax: 10 });
        throw new Error('expected validate() to throw');
      } catch (err) {
        expect(err.details).toContainEqual(
          expect.objectContaining({ message: expect.stringContaining('must not be greater than the maximum') })
        );
      }
    });

    it('accepts a min equal to the max', () => {
      const { service } = build();
      const clean = service.validate({ gameCoinRewardMin: 10, gameCoinRewardMax: 10 });
      expect(clean.gameCoinRewardMin).toBe(10);
      expect(clean.gameCoinRewardMax).toBe(10);
    });

    it('rejects a non-boolean for gameEnabled', () => {
      const { service } = build();
      try {
        service.validate({ gameEnabled: 'yes' });
        throw new Error('expected validate() to throw');
      } catch (err) {
        expect(err.details[0].message).toMatch(/true or false/);
      }
    });

    it('accepts a valid ISO date and null for campaign window fields', () => {
      const { service } = build();
      const clean = service.validate({
        gameStartsAt: '2026-09-01T00:00:00.000Z',
        gameExpiresAt: null,
      });
      expect(clean.gameStartsAt).toBe('2026-09-01T00:00:00.000Z');
      expect(clean.gameExpiresAt).toBeNull();
    });

    it('rejects an invalid date for a campaign window field', () => {
      const { service } = build();
      try {
        service.validate({ gameStartsAt: 'not-a-date' });
        throw new Error('expected validate() to throw');
      } catch (err) {
        expect(err.details[0].message).toMatch(/valid date/);
      }
    });

    it('rejects a key that is not a game setting', () => {
      const { service } = build();
      try {
        service.validate({ somethingElse: 1 });
        throw new Error('expected validate() to throw');
      } catch (err) {
        expect(err.details[0].message).toMatch(/is not a game setting/);
      }
    });

    it('rejects an empty or malformed payload', () => {
      const { service } = build();
      expect(() => service.validate({})).toThrow(/No settings provided/);
      expect(() => service.validate(null)).toThrow(/must be an object/);
    });
  });

  describe('getSettings / updateSettings', () => {
    it('returns the effective config plus validation ranges', async () => {
      const { service } = build();
      const result = await service.getSettings();

      expect(result.settings.gameEnabled).toBe(true);
      expect(result.ranges.gameDurationSeconds).toEqual({ min: 15, max: 90 });
    });

    it('writes through the existing settings service, not a new store', async () => {
      const { service, adminPlatformSettingsService } = build();

      await service.updateSettings({ gameDurationSeconds: 30 }, 'admin-1');

      expect(adminPlatformSettingsService.updateSettings).toHaveBeenCalledWith(
        { gameDurationSeconds: 30 },
        'admin-1'
      );
    });

    it('returns the updated effective settings after a write', async () => {
      const { service } = build();

      const result = await service.updateSettings({ gameWinProbability: 0.25 }, 'admin-1');

      expect(result.settings.gameWinProbability).toBe(0.25);
    });

    it('writes nothing when validation fails', async () => {
      const { service, adminPlatformSettingsService } = build();

      await expect(service.updateSettings({ gameWinProbability: 5 }, 'admin-1')).rejects.toThrow();
      expect(adminPlatformSettingsService.updateSettings).not.toHaveBeenCalled();
    });
  });
});

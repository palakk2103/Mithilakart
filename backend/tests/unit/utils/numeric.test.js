const { isFiniteNumber, toFiniteNumber } = require('../../../src/utils/numeric');

describe('numeric helpers', () => {
  describe('isFiniteNumber', () => {
    it('accepts real numbers, including zero and negatives', () => {
      for (const value of [0, -1, 1.5, 1e6, '42', '0']) {
        expect(isFiniteNumber(value)).toBe(true);
      }
    });

    it('rejects the values Number() silently coerces to a finite number', () => {
      // This is the whole point of the helper: each of these coerces to 0 or 1
      // under Number(), and so passes a naive Number.isFinite(Number(x)) check.
      for (const value of [null, '', false, true, []]) {
        expect(Number.isFinite(Number(value))).toBe(true);
        expect(isFiniteNumber(value)).toBe(false);
      }
    });

    it('rejects genuinely non-numeric values', () => {
      // undefined and {} coerce to NaN, so a naive check already rejects them;
      // they are covered here for completeness.
      for (const value of [undefined, 'abc', {}, NaN, Infinity, -Infinity]) {
        expect(isFiniteNumber(value)).toBe(false);
      }
    });
  });

  describe('toFiniteNumber', () => {
    it('returns the number when one is present', () => {
      expect(toFiniteNumber(5, 99)).toBe(5);
      expect(toFiniteNumber(0, 99)).toBe(0);
      expect(toFiniteNumber('7', 99)).toBe(7);
    });

    it('returns the fallback for absent values rather than 0', () => {
      expect(toFiniteNumber(null, 5)).toBe(5);
      expect(toFiniteNumber(undefined, 5)).toBe(5);
      expect(toFiniteNumber('', 5)).toBe(5);
    });

    it('defaults the fallback to null', () => {
      expect(toFiniteNumber(null)).toBeNull();
    });
  });
});

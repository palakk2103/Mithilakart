import React, { useEffect, useRef } from 'react';

const LENGTH = 6;

/**
 * Six one-digit boxes (AUTH-2). Typing moves forward, Backspace moves back,
 * pasting or SMS autofill ("one-time-code") fills every box at once.
 */
const OtpBoxes = ({ value = '', onChange, onComplete, disabled = false, autoFocus = true, accent = '#2E7D32', invalid = false }) => {
  const refs = useRef([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && !disabled) refs.current[Math.min(value.length, LENGTH - 1)]?.focus();
    // Focus only when the boxes appear, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled]);

  const commit = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, LENGTH);
    onChange(clean);
    if (clean.length === LENGTH) onComplete?.(clean);
    return clean;
  };

  const handleInput = (index, raw) => {
    const typed = raw.replace(/\D/g, '');
    if (!typed) return;
    if (typed.length > 1) {
      // Paste / autofill into any box: spread from that box onward.
      const clean = commit(value.slice(0, index) + typed);
      refs.current[Math.min(clean.length, LENGTH - 1)]?.focus();
      return;
    }
    const chars = digits.slice();
    chars[index] = typed;
    const clean = commit(chars.join(''));
    refs.current[Math.min(clean.length, LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    else if (e.key === 'ArrowRight' && index < LENGTH - 1) refs.current[index + 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2" role="group" aria-label="One-time password">
      {digits.map((digit, index) => (
        <input
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={index === 0 ? LENGTH : 1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => handleInput(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 max-w-[52px] h-11 sm:h-12 text-center text-[20px] font-bold text-[#321c13] bg-[#FFFdfa] rounded-xl border-2 outline-none transition-colors disabled:opacity-60"
          style={{ borderColor: invalid ? '#ef4444' : digit ? accent : `${accent}40` }}
        />
      ))}
    </div>
  );
};

export default OtpBoxes;

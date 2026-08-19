/**
 * CR-002 — incoming-offer ringtone controller.
 *
 * Replaces the fire-and-forget `playOrderAlert()` beep, which could not be
 * stopped, could not loop, and silently swallowed autoplay blocks so the seller
 * got no alert and the app reported none.
 *
 * Design rules this enforces:
 *   - Exactly one ringtone at a time. Starting while ringing is a no-op, so a
 *     burst of socket events cannot stack oscillators or timers.
 *   - Stopping is always safe and always complete (accept / reject / timeout /
 *     cancel / offer replaced / unmount).
 *   - Autoplay blocks are REPORTED, never faked. `start()` resolves to the
 *     honest state so the UI can show a visual fallback and an enable control.
 *
 * Uses the Web Audio API rather than an asset file: no binary to ship, no 404
 * risk, and the tone is synthesised identically on every browser.
 */

const RING_INTERVAL_MS = 2000;

let ctx = null;
let intervalId = null;
let ringing = false;
let unlocked = false;
const listeners = new Set();

/** 'idle' | 'ringing' | 'blocked' */
let state = 'idle';

function notify() {
  for (const fn of listeners) {
    try { fn(state); } catch { /* a bad subscriber must not break audio */ }
  }
}

function setState(next) {
  if (state === next) return;
  state = next;
  notify();
}

export function subscribeRingtone(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getRingtoneState() {
  return state;
}

function getCtx() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** One two-tone chirp. Scheduled entirely on the audio clock, not setTimeout. */
function chirp() {
  const audio = getCtx();
  if (!audio || audio.state !== 'running') return;

  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.connect(audio.destination);

  // Envelope: quick attack, hold, quick release — audible without clipping.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  gain.gain.setValueAtTime(0.3, now + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);

  const osc = audio.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.setValueAtTime(1180, now + 0.16);
  osc.frequency.setValueAtTime(880, now + 0.32);
  osc.frequency.setValueAtTime(1180, now + 0.48);

  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.65);

  // Release the node graph once the sound has finished.
  osc.onended = () => {
    try { osc.disconnect(); gain.disconnect(); } catch { /* already torn down */ }
  };
}

/**
 * Starts the ringtone.
 * @returns {Promise<'ringing'|'blocked'|'unsupported'>} the REAL outcome.
 */
export async function startRingtone() {
  const audio = getCtx();
  if (!audio) {
    setState('blocked');
    return 'unsupported';
  }

  // Already ringing — do not stack a second loop.
  if (ringing) return state === 'blocked' ? 'blocked' : 'ringing';

  if (audio.state === 'suspended') {
    try {
      await audio.resume();
    } catch {
      // Autoplay policy refused us. Say so, so the UI can fall back to visual.
      setState('blocked');
      return 'blocked';
    }
  }

  if (audio.state !== 'running') {
    setState('blocked');
    return 'blocked';
  }

  unlocked = true;
  ringing = true;
  setState('ringing');

  chirp();
  intervalId = setInterval(chirp, RING_INTERVAL_MS);
  return 'ringing';
}

/** Stops the ringtone. Safe to call at any time, any number of times. */
export function stopRingtone() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  ringing = false;
  setState('idle');
}

/**
 * Call from a real user gesture (click/tap) to satisfy the autoplay policy.
 * Resumes the context and, if an offer is still live, resumes ringing.
 * @returns {Promise<boolean>} whether audio is now genuinely usable.
 */
export async function enableRingtoneAudio({ resume = false } = {}) {
  const audio = getCtx();
  if (!audio) return false;

  try {
    if (audio.state === 'suspended') await audio.resume();
  } catch {
    return false;
  }

  if (audio.state !== 'running') return false;

  unlocked = true;
  if (resume && !ringing) {
    await startRingtone();
  } else if (!ringing) {
    setState('idle');
  }
  return true;
}

export function isRingtoneUnlocked() {
  return unlocked;
}

/** Test seam — resets module state between specs. */
export function __resetRingtoneForTests() {
  stopRingtone();
  ctx = null;
  unlocked = false;
  state = 'idle';
  listeners.clear();
}

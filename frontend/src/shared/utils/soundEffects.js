/**
 * soundEffects.js
 * Zero-dependency Web Audio API synthesizer for in-app auditory feedback.
 * Guaranteed to play cleanly without external MP3 asset loads or 404s.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
  }

  _initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Pleasant two-tone success chord (C5 -> E5 -> G5)
   */
  playSuccess() {
    try {
      const ctx = this._initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch {
      // Ignore audio synthesis errors on locked autoplay policies
    }
  }

  /**
   * Subtle alert chime for incoming updates & OTP arrivals (A5 -> D6)
   */
  playNotification() {
    try {
      const ctx = this._initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [880, 1174.66]; // A5, D6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.4);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Joyful delivery fanfare for final delivery celebration
   */
  playDeliveredFanfare() {
    try {
      const ctx = this._initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const sequence = [
        { freq: 523.25, time: 0, dur: 0.15 },    // C5
        { freq: 659.25, time: 0.12, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.24, dur: 0.15 }, // G5
        { freq: 1046.5, time: 0.36, dur: 0.45 }, // C6
      ];

      sequence.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.2, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Repeating incoming order bell for seller merchant portal (rings every 2.5s until dismissed)
   */
  startOrderAlertSiren() {
    if (this._sirenTimer) return;
    this.playNotification();
    this._sirenTimer = setInterval(() => {
      this.playNotification();
    }, 2800);
  }

  stopOrderAlertSiren() {
    if (this._sirenTimer) {
      clearInterval(this._sirenTimer);
      this._sirenTimer = null;
    }
  }
}

export const soundEffects = new SoundSynthesizer();


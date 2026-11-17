import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useActiveTabThemes } from '../theme/tabThemes';
import { effectsLive, normalizeEffects } from '../theme/effects';
import EffectLayer from '../theme/EffectLayer';
import ThemeIcon from '../theme/ThemeIcon';
import useTabTheme from '../hooks/useTabTheme';

// Admin / seller / delivery portals and the focused auth + payment screens stay calm.
const QUIET_PREFIXES = ['/admin', '/seller', '/delivery', '/login', '/signup', '/forgot-password', '/checkout', '/vendor/checkout'];

const OFF_KEY = 'mk_fx_off';
const OFF_FOR_MS = 7 * 24 * 60 * 60 * 1000; // re-test the device after a week
const SLOW_FRAME_MS = 34;                    // average slower than ~30fps = this device cannot afford the effect

const readOff = () => {
  try { return Date.now() - Number(localStorage.getItem(OFF_KEY) || 0) < OFF_FOR_MS; } catch { return false; }
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ));
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
};

/** True while the shopper is scrolling or the page just changed; the animation freezes so the app stays smooth. */
const useBusy = (resetKey) => {
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    const pause = (ms) => {
      setBusy(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBusy(false), ms);
    };
    const onScroll = () => pause(180);
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    pause(900); // route / tab change: let the new screen render first
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      clearTimeout(timer.current);
    };
  }, [resetKey]);
  return busy;
};

/**
 * Frame-rate governor: after the page has settled, sample ~2s of frames. If this device
 * averages under ~30fps the effect switches itself off (and stays off for a week), so a
 * slow phone never gets a laggy app because of a decoration.
 */
const useFrameGovernor = (enabled, onSlow) => {
  useEffect(() => {
    if (!enabled) return undefined;
    let raf = 0;
    let startTimer = 0;
    let cancelled = false;
    startTimer = setTimeout(() => {
      const dts = [];
      let last = performance.now();
      const t0 = last;
      const tick = (now) => {
        if (cancelled) return;
        if (!document.hidden) dts.push(now - last);
        last = now;
        if (now - t0 < 2200) { raf = requestAnimationFrame(tick); return; }
        const usable = dts.slice(3); // ignore the first frames
        const avg = usable.reduce((a, b) => a + b, 0) / Math.max(1, usable.length);
        if (usable.length > 20 && avg > SLOW_FRAME_MS) onSlow();
      };
      raf = requestAnimationFrame(tick);
    }, 3000);
    return () => { cancelled = true; clearTimeout(startTimer); cancelAnimationFrame(raf); };
  }, [enabled, onSlow]);
};

/** Full-screen animation + optional announcement pill, all from the admin theme. */
const SeasonalEffects = () => {
  const themes = useActiveTabThemes();
  const { pathname } = useLocation();
  const { activeFlow, primaryHex } = useTabTheme();
  const reduced = usePrefersReducedMotion();
  const effects = useMemo(() => normalizeEffects(themes?.effects), [themes]);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('mk_fx_banner') || ''; } catch { return ''; }
  });
  const [slowDevice, setSlowDevice] = useState(readOff);

  const quiet = QUIET_PREFIXES.some((p) => pathname.startsWith(p));
  const onThisTab = effects.tabs.length === 0 || effects.tabs.includes(activeFlow);
  const live = effectsLive(effects) && onThisTab && !quiet;
  const animate = live && !reduced && !slowDevice;

  const busy = useBusy(`${pathname}|${activeFlow}`);
  // Stable callback: the governor's timers must not restart on every re-render.
  const onSlow = useCallback(() => {
    try { localStorage.setItem(OFF_KEY, String(Date.now())); } catch { /* ignore */ }
    setSlowDevice(true);
  }, []);
  useFrameGovernor(animate, onSlow);

  if (!live) return null;

  const bannerText = effects.banner.enabled ? effects.banner.text.trim() : '';
  const bannerId = `${effects.type}:${bannerText}`;

  return (
    <>
      {animate && <EffectLayer effects={effects} paused={busy} />}
      {bannerText && dismissed !== bannerId && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-[84px] md:bottom-6 z-[45] max-w-[92vw] flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-full text-white text-[13px] font-semibold shadow-[0_10px_28px_-8px_rgba(0,0,0,.45)]"
          style={{ background: primaryHex }}
        >
          <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><ThemeIcon name={effects.banner.icon} size={16} /></span>
          <span className="truncate">{bannerText}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
              setDismissed(bannerId);
              try { sessionStorage.setItem('mk_fx_banner', bannerId); } catch { /* ignore */ }
            }}
            className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
};

export default SeasonalEffects;

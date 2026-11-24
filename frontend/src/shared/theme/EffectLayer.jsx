import { useMemo } from 'react';
import { effectsLive, normalizeEffects, seeded, typeInfo } from './effects';
import { ThemeShape } from './ThemeIcon';

/**
 * PERFORMANCE RULES — this layer sits over the whole app, so it must cost ~nothing:
 *  - animations are transform / opacity only, with LITERAL keyframe values. (var()/calc()/cq-units
 *    inside keyframes push the animation onto the main thread and freeze the whole app.)
 *  - ONE animation per particle; no blur()/drop-shadow() filters; no animated gradients;
 *  - a hard cap on particle count, lower again on weaker phones;
 *  - NO css `contain` on the wrapper: measured, contain:strict dropped the app from ~55fps to ~14fps.
 * The travel distance is baked into the keyframes: viewport units on the page, pixels in the admin preview.
 */
const kf = (H) => {
  const n = parseFloat(H);
  const u = String(H).replace(/[\d.]/g, '');
  const y = (f) => `${(n * f).toFixed(1)}${u}`;
  return `
@keyframes mk-fall-a{0%{transform:translate3d(0,${y(-0.12)},0) rotate(0)}25%{transform:translate3d(14px,${y(0.2)},0) rotate(90deg)}50%{transform:translate3d(-14px,${y(0.5)},0) rotate(180deg)}75%{transform:translate3d(14px,${y(0.8)},0) rotate(270deg)}100%{transform:translate3d(0,${y(1.12)},0) rotate(360deg)}}
@keyframes mk-fall-b{0%{transform:translate3d(0,${y(-0.12)},0) rotate(0)}25%{transform:translate3d(-14px,${y(0.2)},0) rotate(-90deg)}50%{transform:translate3d(14px,${y(0.5)},0) rotate(-180deg)}75%{transform:translate3d(-14px,${y(0.8)},0) rotate(-270deg)}100%{transform:translate3d(0,${y(1.12)},0) rotate(-360deg)}}
@keyframes mk-drift-a{0%{transform:translate3d(0,${y(-0.12)},0)}25%{transform:translate3d(16px,${y(0.2)},0)}50%{transform:translate3d(-8px,${y(0.5)},0)}75%{transform:translate3d(14px,${y(0.8)},0)}100%{transform:translate3d(-6px,${y(1.12)},0)}}
@keyframes mk-drift-b{0%{transform:translate3d(0,${y(-0.12)},0)}25%{transform:translate3d(-16px,${y(0.2)},0)}50%{transform:translate3d(8px,${y(0.5)},0)}75%{transform:translate3d(-14px,${y(0.8)},0)}100%{transform:translate3d(6px,${y(1.12)},0)}}
@keyframes mk-flutter{0%{transform:translate3d(0,${y(-0.12)},0) rotate3d(1,.4,0,-55deg)}25%{transform:translate3d(18px,${y(0.2)},0) rotate3d(1,.4,0,55deg) rotate(80deg)}50%{transform:translate3d(-18px,${y(0.5)},0) rotate3d(1,.4,0,-55deg) rotate(160deg)}75%{transform:translate3d(18px,${y(0.8)},0) rotate3d(1,.4,0,55deg) rotate(240deg)}100%{transform:translate3d(0,${y(1.12)},0) rotate3d(1,.4,0,-55deg) rotate(320deg)}}
@keyframes mk-flip{0%{transform:translate3d(0,${y(-0.12)},0) rotateX(0)}25%{transform:translate3d(12px,${y(0.2)},0) rotateX(180deg)}50%{transform:translate3d(-12px,${y(0.5)},0) rotateX(360deg)}75%{transform:translate3d(12px,${y(0.8)},0) rotateX(540deg)}100%{transform:translate3d(0,${y(1.12)},0) rotateX(720deg)}}
@keyframes mk-rain{0%{transform:translate3d(0,${y(-0.12)},0)}100%{transform:translate3d(-24px,${y(1.12)},0)}}
@keyframes mk-rise{0%{transform:translate3d(0,${y(1.12)},0)}50%{transform:translate3d(14px,${y(0.5)},0)}100%{transform:translate3d(-6px,${y(-0.12)},0)}}
@keyframes mk-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(12px,${y(-0.05)},0)}}
@keyframes mk-twinkle{0%,100%{opacity:.1;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}
@keyframes mk-burst{0%{opacity:0;transform:scale(.35)}30%{opacity:.55}100%{opacity:0;transform:scale(1.8)}}
@keyframes mk-shoot{0%,86%{opacity:0;transform:translate3d(0,0,0) rotate(28deg)}88%{opacity:1}100%{opacity:0;transform:translate3d(-260px,${y(0.3)},0) rotate(28deg)}}
@keyframes mk-spin{to{transform:rotate(360deg)}}
.mk-fx[data-paused="true"] *{animation-play-state:paused !important}
@media (prefers-reduced-motion: reduce){.mk-fx *{animation-duration:.01ms !important;animation-iteration-count:1 !important}}
`;
};

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

const CrystalFlake = ({ c }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round">
    {[0, 60, 120].map((r) => (
      <g key={r} transform={`rotate(${r} 12 12)`}><path d="M12 1.8v20.4M12 6l-2.8-2.6M12 6l2.8-2.6M12 18l-2.8 2.6M12 18l2.8 2.6M12 11.2l-1.6-1.4M12 11.2l1.6-1.4" /></g>
    ))}
    <circle cx="12" cy="12" r="1.3" fill={c} />
  </svg>
);

const Sparkle = ({ c }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%"><path fill={c} d="M12 0C12.7 7.5 16.5 11.3 24 12C16.5 12.7 12.7 16.5 12 24C11.3 16.5 7.5 12.7 0 12C7.5 11.3 11.3 7.5 12 0Z" /></svg>
);

const Petal = ({ idx }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path fill={`url(#mk-pg-${idx})`} d="M12 1C20 6 20 17 12 23 4 17 4 6 12 1Z" />
    <path stroke="#fff" strokeOpacity=".4" strokeWidth=".8" fill="none" d="M12 4v16" />
  </svg>
);

/** Rays are their own element so the rotation is a compositor transform (not an SVG repaint). */
const SunArt = ({ size }) => (
  <div style={{ position: 'absolute', top: -size * 0.33, right: -size * 0.33, width: size, height: size }}>
    <svg viewBox="0 0 240 240" width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="mk-sunglow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFF3B0" /><stop offset=".45" stopColor="#FFD166" stopOpacity=".7" /><stop offset="1" stopColor="#FFB703" stopOpacity="0" /></radialGradient>
        <radialGradient id="mk-suncore" cx="42%" cy="38%" r="65%"><stop offset="0" stopColor="#FFF6C8" /><stop offset=".6" stopColor="#FFD24A" /><stop offset="1" stopColor="#FFAE1A" /></radialGradient>
      </defs>
      <circle cx="120" cy="120" r="118" fill="url(#mk-sunglow)" />
      <circle cx="120" cy="120" r="46" fill="url(#mk-suncore)" />
    </svg>
    <svg viewBox="0 0 240 240" width={size} height={size} style={{ position: 'absolute', inset: 0, willChange: 'transform', animation: 'mk-spin 90s linear infinite' }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <rect key={i} x="118" y="14" width="4" height={i % 2 ? 16 : 26} rx="2" fill="#FFC531" opacity=".8" transform={`rotate(${i * 15} 120 120)`} />
      ))}
    </svg>
  </div>
);

function Particle({ p, anim, children }) {
  return (
    <span style={{
      position: 'absolute', left: `${p.x}%`, top: 0, width: p.size, height: p.size, opacity: p.opacity,
      animation: `${anim} ${p.dur}s linear ${p.delay}s infinite`, willChange: 'transform',
    }}>
      {children}
    </span>
  );
}

// Weaker phones get fewer particles. (deviceMemory / hardwareConcurrency are absent on iOS → full count.)
const performanceFactor = () => {
  if (typeof navigator === 'undefined') return 1;
  const weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  return weak ? 0.6 : 1;
};

const EffectLayer = ({ effects, fixed = true, force = false, height = 520, paused = false }) => {
  const e = useMemo(() => normalizeEffects(effects), [effects]);
  const info = typeInfo(e.type);
  const colors = e.colors.length ? e.colors : (info.colors || ['#ffffff']);
  const colorKey = colors.join(',');
  const shapeKey = e.shapes.join('|');
  const travel = fixed ? '100vh' : `${height}px`;
  const keyframes = useMemo(() => kf(travel), [travel]);

  const items = useMemo(() => {
    const r = seeded(e.type.length * 7919 + e.intensity * 131 + e.size * 17 + 11);
    const base = { snow: 4, rain: 6, summer: 3, diwali: 4, holi: 2, petals: 3, confetti: 4, stars: 5, custom: 3 }[e.type] || 0;
    const count = Math.min(18, Math.max(1, Math.round(base * e.intensity * performanceFactor())));
    const speedF = 1.75 - e.speed * 0.27;
    const sizeF = 0.65 + e.size * 0.2;
    return Array.from({ length: count }, (_, i) => {
      const depth = r();
      const near = depth > 0.8;
      const far = depth < 0.45;
      return {
        i, depth, near, far,
        x: r() * 100, top: r() * 100,
        size: 10 * sizeF,
        dur: 12 * speedF * (far ? 1.35 : near ? 0.8 : 1) * (0.8 + r() * 0.6),
        delay: -r() * 16,
        side: r() < 0.5 ? 'a' : 'b',
        opacity: far ? 0.55 + r() * 0.2 : 0.85 + r() * 0.15,
        colorIdx: Math.floor(r() * colors.length),
        color: pick(r, colors),
        shape: e.shapes.length ? pick(r, e.shapes) : 'sparkle',
        len: 10 + r() * 20,
        twinkle: 2 + r() * 3,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.type, e.intensity, e.speed, e.size, colorKey, shapeKey]);

  if (!force && !effectsLive(e)) return null;
  if (e.type === 'none') return null;

  const wrap = { position: fixed ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: fixed ? 40 : 1 };

  // Static gradients (painted once) — never animated.
  const ambient = !e.ambient ? null : {
    snow: 'radial-gradient(120% 55% at 50% -12%, rgba(176,214,250,.42), transparent 62%), linear-gradient(to top, rgba(222,240,255,.38), transparent 18%)',
    summer: 'radial-gradient(75% 55% at 100% 0%, rgba(255,196,70,.34), transparent 66%)',
    rain: 'linear-gradient(to bottom, rgba(96,135,184,.16), transparent 50%)',
    diwali: 'radial-gradient(90% 40% at 50% 104%, rgba(255,168,0,.26), transparent 70%), radial-gradient(70% 30% at 50% -6%, rgba(255,196,90,.18), transparent 70%)',
    holi: 'radial-gradient(60% 40% at 0% 0%, rgba(255,79,163,.16), transparent 70%), radial-gradient(60% 40% at 100% 100%, rgba(0,176,255,.16), transparent 70%)',
    petals: 'radial-gradient(85% 40% at 50% -4%, rgba(255,166,43,.18), transparent 70%)',
    stars: 'linear-gradient(to bottom, rgba(18,22,66,.22), transparent 42%)',
  }[e.type];

  return (
    <>
    {/* On the live app the colour wash sits BEHIND the page (content is z-10+). Above it, it bleached
        buttons and prices near the screen edges, e.g. "Proceed to Checkout" on the cart. */}
    {ambient && fixed && <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none', background: ambient }} />}
    <div className="mk-fx" style={wrap} aria-hidden="true" data-testid="effect-layer" data-effect={e.type} data-paused={paused ? 'true' : 'false'}>
      <style>{keyframes}</style>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {colors.map((c, i) => (
            <linearGradient key={i} id={`mk-pg-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={c} /><stop offset="1" stopColor={c} stopOpacity=".55" />
            </linearGradient>
          ))}
        </defs>
      </svg>
      {ambient && !fixed && <div style={{ position: 'absolute', inset: 0, background: ambient }} />}

      {e.type === 'summer' && (
        <>
          <SunArt size={210 + e.size * 18} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: 'absolute', top: -30, right: 40 + i * 70, width: 40 + i * 14, height: '90%', transformOrigin: 'top right', transform: `rotate(${-24 + i * 10}deg)`, background: 'linear-gradient(to bottom, rgba(255,236,170,.4), transparent 80%)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 50%, transparent)', maskImage: 'linear-gradient(to right, transparent, #000 50%, transparent)' }} />
          ))}
        </>
      )}
      {e.type === 'stars' && (
        <>
          <div style={{ position: 'absolute', top: 14, right: 18, width: 38 + e.size * 6, height: 38 + e.size * 6 }}>
            <svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="11.5" fill="#FFE9A8" opacity=".18" /><path fill={colors[0]} d="M20.5 13.2A8.6 8.6 0 1110.8 3.5a6.7 6.7 0 009.7 9.7z" /></svg>
          </div>
          <span style={{ position: 'absolute', top: '8%', right: '10%', width: 90, height: 2, borderRadius: 2, background: 'linear-gradient(to right, transparent, #fff)', animation: 'mk-shoot 9s linear infinite', willChange: 'transform, opacity' }} />
        </>
      )}

      {items.map((p) => {
        switch (e.type) {
          case 'snow':
            if (p.near) {
              return <Particle key={p.i} p={{ ...p, size: p.size * 2.2 }} anim={`mk-fall-${p.side}`}><CrystalFlake c={p.color} /></Particle>;
            }
            return (
              <Particle key={p.i} p={{ ...p, size: p.size * (p.far ? 0.4 : 0.75) }} anim={`mk-drift-${p.side}`}>
                <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, #e3f1ff 55%, #bcdcf7)', boxShadow: '0 0 0 1px rgba(150,195,240,.5)' }} />
              </Particle>
            );
          case 'petals':
            return <Particle key={p.i} p={{ ...p, size: p.size * (p.near ? 2.2 : 1.6) }} anim="mk-flutter"><Petal idx={p.colorIdx} /></Particle>;
          case 'confetti':
            return (
              <Particle key={p.i} p={{ ...p, size: p.size * 0.7 }} anim="mk-flip">
                <span style={{ display: 'block', width: '100%', height: p.i % 3 ? '170%' : '100%', background: p.color, borderRadius: p.i % 3 ? 1.5 : '50%' }} />
              </Particle>
            );
          case 'rain':
            return (
              <Particle key={p.i} p={{ ...p, size: 2, dur: (p.far ? 1.9 : p.near ? 0.85 : 1.3) * (1.5 - e.speed * 0.15) }} anim="mk-rain">
                <span style={{ display: 'block', width: p.near ? 2 : 1.4, height: p.len + e.size * 3, borderRadius: 2, background: `linear-gradient(to bottom, transparent, ${p.color})`, transform: 'rotate(8deg)' }} />
              </Particle>
            );
          case 'summer':
            return (
              <Particle key={p.i} p={{ ...p, size: p.size * (p.near ? 1.3 : 0.8), dur: p.dur * 1.5 }} anim="mk-rise">
                <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, ${p.color}, transparent 72%)` }} />
              </Particle>
            );
          case 'diwali':
            return p.i % 3 === 0 ? (
              <Particle key={p.i} p={{ ...p, size: p.size * 0.7, dur: p.dur * 1.8 }} anim="mk-rise">
                <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, ${p.color}, transparent 70%)` }} />
              </Particle>
            ) : (
              <span key={p.i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.top}%`, width: p.size * (p.near ? 1.4 : 0.9), height: p.size * (p.near ? 1.4 : 0.9), animation: `mk-twinkle ${p.twinkle}s ease-in-out ${p.delay}s infinite`, willChange: 'transform, opacity' }}><Sparkle c={p.color} /></span>
            );
          case 'stars':
            return (
              <span key={p.i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.top * 0.8}%`, width: p.size * (p.near ? 1.1 : 0.55), height: p.size * (p.near ? 1.1 : 0.55), animation: `mk-twinkle ${p.twinkle}s ease-in-out ${p.delay}s infinite`, willChange: 'transform, opacity' }}><Sparkle c={p.color} /></span>
            );
          case 'holi':
            return (
              <span key={p.i} style={{ position: 'absolute', left: `${p.x - 10}%`, top: `${p.top - 10}%`, width: 120 + p.depth * 100, height: 120 + p.depth * 100, borderRadius: '50%', background: `radial-gradient(circle, ${p.color}, transparent 66%)`, animation: `mk-burst ${5 + p.depth * 5}s ease-out ${p.delay}s infinite`, willChange: 'transform, opacity' }} />
            );
          case 'custom':
            return <Particle key={p.i} p={{ ...p, size: p.size * (p.near ? 2.4 : 1.7) }} anim={e.motion === 'float' ? 'mk-float' : e.motion === 'rise' ? 'mk-rise' : `mk-fall-${p.side}`}><ThemeShape name={p.shape} color={p.color} /></Particle>;
          default:
            return null;
        }
      })}
    </div>
    </>
  );
};

export default EffectLayer;

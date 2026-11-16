import { useId } from 'react';

/**
 * Illustrated scenes for the seasonal hero banner (vector, resolution independent).
 * Each scene is drawn on a 220×150 canvas and sits on the right of the banner, leaving
 * the left for the headline. Colours borrow the active tab's accent where it helps.
 */

const Pine = ({ x, y, s = 1, snow = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-2.5" y="22" width="5" height="9" fill="#6B4A2B" />
    {[[0, 22, 17], [-1, 12, 14], [-2, 2, 11]].map(([dx, dy, w], i) => (
      <g key={i}>
        <polygon points={`${dx - w},${dy} ${dx},${dy - 17} ${dx + w},${dy}`} fill={i % 2 ? '#2F8F83' : '#1F7A70'} />
        {snow && <polygon points={`${dx - w * 0.62},${dy - 6} ${dx},${dy - 17} ${dx + w * 0.62},${dy - 6} ${dx + w * 0.3},${dy - 8} ${dx},${dy - 5} ${dx - w * 0.3},${dy - 8}`} fill="#fff" />}
      </g>
    ))}
  </g>
);

const Diya = ({ x, y, s = 1, id }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx="0" cy="-12" r="20" fill={`url(#${id}-glow)`} />
    <path d="M-17 0h34a17 12 0 01-17 12 17 12 0 01-17-12z" fill={`url(#${id}-clay)`} />
    <path d="M-17 0h34" stroke="#FFD08A" strokeWidth="2" strokeLinecap="round" />
    <path d="M0-24c4.500 5 6.500 8.500 6.500 12A6.500 6.500 0 010-5.500 6.500 6.500 0 01-6.500-12c0-3.500 2-7 6.500-12z" fill="#FFB300" />
    <path d="M0-18c2.200 2.600 3.300 4.500 3.300 6.500A3.300 3.300 0 010-8.200 3.300 3.300 0 01-3.300-11.500c0-2 1.100-3.900 3.300-6.500z" fill="#FFF3B0" />
  </g>
);

const Lantern = ({ x, y, s = 1, body = '#E53935' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0-30v14" stroke="#FFD08A" strokeWidth="1.6" />
    <rect x="-9" y="-16" width="18" height="4" rx="1.5" fill="#F7C948" />
    <path d="M-10-12h20l3 22a13 5 0 01-26 0z" fill={body} />
    <path d="M-5-12l-2 22M0-12v24M5-12l2 22" stroke="#FFD08A" strokeOpacity=".7" strokeWidth="1" />
    <rect x="-8" y="13" width="16" height="3" rx="1.5" fill="#F7C948" />
    <path d="M0 16v10M-2 26h4" stroke="#F7C948" strokeWidth="1.5" strokeLinecap="round" />
  </g>
);

const Marigold = ({ x, y, r = 22, id }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 18 }).map((_, i) => (
      <ellipse key={i} cx="0" cy={-r * 0.62} rx={r * 0.2} ry={r * 0.42} fill={i % 2 ? '#FFB02E' : '#FF9500'} transform={`rotate(${i * 20})`} />
    ))}
    {Array.from({ length: 12 }).map((_, i) => (
      <ellipse key={i} cx="0" cy={-r * 0.38} rx={r * 0.15} ry={r * 0.28} fill="#FFC857" transform={`rotate(${i * 30 + 10})`} />
    ))}
    <circle r={r * 0.2} fill={`url(#${id}-core)`} />
  </g>
);

const SCENES = {
  snow: ({ id }) => (
    <>
      <defs>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="170" cy="34" r="34" fill={`url(#${id}-moon)`} /><circle cx="170" cy="34" r="15" fill="#FFF8E1" />
      <path d="M0 116Q52 88 112 110T220 98V150H0z" fill="#fff" opacity=".5" />
      <Pine x={128} y={104} s={0.7} /><Pine x={190} y={100} s={0.8} />
      <path d="M0 134Q62 106 132 128T220 116V150H0z" fill="#fff" />
      <Pine x={152} y={110} s={1.15} /><Pine x={96} y={122} s={0.8} /><Pine x={205} y={116} s={0.95} />
      {[[30, 30, 2], [62, 52, 1.6], [96, 22, 1.8], [118, 56, 1.4], [200, 70, 1.6], [14, 80, 1.5], [80, 90, 1.4]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" opacity=".85" />)}
    </>
  ),
  summer: ({ id }) => (
    <>
      <defs>
        <radialGradient id={`${id}-sun`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#FFF6C8" /><stop offset="1" stopColor="#FFB020" /></radialGradient>
      </defs>
      <circle cx="165" cy="44" r="40" fill="#FFE08A" opacity=".28" />
      {Array.from({ length: 16 }).map((_, i) => <rect key={i} x="164" y="4" width="3" height="12" rx="1.5" fill="#FFD166" transform={`rotate(${i * 22.5} 165.500 44)`} />)}
      <circle cx="165" cy="44" r="23" fill={`url(#${id}-sun)`} />
      <path d="M0 112q18-9 36 0t36 0 36 0 36 0 36 0 36 0V150H0z" fill="#fff" opacity=".35" />
      <path d="M0 122q18-9 36 0t36 0 36 0 36 0 36 0 36 0V150H0z" fill="#fff" opacity=".28" />
      <path d="M0 140q80-14 220 2V150H0z" fill="#F6D79B" />
      <path d="M62 142Q66 112 76 84" stroke="#8B5A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
      {[[-30, -4], [-20, -22], [0, -26], [22, -16], [32, 2]].map(([dx, dy], i) => <path key={i} d={`M76 84q${dx * 0.5} ${dy - 10} ${dx} ${dy + 6}q${-dx * 0.4} ${-10} ${-dx} ${-6}z`} fill={i % 2 ? '#2E9E5B' : '#3DB46D'} />)}
      <circle cx="74" cy="90" r="3" fill="#7A4A1E" /><circle cx="80" cy="91" r="3" fill="#7A4A1E" />
    </>
  ),
  rain: ({ id, accent }) => (
    <>
      <g fill="#fff" opacity=".7"><circle cx="118" cy="44" r="11" /><circle cx="134" cy="38" r="15" /><circle cx="152" cy="46" r="11" /><rect x="112" y="44" width="48" height="12" rx="6" /></g>
      <g fill="#fff" opacity=".95"><circle cx="156" cy="30" r="13" /><circle cx="176" cy="22" r="18" /><circle cx="198" cy="32" r="13" /><rect x="150" y="30" width="58" height="14" rx="7" /></g>
      {Array.from({ length: 16 }).map((_, i) => <path key={i} d={`M${112 + i * 6.500} ${62 + (i % 3) * 8}l-3 12`} stroke="#DCEBFF" strokeWidth="1.600" strokeLinecap="round" opacity={0.55 + (i % 3) * 0.15} />)}
      <path d="M128 112a32 32 0 0164 0q-8-7-16 0-8-7-16 0-8-7-16 0-8-7-16 0z" fill={accent} />
      <path d="M160 112v24q0 5 5 5t5-5" stroke="#fff" strokeWidth="2.600" strokeLinecap="round" fill="none" />
      <ellipse cx="160" cy="146" rx="44" ry="4.500" fill="#fff" opacity=".35" />
      <ellipse cx="160" cy="146" rx="20" ry="2" fill="none" stroke="#fff" strokeOpacity=".6" />
    </>
  ),
  diwali: ({ id }) => (
    <>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFD86B" stopOpacity=".9" /><stop offset="1" stopColor="#FFB300" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-clay`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2A03D" /><stop offset="1" stopColor="#C8641A" /></linearGradient>
      </defs>
      <Lantern x={186} y={34} s={1} body="#E0392D" /><Lantern x={146} y={20} s={0.72} body="#F59E0B" />
      <g opacity=".5" fill="#fff"><circle cx="112" cy="128" r="22" opacity=".25" />{Array.from({ length: 8 }).map((_, i) => <ellipse key={i} cx="112" cy="116" rx="4" ry="9" transform={`rotate(${i * 45} 112 128)`} />)}</g>
      <Diya x={92} y={126} s={0.9} id={id} /><Diya x={132} y={134} s={1.1} id={id} /><Diya x={176} y={128} s={0.85} id={id} />
      {[[60, 40, 5], [108, 62, 4], [200, 88, 4], [34, 100, 3.500], [150, 70, 3]].map(([cx, cy, r], i) => <path key={i} transform={`translate(${cx} ${cy}) scale(${r / 12})`} d="M0-12C1-3 3 -1 12 0 3 1 1 3 0 12-1 3-3 1-12 0-3-1-1-3 0-12z" fill="#FFE9A8" />)}
    </>
  ),
  holi: ({ id }) => (
    <>
      <defs>
        {[['pink', '#FF4FA3'], ['blue', '#00B0FF'], ['yellow', '#FFC400'], ['green', '#2EC27E'], ['purple', '#7C4DFF']].map(([n, c]) => (
          <radialGradient key={n} id={`${id}-${n}`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={c} stopOpacity=".95" /><stop offset=".7" stopColor={c} stopOpacity=".7" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
        ))}
      </defs>
      {[[135, 44, 44, 'pink'], [185, 56, 40, 'blue'], [160, 100, 42, 'yellow'], [112, 96, 34, 'green'], [200, 112, 34, 'purple'], [96, 38, 26, 'blue']].map(([cx, cy, r, n], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={`url(#${id}-${n})`} />)}
      {Array.from({ length: 26 }).map((_, i) => {
        const a = i * 0.9; const rr = 30 + ((i * 37) % 70);
        return <circle key={i} cx={150 + Math.cos(a) * rr * 0.95} cy={74 + Math.sin(a) * rr * 0.62} r={1.4 + (i % 3)} fill={['#FF4FA3', '#00B0FF', '#FFC400', '#2EC27E', '#7C4DFF'][i % 5]} />;
      })}
    </>
  ),
  petals: ({ id }) => (
    <>
      <defs><radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#8A4B08" /><stop offset="1" stopColor="#B8650E" /></radialGradient></defs>
      <path d="M60 150q40-34 92-40" stroke="#3E8E41" strokeWidth="3.500" fill="none" strokeLinecap="round" />
      <path d="M150 112q-30-26-12-46 22 10 12 46z" fill="#3E8E41" opacity=".9" /><path d="M150 112q34-18 36-44-26 4-36 44z" fill="#4FA85A" />
      <Marigold x={156} y={70} r={34} id={id} /><Marigold x={108} y={112} r={20} id={id} /><Marigold x={200} y={114} r={16} id={id} />
      {[[70, 40, 20], [90, 70, -30], [40, 90, 50], [128, 30, 10]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="4" ry="7" fill={['#FFB02E', '#FF6F91', '#FFD166', '#FF9500'][i]} transform={`rotate(${r} ${x} ${y})`} opacity=".9" />)}
    </>
  ),
  stars: ({ id }) => (
    <>
      <defs><radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFE9A8" stopOpacity=".55" /><stop offset="1" stopColor="#FFE9A8" stopOpacity="0" /></radialGradient></defs>
      <circle cx="160" cy="58" r="52" fill={`url(#${id}-glow)`} />
      <path d="M182 74a32 32 0 11-27-50 26 26 0 0027 50z" fill="#F7C948" />
      <path d="M128 40l3 7 8 .6-6 5 2 8-7-4.500-7 4.500 2-8-6-5 8-.6z" fill="#FFF3B0" />
      <Lantern x={96} y={26} s={0.8} body="#14B8A6" /><Lantern x={204} y={22} s={0.65} body="#F59E0B" />
      <path d="M40 150v-24q0-22 22-22t22 22v24zM100 150v-40q0-26 26-26t26 26v40zM160 150v-22q0-18 18-18t18 18v22z" fill="#000" opacity=".22" />
      {[[30, 30, 2], [76, 60, 1.6], [118, 20, 1.8], [210, 70, 1.6], [20, 80, 1.4]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#fff" opacity=".85" />)}
    </>
  ),
  confetti: () => (
    <>
      <path d="M96 140l16-44 28 28-44 16z" fill="#FFB02E" /><path d="M96 140l16-44 10 10z" fill="#FF8A1F" />
      <path d="M126 98q12-26 36-22t14 30" stroke="#FF4FA3" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M134 106q26-12 40 4t0 30" stroke="#00B0FF" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M118 90q-2-34 22-44t30 8" stroke="#FFD166" strokeWidth="3" fill="none" strokeLinecap="round" />
      {Array.from({ length: 28 }).map((_, i) => {
        const x = 90 + ((i * 53) % 125); const y = 14 + ((i * 29) % 100);
        const c = ['#FF9933', '#138808', '#2563EB', '#E11D48', '#FFC400', '#fff'][i % 6];
        return i % 3 ? <rect key={i} x={x} y={y} width="4" height="8" rx="1" fill={c} transform={`rotate(${i * 37} ${x} ${y})`} /> : <circle key={i} cx={x} cy={y} r="2.600" fill={c} />;
      })}
      {[[176, 30], [196, 66], [112, 40]].map(([x, y], i) => <path key={i} transform={`translate(${x} ${y}) scale(.7)`} d="M0-9L2.400-2.600 9 0 2.400 2.600 0 9-2.400 2.600-9 0-2.400-2.600z" fill="#FFF3B0" />)}
    </>
  ),
  custom: () => (
    <>
      <g><rect x="110" y="96" width="46" height="40" rx="4" fill="#fff" opacity=".95" /><rect x="110" y="96" width="46" height="12" rx="3" fill="#FF6B8A" /><rect x="129" y="96" width="8" height="40" fill="#FF6B8A" /><path d="M133 96c-14-14-24-2-12 0M133 96c14-14 24-2 12 0" stroke="#FF6B8A" strokeWidth="3" fill="none" strokeLinecap="round" /></g>
      <g><rect x="164" y="108" width="36" height="30" rx="3" fill="#FFD166" /><rect x="164" y="108" width="36" height="9" rx="2" fill="#4FD1C5" /><rect x="178" y="108" width="7" height="30" fill="#4FD1C5" /></g>
      <g><ellipse cx="170" cy="48" rx="18" ry="22" fill="#4FD1C5" /><path d="M170 70l-3 5h6zM170 75q-4 10 2 18" stroke="#fff" strokeOpacity=".8" fill="none" /><ellipse cx="163" cy="40" rx="4" ry="7" fill="#fff" opacity=".35" /></g>
      <g><ellipse cx="128" cy="40" rx="14" ry="17" fill="#FF6B8A" /><path d="M128 57l-2.500 4h5zM128 61q-3 9 1 16" stroke="#fff" strokeOpacity=".8" fill="none" /></g>
      {[[96, 70, 6], [200, 80, 5], [150, 20, 4], [70, 36, 4]].map(([x, y, r], i) => <path key={i} transform={`translate(${x} ${y}) scale(${r / 12})`} d="M0-12C1-3 3 -1 12 0 3 1 1 3 0 12-1 3-3 1-12 0-3-1-1-3 0-12z" fill="#FFF3B0" />)}
    </>
  ),
};

const SeasonalScene = ({ type, accent = '#FF6B6B', className = '', style }) => {
  const raw = useId().replace(/:/g, '');
  const Scene = SCENES[type];
  if (!Scene) return null;
  return (
    <svg viewBox="0 0 220 150" className={className} style={style} preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
      <Scene id={`s${raw}`} accent={accent} />
    </svg>
  );
};

export default SeasonalScene;

/** Original hand-built SVG art (no external images, offline-safe). Decorative only: always aria-hidden.
 * Shared dusk-stadium palette; every scene is a 360×140 banner (hero 360×220) that crops with `slice`. */
import type { ReactNode } from 'react';

export type SceneName = 'hero' | 'school' | 'college' | 'pro' | 'us' | 'club' | 'draft' | 'training' | 'game' | 'contract' | 'retire' | 'service' | 'trophy' | 'quiet';
export type IconName = 'pitcher' | 'hitter' | 'emblem-school' | 'emblem-college' | 'emblem-pro' | 'emblem-us' | 'empty' | 'error' | 'warn';
export type IllustrationName = SceneName | IconName;

const C = { pine: '#0c2f27', green: '#185548', g1: '#2a7a5f', g2: '#2f8a69', mint: '#8fd9bd', sand: '#d9a56a', cream: '#fff4dc', ball: '#fffaf0', red: '#d6453d', plum: '#2a2250', night: '#121f45', amber: '#ffcf8a', peach: '#ff9f7a', coral: '#f0716b' };

const Grad = ({ id, stops, to = 'v' }: { id: string; stops: readonly (readonly [number, string])[]; to?: 'v' | 'r' }) => (
  to === 'v'
    ? <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">{stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}</linearGradient>
    : <radialGradient id={id}>{stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}</radialGradient>
);
const Cloud = ({ x, y, s = 1, fill = '#fff', o = .5 }: { x: number; y: number; s?: number; fill?: string; o?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} opacity={o}><ellipse cx="0" cy="0" rx="34" ry="6" /><ellipse cx="-10" cy="-5" rx="16" ry="7" /><ellipse cx="12" cy="-4" rx="13" ry="6" /></g>
);
const Bird = ({ x, y }: { x: number; y: number }) => <path d={`M${x} ${y} q3 -4 6 0 q3 -4 6 0`} fill="none" stroke="#3a2a55" strokeWidth="1.3" strokeLinecap="round" opacity=".7" />;
const Stars = ({ pts }: { pts: readonly (readonly [number, number, number])[] }) => <g fill="#fff6d8">{pts.map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} opacity=".85" />)}</g>;
const Lamp = ({ x, y, h, w = 26 }: { x: number; y: number; h: number; w?: number }) => (
  <g><circle cx={x} cy={y + 8} r={w * 1.1} fill="url(#glow)" opacity=".55" /><rect x={x - 1.5} y={y + 14} width="3" height={h} fill="#1a1740" />
    <rect x={x - w / 2} y={y} width={w} height="16" rx="2" fill="#1a1740" />
    {[0, 1, 2, 3].flatMap(i => [0, 1].map(j => <circle key={`${i}${j}`} cx={x - w / 2 + 4 + i * ((w - 8) / 3)} cy={y + 4.5 + j * 7} r="2.2" fill="#fff3c4" />))}</g>
);
/** Mown grass bands + infield dirt; `y` is the horizon of the field. */
const Grass = ({ y, h = 140, dirt = true }: { y: number; h?: number; dirt?: boolean }) => (
  <g>
    {Array.from({ length: Math.ceil((h - y) / 8) }, (_, i) => <rect key={i} x="0" y={y + i * 8} width="360" height="8" fill={i % 2 ? C.g1 : C.g2} />)}
    {dirt ? <path d={`M180 ${y + 2} L252 ${y + 20} L180 ${y + 42} L108 ${y + 20}Z`} fill={C.sand} opacity=".92" /> : null}
    {dirt ? <path d={`M180 ${y + 8} L226 ${y + 20} L180 ${y + 34} L134 ${y + 20}Z`} fill={C.g2} opacity=".9" /> : null}
    {dirt ? [[180, y + 2], [252, y + 20], [180, y + 42], [108, y + 20]].map(([cx, cy]) => <rect key={`${cx}${cy}`} x={cx! - 3} y={cy! - 3} width="6" height="6" transform={`rotate(45 ${cx} ${cy})`} fill="#fff" />) : null}
  </g>
);
const Ball = ({ x, y, r = 7, rot = -20 }: { x: number; y: number; r?: number; rot?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}><circle r={r} fill={C.ball} stroke="#e4d9c3" strokeWidth=".6" />
    <path d={`M${-r * .55} ${-r * .8} q${r * .5} ${r * .8} 0 ${r * 1.6}M${r * .55} ${-r * .8} q${-r * .5} ${r * .8} 0 ${r * 1.6}`} fill="none" stroke={C.red} strokeWidth={r * .14} strokeLinecap="round" /></g>
);
const Crowd = ({ y, h, fill, dot }: { y: number; h: number; fill: string; dot: string }) => (
  <g><path d={`M0 ${y + 14} Q180 ${y - 16} 360 ${y + 14} V${y + h} H0Z`} fill={fill} />
    <path d={`M0 ${y + 14} Q180 ${y - 16} 360 ${y + 14} V${y + h} H0Z`} fill="url(#dots)" opacity=".9" />
    <pattern id="dots" width="7" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill={dot} /><circle cx="5.5" cy="5" r="1.1" fill="#ffd9a0" opacity=".7" /></pattern></g>
);
const Tree = ({ x, y, s = 1, f = '#1f6b52' }: { x: number; y: number; s?: number; f?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><rect x="-2" y="-4" width="4" height="14" fill="#4a3426" /><circle cx="0" cy="-12" r="11" fill={f} /><circle cx="-8" cy="-6" r="8" fill={f} /><circle cx="8" cy="-7" r="8" fill={f} /></g>
);
const Defs = ({ sky, id }: { sky: readonly (readonly [number, string])[]; id: string }) => (
  <defs><Grad id={`sky-${id}`} stops={sky} /><Grad id="glow" to="r" stops={[[0, 'rgba(255,240,180,.95)'], [1, 'rgba(255,240,180,0)']]} /><Grad id="sun" to="r" stops={[[0, '#fff1c2'], [.55, '#ffc27a'], [1, 'rgba(255,170,110,0)']]} />
    <Grad id="shade" stops={[[0, 'rgba(12,47,39,0)'], [1, 'rgba(12,47,39,.5)']]} /></defs>
);
const Frame = ({ id, sky, vb = '0 0 360 140', children }: { id: string; sky: readonly (readonly [number, string])[]; vb?: string; children: ReactNode }) => (
  <svg viewBox={vb} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className="art-svg" role="presentation">
    <Defs sky={sky} id={id} /><rect width="360" height="220" fill={`url(#sky-${id})`} />{children}
  </svg>
);
const DUSK = [[0, '#353472'], [.42, '#b4558a'], [.72, '#f58b6d'], [1, '#ffcb84']] as const;
const DAY = [[0, '#7ec8ee'], [.7, '#cfeaf5'], [1, '#fff1cf']] as const;
const NIGHT = [[0, '#0b1433'], [.6, '#1d2f66'], [1, '#33509a']] as const;

const scenes: Readonly<Record<SceneName, () => ReactNode>> = {
  hero: () => (
    <Frame id="hero" vb="0 0 360 220" sky={DUSK}>
      <Stars pts={[[40, 20, 1], [90, 36, .8], [150, 14, 1.1], [226, 28, .9], [300, 18, 1], [330, 44, .8]]} />
      <circle cx="252" cy="140" r="46" fill="url(#sun)" /><circle cx="252" cy="140" r="21" fill="#ffe9b0" />
      <Cloud x={70} y={78} s={1.3} fill="#ffc2c0" o={.55} /><Cloud x={290} y={64} s={1.1} fill="#ffd7bd" o={.55} /><Cloud x={180} y={104} s={1.6} fill="#ffb59a" o={.5} />
      <Bird x={110} y={50} /><Bird x={126} y={58} /><Bird x={96} y={64} />
      <path d="M150 168 Q220 40 300 28" fill="none" stroke="#fff4dc" strokeWidth="1.5" strokeDasharray="1 5" strokeLinecap="round" opacity=".8" />
      <Ball x={304} y={26} r={8} />
      <Crowd y={134} h={50} fill={C.plum} dot="#ff9f7a" />
      <rect x="140" y="124" width="80" height="26" rx="3" fill="#1a1740" stroke="#473a82" strokeWidth="1.5" />
      <g fill="#8fd9bd" opacity=".9"><rect x="148" y="131" width="30" height="3" rx="1.5" /><rect x="148" y="138" width="46" height="3" rx="1.5" /><rect x="198" y="131" width="14" height="3" rx="1.5" fill="#ffcf8a" /></g>
      <Lamp x={40} y={62} h={90} /><Lamp x={322} y={62} h={90} />
      <Grass y={170} h={220} />
      <rect y="170" width="360" height="50" fill="url(#shade)" />
    </Frame>
  ),
  school: () => (
    <Frame id="school" sky={DAY}>
      <Cloud x={60} y={26} s={1.1} /><Cloud x={290} y={20} s={.9} /><Cloud x={200} y={40} s={.7} o={.4} />
      <g><rect x="40" y="52" width="108" height="56" fill="#e9dcc2" /><path d="M34 54 L94 28 L154 54Z" fill="#b5533f" /><rect x="76" y="34" width="36" height="22" fill="#e9dcc2" /><circle cx="94" cy="45" r="8" fill="#fff" stroke="#6b5a45" strokeWidth="1.5" /><path d="M94 45 V40 M94 45 H98" stroke="#6b5a45" strokeWidth="1.5" />
        {[0, 1, 2, 3].map(i => <rect key={i} x={50 + i * 24} y="62" width="12" height="16" fill="#8bbad6" />)}<rect x="86" y="86" width="16" height="22" fill="#6b4a36" /></g>
      <Tree x={170} y={96} s={.8} /><Tree x={20} y={100} s={.7} />
      <g stroke="#587a6a" strokeWidth="1" opacity=".8" fill="none">{[230, 250, 270, 290, 310, 330].map(x => <path key={x} d={`M${x} 60 V108`} />)}<path d="M222 72 H340 M222 90 H340" /></g>
      <Grass y={104} dirt={false} />
    </Frame>
  ),
  college: () => (
    <Frame id="college" sky={[[0, '#f7b88a'], [.6, '#fbd9a8'], [1, '#fff0cf']]}>
      <Cloud x={280} y={30} s={1} fill="#fff" o={.5} />
      <g><rect x="150" y="26" width="44" height="82" fill="#a0553f" /><path d="M146 28 L172 6 L198 28Z" fill="#6f3a2e" /><path d="M172 6 V-2" stroke="#6f3a2e" strokeWidth="2" /><path d="M172 -2 l12 4 -12 4Z" fill={C.red} />
        {[50].map(y => <path key={y} d={`M162 ${y + 14} V${y} a10 10 0 0 1 20 0 V${y + 14}Z`} fill="#ffe3a8" />)}<path d="M164 108 V92 a8 8 0 0 1 16 0 V108Z" fill="#4a2a22" />
        <rect x="60" y="60" width="90" height="48" fill="#b8624a" /><rect x="194" y="60" width="90" height="48" fill="#b8624a" />
        {[0, 1, 2].flatMap(i => [70, 94].map(y => <g key={`${i}${y}`}><rect x={72 + i * 26} y={y - 4} width="12" height="14" fill="#ffe3a8" /><rect x={206 + i * 26} y={y - 4} width="12" height="14" fill="#ffe3a8" /></g>))}</g>
      {[[30, 20], [66, 44], [250, 12], [312, 40], [118, 16], [220, 36], [336, 18]].map(([x, y]) => <ellipse key={`${x}${y}`} cx={x} cy={y} rx="4" ry="2" transform={`rotate(30 ${x} ${y})`} fill={y! % 2 ? '#e0742f' : '#c4421f'} />)}
      <Tree x={30} y={100} s={.9} f="#d6762c" /><Tree x={330} y={100} s={.9} f="#c4421f" />
      <Grass y={106} dirt={false} />
    </Frame>
  ),
  pro: () => (
    <Frame id="pro" sky={NIGHT}>
      <Stars pts={[[30, 14, 1], [80, 30, .8], [150, 10, 1], [210, 22, .9], [260, 12, 1], [335, 30, .8]]} />
      <Cloud x={190} y={52} s={1.4} fill="#6a86c8" o={.35} />
      <Crowd y={74} h={70} fill="#1b2a5e" dot="#8fb2ff" />
      <rect x="130" y="58" width="100" height="32" rx="3" fill="#0b1433" stroke="#3a5cb0" strokeWidth="1.5" />
      <g fill="#8fd9bd"><rect x="140" y="66" width="34" height="4" rx="2" /><rect x="140" y="75" width="52" height="4" rx="2" /></g><g fill="#ffcf8a"><rect x="198" y="66" width="22" height="4" rx="2" /><rect x="204" y="75" width="16" height="4" rx="2" /></g>
      <Lamp x={34} y={20} h={80} w={32} /><Lamp x={326} y={20} h={80} w={32} /><Lamp x={96} y={34} h={64} w={22} /><Lamp x={264} y={34} h={64} w={22} />
      <Grass y={104} />
    </Frame>
  ),
  us: () => (
    <Frame id="us" sky={[[0, '#14214f'], [.55, '#4a4a98'], [1, '#e48a8a']]}>
      <Stars pts={[[24, 12, 1.2], [70, 26, .9], [128, 10, 1], [300, 16, 1.2], [340, 38, .9], [244, 30, .8]]} />
      <circle cx="288" cy="40" r="14" fill="#fff4dc" opacity=".92" /><circle cx="294" cy="37" r="12" fill="#4a4a98" />
      <g fill="#1d1a46">{[[10, 62, 22], [34, 44, 18], [56, 70, 24], [84, 52, 20], [110, 38, 22], [138, 66, 24], [168, 48, 18], [190, 72, 22], [216, 54, 24], [244, 66, 20], [268, 42, 22], [296, 60, 20], [320, 50, 26]].map(([x, y, w]) => <rect key={`${x}`} x={x} y={y} width={w} height={108 - y!} />)}</g>
      <path d="M244 42 V32 l8 3 -8 3" fill={C.red} /><path d="M244 32 V54" stroke="#1d1a46" strokeWidth="1.5" />
      <g fill="#ffe08a" opacity=".85">{[[16, 70], [40, 56], [62, 80], [90, 62], [116, 50], [144, 76], [196, 80], [222, 64], [274, 52], [326, 62]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="3" height="3" />)}</g>
      <Grass y={106} dirt={false} />
    </Frame>
  ),
  club: () => (
    <Frame id="club" sky={[[0, '#2d6c78'], [.7, '#7ec4b0'], [1, '#e8f0c8']]}>
      <path d="M0 14 Q90 44 180 22 T360 18" fill="none" stroke="#fff4dc" strokeWidth="1.2" />
      {[[26, 22, C.coral], [64, 30, '#ffcf8a'], [104, 33, '#fff4dc'], [146, 29, C.coral], [190, 26, '#ffcf8a'], [236, 24, '#fff4dc'], [282, 26, C.coral], [326, 22, '#ffcf8a']].map(([x, y, f]) => <path key={`${x}`} d={`M${Number(x) - 8} ${y} h16 l-8 20Z`} fill={f as string} />)}
      <g><rect x="40" y="58" width="150" height="14" rx="3" fill="#0c2f27" /><rect x="48" y="72" width="134" height="36" fill="#14473c" /><rect x="56" y="84" width="118" height="6" rx="3" fill="#8b5a36" />
        {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={66 + i * 24} cy="80" r="5" fill="#d9a56a" />)}</g>
      <g transform="translate(250 100)" stroke="#8b5a36" strokeWidth="4" strokeLinecap="round">{[-26, -14, -2, 10].map((x, i) => <path key={i} d={`M${x} 0 L${x + 14 + i * 3} -52`} />)}</g>
      <Grass y={108} dirt={false} />
    </Frame>
  ),
  draft: () => (
    <Frame id="draft" sky={[[0, '#251f5a'], [.6, '#5d3f92'], [1, '#d9708a']]}>
      <g opacity=".35" fill="#fff4dc"><path d="M60 0 L96 104 H24Z" /><path d="M180 0 L218 104 H142Z" /><path d="M300 0 L338 104 H262Z" /></g>
      {[[40, 20, C.amber], [88, 52, '#8fd9bd'], [140, 16, C.coral], [222, 30, C.amber], [276, 14, '#8fd9bd'], [326, 56, C.coral], [20, 70, '#fff4dc'], [346, 28, '#fff4dc']].map(([x, y, f]) => <rect key={`${x}${y}`} x={x} y={y} width="5" height="8" rx="1" transform={`rotate(${(Number(x) * 7) % 90} ${x} ${y})`} fill={f as string} />)}
      <g><rect x="110" y="70" width="140" height="38" rx="3" fill="#2a2250" /><rect x="110" y="70" width="140" height="7" rx="3" fill="#8fd9bd" /><rect x="136" y="48" width="88" height="22" rx="3" fill="#3a2d78" /><rect x="136" y="48" width="88" height="5" rx="2.5" fill={C.amber} /></g>
      <Ball x={180} y={36} r={11} rot={10} />
      <path d="M180 50 v0" />
      <Grass y={110} dirt={false} />
    </Frame>
  ),
  training: () => (
    <Frame id="training" sky={[[0, '#ffb98a'], [.7, '#ffe0b0'], [1, '#fff4d6']]}>
      <circle cx="302" cy="34" r="22" fill="url(#sun)" /><circle cx="302" cy="34" r="11" fill="#fff1c2" />
      <g stroke="#2f5d52" strokeWidth=".9" opacity=".75" fill="none">
        {Array.from({ length: 12 }, (_, i) => <path key={`v${i}`} d={`M${28 + i * 18} 12 V108`} />)}{Array.from({ length: 6 }, (_, i) => <path key={`h${i}`} d={`M28 ${16 + i * 18} H224`} />)}</g>
      <path d="M28 8 H224 M28 8 V108 M224 8 V108" stroke="#0c2f27" strokeWidth="3" />
      <g transform="translate(268 84)"><rect x="-14" y="-18" width="28" height="30" rx="5" fill="#185548" /><circle cx="0" cy="-4" r="8" fill="#0c2f27" /><circle cx="0" cy="-4" r="4" fill="#8fd9bd" /><rect x="-10" y="12" width="20" height="8" fill="#0c2f27" /></g>
      <Ball x={238} y={72} r={6} /><Ball x={142} y={52} r={6} rot={30} /><path d="M90 98 L130 58" stroke="#8b5a36" strokeWidth="5" strokeLinecap="round" />
      <Grass y={108} dirt={false} />
    </Frame>
  ),
  game: () => (
    <Frame id="game" sky={DUSK}>
      <circle cx="90" cy="86" r="34" fill="url(#sun)" /><circle cx="90" cy="86" r="15" fill="#ffe9b0" />
      <Cloud x={230} y={34} s={1.2} fill="#ffc2c0" o={.55} /><Bird x={160} y={30} /><Bird x={176} y={38} />
      <Crowd y={82} h={50} fill={C.plum} dot="#ff9f7a" />
      <Lamp x={310} y={16} h={80} w={30} />
      <Grass y={104} />
      <ellipse cx="180" cy="124" rx="30" ry="7" fill="#c8924e" /><rect x="170" y="119" width="20" height="3" rx="1.5" fill="#fff" />
      <path d="M200 114 Q240 92 300 112" fill="none" stroke="#fff4dc" strokeWidth="1.4" strokeDasharray="1 4" strokeLinecap="round" /><Ball x={206} y={113} r={6} />
    </Frame>
  ),
  contract: () => (
    <Frame id="contract" sky={[[0, '#f6c78a'], [1, '#fde8c4']]}>
      <g><rect x="120" y="14" width="120" height="112" rx="6" fill="#fffaf0" stroke="#e4d2ad" strokeWidth="1.5" transform="rotate(-4 180 70)" />
        <g transform="rotate(-4 180 70)" fill="#cdbb95">{[0, 1, 2, 3].map(i => <rect key={i} x="136" y={30 + i * 14} width={88 - (i % 2) * 20} height="4" rx="2" />)}</g>
        <path d="M140 100 q10 -16 18 -2 t16 -4 t14 4" fill="none" stroke="#185548" strokeWidth="2.2" strokeLinecap="round" /></g>
      <circle cx="222" cy="104" r="14" fill={C.red} opacity=".9" /><path d="M222 97 l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7Z" fill="#fff4dc" />
      <path d="M262 24 L300 112" stroke="#185548" strokeWidth="5" strokeLinecap="round" /><path d="M300 112 l-3 8 -6 -4Z" fill="#0c2f27" />
      <Ball x={66} y={96} r={14} rot={20} /><Cloud x={60} y={26} s={1} o={.5} />
    </Frame>
  ),
  retire: () => (
    <Frame id="retire" sky={[[0, '#6a4a8e'], [.45, '#e8727a'], [.8, '#ffb27a'], [1, '#ffdca0']]}>
      <circle cx="180" cy="104" r="64" fill="url(#sun)" /><circle cx="180" cy="104" r="30" fill="#ffe9b0" />
      <Cloud x={70} y={50} s={1.2} fill="#ffc2c0" o={.5} /><Cloud x={300} y={40} s={1} fill="#ffd7bd" o={.5} /><Bird x={120} y={34} /><Bird x={134} y={42} />
      <Grass y={108} dirt={false} />
      <path d="M70 140 L120 112 L360 132 L360 140Z" fill="#0c2f27" opacity=".25" />
      <g transform="translate(226 110)"><path d="M0 0 q-4 -16 10 -20 q14 -3 16 8 q2 10 -6 14 q-8 3 -20 -2Z" fill="#8b5a36" /><path d="M14 -12 q6 -2 8 4" fill="none" stroke="#5c3a22" strokeWidth="1.5" /><Ball x={8} y={-6} r={5} /></g>
      <g transform="translate(110 112)"><rect x="-26" y="-12" width="52" height="5" rx="2" fill="#3a2d28" /><rect x="-22" y="-7" width="4" height="12" fill="#3a2d28" /><rect x="18" y="-7" width="4" height="12" fill="#3a2d28" /></g>
    </Frame>
  ),
  service: () => (
    <Frame id="service" sky={[[0, '#9fb7c2'], [.7, '#d9dfd0'], [1, '#f2ecd2']]}>
      <path d="M0 96 Q80 66 170 92 T360 84 V140H0Z" fill="#6f8f7c" /><path d="M0 108 Q120 84 240 104 T360 100 V140H0Z" fill="#4f7a65" />
      <Cloud x={80} y={30} s={1.2} o={.7} /><Cloud x={270} y={24} o={.6} />
      <path d="M92 108 V20" stroke="#4a4a4a" strokeWidth="2.4" /><path d="M94 22 h36 v22 h-36Z" fill="#185548" /><path d="M112 27 l2.6 5.4 6 .8 -4.4 4.2 1 6 -5.2 -2.8 -5.2 2.8 1 -6 -4.4 -4.2 6 -.8Z" fill="#ffe9b0" transform="scale(.7) translate(48 12)" />
      <path d="M222 108 L260 62 L298 108Z" fill="#8a8f5a" /><path d="M260 62 L260 108" stroke="#5f6340" strokeWidth="1.5" /><path d="M250 108 L260 88 L270 108Z" fill="#3f4228" />
      <Grass y={114} dirt={false} />
    </Frame>
  ),
  trophy: () => (
    <Frame id="trophy" sky={[[0, '#2b2f63'], [.6, '#7a4f96'], [1, '#ffb27a']]}>
      <g opacity=".3" fill="#fff4dc"><path d="M180 -4 L228 112 H132Z" /></g>
      {[[40, 24, C.amber], [84, 62, '#8fd9bd'], [120, 20, C.coral], [250, 30, '#8fd9bd'], [296, 16, C.amber], [326, 60, C.coral], [210, 58, '#fff4dc'], [16, 80, '#fff4dc']].map(([x, y, f]) => <rect key={`${x}${y}`} x={x} y={y} width="5" height="8" rx="1" transform={`rotate(${(Number(x) * 5) % 80} ${x} ${y})`} fill={f as string} />)}
      <g transform="translate(180 20)"><path d="M-26 0 h52 q0 38 -26 48 q-26 -10 -26 -48Z" fill="#ffcf5a" /><path d="M-26 8 q-18 0 -16 14 q2 10 20 14 M26 8 q18 0 16 14 q-2 10 -20 14" fill="none" stroke="#ffcf5a" strokeWidth="5" /><rect x="-6" y="46" width="12" height="18" fill="#e8a93a" /><rect x="-20" y="62" width="40" height="12" rx="3" fill="#8b5a36" />
        <path d="M-14 6 q-2 22 12 34" fill="none" stroke="#fff4c8" strokeWidth="3" strokeLinecap="round" opacity=".7" /><Ball x={0} y={22} r={9} /></g>
      <Grass y={112} dirt={false} />
    </Frame>
  ),
  quiet: () => (
    <Frame id="quiet" sky={[[0, '#cfe9de'], [1, '#f4f6f9']]}>
      <circle cx="300" cy="60" r="70" fill="#185548" opacity=".08" /><circle cx="70" cy="30" r="46" fill="#185548" opacity=".06" />
      <Ball x={290} y={44} r={22} rot={14} /><Ball x={64} y={92} r={12} rot={-30} />
      <path d="M110 100 L200 40" stroke="#8b5a36" strokeWidth="9" strokeLinecap="round" /><path d="M110 100 L116 96" stroke="#3a2d28" strokeWidth="9" strokeLinecap="round" />
      <Grass y={112} dirt={false} />
    </Frame>
  ),
};

const Disc = ({ a, b, children }: { a: string; b: string; children: ReactNode }) => (
  <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" role="presentation" className="art-svg">
    <defs><linearGradient id={`d${a.slice(1)}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
    <circle cx="32" cy="32" r="32" fill={`url(#d${a.slice(1)})`} />{children}
  </svg>
);
const Cap = ({ x, y }: { x: number; y: number }) => <g><path d={`M${x - 9} ${y} a9 9 0 0 1 18 0Z`} fill="#0c2f27" /><path d={`M${x - 1} ${y} h14 a3 3 0 0 1 0 3 h-14Z`} fill="#0c2f27" /></g>;
const icons: Readonly<Record<IconName, () => ReactNode>> = {
  hitter: () => (
    <Disc a="#bfe6d6" b="#6fb79a">
      <path d="M8 62 q2 -22 22 -22 q20 0 22 22Z" fill="#185548" /><circle cx="30" cy="27" r="9" fill="#f0c9a0" /><Cap x={30} y={24} />
      <path d="M44 56 L58 14" stroke="#8b5a36" strokeWidth="5" strokeLinecap="round" /><path d="M44 56 l-2 6" stroke="#3a2d28" strokeWidth="5" strokeLinecap="round" />
    </Disc>
  ),
  pitcher: () => (
    <Disc a="#ffd9a8" b="#f0916f">
      <path d="M6 62 q2 -22 22 -22 q20 0 22 22Z" fill="#185548" /><circle cx="28" cy="27" r="9" fill="#f0c9a0" /><Cap x={28} y={24} />
      <path d="M44 46 q8 -10 6 -26" fill="none" stroke="#185548" strokeWidth="6" strokeLinecap="round" /><Ball x={50} y={15} r={6} />
    </Disc>
  ),
  'emblem-school': () => (
    <Disc a="#e9f5c8" b="#9ccf7a"><path d="M14 30 L32 16 L50 30Z" fill="#b5533f" /><rect x="18" y="30" width="28" height="18" fill="#fff4dc" /><rect x="29" y="36" width="6" height="12" fill="#6b4a36" /><rect x="21" y="34" width="5" height="6" fill="#8bbad6" /><rect x="38" y="34" width="5" height="6" fill="#8bbad6" /></Disc>
  ),
  'emblem-college': () => (
    <Disc a="#ffd9a8" b="#e0742f"><path d="M32 16 L54 26 L32 36 L10 26Z" fill="#6f3a2e" /><path d="M20 32 v10 q12 8 24 0 v-10" fill="#8a4a38" /><path d="M54 26 v14" stroke="#ffe9b0" strokeWidth="2" /><circle cx="54" cy="42" r="2.5" fill="#ffe9b0" /></Disc>
  ),
  'emblem-pro': () => (
    <Disc a="#5b7fd0" b="#14234d"><Ball x={32} y={32} r={16} rot={-15} /><path d="M32 8 l3 6 6.5 1 -4.7 4.5 1.1 6.5 -5.9 -3.1 -5.9 3.1 1.1 -6.5 -4.7 -4.5 6.5 -1Z" fill="#ffcf5a" transform="scale(.5) translate(32 -6)" /></Disc>
  ),
  'emblem-us': () => (
    <Disc a="#7a6ec0" b="#1d1a46"><g fill="#fff4dc">{[[20, 22], [32, 16], [44, 22]].map(([x, y]) => <path key={`${x}`} d={`M${x} ${y! - 5} l1.6 3.4 3.7 .5 -2.7 2.6 .7 3.7 -3.3 -1.8 -3.3 1.8 .7 -3.7 -2.7 -2.6 3.7 -.5Z`} />)}</g><path d="M10 46 h44 M12 40 h40 M14 52 h36" stroke="#f0716b" strokeWidth="3" strokeLinecap="round" /></Disc>
  ),
  empty: () => (
    <svg viewBox="0 0 120 80" aria-hidden="true" focusable="false" role="presentation" className="art-svg">
      <ellipse cx="60" cy="68" rx="44" ry="6" fill="#185548" opacity=".12" />
      <path d="M24 56 q-10 -22 10 -36 q8 -6 18 -2 q8 -10 18 -4 q8 -8 16 0 q12 6 8 22 q-4 18 -24 22 q-18 2 -46 -2Z" fill="#c98a52" />
      <path d="M34 22 q4 16 -2 30 M52 18 q2 14 -2 32 M70 16 q2 14 2 32 M88 24 q-2 12 -6 26" fill="none" stroke="#8b5a36" strokeWidth="2" strokeLinecap="round" /><Ball x={58} y={44} r={11} rot={10} />
    </svg>
  ),
  error: () => (
    <svg viewBox="0 0 120 80" aria-hidden="true" focusable="false" role="presentation" className="art-svg">
      <ellipse cx="60" cy="68" rx="44" ry="6" fill="#b42318" opacity=".12" />
      <path d="M30 62 L74 14" stroke="#c98a52" strokeWidth="12" strokeLinecap="round" /><path d="M54 36 l-6 -8 l8 -2 l-4 -8" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" /><path d="M70 22 L84 8" stroke="#c98a52" strokeWidth="12" strokeLinecap="round" />
      <Ball x={92} y={54} r={10} rot={30} /><path d="M82 44 l-6 -6 M96 42 l4 -8" stroke="#b42318" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  warn: () => (
    <Disc a="#ffd9a8" b="#f0716b"><Ball x={32} y={32} r={20} rot={-10} /><circle cx="32" cy="32" r="20" fill="#f0716b" opacity=".0" /><rect x="29.5" y="20" width="5" height="16" rx="2.5" fill="#b42318" /><circle cx="32" cy="42" r="3" fill="#b42318" /></Disc>
  ),
};

/** Decorative illustration. Scenes fill their container width (CSS `.art`), icons keep their square size. */
export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  const scene = name in scenes;
  return <span className={`${scene ? 'art' : 'art-icon'} art-${name}${className ? ` ${className}` : ''}`} aria-hidden="true">{scene ? scenes[name as SceneName]() : icons[name as IconName]()}</span>;
}

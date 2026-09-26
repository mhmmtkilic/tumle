import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const GOLD = { hi: '#F6D876', mid: '#E8B93C', deep: '#B8860B', ink: '#7A5A08' };

function starPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rad * Math.cos(angle)).toFixed(1)},${(cy + rad * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}

interface CoinProps {
  value: string;
  unit: string;
  rim: string;
  face: string;
  inner?: string;
  edge: string;
  ink: string;
}

function CoinSvg({ value, unit, rim, face, inner, edge, ink }: CoinProps) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Circle cx={50} cy={52} r={42} fill="rgba(0,0,0,0.10)" />
      <Circle cx={50} cy={50} r={42} fill={rim} />
      <Circle cx={50} cy={50} r={42} fill="none" stroke={edge} strokeWidth={2.5} strokeDasharray="2.2 3.4" />
      <Circle cx={50} cy={50} r={35} fill={face} />
      {inner ? <Circle cx={50} cy={50} r={26} fill={inner} /> : null}
      <SvgText x={50} y={53} textAnchor="middle" fontSize={value.length > 1 ? 26 : 30} fontWeight="800" fill={ink}>
        {value}
      </SvgText>
      <SvgText x={50} y={70} textAnchor="middle" fontSize={10.5} fontWeight="700" letterSpacing={1} fill={ink} opacity={0.75}>
        {unit}
      </SvgText>
      <Ellipse cx={38} cy={32} rx={14} ry={7} fill="#FFFFFF" opacity={0.28} transform="rotate(-24 38 32)" />
    </Svg>
  );
}

interface NoteProps {
  value: string;
  symbol: string;
  paper: string;
  panel: string;
  ink: string;
  deep: string;
}

function NoteSvg({ value, symbol, paper, panel, ink, deep }: NoteProps) {
  return (
    <Svg viewBox="0 0 120 100" width="100%" height="100%">
      <Rect x={8} y={28} width={104} height={52} rx={6} fill="rgba(0,0,0,0.10)" />
      <Rect x={8} y={26} width={104} height={52} rx={6} fill={paper} />
      <Rect x={13} y={31} width={94} height={42} rx={3} fill="none" stroke={deep} strokeWidth={1.4} opacity={0.55} />
      <Ellipse cx={60} cy={52} rx={22} ry={15} fill={panel} />
      <Ellipse cx={60} cy={52} rx={22} ry={15} fill="none" stroke={deep} strokeWidth={1.2} opacity={0.6} />
      <SvgText x={60} y={58} textAnchor="middle" fontSize={16} fontWeight="800" fill={ink}>
        {value}
      </SvgText>
      <SvgText x={26} y={47} textAnchor="middle" fontSize={13} fontWeight="800" fill={deep}>
        {symbol}
      </SvgText>
      <SvgText x={101} y={41} textAnchor="middle" fontSize={9} fontWeight="700" fill={deep}>
        {value}
      </SvgText>
      <SvgText x={19} y={69} textAnchor="middle" fontSize={9} fontWeight="700" fill={deep}>
        {value}
      </SvgText>
      <Line x1={82} y1={64} x2={102} y2={64} stroke={deep} strokeWidth={1} opacity={0.4} />
    </Svg>
  );
}

function Glow({ id }: { id: string }) {
  return (
    <Defs>
      <RadialGradient id={id} cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#F6D876" stopOpacity={0.55} />
        <Stop offset="100%" stopColor="#F6D876" stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );
}

function GoldBarSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Glow id="gbar" />
      <Circle cx={50} cy={50} r={48} fill="url(#gbar)" />
      <Rect x={24} y={34} width={52} height={34} rx={5} fill={GOLD.deep} />
      <Rect x={24} y={32} width={52} height={34} rx={5} fill={GOLD.mid} />
      <Rect x={28} y={36} width={44} height={12} rx={3} fill={GOLD.hi} opacity={0.65} />
      <SvgText x={50} y={52} textAnchor="middle" fontSize={14} fontWeight="800" fill={GOLD.ink}>
        1 g
      </SvgText>
      <SvgText x={50} y={62} textAnchor="middle" fontSize={6.5} fontWeight="700" letterSpacing={0.6} fill={GOLD.ink} opacity={0.8}>
        ALTIN 999,9
      </SvgText>
    </Svg>
  );
}

function CeyrekSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Glow id="gcey" />
      <Circle cx={50} cy={54} r={46} fill="url(#gcey)" />
      <Path d="M40 20 L50 30 L60 20 L60 8 L50 15 L40 8 Z" fill="#C94F4F" />
      <Circle cx={50} cy={58} r={33} fill={GOLD.deep} />
      <Circle cx={50} cy={56} r={33} fill={GOLD.mid} />
      <Circle cx={50} cy={56} r={33} fill="none" stroke={GOLD.hi} strokeWidth={2} strokeDasharray="2 3" />
      <Circle cx={50} cy={56} r={26} fill={GOLD.hi} opacity={0.5} />
      <Circle cx={52} cy={54} r={12} fill={GOLD.mid} />
      <Circle cx={56} cy={52} r={11} fill={GOLD.hi} opacity={0.9} />
      <Polygon points={starPoints(63, 59, 5.5)} fill={GOLD.ink} />
      <SvgText x={50} y={83} textAnchor="middle" fontSize={8} fontWeight="800" letterSpacing={0.8} fill={GOLD.ink}>
        ÇEYREK
      </SvgText>
    </Svg>
  );
}

function TamSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Glow id="gtam" />
      <Circle cx={50} cy={50} r={48} fill="url(#gtam)" />
      <Circle cx={50} cy={54} r={40} fill={GOLD.deep} />
      <Circle cx={50} cy={52} r={40} fill={GOLD.mid} />
      <Circle cx={50} cy={52} r={40} fill="none" stroke={GOLD.hi} strokeWidth={2.5} strokeDasharray="2.4 3.2" />
      <Circle cx={50} cy={52} r={32} fill="none" stroke={GOLD.ink} strokeWidth={1} strokeDasharray="1.5 2.5" opacity={0.6} />
      <Circle cx={50} cy={52} r={27} fill={GOLD.hi} opacity={0.45} />
      <SvgText x={50} y={50} textAnchor="middle" fontSize={15} fontWeight="800" fill={GOLD.ink}>
        TAM
      </SvgText>
      <Polygon points={starPoints(50, 61, 5)} fill={GOLD.ink} />
      <Ellipse cx={37} cy={34} rx={13} ry={6} fill="#FFFFFF" opacity={0.3} transform="rotate(-24 37 34)" />
    </Svg>
  );
}

function KulceSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <Glow id="gkul" />
      <Circle cx={50} cy={50} r={50} fill="url(#gkul)" />
      <G stroke={GOLD.hi} strokeWidth={2} opacity={0.7}>
        <Line x1={50} y1={6} x2={50} y2={16} />
        <Line x1={16} y1={22} x2={23} y2={29} />
        <Line x1={84} y1={22} x2={77} y2={29} />
      </G>
      <Path d="M18 75 L30 45 L70 45 L82 75 Z" fill={GOLD.deep} />
      <Path d="M18 72 L30 42 L70 42 L82 72 Z" fill={GOLD.mid} />
      <Path d="M30 42 L36 34 L76 34 L70 42 Z" fill={GOLD.hi} />
      <Path d="M24 66 L32 46 L68 46 L72 56 L28 56 Z" fill={GOLD.hi} opacity={0.4} />
      <SvgText x={50} y={62} textAnchor="middle" fontSize={10} fontWeight="800" letterSpacing={0.8} fill={GOLD.ink}>
        999,9
      </SvgText>
      <SvgText x={50} y={88} textAnchor="middle" fontSize={8.5} fontWeight="800" letterSpacing={1} fill={GOLD.ink}>
        KÜLÇE
      </SvgText>
    </Svg>
  );
}

/** Renkli ışıma: mücevher/kripto/epik seviyeler için */
function TintGlow({ id, color, opacity = 0.5 }: { id: string; color: string; opacity?: number }) {
  return (
    <Defs>
      <RadialGradient id={id} cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
        <Stop offset="100%" stopColor={color} stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );
}

function Sparkle({ cx, cy, r, color = '#FFFFFF' }: { cx: number; cy: number; r: number; color?: string }) {
  return (
    <G stroke={color} strokeWidth={r * 0.28} strokeLinecap="round">
      <Line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
      <Line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
    </G>
  );
}

// ---- Seviye 13: Yeşim Taşı --------------------------------------------------

function YesimSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gyesim" color="#7FC98A" />
      <Circle cx={50} cy={52} r={46} fill="url(#gyesim)" />
      <Ellipse cx={50} cy={57} rx={30} ry={23} fill="#3E8A52" />
      <Ellipse cx={50} cy={54} rx={30} ry={23} fill="#57A85E" />
      <Ellipse cx={50} cy={54} rx={22} ry={16} fill="#74C46F" opacity={0.7} />
      <Ellipse cx={41} cy={46} rx={11} ry={6} fill="#FFFFFF" opacity={0.45} transform="rotate(-18 41 46)" />
      <Sparkle cx={66} cy={42} r={4} />
    </Svg>
  );
}

// ---- Seviye 14: Zümrüt ------------------------------------------------------

function ZumrutSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gzumrut" color="#3FBF7F" />
      <Circle cx={50} cy={52} r={46} fill="url(#gzumrut)" />
      {/* zümrüt kesim: köşeleri pahlı dikdörtgen basamaklar */}
      <Polygon points="30,32 70,32 80,42 80,66 70,76 30,76 20,66 20,42" fill="#0F7A4A" />
      <Polygon points="34,38 66,38 73,45 73,63 66,70 34,70 27,63 27,45" fill="#1B9861" />
      <Polygon points="39,45 61,45 66,50 66,58 61,63 39,63 34,58 34,50" fill="#37B87D" />
      <Polygon points="30,32 70,32 66,38 34,38" fill="#2FAE74" opacity={0.9} />
      <Sparkle cx={64} cy={36} r={5} />
    </Svg>
  );
}

// ---- Seviye 15: Yakut -------------------------------------------------------

function YakutSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gyakut" color="#E0525E" />
      <Circle cx={50} cy={52} r={46} fill="url(#gyakut)" />
      <Ellipse cx={50} cy={55} rx={28} ry={22} fill="#8E1B2C" />
      <Ellipse cx={50} cy={53} rx={28} ry={22} fill="#C22B3D" />
      {/* ışın fasetleri */}
      <Polygon points="50,53 28,46 36,36" fill="#E0525E" opacity={0.85} />
      <Polygon points="50,53 36,36 58,33" fill="#D43B4C" opacity={0.9} />
      <Polygon points="50,53 58,33 73,45" fill="#E0525E" opacity={0.75} />
      <Polygon points="50,53 73,45 68,64" fill="#B32133" opacity={0.9} />
      <Polygon points="50,53 68,64 42,70" fill="#D43B4C" opacity={0.8} />
      <Polygon points="50,53 42,70 28,46" fill="#A81D30" opacity={0.9} />
      <Ellipse cx={42} cy={44} rx={8} ry={4.5} fill="#FFFFFF" opacity={0.4} transform="rotate(-16 42 44)" />
      <Sparkle cx={65} cy={38} r={4.5} />
    </Svg>
  );
}

// ---- Seviye 16: Safir -------------------------------------------------------

function SafirSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gsafir" color="#4E7DE0" />
      <Circle cx={50} cy={52} r={46} fill="url(#gsafir)" />
      <Circle cx={50} cy={55} r={25} fill="#122E73" />
      <Circle cx={50} cy={53} r={25} fill="#1F4699" />
      <Polygon points="50,28 66,40 60,53 40,53 34,40" fill="#2E5CB8" />
      <Polygon points="50,78 66,66 60,53 40,53 34,66" fill="#173A85" />
      <Polygon points="25,53 34,40 40,53 34,66" fill="#3A6BCB" opacity={0.9} />
      <Polygon points="75,53 66,40 60,53 66,66" fill="#274FA6" opacity={0.95} />
      {/* yıldız safir parlaması */}
      <G stroke="#BFD4F5" strokeWidth={1.6} strokeLinecap="round" opacity={0.9}>
        <Line x1={50} y1={38} x2={50} y2={68} />
        <Line x1={37} y1={45} x2={63} y2={61} />
        <Line x1={63} y1={45} x2={37} y2={61} />
      </G>
      <Sparkle cx={64} cy={36} r={5} />
    </Svg>
  );
}

// ---- Seviye 17-18: Elmas / Pembe Elmas -------------------------------------

function BrilliantSvg({
  glowId,
  glow,
  deep,
  mid,
  light,
  table,
}: {
  glowId: string;
  glow: string;
  deep: string;
  mid: string;
  light: string;
  table: string;
}) {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id={glowId} color={glow} opacity={0.6} />
      <Circle cx={50} cy={52} r={47} fill={`url(#${glowId})`} />
      {/* taç */}
      <Polygon points="30,42 70,42 62,30 38,30" fill={light} />
      <Polygon points="38,30 30,42 20,42" fill={mid} />
      <Polygon points="62,30 70,42 80,42" fill={mid} />
      <Polygon points="38,30 62,30 50,24 44,24" fill={table} />
      {/* pavyon */}
      <Polygon points="20,42 50,80 40,42" fill={mid} />
      <Polygon points="40,42 50,80 60,42" fill={light} />
      <Polygon points="60,42 50,80 80,42" fill={deep} />
      <Line x1={20} y1={42} x2={80} y2={42} stroke="#FFFFFF" strokeWidth={1.4} opacity={0.8} />
      <Sparkle cx={35} cy={35} r={4.5} />
      <Sparkle cx={66} cy={54} r={3.5} />
    </Svg>
  );
}

// ---- Seviye 19: Bitcoin -----------------------------------------------------

function BitcoinSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gbtc" color="#F7931A" opacity={0.55} />
      <Circle cx={50} cy={52} r={47} fill="url(#gbtc)" />
      <Circle cx={50} cy={54} r={31} fill="#C46E0A" />
      <Circle cx={50} cy={52} r={31} fill="#F7931A" />
      <Circle cx={50} cy={52} r={26} fill="none" stroke="#FFD9A0" strokeWidth={2} />
      <SvgText x={51} y={63} textAnchor="middle" fontSize={34} fontWeight="800" fill="#FFFFFF">
        B
      </SvgText>
      <G stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round">
        <Line x1={46} y1={34} x2={46} y2={39} />
        <Line x1={54} y1={34} x2={54} y2={39} />
        <Line x1={46} y1={65} x2={46} y2={70} />
        <Line x1={54} y1={65} x2={54} y2={70} />
      </G>
      <Ellipse cx={39} cy={40} rx={10} ry={5} fill="#FFFFFF" opacity={0.3} transform="rotate(-24 39 40)" />
    </Svg>
  );
}

// ---- Seviye 20: Soğuk Cüzdan ------------------------------------------------

function WalletSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gwallet" color="#6FA8C9" opacity={0.45} />
      <Circle cx={50} cy={52} r={46} fill="url(#gwallet)" />
      <Rect x={22} y={30} width={56} height={46} rx={8} fill="#5A6B77" />
      <Rect x={22} y={27} width={56} height={46} rx={8} fill="#7E93A1" />
      <Rect x={27} y={32} width={46} height={36} rx={5} fill="#8FA5B3" />
      {/* devre izleri */}
      <G stroke="#C4D6E0" strokeWidth={1.6} strokeLinecap="round">
        <Line x1={32} y1={40} x2={44} y2={40} />
        <Line x1={44} y1={40} x2={44} y2={50} />
        <Line x1={32} y1={60} x2={40} y2={60} />
        <Line x1={40} y1={60} x2={40} y2={52} />
      </G>
      <Circle cx={44} cy={50} r={2} fill="#C4D6E0" />
      <Circle cx={40} cy={52} r={2} fill="#C4D6E0" />
      {/* kilit çarkı */}
      <Circle cx={60} cy={50} r={9} fill="#5A6B77" />
      <Circle cx={60} cy={50} r={9} fill="none" stroke="#C4D6E0" strokeWidth={2} />
      <Circle cx={60} cy={50} r={3} fill="#3DDB84" />
      <Line x1={60} y1={41} x2={60} y2={45} stroke="#C4D6E0" strokeWidth={2} />
    </Svg>
  );
}

// ---- Seviye 21: Hazine Sandığı ----------------------------------------------

function SandikSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gsandik" color="#F6D876" opacity={0.6} />
      <Circle cx={50} cy={52} r={47} fill="url(#gsandik)" />
      {/* açık kapak */}
      <Path d="M24 42 Q50 20 76 42 L76 48 L24 48 Z" fill="#7E5C3F" />
      <Path d="M24 42 Q50 24 76 42" fill="none" stroke="#9A7250" strokeWidth={3} />
      {/* taşan altınlar */}
      <Circle cx={38} cy={44} r={6} fill="#F6D876" />
      <Circle cx={50} cy={41} r={7} fill="#E8B93C" />
      <Circle cx={62} cy={44} r={6} fill="#F6D876" />
      <Circle cx={44} cy={47} r={5} fill="#E8B93C" />
      <Circle cx={57} cy={47} r={5} fill="#F0C95A" />
      {/* gövde */}
      <Rect x={24} y={48} width={52} height={30} rx={4} fill="#9A7250" />
      <Rect x={24} y={48} width={52} height={7} fill="#845B39" />
      <Rect x={45} y={52} width={10} height={12} rx={2} fill="#E8B93C" />
      <Circle cx={50} cy={57} r={1.8} fill="#7A5A08" />
      <Line x1={31} y1={48} x2={31} y2={78} stroke="#E8B93C" strokeWidth={2.5} />
      <Line x1={69} y1={48} x2={69} y2={78} stroke="#E8B93C" strokeWidth={2.5} />
      <Sparkle cx={68} cy={34} r={4.5} color="#FFF3C4" />
    </Svg>
  );
}

// ---- Seviye 22: Banka Kasası ------------------------------------------------

function KasaSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gkasa" color="#9BB1C4" opacity={0.5} />
      <Circle cx={50} cy={52} r={47} fill="url(#gkasa)" />
      <Circle cx={50} cy={54} r={33} fill="#5A6B77" />
      <Circle cx={50} cy={52} r={33} fill="#8296A6" />
      <Circle cx={50} cy={52} r={26} fill="#9FB2C0" />
      <Circle cx={50} cy={52} r={26} fill="none" stroke="#5A6B77" strokeWidth={2} />
      {/* kol çarkı */}
      <Circle cx={50} cy={52} r={11} fill="none" stroke="#3E4C56" strokeWidth={3.5} />
      <G stroke="#3E4C56" strokeWidth={3.5} strokeLinecap="round">
        <Line x1={50} y1={38} x2={50} y2={66} />
        <Line x1={38} y1={45} x2={62} y2={59} />
        <Line x1={62} y1={45} x2={38} y2={59} />
      </G>
      <Circle cx={50} cy={52} r={4} fill="#3E4C56" />
      {/* cıvatalar */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <Circle
          key={deg}
          cx={50 + 30 * Math.cos((deg * Math.PI) / 180)}
          cy={52 + 30 * Math.sin((deg * Math.PI) / 180)}
          r={2.4}
          fill="#DCE5EC"
        />
      ))}
    </Svg>
  );
}

// ---- Seviye 23: Merkez Bankası Rezervi --------------------------------------

function RezervSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="grezerv" color="#F6D876" opacity={0.6} />
      <Circle cx={50} cy={52} r={47} fill="url(#grezerv)" />
      {/* sütunlu bina silüeti */}
      <Polygon points="50,16 24,30 76,30" fill="#B4C4D4" />
      <Rect x={28} y={32} width={5} height={18} fill="#C9D6E2" />
      <Rect x={40} y={32} width={5} height={18} fill="#C9D6E2" />
      <Rect x={55} y={32} width={5} height={18} fill="#C9D6E2" />
      <Rect x={67} y={32} width={5} height={18} fill="#C9D6E2" />
      {/* külçe piramidi */}
      {[
        { x: 26, y: 68, w: 15 }, { x: 43, y: 68, w: 15 }, { x: 60, y: 68, w: 15 },
        { x: 34, y: 59, w: 15 }, { x: 51, y: 59, w: 15 },
        { x: 43, y: 50, w: 15 },
      ].map((b, i) => (
        <G key={i}>
          <Rect x={b.x} y={b.y + 1.5} width={b.w} height={8} rx={2} fill="#B8860B" />
          <Rect x={b.x} y={b.y} width={b.w} height={8} rx={2} fill="#E8B93C" />
          <Rect x={b.x + 2} y={b.y + 1.5} width={b.w - 4} height={2.5} rx={1} fill="#F6D876" />
        </G>
      ))}
      <Sparkle cx={70} cy={44} r={4} color="#FFF3C4" />
    </Svg>
  );
}

// ---- Seviye 24: Dünya Serveti (nihai hedef) ---------------------------------

function DunyaSvg() {
  return (
    <Svg viewBox="0 0 100 100" width="100%" height="100%">
      <TintGlow id="gdunya" color="#F6D876" opacity={0.75} />
      <Circle cx={50} cy={52} r={49} fill="url(#gdunya)" />
      {/* ışınlar */}
      <G stroke="#F6D876" strokeWidth={2.4} strokeLinecap="round" opacity={0.85}>
        <Line x1={50} y1={6} x2={50} y2={15} />
        <Line x1={17} y1={22} x2={24} y2={28} />
        <Line x1={83} y1={22} x2={76} y2={28} />
        <Line x1={10} y1={54} x2={19} y2={54} />
        <Line x1={90} y1={54} x2={81} y2={54} />
      </G>
      {/* altın küre */}
      <Circle cx={50} cy={54} r={29} fill="#B8860B" />
      <Circle cx={50} cy={52} r={29} fill="#E8B93C" />
      <Circle cx={50} cy={52} r={29} fill="none" stroke="#F6D876" strokeWidth={2} />
      {/* meridyen ve paraleller */}
      <G stroke="#7A5A08" strokeWidth={1.6} fill="none" opacity={0.8}>
        <Ellipse cx={50} cy={52} rx={13} ry={29} />
        <Ellipse cx={50} cy={52} rx={24} ry={29} />
        <Line x1={21} y1={52} x2={79} y2={52} />
        <Ellipse cx={50} cy={52} rx={29} ry={12} />
      </G>
      {/* kıta lekeleri */}
      <Circle cx={40} cy={42} r={5} fill="#F6D876" opacity={0.9} />
      <Ellipse cx={60} cy={60} rx={7} ry={5} fill="#F6D876" opacity={0.9} />
      <Ellipse cx={42} cy={64} rx={4.5} ry={3.5} fill="#F6D876" opacity={0.85} />
      <Ellipse cx={38} cy={40} rx={9} ry={5} fill="#FFFFFF" opacity={0.3} transform="rotate(-24 38 40)" />
      <Sparkle cx={70} cy={32} r={5.5} color="#FFF3C4" />
      <Sparkle cx={28} cy={70} r={4} color="#FFF3C4" />
    </Svg>
  );
}

export function MoneySvg({ level }: { level: number }) {
  switch (level) {
    case 1:
      return <CoinSvg value="1" unit="KURUŞ" rim="#A96A45" face="#C8845A" edge="#8F5637" ink="#5C3620" />;
    case 2:
      return <CoinSvg value="10" unit="KURUŞ" rim="#B58234" face="#D9A353" edge="#96691F" ink="#5F4310" />;
    case 3:
      return <CoinSvg value="50" unit="KURUŞ" rim="#B58234" face="#D9A353" inner="#CDD3D6" edge="#96691F" ink="#4A5257" />;
    case 4:
      return <CoinSvg value="1" unit="TL" rim="#9AA4AA" face="#C9CFD3" inner="#D9A353" edge="#7E8A91" ink="#5F4310" />;
    case 5:
      return <NoteSvg value="10" symbol="₺" paper="#EBB8B8" panel="#F5DADA" ink="#7C2E2E" deep="#A34848" />;
    case 6:
      return <NoteSvg value="50" symbol="₺" paper="#EBC194" panel="#F7E3C9" ink="#7C4E1B" deep="#B0722F" />;
    case 7:
      return <NoteSvg value="200" symbol="₺" paper="#C3B4E0" panel="#E6DFF4" ink="#4E3B7A" deep="#75619F" />;
    case 8:
      return <NoteSvg value="100" symbol="$" paper="#A9C9B4" panel="#DCEBE1" ink="#2E5B40" deep="#4E7D60" />;
    case 9:
      return <GoldBarSvg />;
    case 10:
      return <CeyrekSvg />;
    case 11:
      return <TamSvg />;
    case 12:
      return <KulceSvg />;
    case 13:
      return <YesimSvg />;
    case 14:
      return <ZumrutSvg />;
    case 15:
      return <YakutSvg />;
    case 16:
      return <SafirSvg />;
    case 17:
      return (
        <BrilliantSvg glowId="gelmas" glow="#BFE0F5" deep="#9FB8D9" mid="#C6D8ED" light="#E8F1FA" table="#FFFFFF" />
      );
    case 18:
      return (
        <BrilliantSvg glowId="gpembe" glow="#F09AC4" deep="#D9679F" mid="#EC93BE" light="#F9C6DE" table="#FDE8F2" />
      );
    case 19:
      return <BitcoinSvg />;
    case 20:
      return <WalletSvg />;
    case 21:
      return <SandikSvg />;
    case 22:
      return <KasaSvg />;
    case 23:
      return <RezervSvg />;
    case 24:
      return <DunyaSvg />;
    default:
      return null;
  }
}

export default React.memo(MoneySvg);

import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { AchTier } from '../achievements/defs';

/*
 * Başarım rozetleri — para taşlarıyla aynı görsel dil: ofset gölge, kesikli
 * kenar çizgisi, pastel yüz, beyaz parlama. Normal başarımlar gümüş madalya +
 * yeşil kurdele; zor başarımlar altın madalya + kırmızı kurdele + ışıma.
 * Kilitliyken her şey gri iskelet olarak çizilir, kazanınca renkleri açılır.
 */

interface Palette {
  rim: string;
  edge: string;
  face: string;
  ink: string; // ikon ana rengi
  accent: string; // ikon vurgu rengi
  ribbon: string;
  ribbonDeep: string;
  shadow: string;
  shine: boolean;
  glow: boolean;
}

const SILVER: Palette = {
  rim: '#C2CDD2',
  edge: '#8E9CA4',
  face: '#E6ECEF',
  ink: '#4E6E5D',
  accent: '#7FB294',
  ribbon: '#4FB477',
  ribbonDeep: '#3E8E68',
  shadow: 'rgba(0,0,0,0.10)',
  shine: true,
  glow: false,
};

const GOLD: Palette = {
  rim: '#E8B93C',
  edge: '#B8860B',
  face: '#F6D876',
  ink: '#7A5A08',
  accent: '#B8860B',
  ribbon: '#D95D4E',
  ribbonDeep: '#C94F4F',
  shadow: 'rgba(0,0,0,0.10)',
  shine: true,
  glow: true,
};

/** Elit rozetler: her başarımın kendi mücevher minesi */
const GEMS: Record<string, { light: string; base: string; deep: string }> = {
  altinseti: { light: '#FFE9A8', base: '#E8B93C', deep: '#9A6D07' }, // altın mine
  ciftekulce: { light: '#FF9DB0', base: '#E8506E', deep: '#B22C4C' }, // yakut
  altincag: { light: '#8FE6B8', base: '#3BC47E', deep: '#1F8D57' }, // zümrüt
  numizmat: { light: '#8FC8F2', base: '#3E8ED9', deep: '#2361A6' }, // safir
  hiper: { light: '#CBA8F0', base: '#9A5FD6', deep: '#6C3AA6' }, // ametist
  holding: { light: '#7FE0DC', base: '#2FB4AE', deep: '#177E7A' }, // turkuaz
  serimanyagi: { light: '#FFBE85', base: '#F08A3E', deep: '#C2601D' }, // kor
};

/** Efsanevi rozetler: yeni zincir ucunun (mücevher/kripto/epik) renk temaları */
const HUES: Record<string, { light: string; base: string; deep: string }> = {
  kuyumcu: { light: '#B8E6C0', base: '#6FBF7F', deep: '#3E8E58' }, // yeşim
  elmas: { light: '#EEF6FF', base: '#A9C4DE', deep: '#5E7C96' }, // pırlanta beyazı
  pembeelmas: { light: '#FFD1E8', base: '#E86FA8', deep: '#A8347A' }, // pembe elmas
  mucevherseti: { light: '#E3C9F7', base: '#A56FD6', deep: '#6C3AA6' }, // vitrin moru
  sogukzincir: { light: '#DDE5EA', base: '#8A9BA8', deep: '#4E606E' }, // çelik + buz
  kasa: { light: '#CFE0D6', base: '#6E9480', deep: '#3C5C4A' }, // kasa yeşili
  rezerv: { light: '#FFEEB5', base: '#E0B63C', deep: '#9A7A10' }, // rezerv altını
  mucevherkutusu: { light: '#F2B8D8', base: '#D66FA8', deep: '#A8437C' }, // pembe elmas
  elmaseller: { light: '#FFD9A0', base: '#F7931A', deep: '#B96A0E' }, // bitcoin turuncusu
  sogukdepo: { light: '#D6EFFA', base: '#7FC4E8', deep: '#3E85B5' }, // buz
  define: { light: '#F5A9A0', base: '#D9574A', deep: '#A03428' }, // hazine kırmızısı
  dunyanin: { light: '#A9C8F5', base: '#4A79D9', deep: '#2C4FA6' }, // dünya mavisi
};

/** Dört uçlu parıltı yıldızı path'i */
function sparkPath(cx: number, cy: number, r: number): string {
  const k = r * 0.28;
  return `M ${cx} ${cy - r} L ${cx + k} ${cy - k} L ${cx + r} ${cy} L ${cx + k} ${cy + k} L ${cx} ${cy + r} L ${cx - k} ${cy + k} L ${cx - r} ${cy} L ${cx - k} ${cy - k} Z`;
}


/** Başarım ikonu: madalya yüzünün merkezine (50, 46) çizilir */
function BadgeIcon({ id, p }: { id: string; p: Palette }) {
  switch (id) {
    // ---- Madeni para ----
    case 'madeni':
      return (
        <>
          <Circle cx={50} cy={46} r={15} fill={p.ink} />
          <Circle cx={50} cy={46} r={11.5} fill="none" stroke={p.face} strokeWidth={1.6} opacity={0.7} />
          <SvgText x={50} y={53} textAnchor="middle" fontSize={17} fontWeight="800" fill={p.face}>
            ₺
          </SvgText>
        </>
      );
    case 'kumbara':
      return (
        <>
          <Circle cx={40} cy={36} r={7} fill={p.ink} opacity={0.7} />
          <Circle cx={60} cy={36} r={8.5} fill={p.ink} opacity={0.82} />
          <Circle cx={39} cy={56} r={9.5} fill={p.ink} opacity={0.9} />
          <Circle cx={60} cy={56} r={11} fill={p.ink} />
          <Circle cx={60} cy={56} r={5} fill="none" stroke={p.face} strokeWidth={1.4} opacity={0.6} />
        </>
      );
    // ---- Kağıt para ----
    case 'banknot':
      return (
        <>
          <Rect x={31} y={35} width={38} height={22} rx={3} fill={p.ink} />
          <Circle cx={50} cy={46} r={6.5} fill={p.face} opacity={0.85} />
          <SvgText x={50} y={49.5} textAnchor="middle" fontSize={8.5} fontWeight="800" fill={p.ink}>
            10
          </SvgText>
          <Line x1={35} y1={40} x2={41} y2={40} stroke={p.face} strokeWidth={1.6} opacity={0.55} strokeLinecap="round" />
          <Line x1={59} y1={52} x2={65} y2={52} stroke={p.face} strokeWidth={1.6} opacity={0.55} strokeLinecap="round" />
        </>
      );
    case 'deste':
      return (
        <>
          <Rect x={30} y={31} width={36} height={16} rx={2.5} fill={p.ink} opacity={0.55} transform="rotate(-8 48 39)" />
          <Rect x={32} y={39} width={36} height={16} rx={2.5} fill={p.ink} opacity={0.78} />
          <Rect x={31} y={47} width={38} height={17} rx={2.5} fill={p.ink} />
          <Rect x={44} y={47} width={11} height={17} fill={p.accent} opacity={0.8} />
          <Circle cx={50} cy={55.5} r={3.8} fill={p.face} opacity={0.75} />
        </>
      );
    case 'dolar':
      return (
        <SvgText x={50} y={57} textAnchor="middle" fontSize={32} fontWeight="800" fill={p.ink}>
          $
        </SvgText>
      );
    case 'altin':
      return (
        <>
          <Rect x={36} y={40} width={28} height={15} rx={2.5} fill={p.ink} />
          <Rect x={39} y={43} width={22} height={4.5} rx={2} fill={p.accent} opacity={0.9} />
          <SvgText x={50} y={64} textAnchor="middle" fontSize={8} fontWeight="800" fill={p.ink}>
            1g
          </SvgText>
        </>
      );
    // ---- Altın ----
    case 'tamaltin':
      return (
        <>
          <Circle cx={50} cy={46} r={16} fill={p.ink} />
          <Circle cx={50} cy={46} r={12.5} fill="none" stroke={p.face} strokeWidth={1.5} opacity={0.6} />
          <Path d="M54 37 a9.5 9.5 0 1 0 0 18 a7.2 7.2 0 1 1 0 -18 Z" fill={p.face} opacity={0.9} />
          <Path d={sparkPath(60, 46, 3.2)} fill={p.face} opacity={0.85} />
        </>
      );
    case 'zincir':
      return (
        <>
          <Path d="M52 26 L44 42 L50 42 L46 56 L58 38 L51 38 Z" fill={p.accent} />
          <SvgText x={50} y={64} textAnchor="middle" fontSize={13} fontWeight="800" fill={p.ink}>
            ×5
          </SvgText>
        </>
      );
    case 'anahtar':
      return (
        <>
          <Circle cx={41} cy={46} r={7} fill="none" stroke={p.ink} strokeWidth={4} />
          <Line x1={48} y1={46} x2={64} y2={46} stroke={p.ink} strokeWidth={4} strokeLinecap="round" />
          <Line x1={57} y1={46} x2={57} y2={53} stroke={p.ink} strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={63} y1={46} x2={63} y2={54} stroke={p.ink} strokeWidth={3.5} strokeLinecap="round" />
        </>
      );
    case 'kulce':
      return (
        <>
          <Polygon points="40,42 45,32 61,32 66,42" fill={p.accent} />
          <Polygon points="33,58 39,46 57,46 63,58" fill={p.ink} />
          <Line x1={41} y1={49} x2={54} y2={49} stroke={p.face} strokeWidth={2} opacity={0.6} strokeLinecap="round" />
        </>
      );
    case 'efsane':
      return (
        <>
          <Path d="M33 58 L33 40 L42 47 L50 32 L58 47 L67 40 L67 58 Z" fill={p.ink} />
          <Circle cx={41} cy={53} r={2.2} fill={p.face} />
          <Circle cx={50} cy={53} r={2.2} fill={p.face} />
          <Circle cx={59} cy={53} r={2.2} fill={p.face} />
        </>
      );
    case 'milyoner':
      return (
        <SvgText x={50} y={55} textAnchor="middle" fontSize={21} fontWeight="800" fill={p.ink}>
          ₺1M
        </SvgText>
      );
    case 'boga':
      return (
        <>
          <Path
            d="M33 58 L44 47 L51 53 L62 39"
            fill="none"
            stroke={p.ink}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polygon points="66,34 54,36 63,45" fill={p.ink} />
        </>
      );
    case 'agalik':
      return (
        <>
          <Polygon
            points="50,32 69,45 50,58 31,45"
            fill="none"
            stroke={p.ink}
            strokeWidth={3}
            strokeDasharray="5 4"
          />
          <Line x1={50} y1={51} x2={50} y2={42} stroke={p.accent} strokeWidth={3} strokeLinecap="round" />
          <Path d="M50 45 q-6 -1 -7 -7 q6 1 7 7" fill={p.accent} />
          <Path d="M50 43 q6 -2 6 -8 q-6 2 -6 8" fill={p.accent} />
        </>
      );
    case 'kral':
      return (
        <>
          <Path d="M39 32 L61 32 L59 46 A9.5 9.5 0 0 1 41 46 Z" fill={p.ink} />
          <Path d="M38 35 q-8 1 -6 9 q2 5 8 5" fill="none" stroke={p.ink} strokeWidth={3} />
          <Path d="M62 35 q8 1 6 9 q-2 5 -8 5" fill="none" stroke={p.ink} strokeWidth={3} />
          <Rect x={47} y={52} width={6} height={6} fill={p.ink} />
          <Rect x={41} y={58} width={18} height={4.5} rx={2} fill={p.ink} />
        </>
      );
    // ---- Elit ikonlar (mine üzerine beyaz) ----
    case 'altinseti':
      return (
        <>
          <Circle cx={37} cy={36} r={7.5} fill={p.ink} opacity={0.82} />
          <Circle cx={57} cy={34} r={9} fill={p.ink} />
          <Rect x={30} y={49} width={19} height={8} rx={1.5} fill={p.ink} opacity={0.9} />
          <Polygon points="52,57 55,48 69,48 72,57" fill={p.ink} />
          <Line x1={57} y1={52.5} x2={66} y2={52.5} stroke={p.accent} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
        </>
      );
    case 'ciftekulce':
      return (
        <>
          <Polygon points="36,46 41,38 57,38 62,46" fill={p.ink} opacity={0.8} />
          <Polygon points="38,58 43,48 61,48 66,58" fill={p.ink} />
          <Line x1={46} y1={53} x2={58} y2={53} stroke={p.accent} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        </>
      );
    case 'altincag':
      return (
        <>
          <Polygon points="34,45 38,38 47,38 51,45" fill={p.ink} />
          <Polygon points="53,45 57,38 66,38 70,45" fill={p.ink} opacity={0.85} />
          <Polygon points="30,57 34,50 43,50 47,57" fill={p.ink} opacity={0.85} />
          <Polygon points="49,57 53,50 62,50 66,57" fill={p.ink} />
        </>
      );
    case 'numizmat':
      return (
        <>
          <Circle cx={42} cy={41} r={9} fill={p.ink} opacity={0.85} />
          <Circle cx={58} cy={41} r={9} fill={p.ink} opacity={0.75} />
          <Circle cx={50} cy={53} r={10} fill={p.ink} />
          <Circle cx={50} cy={53} r={5.5} fill="none" stroke={p.accent} strokeWidth={1.6} />
        </>
      );
    case 'hiper':
      return (
        <>
          <Path d="M50 26 C56 32 57 43 54 51 L46 51 C43 43 44 32 50 26 Z" fill={p.ink} />
          <Circle cx={50} cy={38} r={3.2} fill={p.accent} />
          <Polygon points="45,48 38,57 45,55" fill={p.ink} />
          <Polygon points="55,48 62,57 55,55" fill={p.ink} />
          <Polygon points="46,53 50,63 54,53" fill="#F6D876" />
        </>
      );
    case 'holding':
      return (
        <>
          <Rect x={34} y={41} width={9} height={19} rx={1} fill={p.ink} opacity={0.8} />
          <Rect x={45} y={31} width={11} height={29} rx={1} fill={p.ink} />
          <Rect x={58} y={45} width={9} height={15} rx={1} fill={p.ink} opacity={0.8} />
          <Rect x={48} y={35} width={2.4} height={2.4} fill={p.accent} />
          <Rect x={52} y={35} width={2.4} height={2.4} fill={p.accent} />
          <Rect x={48} y={40} width={2.4} height={2.4} fill={p.accent} />
          <Rect x={52} y={40} width={2.4} height={2.4} fill={p.accent} />
        </>
      );
    case 'serimanyagi':
      return (
        <>
          <Path d="M54 26 L42 46 L49 46 L44 62 L60 40 L52 40 Z" fill={p.ink} />
          <Path d="M63 30 L57 40 L61 40 L58 48 L66 37 L62 37 Z" fill={p.ink} opacity={0.6} />
        </>
      );
    // ---- Efsanevi ikonlar ----
    case 'kuyumcu':
      return (
        <>
          <Circle cx={50} cy={51} r={9} fill="none" stroke={p.ink} strokeWidth={4} />
          <Polygon points="50,29 58,37 50,45 42,37" fill={p.ink} />
          <Line x1={45} y1={37} x2={55} y2={37} stroke={p.accent} strokeWidth={1.5} />
        </>
      );
    case 'elmas':
      return (
        <>
          <Polygon points="50,62 30,41 39,30 61,30 70,41" fill={p.ink} />
          <Polygon points="39,30 61,30 66,41 34,41" fill={p.accent} opacity={0.3} />
          <Line x1={34} y1={41} x2={66} y2={41} stroke={p.face} strokeWidth={1.4} opacity={0.5} />
          <Path d={sparkPath(67, 27, 4)} fill={p.ink} opacity={0.9} />
        </>
      );
    case 'pembeelmas':
      return (
        <>
          <Polygon points="50,63 33,42 50,28 67,42" fill={p.ink} />
          <Polygon points="50,28 67,42 33,42" fill={p.accent} opacity={0.3} />
          <Line x1={50} y1={28} x2={50} y2={63} stroke={p.face} strokeWidth={1.2} opacity={0.4} />
          <Path d={sparkPath(68, 29, 4.5)} fill={p.ink} opacity={0.9} />
          <Path d={sparkPath(32, 58, 3)} fill={p.ink} opacity={0.7} />
        </>
      );
    case 'mucevherseti':
      return (
        <>
          {[
            { x: 33, r: 5 },
            { x: 41.5, r: 6 },
            { x: 50, r: 7.5 },
            { x: 58.5, r: 6 },
            { x: 67, r: 5 },
          ].map((g, k) => (
            <Polygon
              key={k}
              points={`${g.x},${44 - g.r * 1.6} ${g.x + g.r},44 ${g.x},${44 + g.r * 1.6} ${g.x - g.r},44`}
              fill={p.ink}
              opacity={k === 2 ? 1 : 0.78}
            />
          ))}
          <Rect x={29} y={58} width={42} height={4.5} rx={2.2} fill={p.ink} opacity={0.6} />
        </>
      );
    case 'mucevherkutusu':
      return (
        <>
          <Polygon points="43,27 47,31 43,35 39,31" fill={p.ink} opacity={0.8} />
          <Polygon points="50,24 55,29 50,34 45,29" fill={p.ink} />
          <Polygon points="57,27 61,31 57,35 53,31" fill={p.ink} opacity={0.8} />
          <Rect x={34} y={40} width={32} height={5} rx={2} fill={p.ink} opacity={0.85} />
          <Rect x={36} y={45} width={28} height={14} rx={2} fill={p.ink} />
          <Rect x={47} y={47} width={6} height={5} rx={1.5} fill={p.accent} />
        </>
      );
    case 'elmaseller':
      return (
        <>
          <SvgText x={50} y={56} textAnchor="middle" fontSize={28} fontWeight="800" fill={p.ink}>
            B
          </SvgText>
          <Line x1={47} y1={28} x2={47} y2={33} stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
          <Line x1={53} y1={28} x2={53} y2={33} stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
          <Line x1={47} y1={58} x2={47} y2={63} stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
          <Line x1={53} y1={58} x2={53} y2={63} stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case 'sogukdepo':
      return (
        <>
          <Line x1={50} y1={31} x2={50} y2={61} stroke={p.ink} strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={37} y1={38.5} x2={63} y2={53.5} stroke={p.ink} strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={63} y1={38.5} x2={37} y2={53.5} stroke={p.ink} strokeWidth={3.5} strokeLinecap="round" />
          <Circle cx={50} cy={46} r={3} fill={p.accent} />
        </>
      );
    case 'sogukzincir':
      return (
        <>
          <Circle cx={41} cy={46} r={13} fill={p.ink} />
          <SvgText x={41} y={52.5} textAnchor="middle" fontSize={17} fontWeight="800" fill={p.face}>
            B
          </SvgText>
          <Line x1={62} y1={33} x2={62} y2={59} stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
          <Line x1={52} y1={39} x2={72} y2={53} stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
          <Line x1={72} y1={39} x2={52} y2={53} stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case 'define':
      return (
        <>
          <Path d="M36 45 a14 10 0 0 1 28 0 Z" fill={p.ink} opacity={0.85} />
          <Rect x={36} y={45} width={28} height={14} rx={2} fill={p.ink} />
          <Rect x={47} y={44} width={6} height={8} rx={1.5} fill={p.accent} />
          <Circle cx={50} cy={47.5} r={1.4} fill={p.ink} />
        </>
      );
    case 'kasa':
      return (
        <>
          <Rect x={31} y={29} width={38} height={36} rx={4} fill={p.ink} />
          <Rect x={35} y={33} width={30} height={28} rx={3} fill="none" stroke={p.face} strokeWidth={1.5} opacity={0.55} />
          <Circle cx={50} cy={47} r={8} fill={p.face} opacity={0.9} />
          <Circle cx={50} cy={47} r={3} fill={p.ink} />
          <Line x1={50} y1={37} x2={50} y2={57} stroke={p.ink} strokeWidth={2} strokeLinecap="round" />
          <Line x1={40} y1={47} x2={60} y2={47} stroke={p.ink} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case 'rezerv':
      return (
        <>
          <Polygon points="50,26 72,38 28,38" fill={p.ink} />
          <Rect x={31} y={40} width={38} height={4} rx={1.5} fill={p.ink} />
          <Rect x={34} y={46} width={5} height={16} fill={p.ink} opacity={0.88} />
          <Rect x={43.5} y={46} width={5} height={16} fill={p.ink} opacity={0.88} />
          <Rect x={53} y={46} width={5} height={16} fill={p.ink} opacity={0.88} />
          <Rect x={62} y={46} width={5} height={16} fill={p.ink} opacity={0.88} />
          <Rect x={30} y={63} width={41} height={4} rx={1.5} fill={p.ink} />
          <Path d={sparkPath(50, 33, 3.2)} fill={p.face} opacity={0.85} />
        </>
      );
    case 'dunyanin':
      return (
        <>
          <Circle cx={50} cy={46} r={14} fill="none" stroke={p.ink} strokeWidth={3} />
          <Ellipse cx={50} cy={46} rx={6} ry={14} fill="none" stroke={p.ink} strokeWidth={2} />
          <Line x1={36} y1={46} x2={64} y2={46} stroke={p.ink} strokeWidth={2} />
          <Path d="M39 39 q5 -3 9 -1" fill="none" stroke={p.accent} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    default:
      return null;
  }
}

export default function BadgeSvg({
  id,
  tier,
  locked,
  size = 92,
}: {
  id: string;
  tier: AchTier;
  locked: boolean;
  size?: number;
}) {
  // Kilitli rozet: madalyanın tüm katman yapısı (kurdele, halka, kesikli
  // kenar, yüz) gri tonlarda korunur ama başarımın ikonu görünmez — yerinde
  // içeriği ele vermeyen bir asma kilit durur. Kazanınca renkleri açılır.
  if (locked) {
    return (
      <Svg viewBox="0 0 100 110" width={size} height={(size * 110) / 100}>
        <Polygon points="36,60 27,98 44,90 50,68" fill="#CBD3CD" />
        <Polygon points="64,60 73,98 56,90 50,68" fill="#D6DDD8" />
        <Circle cx={50} cy={48} r={38} fill="rgba(0,0,0,0.06)" />
        <Circle cx={50} cy={46} r={38} fill="#D3DAD5" />
        <Circle
          cx={50}
          cy={46}
          r={38}
          fill="none"
          stroke="#B9C3BC"
          strokeWidth={2.5}
          strokeDasharray="2.2 3.4"
        />
        <Circle cx={50} cy={46} r={30} fill="#E4E9E5" />
        <Path d="M45 44 v-4 a5 5 0 0 1 10 0 v4" fill="none" stroke="#AEB9B1" strokeWidth={3} />
        <Rect x={43} y={44} width={14} height={12} rx={2.5} fill="#AEB9B1" />
        <Circle cx={50} cy={49.5} r={1.8} fill="#E4E9E5" />
        <Ellipse cx={39} cy={29} rx={12} ry={6} fill="#FFFFFF" opacity={0.18} transform="rotate(-24 39 29)" />
      </Svg>
    );
  }

  // Efsanevi: taçlı, yanardöner jantlı, faset yüzlü madalya — zincirin ucu
  if (tier === 'efsanevi') {
    const hue = HUES[id] ?? HUES.dunyanin;
    const glowId = `bglow-${id}`;
    const faceId = `bface-${id}`;
    const rimId = `brim-${id}`;
    const inkP: Palette = { ...GOLD, ink: '#FFFFFF', accent: hue.deep, face: hue.base };
    return (
      <Svg viewBox="0 0 100 110" width={size} height={(size * 110) / 100}>
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={hue.light} stopOpacity={0.7} />
            <Stop offset="100%" stopColor={hue.light} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={faceId} cx="42%" cy="36%" r="75%">
            <Stop offset="0%" stopColor={hue.light} />
            <Stop offset="100%" stopColor={hue.base} />
          </RadialGradient>
          {/* yanardöner (prizmatik) jant */}
          <LinearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F6D876" />
            <Stop offset="0.3" stopColor="#FF9DB0" />
            <Stop offset="0.55" stopColor="#C9A8F0" />
            <Stop offset="0.78" stopColor="#8FC8F2" />
            <Stop offset="1" stopColor="#8FE6B8" />
          </LinearGradient>
        </Defs>
        <Circle cx={50} cy={46} r={50} fill={`url(#${glowId})`} />
        {Array.from({ length: 12 }, (_, k) => (
          <Polygon
            key={k}
            points="50,3 54,20 50,28 46,20"
            fill={k % 2 === 0 ? '#F6D876' : '#FFFFFF'}
            opacity={k % 2 === 0 ? 0.9 : 0.55}
            transform={`rotate(${k * 30} 50 46)`}
          />
        ))}
        <Polygon points="36,60 27,98 44,90 50,68" fill={hue.deep} stroke="#E8B93C" strokeWidth={1.2} />
        <Polygon points="64,60 73,98 56,90 50,68" fill={hue.base} stroke="#E8B93C" strokeWidth={1.2} />
        <Circle cx={50} cy={48} r={38} fill="rgba(0,0,0,0.10)" />
        <Circle cx={50} cy={46} r={38} fill={`url(#${rimId})`} />
        <Circle
          cx={50}
          cy={46}
          r={38}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeDasharray="2.2 3.4"
          opacity={0.85}
        />
        <Circle cx={50} cy={46} r={30} fill={`url(#${faceId})`} />
        {/* faset ışık bantları */}
        <Polygon points="25,41 75,28 75,33 25,46" fill="#FFFFFF" opacity={0.14} />
        <Polygon points="27,59 73,47 73,51 27,63" fill="#FFFFFF" opacity={0.08} />
        <Circle cx={50} cy={46} r={30} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.5} />
        <Circle cx={50} cy={46} r={25.5} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.25} />
        <BadgeIcon id={id} p={inkP} />
        {/* taç */}
        <Path
          d="M40 10 L40 3 L45 7 L50 1 L55 7 L60 3 L60 10 Z"
          fill="#F6D876"
          stroke="#B8860B"
          strokeWidth={1}
        />
        <Circle cx={50} cy={7} r={1.5} fill={hue.base} />
        <Ellipse cx={39} cy={29} rx={12} ry={6} fill="#FFFFFF" opacity={0.4} transform="rotate(-24 39 29)" />
        <Path d={sparkPath(69, 24, 5)} fill="#FFFFFF" opacity={0.95} />
        <Path d={sparkPath(30, 60, 3.5)} fill="#FFFFFF" opacity={0.7} />
        <Path d={sparkPath(63, 66, 3)} fill="#FFFFFF" opacity={0.8} />
      </Svg>
    );
  }

  // Elit: altın çerçeve + mücevher mine yüz + ışın patlaması + parıltılar
  if (tier === 'elit') {
    const gem = GEMS[id] ?? GEMS.hiper;
    const glowId = `bglow-${id}`;
    const faceId = `bface-${id}`;
    const elitInk: Palette = {
      ...GOLD,
      ink: '#FFFFFF',
      accent: gem.deep,
      face: gem.base,
    };
    return (
      <Svg viewBox="0 0 100 110" width={size} height={(size * 110) / 100}>
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={gem.light} stopOpacity={0.6} />
            <Stop offset="100%" stopColor={gem.light} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={faceId} cx="42%" cy="38%" r="72%">
            <Stop offset="0%" stopColor={gem.light} />
            <Stop offset="100%" stopColor={gem.base} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={46} r={49} fill={`url(#${glowId})`} />
        {Array.from({ length: 8 }, (_, k) => (
          <Polygon
            key={k}
            points="50,2 55,20 50,30 45,20"
            fill="#F6D876"
            opacity={k % 2 === 0 ? 0.95 : 0.65}
            transform={`rotate(${k * 45} 50 46)`}
          />
        ))}
        <Polygon points="36,60 27,98 44,90 50,68" fill={gem.deep} />
        <Polygon points="64,60 73,98 56,90 50,68" fill={gem.base} />
        <Circle cx={50} cy={48} r={38} fill="rgba(0,0,0,0.10)" />
        <Circle cx={50} cy={46} r={38} fill={GOLD.rim} />
        <Circle
          cx={50}
          cy={46}
          r={38}
          fill="none"
          stroke={GOLD.edge}
          strokeWidth={2.5}
          strokeDasharray="2.2 3.4"
        />
        <Circle cx={50} cy={46} r={30} fill={`url(#${faceId})`} />
        <Circle cx={50} cy={46} r={30} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.4} />
        <BadgeIcon id={id} p={elitInk} />
        <Ellipse cx={39} cy={29} rx={12} ry={6} fill="#FFFFFF" opacity={0.35} transform="rotate(-24 39 29)" />
        <Path d={sparkPath(69, 25, 5)} fill="#FFFFFF" opacity={0.95} />
        <Path d={sparkPath(31, 62, 3.5)} fill="#FFFFFF" opacity={0.7} />
      </Svg>
    );
  }

  const p = tier === 'zor' ? GOLD : SILVER;
  const glowId = `bglow-${id}`;
  return (
    <Svg viewBox="0 0 100 110" width={size} height={(size * 110) / 100}>
      {p.glow ? (
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#F6D876" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#F6D876" stopOpacity={0} />
          </RadialGradient>
        </Defs>
      ) : null}
      {p.glow ? <Circle cx={50} cy={48} r={49} fill={`url(#${glowId})`} /> : null}
      {/* kurdele */}
      <Polygon points="36,60 27,98 44,90 50,68" fill={p.ribbonDeep} />
      <Polygon points="64,60 73,98 56,90 50,68" fill={p.ribbon} />
      {/* madalya: ofset gölge + kesikli kenarlı yüz (para tarzı) */}
      <Circle cx={50} cy={48} r={38} fill={p.shadow} />
      <Circle cx={50} cy={46} r={38} fill={p.rim} />
      <Circle
        cx={50}
        cy={46}
        r={38}
        fill="none"
        stroke={p.edge}
        strokeWidth={2.5}
        strokeDasharray="2.2 3.4"
      />
      <Circle cx={50} cy={46} r={30} fill={p.face} />
      <BadgeIcon id={id} p={p} />
      {p.shine ? (
        <Ellipse cx={39} cy={29} rx={12} ry={6} fill="#FFFFFF" opacity={0.28} transform="rotate(-24 39 29)" />
      ) : null}
    </Svg>
  );
}

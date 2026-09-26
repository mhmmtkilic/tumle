import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { ITEMS } from '../economy/items';
import { box, footprint, lQuad, P, pts, rQuad, SHADOW } from './iso';

// ---- Ev (130x120) ----------------------------------------------------------

export function EvSvg({ tint }: { tint?: string } = {}) {
  const a = 62, b = 40, h = 35;
  const f = box(a, b, h);
  const apex: P = [(a - b) / 2, -h - (a + b) / 4 - 27];
  const roofR = pts([[0, -h], [a, -a / 2 - h], apex]);
  const roofL = pts([[0, -h], [-b, -b / 2 - h], apex]);
  const chim = box(8, 8, 13);
  return (
    <Svg viewBox="0 0 118 108" width="100%" height="100%">
      <G transform="translate(46,96)">
        <Polygon points={footprint(a, b, 6)} fill={SHADOW} />
        <Polygon points={f.right} fill={tint || '#F6E3BE'} />
        <Polygon points={f.left} fill={tint || '#E5C990'} />
        <Polygon points={f.top} fill={tint || '#FBEDD2'} />
        <Polygon points={roofR} fill={tint || '#E2604A'} />
        <Polygon points={roofL} fill={tint || '#C74E3B'} />
        {/* kapı ve pencereler */}
        <Polygon points={rQuad(7, 0, 13, 19)} fill={tint || '#9A6B3F'} />
        <Polygon points={rQuad(28, 7, 16, 12)} fill={tint || '#9FD4EA'} stroke={tint || '#FBEDD2'} strokeWidth={1.5} />
        <Polygon points={lQuad(9, 9, 18, 12)} fill={tint || '#8CC5DC'} stroke={tint || '#E5C990'} strokeWidth={1.5} />
        {/* baca */}
        <G transform="translate(34,-68)">
          <Polygon points={chim.right} fill={tint || '#D0806B'} />
          <Polygon points={chim.left} fill={tint || '#B5654F'} />
          <Polygon points={chim.top} fill={tint || '#E09880'} />
        </G>
      </G>
    </Svg>
  );
}

// ---- Köşe Dükkanı (110x100) ------------------------------------------------

export function DukkanSvg({ tint }: { tint?: string } = {}) {
  const a = 58, b = 36, h = 34;
  const f = box(a, b, h);
  const stripes = [];
  for (let i = 0; i < 6; i++) {
    const t0 = (i / 6) * a;
    const t1 = ((i + 1) / 6) * a;
    stripes.push(
      <Polygon
        key={i}
        points={pts([
          [t0, -t0 / 2 - (h - 6)],
          [t1, -t1 / 2 - (h - 6)],
          [t1 + 6, -t1 / 2 - (h - 6) + 8],
          [t0 + 6, -t0 / 2 - (h - 6) + 8],
        ])}
        fill={tint || (i % 2 === 0 ? '#E2604A' : '#FFF8EC')}
      />
    );
  }
  return (
    <Svg viewBox="0 0 110 100" width="100%" height="100%">
      <G transform="translate(42,90)">
        <Polygon points={footprint(a, b, 6)} fill={SHADOW} />
        <Polygon points={f.right} fill={tint || '#A8DBBE'} />
        <Polygon points={f.left} fill={tint || '#8CC4A6'} />
        <Polygon points={f.top} fill={tint || '#D2EDDD'} />
        <Polygon points={rQuad(6, 0, 13, 17)} fill={tint || '#4E7D60'} />
        <Polygon points={rQuad(25, 3, 26, 13)} fill={tint || '#9FD4EA'} stroke={tint || '#D2EDDD'} strokeWidth={1.5} />
        <Polygon points={lQuad(5, 20, 26, 9)} fill={tint || '#F6B93B'} />
        {stripes}
      </G>
    </Svg>
  );
}

// ---- Gökdelen (100x190) ----------------------------------------------------

export function GokdelenSvg({ tint }: { tint?: string } = {}) {
  const a = 34, b = 30, h = 140;
  const f = box(a, b, h);
  const winsR = [];
  const winsL = [];
  for (let row = 0; row < 9; row++) {
    const y0 = 10 + row * 14;
    for (let col = 0; col < 4; col++) {
      winsR.push(<Polygon key={`r${row}-${col}`} points={rQuad(4 + col * 8, y0, 5, 8)} fill={tint || '#FBE8A6'} opacity={0.95} />);
    }
    for (let col = 0; col < 3; col++) {
      winsL.push(<Polygon key={`l${row}-${col}`} points={lQuad(4 + col * 9, y0, 6, 8)} fill={tint || '#C9DCEC'} opacity={0.9} />);
    }
  }
  const topCx = (a - b) / 2;
  const topCy = -h - (a + b) / 4;
  return (
    <Svg viewBox="0 0 100 190" width="100%" height="100%">
      <G transform="translate(38,182)">
        <Polygon points={footprint(a, b, 6)} fill={SHADOW} />
        <Polygon points={f.right} fill={tint || '#A9C8E8'} />
        <Polygon points={f.left} fill={tint || '#8FB2D6'} />
        <Polygon points={f.top} fill={tint || '#D8E8F6'} />
        {winsR}
        {winsL}
        <Line x1={topCx} y1={topCy} x2={topCx} y2={topCy - 16} stroke={tint || '#7E96AC'} strokeWidth={2.5} />
        <Circle cx={topCx} cy={topCy - 18} r={3} fill={tint || '#E2604A'} />
      </G>
    </Svg>
  );
}

// ---- İzometrik tekerlek ----------------------------------------------------
// Tekerlek u-h düzleminde dik duran bir dairedir; 2:1 izometride bu daire
// rx=1.28r, ry=0.78r eksenli ve -52° dönük bir elipse izdüşer.

function IsoWheel({ x, y, r, tint }: { x: number; y: number; r: number; tint?: string }) {
  return (
    <G transform={`translate(${x},${y}) rotate(-52)`}>
      <Ellipse rx={r * 1.28} ry={r * 0.78} fill={tint || '#2E3633'} />
      <Ellipse rx={r * 0.46} ry={r * 0.28} fill={tint || '#C9CFD3'} />
    </G>
  );
}

// ---- Araba (110x80) --------------------------------------------------------

export function ArabaSvg({ tint }: { tint?: string } = {}) {
  const body = box(64, 22, 15);
  const cab = box(34, 20, 12);
  return (
    <Svg viewBox="0 0 110 80" width="100%" height="100%">
      <G transform="translate(28,64)">
        <Polygon points={footprint(64, 22, 7)} fill={SHADOW} />
        <Polygon points={body.right} fill={tint || '#E8584A'} />
        <Polygon points={body.left} fill={tint || '#C94537'} />
        <Polygon points={body.top} fill={tint || '#F2705C'} />
        <G transform="translate(15,-19)">
          <Polygon points={cab.right} fill={tint || '#8FD0EA'} />
          <Polygon points={cab.left} fill={tint || '#74B9D6'} />
          <Polygon points={cab.top} fill={tint || '#E8584A'} />
        </G>
        {/* ön (sağ taraf) tekerlekler: gövde alt kenarına oturur */}
        <IsoWheel x={13} y={-3} r={8} tint={tint} />
        <IsoWheel x={48} y={-20.5} r={8} tint={tint} />
        <Circle cx={2} cy={-6} r={2.6} fill={tint || '#FFD84D'} />
      </G>
    </Svg>
  );
}

// ---- Bahçe Ağacı (70x90) ---------------------------------------------------

export function AgacSvg({ tint }: { tint?: string } = {}) {
  const trunk = box(7, 7, 16);
  return (
    <Svg viewBox="0 0 70 90" width="100%" height="100%">
      <Ellipse cx={34} cy={84} rx={17} ry={5} fill={SHADOW} />
      <G transform="translate(32,84)">
        <Polygon points={trunk.right} fill={tint || '#A0714B'} />
        <Polygon points={trunk.left} fill={tint || '#845B39'} />
        <Polygon points={trunk.top} fill={tint || '#B58356'} />
      </G>
      <Circle cx={24} cy={52} r={15} fill={tint || '#5FAF63'} />
      <Circle cx={47} cy={54} r={13} fill={tint || '#8FD087'} />
      <Circle cx={35} cy={40} r={19} fill={tint || '#74C46F'} />
    </Svg>
  );
}

// ---- Şehir Bisikleti (80x60, yol eğimine uyacak şekilde hafif dönük) -------

export function BisikletSvg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 80 60" width="100%" height="100%">
      <G transform="rotate(13 40 40)">
        <Ellipse cx={40} cy={53} rx={24} ry={4.5} fill={SHADOW} />
        <Circle cx={22} cy={40} r={13} fill="none" stroke={tint || '#3A423E'} strokeWidth={2.5} />
        <Circle cx={58} cy={40} r={13} fill="none" stroke={tint || '#3A423E'} strokeWidth={2.5} />
        <Path d="M22 40 L38 26 L54 26 L58 40 M38 26 L40 40 L22 40" fill="none" stroke={tint || '#2E9BB5'} strokeWidth={3} strokeLinejoin="round" />
        <Line x1={54} y1={26} x2={50} y2={18} stroke={tint || '#2E9BB5'} strokeWidth={3} />
        <Line x1={46} y1={17} x2={54} y2={19} stroke={tint || '#3A423E'} strokeWidth={3} strokeLinecap="round" />
        <Line x1={38} y1={26} x2={35} y2={20} stroke={tint || '#2E9BB5'} strokeWidth={3} />
        <Line x1={31} y1={19} x2={39} y2={19} stroke={tint || '#3A423E'} strokeWidth={3.5} strokeLinecap="round" />
        <Circle cx={40} cy={40} r={4} fill={tint || '#3A423E'} />
      </G>
    </Svg>
  );
}

// ---- Motosiklet (85x60) ----------------------------------------------------

export function MotosikletSvg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 85 60" width="100%" height="100%">
      <Ellipse cx={42} cy={52} rx={26} ry={4.5} fill={SHADOW} />
      <Circle cx={20} cy={42} r={11} fill={tint || '#2E3633'} />
      <Circle cx={20} cy={42} r={4} fill={tint || '#C9CFD3'} />
      <Circle cx={64} cy={42} r={11} fill={tint || '#2E3633'} />
      <Circle cx={64} cy={42} r={4} fill={tint || '#C9CFD3'} />
      <Line x1={58} y1={22} x2={64} y2={40} stroke={tint || '#3A423E'} strokeWidth={3.5} strokeLinecap="round" />
      <Line x1={51} y1={17} x2={61} y2={23} stroke={tint || '#3A423E'} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M14 36 C20 26 36 22 48 26 L56 31 L50 40 L24 43 Z" fill={tint || '#F09A3E'} />
      <Path d="M24 26 L38 22 L41 28 L27 32 Z" fill={tint || '#3A423E'} />
      <Circle cx={55} cy={28} r={2.6} fill={tint || '#FFD84D'} />
      <Line x1={10} y1={44} x2={19} y2={44} stroke={tint || '#8A9590'} strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}

// ---- Villa (140x130) -------------------------------------------------------

export function VillaSvg({ tint }: { tint?: string } = {}) {
  const a = 64, b = 38, h = 38;
  const f = box(a, b, h);
  const slab = box(a + 6, b + 6, 6);
  return (
    <Svg viewBox="0 0 120 110" width="100%" height="100%">
      <G transform="translate(46,102)">
        <Polygon points={footprint(a, b, 6)} fill={SHADOW} />
        <Polygon points={f.right} fill={tint || '#FAF7F0'} />
        <Polygon points={f.left} fill={tint || '#E8E1D2'} />
        <Polygon points={f.top} fill={tint || '#F1ECE0'} />
        {/* geniş pencereler ve kapı */}
        <Polygon points={rQuad(6, 5, 20, 18)} fill={tint || '#8FD0EA'} stroke={tint || '#FAF7F0'} strokeWidth={1.5} />
        <Polygon points={rQuad(32, 5, 18, 18)} fill={tint || '#8FD0EA'} stroke={tint || '#FAF7F0'} strokeWidth={1.5} />
        <Polygon points={rQuad(52, 0, 11, 20)} fill={tint || '#9A6B3F'} />
        <Polygon points={lQuad(8, 7, 22, 15)} fill={tint || '#74B9D6'} stroke={tint || '#E8E1D2'} strokeWidth={1.5} />
        {/* modern düz çatı plakası */}
        <G transform="translate(3,-38)">
          <Polygon points={slab.right} fill={tint || '#E2604A'} />
          <Polygon points={slab.left} fill={tint || '#C74E3B'} />
          <Polygon points={slab.top} fill={tint || '#F0705C'} />
        </G>
      </G>
    </Svg>
  );
}

// ---- Yüzme Havuzu (95x60) --------------------------------------------------

export function HavuzSvg({ tint }: { tint?: string } = {}) {
  const deck = box(56, 34, 5);
  // İç su yüzeyi: güvertenin içine oturan elmas
  const water = pts([[0, 0], [46, -23], [20, -36], [-26, -13]]);
  return (
    <Svg viewBox="0 0 95 60" width="100%" height="100%">
      <G transform="translate(36,50)">
        <Polygon points={footprint(56, 34, 5)} fill={SHADOW} />
        <Polygon points={deck.right} fill={tint || '#D9D2C2'} />
        <Polygon points={deck.left} fill={tint || '#C4BCAA'} />
        <Polygon points={deck.top} fill={tint || '#F1ECE0'} />
        <G transform="translate(3,-7)">
          <Polygon points={water} fill={tint || '#5FBEE0'} />
          <Path d="M8 -8 q4 -2 8 0 q4 2 8 0" stroke={tint || '#BDE8F5'} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M18 -16 q4 -2 8 0" stroke={tint || '#BDE8F5'} strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
        {/* merdiven */}
        <Line x1={40} y1={-24} x2={44} y2={-19} stroke={tint || '#C9CFD3'} strokeWidth={2} />
        <Line x1={45} y1={-27} x2={49} y2={-22} stroke={tint || '#C9CFD3'} strokeWidth={2} />
      </G>
    </Svg>
  );
}

// ---- Çocuk Parkı (80x70, stilize salıncak) ---------------------------------

export function ParkSvg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 80 70" width="100%" height="100%">
      <Ellipse cx={38} cy={58} rx={28} ry={5} fill={SHADOW} />
      {/* salıncak iskeleti */}
      <Line x1={12} y1={20} x2={62} y2={20} stroke={tint || '#F09A3E'} strokeWidth={4} strokeLinecap="round" />
      <Line x1={12} y1={20} x2={4} y2={56} stroke={tint || '#F09A3E'} strokeWidth={4} strokeLinecap="round" />
      <Line x1={12} y1={20} x2={20} y2={56} stroke={tint || '#F09A3E'} strokeWidth={4} strokeLinecap="round" />
      <Line x1={62} y1={20} x2={54} y2={56} stroke={tint || '#F09A3E'} strokeWidth={4} strokeLinecap="round" />
      <Line x1={62} y1={20} x2={70} y2={56} stroke={tint || '#F09A3E'} strokeWidth={4} strokeLinecap="round" />
      {/* salıncaklar */}
      <Line x1={28} y1={20} x2={28} y2={42} stroke={tint || '#3A423E'} strokeWidth={2} />
      <Line x1={36} y1={20} x2={36} y2={42} stroke={tint || '#3A423E'} strokeWidth={2} />
      <Path d="M25 42 L39 42 L39 45 L25 45 Z" fill={tint || '#2E9BB5'} />
      <Line x1={44} y1={20} x2={47} y2={44} stroke={tint || '#3A423E'} strokeWidth={2} />
      <Line x1={52} y1={20} x2={55} y2={44} stroke={tint || '#3A423E'} strokeWidth={2} />
      <Path d="M44 44 L58 44 L58 47 L44 47 Z" fill={tint || '#E2604A'} />
      {/* top */}
      <Circle cx={68} cy={54} r={4} fill={tint || '#E2604A'} />
    </Svg>
  );
}

// ---- Karavan (100x70) ------------------------------------------------------

export function KaravanSvg({ tint }: { tint?: string } = {}) {
  const body = box(56, 20, 26);
  return (
    <Svg viewBox="0 0 100 80" width="100%" height="100%">
      <G transform="translate(26,66)">
        <Polygon points={footprint(56, 20, 6)} fill={SHADOW} />
        <Polygon points={body.right} fill={tint || '#FAF7F0'} />
        <Polygon points={body.left} fill={tint || '#E8E1D2'} />
        <Polygon points={body.top} fill={tint || '#F1ECE0'} />
        {/* turuncu şerit, pencere ve kapı */}
        <Polygon points={rQuad(0, 13, 56, 6)} fill={tint || '#F09A3E'} />
        <Polygon points={rQuad(34, 15, 16, 8)} fill={tint || '#8FD0EA'} stroke={tint || '#FAF7F0'} strokeWidth={1.5} />
        <Polygon points={rQuad(6, 0, 12, 17)} fill={tint || '#7E8A91'} />
        <IsoWheel x={16} y={-4} r={6.5} tint={tint} />
        {/* çeki demiri */}
        <Line x1={57} y1={-28} x2={65} y2={-31} stroke={tint || '#7E8A91'} strokeWidth={3} strokeLinecap="round" />
      </G>
    </Svg>
  );
}

// ---- Helikopter + Pist (90x70) ---------------------------------------------

/** hideRotor: mahalle sahnesi pervaneyi kendi animasyonlu katmanıyla çizer */
export function HelikopterSvg({ hideRotor, tint }: { hideRotor?: boolean; tint?: string }) {
  const pad = box(46, 46, 4);
  return (
    <Svg viewBox="0 0 90 70" width="100%" height="100%">
      <G transform="translate(45,62)">
        <Polygon points={footprint(46, 46, 5)} fill={SHADOW} />
        <Polygon points={pad.right} fill={tint || '#A8B2B6'} />
        <Polygon points={pad.left} fill={tint || '#939DA1'} />
        <Polygon points={pad.top} fill={tint || '#B8C2C6'} />
        {/* pist işareti */}
        <Ellipse cx={0} cy={-27} rx={16} ry={8} fill="none" stroke={tint || '#FFFFFF'} strokeWidth={2} />
        <Line x1={-4} y1={-31} x2={-4} y2={-23} stroke={tint || '#FFFFFF'} strokeWidth={2} />
        <Line x1={4} y1={-31} x2={4} y2={-23} stroke={tint || '#FFFFFF'} strokeWidth={2} />
        <Line x1={-4} y1={-27} x2={4} y2={-27} stroke={tint || '#FFFFFF'} strokeWidth={2} />
      </G>
      {/* helikopter: kızakları pistin üzerine basar */}
      <Ellipse cx={45} cy={45} rx={12} ry={3.5} fill="rgba(38,51,44,0.18)" />
      <G transform="translate(45,31)">
        <Line x1={-8} y1={12} x2={10} y2={12} stroke={tint || '#3A423E'} strokeWidth={2} />
        <Line x1={-10} y1={9} x2={12} y2={9} stroke={tint || '#3A423E'} strokeWidth={2} />
        <Ellipse cx={0} cy={0} rx={13} ry={8} fill={tint || '#2E9BB5'} />
        <Circle cx={8} cy={-1} r={4} fill={tint || '#BDE8F5'} />
        <Line x1={-11} y1={-1} x2={-28} y2={-5} stroke={tint || '#2E9BB5'} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={-29} cy={-5} r={4} fill="none" stroke={tint || '#3A423E'} strokeWidth={2} />
        <Line x1={0} y1={-8} x2={0} y2={-13} stroke={tint || '#3A423E'} strokeWidth={2.5} />
        {hideRotor ? null : (
          <Line x1={-24} y1={-13} x2={24} y2={-13} stroke={tint || '#3A423E'} strokeWidth={2.5} strokeLinecap="round" />
        )}
      </G>
    </Svg>
  );
}

// ---- Yan Arsa (90x70, mağaza görseli) --------------------------------------

export function ArsaSvg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 90 70" width="100%" height="100%">
      <Polygon points="45,8 85,33 45,58 5,33" fill={tint || '#D8E8D4'} stroke={tint || '#7FA884'} strokeWidth={2} strokeDasharray="7 6" />
      {/* filiz */}
      <Line x1={45} y1={40} x2={45} y2={28} stroke={tint || '#5FAF63'} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M45 32 q-8 -2 -9 -9 q8 1 9 9" fill={tint || '#74C46F'} />
      <Path d="M45 30 q8 -3 8 -10 q-8 2 -8 10" fill={tint || '#8FD087'} />
      {/* satılık tabelası */}
      <Line x1={66} y1={44} x2={66} y2={30} stroke={tint || '#9A6B3F'} strokeWidth={2.5} />
      <Path d="M58 24 L74 24 L74 32 L58 32 Z" fill={tint || '#F6B93B'} />
    </Svg>
  );
}

// ---- Kayıt ----------------------------------------------------------------

// ---- Sahil Arsası (90x70, mağaza görseli) ----------------------------------

export function Arsa2Svg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 90 70" width="100%" height="100%">
      <Polygon points="45,8 85,33 45,58 5,33" fill={tint || '#D8E8D4'} stroke={tint || '#7FA884'} strokeWidth={2} strokeDasharray="7 6" />
      {/* sağ köşede deniz */}
      <Polygon points="85,33 45,58 62,62 90,42" fill={tint || '#A8D8EA'} />
      <Path d="M62 47 q4 -2 8 0 q4 2 8 0" stroke={tint || '#FFFFFF'} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M70 53 q4 -2 8 0" stroke={tint || '#FFFFFF'} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {/* palmiye filizi */}
      <Path d="M38 44 Q36 32 40 26" stroke={tint || '#9A7250'} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M40 27 q-9 -4 -13 2 q8 3 13 -2" fill={tint || '#5FAF63'} />
      <Path d="M40 27 q9 -6 14 -1 q-7 5 -14 1" fill={tint || '#74C46F'} />
      {/* satılık tabelası */}
      <Line x1={62} y1={40} x2={62} y2={26} stroke={tint || '#9A6B3F'} strokeWidth={2.5} />
      <Path d="M54 20 L70 20 L70 28 L54 28 Z" fill={tint || '#F6B93B'} />
    </Svg>
  );
}

// ---- Malikane (130x115) -----------------------------------------------------

export function MalikaneSvg({ tint }: { tint?: string } = {}) {
  const a = 70, b = 44, h = 34;
  const f = box(a, b, h);
  const slab = box(a + 4, b + 4, 6);
  return (
    <Svg viewBox="0 0 130 115" width="100%" height="100%">
      <G transform="translate(50,102)">
        <Polygon points={footprint(a, b, 6)} fill={SHADOW} />
        <Polygon points={f.right} fill={tint || '#F5EFE2'} />
        <Polygon points={f.left} fill={tint || '#E2D8C2'} />
        <Polygon points={f.top} fill={tint || '#FAF5EA'} />
        {/* sütunlu giriş */}
        <Polygon points={rQuad(8, 0, 4, 26)} fill={tint || '#FFFFFF'} />
        <Polygon points={rQuad(20, 0, 4, 26)} fill={tint || '#FFFFFF'} />
        <Polygon points={rQuad(32, 0, 4, 26)} fill={tint || '#FFFFFF'} />
        <Polygon points={rQuad(13, 0, 10, 20)} fill={tint || '#7A5C3E'} />
        <Polygon points={rQuad(44, 4, 20, 16)} fill={tint || '#9FD4EA'} stroke={tint || '#FAF5EA'} strokeWidth={1.5} />
        <Polygon points={lQuad(8, 8, 28, 14)} fill={tint || '#8CC5DC'} stroke={tint || '#E2D8C2'} strokeWidth={1.5} />
        {/* altın saçak + düz çatı */}
        <G transform="translate(2,-34)">
          <Polygon points={slab.right} fill={tint || '#C9A94B'} />
          <Polygon points={slab.left} fill={tint || '#A8883A'} />
          <Polygon points={slab.top} fill={tint || '#E0C063'} />
        </G>
      </G>
    </Svg>
  );
}

// ---- Yat (110x80, kendi su birikintisiyle) ---------------------------------

export function YatSvg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 110 80" width="100%" height="100%">
      {/* su */}
      <Ellipse cx={55} cy={62} rx={44} ry={15} fill={tint || '#5FA8CC'} />
      <Ellipse cx={55} cy={60} rx={44} ry={15} fill={tint || '#7FC4E8'} />
      <Path d="M22 64 q5 -2.5 10 0 q5 2.5 10 0" stroke={tint || '#D9F0FA'} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M70 68 q5 -2.5 10 0" stroke={tint || '#D9F0FA'} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* gövde */}
      <Path d="M22 50 L82 50 Q93 50 88 58 Q70 63 34 61 Q22 58 22 50 Z" fill={tint || '#FAF7F0'} />
      <Path d="M24 54 L86 54 Q80 60 34 60 Q26 58 24 54 Z" fill={tint || '#2E6B8A'} opacity={0.9} />
      {/* kabin */}
      <Path d="M36 40 L62 40 Q66 40 66 44 L66 50 L34 50 L34 42 Q34 40 36 40 Z" fill={tint || '#FFFFFF'} />
      <Circle cx={41} cy={45} r={2.2} fill={tint || '#8FD0EA'} />
      <Circle cx={49} cy={45} r={2.2} fill={tint || '#8FD0EA'} />
      <Circle cx={57} cy={45} r={2.2} fill={tint || '#8FD0EA'} />
      {/* direk + flama */}
      <Line x1={70} y1={50} x2={70} y2={24} stroke={tint || '#7E8A91'} strokeWidth={2.5} />
      <Path d="M70 24 L82 28 L70 32 Z" fill={tint || '#E2604A'} />
    </Svg>
  );
}

// ---- Özel Jet (120x70) ------------------------------------------------------

export function JetSvg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 120 70" width="100%" height="100%">
      {/* apron (pist betonu) */}
      <Polygon points="60,30 105,52 60,74 15,52" fill={tint || '#C6CDD1'} />
      <Polygon points="60,36 93,52 60,68 27,52" fill="none" stroke={tint || '#F5F0E6'} strokeWidth={1.8} strokeDasharray="7 7" />
      {/* gövde */}
      <Path d="M28 44 Q60 36 90 42 L98 46 Q92 51 60 53 L34 51 Q24 48 28 44 Z" fill={tint || '#FAF7F0'} />
      {/* kuyruk */}
      <Polygon points="30,45 36,29 44,44" fill={tint || '#E2604A'} />
      {/* kanat: izleyiciye doğru */}
      <Polygon points="52,49 74,49 66,61 48,58" fill={tint || '#E8E1D2'} />
      <Ellipse cx={60} cy={57} rx={6} ry={3} fill={tint || '#7E8A91'} />
      {/* pencereler + burun */}
      <Circle cx={54} cy={44} r={1.8} fill={tint || '#8FD0EA'} />
      <Circle cx={62} cy={44} r={1.8} fill={tint || '#8FD0EA'} />
      <Circle cx={70} cy={44} r={1.8} fill={tint || '#8FD0EA'} />
      <Path d="M90 42 L98 46 Q95 43 90 42 Z" fill={tint || '#2E6B8A'} />
      <Line x1={44} y1={46} x2={86} y2={46} stroke={tint || '#E2604A'} strokeWidth={1.6} />
    </Svg>
  );
}

// ---- Özel Ada (100x85) ------------------------------------------------------

export function AdaSvg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 100 85" width="100%" height="100%">
      {/* deniz halkası */}
      <Ellipse cx={50} cy={64} rx={42} ry={17} fill={tint || '#5FA8CC'} />
      <Ellipse cx={50} cy={62} rx={42} ry={17} fill={tint || '#7FC4E8'} />
      <Path d="M14 64 q5 -2.5 10 0" stroke={tint || '#D9F0FA'} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M72 70 q5 -2.5 10 0" stroke={tint || '#D9F0FA'} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* kumsal */}
      <Ellipse cx={50} cy={60} rx={26} ry={11} fill={tint || '#D9C68F'} />
      <Ellipse cx={50} cy={58.5} rx={26} ry={11} fill={tint || '#EFDFA8'} />
      {/* palmiye */}
      <Path d="M50 57 Q47 42 53 32" stroke={tint || '#9A7250'} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Path d="M53 33 q-13 -6 -19 2 q11 5 19 -2" fill={tint || '#5FAF63'} />
      <Path d="M53 33 q13 -8 20 -1 q-10 7 -20 1" fill={tint || '#74C46F'} />
      <Path d="M53 33 q-2 -12 6 -16 q3 9 -6 16" fill={tint || '#8FD087'} />
      <Circle cx={51} cy={37} r={2.2} fill={tint || '#9A7250'} />
      <Circle cx={56} cy={38} r={2.2} fill={tint || '#9A7250'} />
      {/* güneşlenme havlusu */}
      <Polygon points="34,58 44,53 50,56 40,61" fill={tint || '#E2604A'} opacity={0.9} />
    </Svg>
  );
}

// ---- Uzay Roketi (90x130) ---------------------------------------------------

export function RoketSvg({ tint }: { tint?: string } = {}) {
  return (
    <Svg viewBox="0 0 90 130" width="100%" height="100%">
      {/* fırlatma rampası */}
      <Polygon points="45,92 77,108 45,124 13,108" fill={tint || '#B8C2C6'} />
      <Polygon points="45,98 65,108 45,118 25,108" fill="none" stroke={tint || '#F5F0E6'} strokeWidth={1.6} />
      {/* kanatçıklar (gövdenin arkasında kalanlar önce) */}
      <Polygon points="36,86 24,106 36,98" fill={tint || '#C74E3B'} />
      <Polygon points="54,86 66,106 54,98" fill={tint || '#E2604A'} />
      {/* gövde */}
      <Path d="M36 36 L36 92 Q45 100 54 92 L54 36 Z" fill={tint || '#F5F0E6'} />
      <Path d="M50 36 L50 94 Q52 95 54 92 L54 36 Z" fill={tint || '#DCD4C2'} />
      {/* burun */}
      <Path d="M36 38 Q45 6 54 38 Z" fill={tint || '#E2604A'} />
      {/* pencere + şerit */}
      <Circle cx={45} cy={52} r={6} fill={tint || '#8FD0EA'} stroke={tint || '#FFFFFF'} strokeWidth={2} />
      <Path d="M36 72 L54 72 L54 78 L36 78 Z" fill={tint || '#E2604A'} />
      {/* motor ağzı */}
      <Path d="M40 96 Q45 102 50 96 L52 102 Q45 108 38 102 Z" fill={tint || '#7E8A91'} />
    </Svg>
  );
}

/** Mahalle eşyalarının izometrik çizimleri */
export const ITEM_ART: Record<string, React.ComponentType<{ tint?: string }>> = {
  arsa2: Arsa2Svg,
  malikane: MalikaneSvg,
  yat: YatSvg,
  jet: JetSvg,
  ada: AdaSvg,
  roket: RoketSvg,
  bisiklet: BisikletSvg,
  agac: AgacSvg,
  motosiklet: MotosikletSvg,
  araba: ArabaSvg,
  dukkan: DukkanSvg,
  ev: EvSvg,
  gokdelen: GokdelenSvg,
  park: ParkSvg,
  karavan: KaravanSvg,
  havuz: HavuzSvg,
  arsa: ArsaSvg,
  villa: VillaSvg,
  helikopter: HelikopterSvg,
};

// Katalogdaki her eşyanın çizimi olmalı; eksikse geliştirme anında patlasın
for (const it of ITEMS) {
  if (!ITEM_ART[it.id]) throw new Error(`Çizimi olmayan eşya: ${it.id}`);
}

export function artOf(id: string): React.ComponentType<{ tint?: string }> {
  return ITEM_ART[id];
}

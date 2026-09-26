import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Klasik dişli çark (ayarlar) ikonu */
export function GearIcon({ size = 20, color = '#26332C', holeColor = '#FFFFFF' }: {
  size?: number;
  color?: string;
  holeColor?: string;
}) {
  const teeth = [];
  for (let i = 0; i < 8; i++) {
    teeth.push(
      <Rect
        key={i}
        x={10.4}
        y={1.5}
        width={3.2}
        height={5}
        rx={1.4}
        fill={color}
        transform={`rotate(${i * 45} 12 12)`}
      />
    );
  }
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {teeth}
      <Circle cx={12} cy={12} r={7} fill={color} />
      <Circle cx={12} cy={12} r={3.2} fill={holeColor} />
    </Svg>
  );
}

/** Tenteli dükkan (mağaza) ikonu: kırmızı-beyaz tente, vitrin, kapı */
export function ShopIcon({ size = 20, color = '#3E8E68', doorColor = '#FFFFFF' }: {
  size?: number;
  color?: string;
  doorColor?: string;
}) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {/* gövde */}
      <Rect x={4} y={9.5} width={16} height={11} rx={1.5} fill={color} />
      {/* vitrin */}
      <Rect x={6} y={12} width={5.5} height={4.5} rx={0.8} fill="#D9F0FA" />
      <Rect x={6} y={12} width={5.5} height={1.6} fill="#FFFFFF" opacity={0.7} />
      {/* kapı */}
      <Rect x={13.5} y={12} width={4.5} height={8.5} rx={0.9} fill={doorColor} />
      <Circle cx={17} cy={16.5} r={0.6} fill={color} />
      {/* tente: kırmızı-beyaz dilimler */}
      <Path d="M2.5 5 L21.5 5 L21.5 8.2 a2.375 2.375 0 0 1 -4.75 0 a2.375 2.375 0 0 1 -4.75 0 a2.375 2.375 0 0 1 -4.75 0 a2.375 2.375 0 0 1 -4.75 0 Z" fill="#E2604A" />
      <Path d="M7.25 5 L12 5 L12 8.2 a2.375 2.375 0 0 1 -4.75 0 Z" fill="#FFFFFF" />
      <Path d="M16.75 5 L21.5 5 L21.5 8.2 a2.375 2.375 0 0 1 -4.75 0 Z" fill="#FFFFFF" />
      <Rect x={2.5} y={3.6} width={19} height={1.8} rx={0.9} fill="#A83E2C" />
    </Svg>
  );
}

/** Kupa (başarımlar) ikonu */
export function TrophyIcon({ size = 20, color = '#26332C' }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path d="M7 3 L17 3 L16.2 10 A4.5 4.5 0 0 1 7.8 10 Z" fill={color} />
      <Path d="M6.6 4.4 q-3.6 0.5 -2.7 4 q0.9 2.4 3.6 2.4" fill="none" stroke={color} strokeWidth={1.6} />
      <Path d="M17.4 4.4 q3.6 0.5 2.7 4 q-0.9 2.4 -3.6 2.4" fill="none" stroke={color} strokeWidth={1.6} />
      <Rect x={10.8} y={13} width={2.4} height={3.6} fill={color} />
      <Rect x={7.5} y={16.6} width={9} height={2.6} rx={1.2} fill={color} />
    </Svg>
  );
}

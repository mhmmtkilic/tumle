import React, { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { ICON_SPECS, IconName, isSolid, Layer, OUTLINE, OUTLINE_W, SHADOW_DY } from './gameIconSpecs';

/*
 * Renkli oyun ikonları (Clash Royale tarzı): her ikon kendi renginde, kalın
 * koyu konturlu, altta kabartma gölgesi, üstte parlak yansıma. Çizimler
 * gameIconSpecs.ts'te; önizleme: node scripts/preview-icons.mjs <png>.
 * Hepsi aynı imzayı paylaşır; renkler ikonun kendisinde olduğundan `color`
 * yok sayılır.
 */

export interface IconProps {
  size?: number;
  color?: string;
}

function shape(l: Layer, key: string, props: Record<string, unknown>) {
  if (l.circle) return <Circle key={key} cx={l.circle[0]} cy={l.circle[1]} r={l.circle[2]} {...props} />;
  if (l.rect) return <Rect key={key} x={l.rect[0]} y={l.rect[1]} width={l.rect[2]} height={l.rect[3]} rx={l.rect[4]} {...props} />;
  return <Path key={key} d={l.d} {...props} />;
}

const GameIcon = React.memo(function GameIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  const layers: Layer[] = ICON_SPECS[name];
  // Degrade kimliği her ikon örneğinde benzersiz: aynı kimlik belgede iki kez
  // olunca (web) gizli bir kopyaya bağlanıp ikon siyah çiziliyordu
  const uid = useId().replace(/:/g, '');
  const solid = layers.filter(isSolid);
  const outline = (dy: number) =>
    solid.map((l, i) =>
      shape(l, `o${dy}-${i}`, {
        translateY: dy,
        fill: l.fill || l.grad ? OUTLINE : 'none',
        stroke: OUTLINE,
        strokeWidth: (l.sw ?? 0) + OUTLINE_W,
        strokeLinejoin: 'round',
        strokeLinecap: 'round',
      })
    );
  return (
    <Svg viewBox="-3 -3 54 57" width={size} height={size * (57 / 54)}>
      <Defs>
        {layers.map((l, i) =>
          l.grad ? (
            <LinearGradient key={i} id={`${name}${uid}g${i}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={l.grad[0]} />
              <Stop offset="1" stopColor={l.grad[1]} />
            </LinearGradient>
          ) : null
        )}
      </Defs>
      {outline(SHADOW_DY)}
      {outline(0)}
      {layers.map((l, i) =>
        l.shine
          ? null
          : shape(l, `b${i}`, {
          fill: l.grad ? `url(#${name}${uid}g${i})` : (l.fill ?? 'none'),
          fillOpacity: l.fillOpacity ?? 1,
          strokeOpacity: l.strokeOpacity ?? 1,
          stroke: l.stroke ?? 'none',
          strokeWidth: l.sw ?? 0,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
        })
      )}
      {layers.filter((l) => l.shine).map((l, i) => shape(l, `s${i}`, { fill: '#FFFFFF', fillOpacity: 0.45 }))}
    </Svg>
  );
});

const icon = (name: IconName) =>
  function Icon({ size }: IconProps) {
    return <GameIcon name={name} size={size} />;
  };

export const ChevronLeftIcon = icon('back');
export const GearIcon = icon('gear');
export const TrophyIcon = icon('trophy');
export const BagIcon = icon('bag');
export const ShareIcon = icon('share');
export const PlusIcon = icon('plus');
export const MinusIcon = icon('minus');
export const RestartIcon = icon('restart');
export const ShuffleIcon = icon('shuffle');
export const PencilIcon = icon('pencil');
export const CheckIcon = icon('check');
export const XmarkIcon = icon('cross');
export const HouseIcon = icon('house');
export const VibrateIcon = icon('vibrate');
export const TrashIcon = icon('trash');
export const CrownIcon = icon('crown');
export const UndoIcon = icon('undo');
export const HammerIcon = icon('hammer');
export const LockIcon = icon('lock');

export function SpeakerIcon({ muted, size }: IconProps & { muted?: boolean }) {
  return <GameIcon name={muted ? 'speakerOff' : 'speaker'} size={size} />;
}

export function MusicIcon({ muted, size }: IconProps & { muted?: boolean }) {
  return <GameIcon name={muted ? 'musicOff' : 'music'} size={size} />;
}

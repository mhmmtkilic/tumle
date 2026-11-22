import React from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { GAME_FONT } from '../theme';
import { OUTLINE } from './skins';

/** Altın ₺ sikkesi: cüzdan sayacı ve ana sayfa sekmesinin simgesi */
function CoinIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42">
      <Defs>
        <LinearGradient id="coin-face" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF1A0" />
          <Stop offset="0.55" stopColor="#FFC531" />
          <Stop offset="1" stopColor="#E08A12" />
        </LinearGradient>
      </Defs>
      <Circle cx="21" cy="22.5" r="18.5" fill={OUTLINE} />
      <Circle cx="21" cy="21" r="18.5" fill="url(#coin-face)" stroke={OUTLINE} strokeWidth="3" />
      <Circle cx="21" cy="21" r="13" fill="none" stroke="#C97A0C" strokeWidth="2" strokeOpacity="0.7" />
      <SvgText x="21" y="29.5" textAnchor="middle" fontFamily={GAME_FONT} fontSize="22" fill="#FFF6E0" stroke="#9A5A08" strokeWidth="3" strokeLinejoin="round">
        ₺
      </SvgText>
      <SvgText x="21" y="29.5" textAnchor="middle" fontFamily={GAME_FONT} fontSize="22" fill="#FFF6E0">
        ₺
      </SvgText>
      <Ellipse cx="14" cy="11" rx="5" ry="2.6" fill="#FFFFFF" fillOpacity="0.7" transform="rotate(-30 14 11)" />
    </Svg>
  );
}

export default React.memo(CoinIcon);

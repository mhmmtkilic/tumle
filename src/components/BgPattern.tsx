import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { G, Line } from 'react-native-svg';

/**
 * Silik izometrik grid arka planı: oyunun 2:1 perspektifiyle aynı eğimde,
 * çok soluk elmas dokusu. Boş ekranlara derinlik katar, içeriği ezmez.
 */
export default function BgPattern() {
  const { width, height } = useWindowDimensions();

  const lines = useMemo(() => {
    const step = 48;
    const out: React.ReactElement[] = [];
    const reach = height * 2;
    for (let x = -reach; x < width + reach; x += step) {
      out.push(<Line key={`a${x}`} x1={x} y1={0} x2={x + reach} y2={height} />);
      out.push(<Line key={`b${x}`} x1={x + reach} y1={0} x2={x} y2={height} />);
    }
    return out;
  }, [width, height]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <G stroke="#3E8E68" strokeOpacity={0.06} strokeWidth={1.2}>
          {lines}
        </G>
      </Svg>
    </View>
  );
}

import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { GAME_FONT } from '../theme';
import { OUTLINE } from './skins';

/** Oyun yazısının dolgusu: saf beyaz değil, sıcak krem */
export const CREAM = '#FFF6E0';

/** Konturu oluşturan kopyaların yönleri (birim çember üzerinde 8 nokta) */
const DIRS = [
  [1, 0],
  [0.71, 0.71],
  [0, 1],
  [-0.71, 0.71],
  [-1, 0],
  [-0.71, -0.71],
  [0, -1],
  [0.71, -0.71],
] as const;

interface Props {
  children: string | number | (string | number)[];
  size?: number;
  color?: string;
  stroke?: string;
  /** Kontur kalınlığı; verilmezse yazı boyuna göre */
  strokeWidth?: number;
  /** Alttaki kabartma gölgesinin yüksekliği (0: yok) */
  depth?: number;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  numberOfLines?: number;
}

/**
 * Kalın konturlu oyun yazısı. React Native yazıya kontur çizemediği için aynı
 * yazı arkada 8 yöne kaydırılmış koyu kopyalar olarak çizilir, üstüne dolgu
 * gelir; en altta da aşağı kaydırılmış bir kopya kabartma gölgesi verir.
 * Kısa etiketler (buton, sayaç, sekme) için; uzun metinde GameText kullan.
 */
function OutlineText({ children, size = 18, color = CREAM, stroke = OUTLINE, strokeWidth, depth, style, containerStyle, numberOfLines = 1 }: Props) {
  const w = strokeWidth ?? Math.max(1.5, Math.min(3.5, size * 0.11));
  const d = depth ?? Math.max(1.5, size * 0.08);
  const base = [styles.text, { fontSize: size, lineHeight: Math.round(size * 1.3) }, style];
  const copy = (dx: number, dy: number, key: string) => (
    <Text key={key} style={[base, styles.copy, { color: stroke, transform: [{ translateX: dx }, { translateY: dy }] }]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
  return (
    <View style={containerStyle} accessible accessibilityRole="text">
      {d > 0 ? DIRS.map(([x, y], i) => copy(x * w, y * w + d, `d${i}`)) : null}
      {DIRS.map(([x, y], i) => copy(x * w, y * w, `o${i}`))}
      <Text style={[base, { color }]} numberOfLines={numberOfLines}>
        {children}
      </Text>
    </View>
  );
}

export default React.memo(OutlineText);

const styles = StyleSheet.create({
  text: { fontFamily: GAME_FONT, textAlign: 'center', includeFontPadding: false },
  copy: { position: 'absolute', left: 0, right: 0, top: 0 },
});

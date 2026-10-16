import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { GAME_FONT } from '../theme';
import { OUTLINE, PANEL } from './skins';

/** Koyu lacivert oyun paneli: kalın dış çizgi, iç açık kenar, altta gölge kalınlığı */
export function Panel({ children, style, innerStyle }: { children: React.ReactNode; style?: ViewStyle; innerStyle?: ViewStyle }) {
  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </View>
  );
}

/** Oyun fontuyla, koyu konturlu beyaz yazı */
export function GameText({ children, size = 18, style, numberOfLines }: { children: React.ReactNode; size?: number; style?: TextStyle; numberOfLines?: number }) {
  return (
    <Text style={[styles.text, { fontSize: size }, style]} numberOfLines={numberOfLines} adjustsFontSizeToFit={!!numberOfLines}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: OUTLINE,
    borderRadius: 18,
    padding: 2.5,
    paddingBottom: 6,
  },
  inner: {
    backgroundColor: PANEL.bottom,
    borderRadius: 15,
    borderTopWidth: 3,
    borderTopColor: PANEL.top,
    borderWidth: 1.5,
    borderColor: PANEL.stroke,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  text: {
    fontFamily: GAME_FONT,
    color: PANEL.text,
    textShadowColor: OUTLINE,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0.1,
  },
});

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, GAME_FONT } from '../theme';

/** Kırmızı sayı rozeti: koyu dış çizgili, oyun fontuyla (bildirim sayısı) */
export default function GameBadge({ count, style }: { count: number; style?: ViewStyle }) {
  return (
    <View style={[styles.root, style]} pointerEvents="none">
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: '#E8413A',
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: GAME_FONT, color: '#FFFFFF', fontSize: 12 },
});

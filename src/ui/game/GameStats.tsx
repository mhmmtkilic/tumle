import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, numeric, panelStyle, space, type } from '../theme';

export interface Stat {
  label: string;
  value: string;
}

/**
 * Tek panel içinde yan yana değerler (oyun fontuyla), aralarında ince ayraç.
 * `framed`: altın çerçeveli vurgu paneli (oyun ekranının üst şeridi); ilk değer altın renkte.
 */
export default function GameStats({ items, style, framed, fit = true }: { items: Stat[]; style?: ViewStyle; framed?: boolean; /** Uzun değeri küçülterek sığdır (sık değişen değerlerde kapat) */ fit?: boolean }) {
  return (
    <View style={[styles.card, framed && styles.framed, style]}>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 ? <View style={styles.separator} /> : null}
          <View style={styles.cell}>
            <Text style={styles.label} numberOfLines={1}>
              {it.label}
            </Text>
            <Text style={[styles.value, framed && i === 0 && styles.gold]} numberOfLines={1} adjustsFontSizeToFit={fit}>
              {it.value}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...panelStyle, flexDirection: 'row', paddingVertical: space.s },
  cell: { flex: 1, alignItems: 'center', paddingHorizontal: space.s },
  separator: { width: 1.5, backgroundColor: colors.separator, marginVertical: 2 },
  label: { ...type.overline, color: colors.secondaryLabel },
  value: { ...type.title3, ...numeric, color: colors.label, marginTop: 1 },
  gold: { color: colors.gold },
  framed: {
    borderColor: '#E9A11A',
    borderBottomColor: colors.outline,
    backgroundImage: 'linear-gradient(#3566B8, #22468A)',
    boxShadow: '0 0 0 2.5px #1B2238, inset 0 3px 0 rgba(255,255,255,0.18)',
  },
});

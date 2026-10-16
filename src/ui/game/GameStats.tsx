import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, numeric, panelStyle, space, type } from '../theme';

export interface Stat {
  label: string;
  value: string;
}

/** Tek panel içinde yan yana değerler (oyun fontuyla), aralarında ince ayraç */
export default function GameStats({ items, style }: { items: Stat[]; style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 ? <View style={styles.separator} /> : null}
          <View style={styles.cell}>
            <Text style={styles.label} numberOfLines={1}>
              {it.label}
            </Text>
            <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
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
});

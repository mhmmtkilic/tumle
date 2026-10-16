import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, panelStyle, space, type } from '../theme';

/**
 * Oyun listesi: başlık (oyun fontu), lacivert panel içinde satırlar, altta
 * açıklama. Satırlar arası ince açık ayraç.
 */
export function Section({ header, footer, children, style }: { header?: string; footer?: string; children: React.ReactNode; style?: ViewStyle }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.section, style]}>
      {header ? <Text style={styles.header}>{header}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={styles.separator} /> : null}
            {row}
          </React.Fragment>
        ))}
        {/* Açıklama panelin içinde: gökyüzü/bulut üstünde beyaz yazı okunmuyordu */}
        {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      </View>
    </View>
  );
}

/** Satır: solda isteğe bağlı ikon kutusu, başlık + alt yazı, sağda kontrol */
export function Row({
  title,
  subtitle,
  icon,
  iconBg = '#2E8CF0',
  right,
  destructive,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  right?: React.ReactNode;
  destructive?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.row}>
      {icon ? <View style={[styles.iconBox, { backgroundColor: destructive ? '#E8413A' : iconBg }]}>{icon}</View> : null}
      <View style={styles.rowText}>
        <Text style={[styles.title, destructive && styles.destructive]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: space.xl },
  header: { ...type.headline, color: colors.label, marginBottom: space.s, marginLeft: space.xs },
  footer: { ...type.footnote, color: colors.secondaryLabel, paddingHorizontal: space.m, paddingBottom: space.m, marginTop: -space.xs },
  card: { ...panelStyle, overflow: 'hidden' },
  separator: { height: 1.5, backgroundColor: colors.separator, marginHorizontal: space.m },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.m, paddingHorizontal: space.m },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  title: { ...type.body, color: colors.label },
  destructive: { color: colors.destructive },
  subtitle: { ...type.footnote, color: colors.secondaryLabel, marginTop: 2 },
  pressed: { backgroundColor: colors.fill },
});

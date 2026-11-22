import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import OutlineText from './OutlineText';
import { OUTLINE } from './skins';
import { GAME_FONT } from '../theme';

interface Props {
  /** Hapın sol kenarından taşan simge (~44 px) */
  icon: React.ReactNode;
  value: string;
  onPress?: () => void;
  /** Simgenin altında yeşil "+" (dokununca mağaza gibi bir yere götürür) */
  plus?: boolean;
  label?: string;
  style?: ViewStyle;
}

/**
 * Üst şeridin sayaç hapı: koyu lacivert gövde, simge sol kenardan taşar,
 * değer konturlu yazıyla sağa yaslı.
 */
function CurrencyChip({ icon, value, onPress, plus, label, style }: Props) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={label ?? value} style={[styles.root, style]}>
      {({ pressed }) => (
        <View style={[styles.pill, pressed && styles.pressed]}>
          <View style={styles.value}>
            <OutlineText size={18}>{value}</OutlineText>
          </View>
          <View style={styles.icon} pointerEvents="none">
            {icon}
            {plus ? (
              <View style={styles.plus}>
                <Text style={styles.plusText}>+</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default React.memo(CurrencyChip);

const H = 36;

const styles = StyleSheet.create({
  root: { height: 46, justifyContent: 'center', paddingLeft: 12 },
  pill: {
    height: H,
    borderRadius: H / 2,
    borderWidth: 2.5,
    borderColor: '#0D1533',
    backgroundColor: '#1A2854',
    backgroundImage: 'linear-gradient(#22346A, #15224A)',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.12)',
    justifyContent: 'center',
    paddingLeft: 30,
    paddingRight: 12,
  },
  pressed: { transform: [{ scale: 0.96 }] },
  value: { alignItems: 'flex-end' },
  icon: { position: 'absolute', left: -14, top: -7, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  plus: {
    position: 'absolute',
    left: -3,
    bottom: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: OUTLINE,
    backgroundColor: '#43B52A',
    backgroundImage: 'linear-gradient(#9BEA62, #3FAE25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { fontFamily: GAME_FONT, color: '#FFFFFF', fontSize: 16, lineHeight: 18, marginTop: 1, includeFontPadding: false },
});

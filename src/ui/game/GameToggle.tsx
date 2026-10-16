import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

/** Kalın oyun anahtarı: dış çizgili iz, yumuşakça kayan beyaz topuz (salınım yok); açıkken yeşil */
const W = 58;
const H = 32;
const KNOB = 24;
const PAD = (H - 4 - KNOB) / 2;

export default function GameToggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  const t = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(value ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], ['#6F7887', '#43B52A']),
  }));
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * (W - 4 - KNOB - PAD * 2) }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
    >
      <View style={styles.outer}>
        <Animated.View style={[styles.track, track]}>
          <Animated.View style={[styles.knob, knob]} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { width: W, height: H + 3, borderRadius: H / 2, backgroundColor: colors.outline, padding: 2, paddingBottom: 5 },
  track: { flex: 1, borderRadius: H / 2, padding: PAD, justifyContent: 'center' },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.outline,
  },
});

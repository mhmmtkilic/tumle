import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors, radius, space, type } from '../theme';

/** Koyu, dış çizgili kapsül bilgi balonu; `key` değişince yeniden belirir */
export default function GameToast({ text, style }: { text: string; style?: ViewStyle }) {
  return (
    <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(180)} style={[styles.root, style]} pointerEvents="none">
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.toast,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: colors.outline,
    paddingVertical: space.s,
    paddingHorizontal: space.l,
    maxWidth: '84%',
  },
  text: { ...type.headline, fontSize: 15, color: colors.label, textAlign: 'center' },
});

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import OutlineText from './OutlineText';
import { colors, radius, space } from '../theme';

/** Altın kenarlı mavi kapsül bilgi balonu, konturlu yazı; `key` değişince yeniden belirir */
export default function GameToast({ text, style }: { text: string; style?: ViewStyle }) {
  return (
    <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(180)} style={[styles.root, style]} pointerEvents="none">
      <OutlineText size={16} strokeWidth={2.5} depth={1} numberOfLines={2}>
        {text}
      </OutlineText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.toast,
    backgroundImage: 'linear-gradient(#3566B8, #22468A)',
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: '#E9A11A',
    boxShadow: `0 0 0 2.5px ${colors.outline}, 0 4px 0 2.5px ${colors.outline}`,
    paddingVertical: space.s,
    paddingHorizontal: space.l,
    maxWidth: '84%',
  },
});

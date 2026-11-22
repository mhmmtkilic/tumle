import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import OutlineText from './OutlineText';
import { OUTLINE } from './skins';

interface Props {
  label: string;
  /** Etiketin altındaki küçük satır (ör. mahalle bonusu) */
  sub?: string;
  onPress: () => void;
}

const H = 84;
const DEPTH = 7;
const BORDER = 3;

/**
 * Ana sayfanın büyük yeşil oyna butonu: koyu kontur → alt gövde → degrade yüz,
 * üstte ince ışık, sağ üstte parlama lekesi. Basınca yüz gövdeye çöker.
 */
function PlayButton({ label, sub, onPress }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      {({ pressed }) => {
        const down = pressed ? DEPTH - 2 : 0;
        return (
          <View style={styles.root}>
            <View style={styles.base}>
              <View style={styles.body} />
            </View>
            <View style={[styles.face, { top: BORDER + down }]}>
              <View style={styles.lowShade} pointerEvents="none" />
              <View style={styles.topLight} pointerEvents="none" />
              <View style={styles.glint} pointerEvents="none" />
              <OutlineText size={38} strokeWidth={3.5} style={styles.label}>
                {label}
              </OutlineText>
              {sub ? (
                <OutlineText size={13} strokeWidth={2.5} depth={1.5} style={styles.sub}>
                  {sub}
                </OutlineText>
              ) : null}
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

export default React.memo(PlayButton);

const R = 28;

const styles = StyleSheet.create({
  root: { width: 236, height: H + BORDER * 2 },
  base: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: R + BORDER, backgroundColor: OUTLINE, padding: BORDER },
  body: { flex: 1, borderRadius: R, backgroundColor: '#23801A' },
  face: {
    position: 'absolute',
    left: BORDER,
    right: BORDER,
    height: H - DEPTH,
    borderRadius: R,
    overflow: 'hidden',
    backgroundColor: '#4CC22A',
    backgroundImage: 'linear-gradient(#A8F25C, #4CC22A 58%, #36A51C)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, backgroundColor: 'rgba(0,70,0,0.22)' },
  topLight: { position: 'absolute', left: 14, right: 14, top: 3, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  glint: {
    position: 'absolute',
    right: 18,
    top: 9,
    width: 28,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.75)',
    transform: [{ rotate: '-14deg' }],
  },
  label: { marginTop: -4 },
  sub: { marginTop: -8 },
});

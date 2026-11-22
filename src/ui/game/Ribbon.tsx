import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import OutlineText from './OutlineText';
import { OUTLINE } from './skins';

type Tone = 'red' | 'blue' | 'green';

const TONES: Record<Tone, { face: string; tail: string; tailDark: string }> = {
  red: { face: 'linear-gradient(#FF7A6A, #E8413A 55%, #C42F29)', tail: '#B92A25', tailDark: '#7E1915' },
  blue: { face: 'linear-gradient(#7FC4FF, #3A86E0 55%, #2A68C2)', tail: '#2A62B8', tailDark: '#173D7A' },
  green: { face: 'linear-gradient(#A6EE66, #4CC22A 55%, #36A51C)', tail: '#2E8F1A', tailDark: '#1B5A0E' },
};

const H = 42;
const TAIL_W = 24;

/** Kurdelenin çatal ucu: sol uç çizilir, sağ uç aynalanır */
function Tail({ tone, flip }: { tone: Tone; flip?: boolean }) {
  const t = TONES[tone];
  return (
    <Svg width={TAIL_W} height={H - 6} viewBox="0 0 24 36" style={[styles.tail, flip ? styles.tailRight : styles.tailLeft, flip && styles.flip]}>
      <Path d="M24 3H3l7 15-7 15h21z" fill={t.tail} stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M24 27v6h-7z" fill={t.tailDark} />
    </Svg>
  );
}

/**
 * Başlık kurdelesi: altın kenarlı renkli şerit, iki yanında çatal uçlar,
 * üstünde konturlu krem yazı. Ekran başlıkları ve pencere başlıkları için.
 */
function Ribbon({ title, tone = 'red', size = 24, style }: { title: string; tone?: Tone; size?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.root, style]} accessibilityRole="header">
      <Tail tone={tone} />
      <View style={styles.rim}>
        <View style={[styles.face, { backgroundImage: TONES[tone].face }]}>
          <View style={styles.light} />
          <OutlineText size={size} strokeWidth={3}>
            {title}
          </OutlineText>
        </View>
      </View>
      <Tail tone={tone} flip />
    </View>
  );
}

export default React.memo(Ribbon);

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', maxWidth: '100%' },
  tail: { marginTop: 14 },
  tailLeft: { marginRight: -12 },
  tailRight: { marginLeft: -12 },
  flip: { transform: [{ scaleX: -1 }] },
  rim: {
    zIndex: 1,
    flexShrink: 1,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: OUTLINE,
    padding: 2.5,
    backgroundColor: '#F2B12A',
    backgroundImage: 'linear-gradient(#FFE58A, #E9A11A)',
    boxShadow: `0 3px 0 ${OUTLINE}`,
  },
  face: { height: H, borderRadius: 10, paddingHorizontal: 22, justifyContent: 'center', overflow: 'hidden' },
  light: { position: 'absolute', left: 8, right: 8, top: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
});

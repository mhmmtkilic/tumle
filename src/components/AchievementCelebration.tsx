import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import BadgeSvg from './BadgeSvg';
import { Coin, COINS } from './ComboBurst';
import { COMBO_IMAGES } from './comboImages';
import { AchievementDef, AchTier, rewardOf } from '../achievements/defs';
import { formatTL } from '../game/levels';
import { GAME_FONT } from '../ui/theme';

/*
 * Başarım kutlaması (combo patlamasıyla aynı dil): ekran hafifçe kararır,
 * rozet büyükten inip damga gibi oturur; çarpınca şok halkası ve ₺ paralar
 * saçılır, arkada kademe renginde ışınlar döner. Üstte "BAŞARIM AÇILDI!",
 * altta adı ve ödülü belirir. Oyuncu kaçırmasın diye en az MIN_MS ekranda
 * kalır; sonra "Devam etmek için dokun" belirir ve yalnız dokununca kapanır.
 */

const IMPACT = 260;
/** Bu süre dolmadan dokunmak kutlamayı kapatmaz */
const MIN_MS = 2000;
const OUTLINE = '#1B2238';

const RAY_COLOR: Record<AchTier, string> = {
  normal: '#E3E9F2',
  zor: '#FFC531',
  elit: '#3FB2F5',
  efsanevi: '#B05CFF',
};

const PX = 1 / 3;

export default function AchievementCelebration({ def, onDone }: { def: AchievementDef; onDone: () => void }) {
  const { width } = useWindowDimensions();
  const badge = Math.min(width * 0.42, 170);
  const raysSize = Math.min(width * 1.5, 640);

  const show = useSharedValue(0);
  const stamp = useSharedValue(0);
  const label = useSharedValue(0);
  const info = useSharedValue(0);
  const spin = useSharedValue(0);
  const ring = useSharedValue(0);
  const coins = useSharedValue(0);
  const bob = useSharedValue(0);

  const tap = useSharedValue(0);
  const [canClose, setCanClose] = useState(false);

  const close = () => {
    if (!canClose) return;
    setCanClose(false);
    show.value = withTiming(0, { duration: 220 }, (done) => {
      if (done) runOnJS(onDone)();
    });
  };

  useEffect(() => {
    show.value = withTiming(1, { duration: 180 });
    stamp.value = withSequence(
      withTiming(1, { duration: IMPACT, easing: Easing.in(Easing.quad) }),
      withTiming(1.12, { duration: 100, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 130, easing: Easing.inOut(Easing.quad) })
    );
    label.value = withDelay(IMPACT - 40, withTiming(1, { duration: 420, easing: Easing.out(Easing.back(2.2)) }));
    info.value = withDelay(IMPACT + 160, withTiming(1, { duration: 380, easing: Easing.out(Easing.back(1.8)) }));
    // Işınlar kutlama sürdükçe yavaşça döner
    spin.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
    ring.value = withDelay(IMPACT, withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) }));
    coins.value = withDelay(IMPACT, withTiming(1, { duration: 1300, easing: Easing.linear }));
    bob.value = withDelay(IMPACT + 400, withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true));
    const t = setTimeout(() => {
      setCanClose(true);
      tap.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
    }, MIN_MS);
    return () => clearTimeout(t);
  }, []);

  const rootStyle = useAnimatedStyle(() => ({ opacity: show.value }));
  const raysStyle = useAnimatedStyle(() => ({
    opacity: Math.min(stamp.value, 1) * 0.9,
    transform: [{ scale: 0.4 + Math.min(stamp.value, 1) * 0.6 }, { rotate: `${spin.value * 360}deg` }],
  }));
  const badgeStyle = useAnimatedStyle(() => {
    const s = stamp.value;
    const scale = s <= 1 ? 3 - 2 * s : 1 - (s - 1) * 1.1;
    return { opacity: Math.min(s * 3, 1), transform: [{ translateY: -bob.value * 6 }, { scale }] };
  });
  const labelStyle = useAnimatedStyle(() => ({
    opacity: Math.min(label.value * 3, 1),
    transform: [{ translateY: (1 - label.value) * 26 }, { scale: 0.3 + label.value * 0.7 }, { rotate: '-3deg' }],
  }));
  const infoStyle = useAnimatedStyle(() => ({
    opacity: Math.min(info.value * 2, 1),
    transform: [{ translateY: (1 - info.value) * 20 }, { scale: 0.6 + info.value * 0.4 }],
  }));
  const tapStyle = useAnimatedStyle(() => ({ opacity: 0.55 + tap.value * 0.45, transform: [{ scale: 1 + tap.value * 0.06 }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value <= 0 ? 0 : 1 - ring.value,
    transform: [{ scale: 0.4 + ring.value * 3.2 }],
  }));

  const lbl = COMBO_IMAGES.basarim;
  const lblW = Math.min(lbl.w * PX, width - 48);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="Kapat" />
      <View style={styles.center} pointerEvents="none">
        <Animated.Image
          source={COMBO_IMAGES.rays.src}
          style={[{ position: 'absolute', width: raysSize, height: raysSize, tintColor: RAY_COLOR[def.tier] }, raysStyle]}
        />
        <Animated.View style={[styles.ring, ringStyle]} />
        {Array.from({ length: COINS }, (_, i) => (
          <Coin key={i} index={i} seed={def.id.length * 7} t={coins} />
        ))}
        <Animated.View style={labelStyle}>
          <Image source={lbl.src} style={{ width: lblW, height: (lbl.h * PX * lblW) / (lbl.w * PX) }} />
        </Animated.View>
        <Animated.View style={[styles.badge, badgeStyle]}>
          <BadgeSvg id={def.id} tier={def.tier} locked={false} size={badge} />
        </Animated.View>
        <Animated.View style={[styles.info, infoStyle]}>
          <Text style={styles.title} numberOfLines={2}>
            {def.title}
          </Text>
          <View style={styles.reward}>
            <Text style={styles.rewardText}>+{formatTL(rewardOf(def))}</Text>
          </View>
          <Text style={styles.hint}>Ödülü Başarımlar’dan al</Text>
        </Animated.View>
        {canClose ? (
          <Animated.View style={[styles.tap, tapStyle]}>
            <Text style={styles.tapText}>Devam etmek için dokun</Text>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const textOutline = { textShadowColor: OUTLINE, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0.1 };

const styles = StyleSheet.create({
  root: { backgroundColor: 'rgba(12,22,48,0.55)', zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  ring: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 12, borderColor: '#FFFFFF' },
  badge: { marginVertical: 10 },
  info: { alignItems: 'center', gap: 8 },
  title: { fontFamily: GAME_FONT, fontSize: 30, color: '#FFFFFF', textAlign: 'center', ...textOutline },
  reward: {
    backgroundColor: '#24406E',
    borderWidth: 2.5,
    borderBottomWidth: 5,
    borderColor: OUTLINE,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 2,
  },
  rewardText: { fontFamily: GAME_FONT, fontSize: 26, color: '#FFD43B', ...textOutline, textShadowOffset: { width: 0, height: 2 } },
  tap: { marginTop: 28 },
  tapText: { fontFamily: GAME_FONT, fontSize: 20, color: '#FFFFFF', ...textOutline },
  hint: { fontFamily: GAME_FONT, fontSize: 15, color: '#C9D8F2', ...textOutline, textShadowOffset: { width: 0, height: 2 } },
});

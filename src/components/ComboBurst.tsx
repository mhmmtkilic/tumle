import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COMBO_IMAGES, ComboImageId } from './comboImages';
import { formatTL } from '../game/levels';
import { comboMultiplier } from '../useGame';
import { GAME_FONT } from '../ui/theme';

/*
 * Combo patlaması ("Altın patlama" + "Damga" karışımı):
 *  - dev çarpan ekrana damga gibi iner (büyükten küçüğe çarpar, hafif sekmeli)
 *  - indiği an: beyaz şok halkası, tahta sarsıntısı, etrafa ₺ paralar saçılıp düşer
 *  - arkada kademe renginde dönen ışın patlaması
 *  - üstte COMBO! etiketi zıplar, altta kademe sözü (SÜPER / ÇILGINCA / EFSANE)
 *  - kazanç aşağıdan yukarı süzülür
 * Yazılar PNG (scripts/render-combo.mjs); tüm hareket UI iş parçacığında.
 * Bileşen her yeni combo'da yeniden kurulmaz: `combo` değişince baştan oynar.
 */

/** Görseller 3x çizildi */
const PX = 1 / 3;
/** Çarpanın yere çarptığı an (ms): halka, sarsıntı ve paralar burada başlar */
const IMPACT = 210;
const COINS = 12;
const OUTLINE = '#1B2238';

/** Kademe rengi (render-combo.mjs ile aynı) */
function tierColor(m: number) {
  return m >= 10 ? '#B05CFF' : m >= 8 ? '#FF9A3D' : m >= 6 ? '#5BD43A' : '#3FB2F5';
}

function tierWord(m: number): ComboImageId | null {
  return m >= 10 ? 'efsane' : m >= 8 ? 'cilginca' : m >= 6 ? 'super' : null;
}

function size(id: ComboImageId, k = 1) {
  const c = COMBO_IMAGES[id];
  return { width: c.w * PX * k, height: c.h * PX * k };
}

const out = Easing.out(Easing.cubic);

/** Saçılan tek para: açısı sırasından, uzaklığı ve dönüşü combo sayısından türetilir */
function Coin({ index, seed, t }: { index: number; seed: number; t: SharedValue<number> }) {
  const jitter = ((index * 37 + seed * 11) % 10) / 10;
  const a = (index / COINS) * Math.PI * 2 + jitter * 0.5;
  const r = 110 + jitter * 70;
  const dx = Math.cos(a) * r;
  const dy = Math.sin(a) * r * 0.8 - 50;
  const spin = (index % 2 ? 1 : -1) * (240 + jitter * 300);
  const style = useAnimatedStyle(() => {
    const p = t.value;
    // Hızla dışa saçılır, sonra yerçekimiyle düşer
    const fly = 1 - Math.pow(1 - Math.min(p / 0.45, 1), 3);
    const fall = Math.max(0, p - 0.3);
    return {
      opacity: p <= 0 ? 0 : p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25,
      transform: [
        { translateX: dx * fly * (1 + fall * 0.3) },
        { translateY: dy * fly + fall * fall * 520 },
        { rotate: `${spin * p}deg` },
        { scale: 0.4 + Math.min(p * 4, 0.6) },
      ],
    };
  });
  return <Animated.Image source={COMBO_IMAGES.coin.src} style={[styles.coin, style]} />;
}

export default function ComboBurst({ combo, gain, shake }: { combo: number; gain: number; shake?: SharedValue<number> }) {
  const { width } = useWindowDimensions();
  const mult = comboMultiplier(combo);
  const color = tierColor(mult);
  const word = tierWord(mult);
  const multId = `x${mult}` as ComboImageId;
  const raysSize = Math.min(width * 1.25, 560);

  const show = useSharedValue(0);
  const stamp = useSharedValue(0);
  const label = useSharedValue(0);
  const wordIn = useSharedValue(0);
  const rays = useSharedValue(0);
  const ring = useSharedValue(0);
  const coins = useSharedValue(0);
  const rise = useSharedValue(0);

  useEffect(() => {
    for (const v of [stamp, label, wordIn, rays, ring, coins, rise]) v.value = 0;
    show.value = withSequence(withTiming(1, { duration: 60 }), withDelay(1050, withTiming(0, { duration: 260 })));
    // Damga: büyükten iner, çarpınca hafif ezilip yerine oturur
    stamp.value = withSequence(
      withTiming(1, { duration: IMPACT, easing: Easing.in(Easing.quad) }),
      withTiming(1.12, { duration: 90, easing: out }),
      withTiming(1, { duration: 110, easing: Easing.inOut(Easing.quad) })
    );
    label.value = withDelay(IMPACT - 20, withTiming(1, { duration: 380, easing: Easing.out(Easing.back(2.2)) }));
    wordIn.value = withDelay(IMPACT + 120, withTiming(1, { duration: 360, easing: Easing.out(Easing.back(2.6)) }));
    rays.value = withDelay(IMPACT - 60, withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }));
    ring.value = withDelay(IMPACT, withTiming(1, { duration: 520, easing: out }));
    coins.value = withDelay(IMPACT, withTiming(1, { duration: 1150, easing: Easing.linear }));
    rise.value = withDelay(IMPACT + 150, withTiming(1, { duration: 1000, easing: out }));
    if (shake) {
      const k = mult >= 8 ? 1.6 : mult >= 6 ? 1.25 : 1;
      shake.value = withDelay(
        IMPACT,
        withSequence(
          withTiming(-6 * k, { duration: 35 }),
          withTiming(6 * k, { duration: 50 }),
          withTiming(-4 * k, { duration: 45 }),
          withTiming(3 * k, { duration: 40 }),
          withTiming(0, { duration: 40 })
        )
      );
    }
  }, [combo]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: show.value }));
  const stampStyle = useAnimatedStyle(() => {
    const s = stamp.value;
    // 0..1: 3.2 → 1 (iniş); 1..1.12..1: çarpma esnemesi
    const scale = s <= 1 ? 3.2 - 2.2 * s : 1 - (s - 1) * 1.1;
    return { opacity: Math.min(s * 3, 1), transform: [{ scale }] };
  });
  const labelStyle = useAnimatedStyle(() => ({
    opacity: Math.min(label.value * 3, 1),
    transform: [{ translateY: (1 - label.value) * 30 }, { scale: 0.3 + label.value * 0.7 }, { rotate: '-4deg' }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: Math.min(wordIn.value * 3, 1),
    transform: [{ scale: 0.3 + wordIn.value * 0.7 }, { rotate: '3deg' }],
  }));
  const raysStyle = useAnimatedStyle(() => {
    const p = rays.value;
    return {
      opacity: p <= 0 ? 0 : p < 0.25 ? (p / 0.25) * 0.85 : 0.85 * (1 - (p - 0.25) / 0.75),
      transform: [{ scale: Math.min(p * 3.5, 1) + p * 0.15 }, { rotate: `${p * 110}deg` }],
    };
  });
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value <= 0 ? 0 : 1 - ring.value,
    transform: [{ scale: 0.3 + ring.value * 2.9 }],
  }));
  const gainStyle = useAnimatedStyle(() => ({
    opacity: rise.value <= 0 ? 0 : rise.value < 0.2 ? rise.value * 5 : 1,
    transform: [{ translateY: 24 - rise.value * 60 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.root, rootStyle]}>
      <Animated.Image source={COMBO_IMAGES.rays.src} style={[{ width: raysSize, height: raysSize, tintColor: color }, styles.abs, raysStyle]} />
      <Animated.View style={[styles.ring, ringStyle]} />
      {Array.from({ length: COINS }, (_, i) => (
        <Coin key={i} index={i} seed={combo} t={coins} />
      ))}
      <View style={styles.stack}>
        <Animated.View style={labelStyle}>
          <Image source={COMBO_IMAGES.combo.src} style={size('combo', 0.9)} />
        </Animated.View>
        <Animated.View style={[styles.mult, stampStyle]}>
          <Image source={COMBO_IMAGES[multId].src} style={size(multId)} />
        </Animated.View>
        {word ? (
          <Animated.View style={[styles.word, wordStyle]}>
            <Image source={COMBO_IMAGES[word].src} style={size(word, 0.85)} />
          </Animated.View>
        ) : null}
        {gain > 0 ? (
          <Animated.View style={gainStyle}>
            <Text style={styles.gain}>+{formatTL(gain)}</Text>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  abs: { position: 'absolute' },
  ring: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 10, borderColor: '#FFFFFF' },
  coin: { position: 'absolute', width: 30, height: 30 },
  stack: { alignItems: 'center' },
  mult: { marginTop: -14 },
  word: { marginTop: -22 },
  gain: {
    fontFamily: GAME_FONT,
    fontSize: 30,
    color: '#FFD43B',
    fontVariant: ['tabular-nums'],
    textShadowColor: OUTLINE,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0.1,
  },
});

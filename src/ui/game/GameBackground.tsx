import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/*
 * Ortak oyun arka planı (mağaza, başarımlar, ayarlar, profil, oyun): 3D
 * mahalledeki gökyüzünün 2D karşılığı — tepede koyu, aşağıda açık mavi; önde
 * yavaşça süzülen tombul bulutlar. Ana ekran ve Mahallem 3D sahneyi kullanır.
 */

const SKY_TOP = '#4DA8F0';
const SKY_BOTTOM = '#BDE6FF';

/**
 * Bulut: üst üste binen daireler, altında hafif gölge katmanı. SVG değil yerel
 * görünümlerle çizilir: kayarken Android'de yeniden resme çevrilmez (SVG
 * bulutlar boşta bile sürekli bitmap yüklemesine ve takılmaya yol açıyordu).
 */
function Cloud({ w }: { w: number }) {
  const h = w * 0.5;
  const puffs: [number, number, number][] = [
    [0.22, 0.62, 0.2],
    [0.42, 0.45, 0.26],
    [0.64, 0.52, 0.22],
    [0.8, 0.66, 0.16],
  ];
  const circle = (x: number, y: number, r: number, color: string, key: string) => (
    <View
      key={key}
      style={{ position: 'absolute', left: x * w - r * w, top: y * h - r * w, width: r * w * 2, height: r * w * 2, borderRadius: r * w, backgroundColor: color }}
    />
  );
  return (
    <View style={{ width: w, height: h }}>
      {puffs.map(([x, y, r], i) => circle(x, y + 0.06, r, '#D5E7F7', `s${i}`))}
      {puffs.map(([x, y, r], i) => circle(x, y, r, '#FFFFFF', `c${i}`))}
    </View>
  );
}

function Drift({ top, w, duration, phase, screenW }: { top: number; w: number; duration: number; phase: number; screenW: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, []);
  // Soldan sağa süzülür, sağdan çıkınca soldan yeniden girer; her bulutun fazı farklı
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -w + ((t.value + phase) % 1) * (screenW + w) }],
  }));
  return (
    <Animated.View style={[styles.abs, { top }, style]} renderToHardwareTextureAndroid>
      <Cloud w={w} />
    </Animated.View>
  );
}

export default function GameBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SKY_TOP} />
            <Stop offset="1" stopColor={SKY_BOTTOM} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#sky)" />
      </Svg>
      <Drift top={height * 0.1} w={150} duration={70000} phase={0.15} screenW={width} />
      <Drift top={height * 0.3} w={110} duration={90000} phase={0.65} screenW={width} />
      <Drift top={height * 0.55} w={170} duration={80000} phase={0.4} screenW={width} />
      <Drift top={height * 0.8} w={120} duration={100000} phase={0.85} screenW={width} />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, opacity: 0.7 },
});

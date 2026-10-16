import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import GameBackground from '../ui/game/GameBackground';
import { colors, GAME_FONT } from '../ui/theme';

/*
 * Açılış ekranı: uygulamanın geri kalanıyla aynı dil — süzülen bulutlu
 * gökyüzü, ortada sade logo (altın para taşı + "Tümle 2026"), lacivert panelde
 * parlak yeşil yükleme çubuğu. Yazı, oyun fontu yüklenene kadar sistem fontuyla
 * çizilir. Logo: scripts/render-logo.mjs (npm run logo).
 */

const BAR_WIDTH = 260;
const BAR_HEIGHT = 26;

export default function SplashScreen({ progress, fontReady = false }: { progress: number; fontReady?: boolean }) {
  const { width } = useWindowDimensions();
  const [dots, setDots] = useState(0);
  const logoSize = Math.min(width * 0.82, 360);

  // Logo nefes alır gibi hafifçe büyüyüp küçülür
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.035 }, { translateY: pulse.value * -6 }],
  }));

  // Çubuk gerçek ilerlemeye yumuşak geçişle yaklaşır
  const fill = useAnimatedStyle(() => ({
    width: withTiming(Math.max(progress, 0.06) * (BAR_WIDTH - 10), { duration: 450, easing: Easing.out(Easing.cubic) }),
  }));

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 420);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.root}>
      <GameBackground />

      <View style={styles.center}>
        <Animated.View style={pulseStyle}>
          <Image source={require('../../assets/logo.png')} style={{ width: logoSize, height: logoSize }} resizeMode="contain" />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.barOuter}>
          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, fill]}>
              <View style={styles.barShine} />
            </Animated.View>
          </View>
        </View>
        <Text style={[styles.loading, fontReady && styles.loadingGame]}>
          Yükleniyor{'.'.repeat(dots)}
          <Text style={styles.loadingGhost}>{'.'.repeat(3 - dots)}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { alignItems: 'center', gap: 12, paddingBottom: 72 },
  // Oyun paneli dili: koyu dış çizgi, altta kalınlık, lacivert iz
  barOuter: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT + 6,
    borderRadius: 999,
    backgroundColor: colors.outline,
    padding: 2.5,
    paddingBottom: 5,
  },
  barTrack: { flex: 1, borderRadius: 999, backgroundColor: colors.surface, padding: 2.5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: '#43B52A' },
  barShine: {
    position: 'absolute',
    top: 2,
    left: 6,
    right: 6,
    height: '38%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  loading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textShadowColor: colors.outline,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0.1,
  },
  // Font hazırsa oyun fontu (özel fontta fontWeight verilmez)
  loadingGame: { fontFamily: GAME_FONT, fontWeight: undefined, fontSize: 20 },
  loadingGhost: { color: 'transparent', textShadowColor: 'transparent' },
});

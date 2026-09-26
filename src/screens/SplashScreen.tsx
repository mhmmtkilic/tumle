import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, G, Line, LinearGradient, Rect, Stop } from 'react-native-svg';

const BAR_WIDTH = 260;
const BAR_HEIGHT = 24;

export default function SplashScreen({ progress }: { progress: number }) {
  const { width, height } = useWindowDimensions();
  const [dots, setDots] = useState(0);

  const logoSize = Math.min(width * 0.78, 340);

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
    transform: [{ scale: 1 + pulse.value * 0.04 }, { translateY: pulse.value * -6 }],
  }));

  // Bar gerçek ilerlemeye yumuşak geçişle yaklaşır
  const fill = useAnimatedStyle(() => ({
    width: withTiming(Math.max(progress, 0.05) * BAR_WIDTH, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    }),
  }));

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 420);
    return () => clearInterval(id);
  }, []);

  // Silik izometrik grid: altın zeminde beyaz çizgiler
  const gridLines: React.ReactElement[] = [];
  const step = 52;
  const reach = height * 2;
  for (let x = -reach; x < width + reach; x += step) {
    gridLines.push(<Line key={`a${x}`} x1={x} y1={0} x2={x + reach} y2={height} />);
    gridLines.push(<Line key={`b${x}`} x1={x + reach} y1={0} x2={x} y2={height} />);
  }

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <LinearGradient id="splashBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD65A" />
            <Stop offset="0.55" stopColor="#F7AC16" />
            <Stop offset="1" stopColor="#E08E00" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#splashBg)" />
        <G stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={1.2}>
          {gridLines}
        </G>
      </Svg>

      <View style={styles.center}>
        <Animated.View style={[styles.logoCard, { width: logoSize, height: logoSize }, pulseStyle]}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="cover" />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, fill]}>
            <View style={styles.barShine} />
          </Animated.View>
        </View>
        <Text style={styles.loading}>
          Yükleniyor{'.'.repeat(dots)}
          <Text style={styles.loadingGhost}>{'.'.repeat(3 - dots)}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7AC16',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCard: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#7A4A00',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    backgroundColor: '#F7AC16',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  footer: {
    alignItems: 'center',
    gap: 14,
    paddingBottom: 72,
  },
  barTrack: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2E9D60',
  },
  barShine: {
    position: 'absolute',
    top: 3,
    left: 8,
    right: 8,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  loading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(122,74,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingGhost: {
    color: 'transparent',
    textShadowColor: 'transparent',
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import CityScreen from './src/screens/CityScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import SplashScreen from './src/screens/SplashScreen';
import { AchievementsProvider } from './src/achievements/AchievementsContext';
import { EconomyProvider } from './src/economy/EconomyContext';
import { LayoutProvider } from './src/city/LayoutContext';
import { SettingsProvider } from './src/settings/SettingsContext';
import { preloadAll } from './src/preload';

type Screen = 'home' | 'game' | 'shop' | 'city' | 'settings' | 'achievements';

function Root() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('home');
  /** Mahalle ziyaretine kadar biriken yeni alımlar (iniş animasyonu için) */
  const [justBought, setJustBought] = useState<string[]>([]);

  const go = useCallback((next: Screen) => {
    setScreen((current) => {
      // Mahalleden ayrılınca "yeni alındı" animasyon işareti temizlenir
      if (current === 'city') setJustBought([]);
      return next;
    });
  }, []);

  const openShop = useCallback(() => go('shop'), [go]);

  /** Alınan eşya mağazadan çıkmadan kendi yerine iner; dünyaya girince animasyonla belirir */
  const onBought = useCallback((id: string) => {
    setJustBought((cur) => (cur.includes(id) ? cur : [...cur, id]));
  }, []);

  const openCity = useCallback(() => go('city'), [go]);

  // Android donanım geri tuşu: alt ekranlardan ana ekrana döner, ana ekranda uygulamadan çıkar
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      go('home');
      return true;
    });
    return () => sub.remove();
  }, [screen, go]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <Animated.View key={screen} entering={FadeIn.duration(160)} exiting={FadeOut.duration(110)} style={styles.screen}>
        {screen === 'home' ? (
          <HomeScreen
            onPlay={() => go('game')}
            onShop={openShop}
            onCity={openCity}
            onSettings={() => go('settings')}
            onAchievements={() => go('achievements')}
          />
        ) : screen === 'game' ? (
          <GameScreen onBack={() => go('home')} />
        ) : screen === 'shop' ? (
          <CatalogScreen onBack={() => go('home')} onBought={onBought} />
        ) : screen === 'settings' ? (
          <SettingsScreen onBack={() => go('home')} />
        ) : screen === 'achievements' ? (
          <AchievementsScreen onBack={() => go('home')} />
        ) : (
          <CityScreen onBack={() => go('home')} onShop={openShop} justBought={justBought} />
        )}
      </Animated.View>
      <StatusBar style="dark" />
    </View>
  );
}

// Bar dolumu görülebilsin diye splash en az bu kadar ekranda kalır
const MIN_SPLASH_MS = 3000;

export default function App() {
  const [loadProgress, setLoadProgress] = useState(0);
  const [timeProgress, setTimeProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - started) / MIN_SPLASH_MS, 1);
      setTimeProgress(p);
      if (p >= 1) clearInterval(id);
    }, 100);
    preloadAll(setLoadProgress).then(() => {
      const remain = MIN_SPLASH_MS - (Date.now() - started);
      setTimeout(() => setReady(true), Math.max(remain, 0));
    });
    return () => clearInterval(id);
  }, []);

  // Bar 3 saniyeye yayılır ama gerçek yüklemenin önüne geçmez:
  // asset'ler erken biterse süreyle akar, geç kalırsa bar da bekler
  const progress = Math.min(loadProgress, timeProgress);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <EconomyProvider>
            <LayoutProvider>
              <AchievementsProvider>
                <Root />
              </AchievementsProvider>
            </LayoutProvider>
          </EconomyProvider>
        </SettingsProvider>
        {!ready && (
          <Animated.View exiting={FadeOut.duration(450)} style={StyleSheet.absoluteFill}>
            <SplashScreen progress={progress} />
          </Animated.View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F6F3',
  },
  screen: {
    flex: 1,
  },
});

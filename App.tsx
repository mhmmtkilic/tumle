import React, { Activity, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  configureReanimatedLogger,
  Easing,
  FadeOut,
  ReanimatedLogLevel,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NativeSplash from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import CityScreen from './src/screens/CityScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AvatarEditorScreen from './src/screens/AvatarEditorScreen';
import SplashScreen from './src/screens/SplashScreen';
import { AchievementsProvider } from './src/achievements/AchievementsContext';
import { EconomyProvider, useEconomy } from './src/economy/EconomyContext';
import { LayoutProvider, useCityLayout } from './src/city/LayoutContext';
import { SettingsProvider } from './src/settings/SettingsContext';
import { ProfileProvider } from './src/profile/ProfileContext';
import { preloadAll } from './src/preload';
import { BODY_FONT, BODY_FONT_HEAVY, colors, GAME_FONT } from './src/ui/theme';
import Mahalle3D, { Mahalle3DHandle, StageEvents } from './src/components/Mahalle3D';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import { StageContext } from './src/city/StageContext';
import GameBackground from './src/ui/game/GameBackground';

type Screen = 'home' | 'game' | 'shop' | 'city' | 'settings' | 'achievements' | 'profile' | 'avatar' | 'leaderboard';

/**
 * Bellekte tutulan ekranlar: ilk açılışta kurulur, sonra hiç kaldırılmaz
 * (görünmezken React <Activity> ile gizli ve donuk kalırlar). Açılışta yalnız
 * ana ekran ve Mahallem kurulur: hepsini birden kurmak arayüz iş parçacığını
 * saniyelerce meşgul edip 3D sahnenin oluşmasını geciktiriyordu.
 * Oyun ve avatar sayfası her açılışta sıfırdan kurulur.
 */
const KEPT: Screen[] = ['home', 'shop', 'city', 'leaderboard', 'achievements', 'settings', 'profile'];
const ON_DEMAND: Screen[] = ['game', 'avatar'];
/**
 * Ana ekran ve Mahallem hafif ve aralarında sık geçilir: hiç gizlenmez, yalnız
 * saydamlaşır. Gizli <Activity> açılırken alt ağacın efektleri ve yerel
 * görünümleri yeniden kurulur; bu geçişte takılma yapıyordu.
 */
const ALWAYS_ON: Screen[] = ['home', 'city'];
const ENTER_MS = 260;
const EXIT_MS = 180;

/** Uygulamanın ilk çizimi mi (açılış ekranı henüz üstte) */
const isFirstFrame = { current: true };

/** Ekran katmanı: girerken hafifçe yükselip belirir, çıkarken solar (UI iş parçacığında) */
const ScreenLayer = React.memo(function ScreenLayer({
  active,
  visible,
  padded,
  children,
}: {
  active: boolean;
  visible: boolean;
  padded: boolean;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  // Açılıştaki ilk ekran doğrudan görünür başlar (açılış ekranının altında kalır;
  // açılışın yoğun anında başlatılan giriş animasyonu kaybolup ekran saydam kalıyordu)
  const p = useSharedValue(active && isFirstFrame.current ? 1 : 0);
  useEffect(() => {
    p.value = active
      ? withTiming(1, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) })
      : withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.quad) });
  }, [active]);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 16 }, { scale: 0.985 + p.value * 0.015 }],
  }));
  return (
    <Activity mode={visible ? 'visible' : 'hidden'}>
      <Animated.View
        style={[StyleSheet.absoluteFill, padded && { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }, anim]}
        pointerEvents={active ? 'box-none' : 'none'}
      >
        {children}
      </Animated.View>
    </Activity>
  );
});

function Root({ onWorldReady }: { onWorldReady: () => void }) {
  const [screen, setScreen] = useState<Screen>('home');
  /** Solarak çıkan ekran (solma bitene kadar görünür kalır) */
  const [leaving, setLeaving] = useState<Screen | null>(null);
  const screenRef = useRef<Screen>('home');
  /** Şimdiye kadar açılmış (kurulmuş) ekranlar */
  const [mounted, setMounted] = useState<ReadonlySet<Screen>>(() => new Set(ALWAYS_ON));
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Mahalle ziyaretine kadar biriken yeni alımlar (iniş animasyonu için) */
  const [justBought, setJustBought] = useState<string[]>([]);
  const { owned } = useEconomy();
  const { layout } = useCityLayout();

  // Uygulamanın tek 3D sahnesi: ana ekranda arka plan, Mahallem'de sahne
  const sceneRef = useRef<Mahalle3DHandle>(null);
  const eventsRef = useRef<StageEvents>({});
  const stage = useMemo(() => ({ scene: sceneRef, events: eventsRef }), []);
  const profileBack = useRef<(() => void) | null>(null);

  useEffect(() => {
    isFirstFrame.current = false;
  }, []);

  const go = useCallback((next: Screen) => {
    const current = screenRef.current;
    if (current === next) return;
    screenRef.current = next;
    // Mahalleden ayrılınca "yeni alındı" animasyon işareti temizlenir
    if (current === 'city') setJustBought([]);
    setMounted((m) => (m.has(next) ? m : new Set(m).add(next)));
    setLeaving(current);
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setLeaving(null), EXIT_MS + 60);
    setScreen(next);
  }, []);

  const toHome = useCallback(() => go('home'), [go]);
  const openShop = useCallback(() => go('shop'), [go]);
  const openCity = useCallback(() => go('city'), [go]);
  const openProfile = useCallback(() => go('profile'), [go]);
  const openAvatar = useCallback(() => go('avatar'), [go]);

  /** Bir şey alınınca doğrudan Mahallem'e gidilir: eşya gökten iner / arsa açılır */
  const onBought = useCallback(
    (id: string) => {
      setJustBought((cur) => (cur.includes(id) ? cur : [...cur, id]));
      go('city');
    },
    [go]
  );

  // Android donanım geri tuşu: alt ekranlardan ana ekrana döner, ana ekranda uygulamadan çıkar
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      if (screen === 'profile' && profileBack.current) profileBack.current();
      else go(screen === 'avatar' ? 'profile' : 'home');
      return true;
    });
    return () => sub.remove();
  }, [screen, go]);

  // Ekran öğeleri SABİT tutulur: geçişte yalnız katmanların görünürlüğü değişir,
  // ekranların kendisi yeniden çizilmez (aksi halde her geçişte 7 ekran baştan
  // çiziliyor, JS iş parçacığı ~200 ms kilitleniyor, 3D sahne takılıyordu)
  const boardActive = screen === 'leaderboard';
  const fixed = useMemo(
    () => ({
      home: (
        <HomeScreen
          onPlay={() => go('game')}
          onShop={openShop}
          onCity={openCity}
          onSettings={() => go('settings')}
          onAchievements={() => go('achievements')}
          onProfile={openProfile}
          onLeaderboard={() => go('leaderboard')}
        />
      ),
      shop: <CatalogScreen onBack={toHome} onBought={onBought} />,
      settings: <SettingsScreen onBack={toHome} />,
      achievements: <AchievementsScreen onBack={toHome} />,
      profile: <ProfileScreen onBack={toHome} onEditAvatar={openAvatar} backRef={profileBack} />,
      game: <GameScreen onBack={toHome} />,
      avatar: <AvatarEditorScreen onBack={openProfile} onSaved={openProfile} />,
    }),
    [go, openShop, openCity, openProfile, openAvatar, toHome, onBought]
  );
  const city = useMemo(() => <CityScreen onBack={toHome} onShop={openShop} />, [toHome, openShop]);
  const board = useMemo(() => <LeaderboardScreen onBack={toHome} active={boardActive} />, [toHome, boardActive]);
  const render = (k: Screen) => (k === 'city' ? city : k === 'leaderboard' ? board : fixed[k]);

  return (
    <StageContext.Provider value={stage}>
      <View style={styles.root}>
        {/* Gökyüzü en altta; 3D sahne ana ekranda ve Mahallem'de üstünde belirir */}
        <GameBackground />
        <Mahalle3D
          ref={sceneRef}
          events={eventsRef}
          mode={screen === 'home' ? 'home' : screen === 'city' ? 'city' : 'hidden'}
          owned={owned}
          layout={layout}
          fresh={justBought}
          onReady={onWorldReady}
        />
        {KEPT.filter((k) => mounted.has(k)).map((k) => (
          <ScreenLayer key={k} active={screen === k} visible={ALWAYS_ON.includes(k) || screen === k || leaving === k} padded={k !== 'city'}>
            {render(k)}
          </ScreenLayer>
        ))}
        {ON_DEMAND.filter((k) => screen === k || leaving === k).map((k) => (
          <ScreenLayer key={k} active={screen === k} visible padded>
            {render(k)}
          </ScreenLayer>
        ))}
        <StatusBar style="light" />
      </View>
    </StageContext.Provider>
  );
}

// Gizli ekranlar <Activity> ile önceden kurulur; Reanimated'ın "render sırasında
// okuma" denetimi bu ilk kurulumu ikinci render sanıp yanlış uyarı veriyor
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

// Native splash, JS splash ilk karesini çizene kadar ekranda kalır; arada boş kare görünmez
NativeSplash.preventAutoHideAsync();
NativeSplash.setOptions({ duration: 300, fade: true });

// Bar dolumu görülebilsin diye splash en az bu kadar ekranda kalır
const MIN_SPLASH_MS = 3000;

/**
 * Sağlayıcılar + ekranlar. Önbellekli: açılış çubuğunun saniyede 10 kez
 * ilerlemesi bu ağacı yeniden çizdirmesin (çizdiriyordu; açılışta JS iş
 * parçacığı boğuluyor, 3D sahne saniyelerce gecikiyordu).
 */
const AppTree = React.memo(function AppTree({ fontsReady, onWorldReady }: { fontsReady: boolean; onWorldReady: () => void }) {
  return (
    <SettingsProvider>
      <EconomyProvider>
        <LayoutProvider>
          <AchievementsProvider>
            <ProfileProvider>{fontsReady ? <Root onWorldReady={onWorldReady} /> : null}</ProfileProvider>
          </AchievementsProvider>
        </LayoutProvider>
      </EconomyProvider>
    </SettingsProvider>
  );
});

export default function App() {
  const [loadProgress, setLoadProgress] = useState(0);
  const [timeProgress, setTimeProgress] = useState(0);
  const [ready, setReady] = useState(false);
  // 3D sahnenin ilk karesi çizilene kadar açılış ekranı kalır (en fazla birkaç saniye)
  const [worldReady, setWorldReady] = useState(false);
  const onWorldReady = useCallback(() => setWorldReady(true), []);
  // Menü yazıları oyun fontuyla çizilir: iOS, font sonradan yüklenince mevcut
  // yazıları yenilemez; bu yüzden ekranlar font hazır olunca kurulur
  const [fontsLoaded, fontError] = useFonts({
    [GAME_FONT]: Baloo2_800ExtraBold,
    [BODY_FONT]: Nunito_700Bold,
    [BODY_FONT_HEAVY]: Nunito_800ExtraBold,
  });

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
      // Sahne takılırsa açılış sonsuza dek beklemesin
      setTimeout(() => setWorldReady(true), Math.max(remain, 0) + 5000);
    });
    return () => clearInterval(id);
  }, []);

  // Bar 3 saniyeye yayılır ama gerçek yüklemenin önüne geçmez:
  // asset'ler erken biterse süreyle akar, geç kalırsa bar da bekler
  const progress = Math.min(loadProgress, timeProgress);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppTree fontsReady={!!(fontsLoaded || fontError)} onWorldReady={onWorldReady} />
        {!(ready && worldReady && (fontsLoaded || fontError)) && (
          <Animated.View
            exiting={FadeOut.duration(450)}
            style={StyleSheet.absoluteFill}
            onLayout={() => NativeSplash.hideAsync()}
          >
            <SplashScreen progress={progress} fontReady={fontsLoaded} />
          </Animated.View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

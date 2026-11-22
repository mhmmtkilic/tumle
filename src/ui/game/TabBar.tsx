import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BagIcon, CrownIcon, HouseIcon, TrophyIcon } from '../../components/icons';
import CoinIcon from './CoinIcon';
import OutlineText from './OutlineText';
import { OUTLINE } from './skins';
import { GAME_FONT } from '../theme';

export type TabKey = 'shop' | 'city' | 'home' | 'achievements' | 'leaderboard';

/** Çubuğun güvenli alan dışındaki yüksekliği; sekmeli ekranlar alttan bu kadar boşluk bırakır */
export const TAB_BAR_HEIGHT = 74;

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  big: React.ReactNode;
}

const TABS: TabDef[] = [
  { key: 'shop', label: 'Mağaza', icon: <BagIcon size={40} />, big: <BagIcon size={50} /> },
  { key: 'city', label: 'Mahallem', icon: <HouseIcon size={40} />, big: <HouseIcon size={50} /> },
  { key: 'home', label: 'Ana Sayfa', icon: <CoinIcon size={42} />, big: <CoinIcon size={54} /> },
  { key: 'achievements', label: 'Başarımlar', icon: <TrophyIcon size={40} />, big: <TrophyIcon size={50} /> },
  { key: 'leaderboard', label: 'Zenginler', icon: <CrownIcon size={42} />, big: <CrownIcon size={52} /> },
];

interface Props {
  /** Seçili sekme; null iken çubuk aşağı kayıp gizlenir (oyun, ayarlar, profil) */
  active: TabKey | null;
  onSelect: (key: TabKey) => void;
  badges?: Partial<Record<TabKey, number>>;
}

const MOVE = LinearTransition.duration(200).easing(Easing.out(Easing.cubic));

/**
 * Alt gezinti çubuğu: beş sekme, seçili olan genişler, açık renkli kart olarak
 * çubuğun üstüne taşar ve adını gösterir. Sekmeli ekranların hepsinde sabit kalır.
 */
function TabBar({ active, onSelect, badges }: Props) {
  const insets = useSafeAreaInsets();
  const shown = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    shown.value = withTiming(active ? 1 : 0, { duration: active ? 240 : 180, easing: Easing.out(Easing.cubic) });
  }, [active]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - shown.value) * (TAB_BAR_HEIGHT + 60) }] }));

  return (
    <Animated.View style={[styles.root, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }, anim]} pointerEvents={active ? 'box-none' : 'none'}>
      <View style={styles.bar} />
      <View style={styles.row} pointerEvents="box-none">
        {TABS.map((t, i) => {
          const sel = t.key === active;
          const badge = badges?.[t.key] ?? 0;
          return (
            <Animated.View key={t.key} layout={MOVE} style={[styles.slot, sel && styles.slotSel, i < TABS.length - 1 && !sel && TABS[i + 1].key !== active && styles.divider]}>
              <Pressable
                style={styles.press}
                onPress={() => {
                  if (sel) return;
                  Haptics.selectionAsync();
                  onSelect(t.key);
                }}
                accessibilityRole="tab"
                accessibilityLabel={t.label}
                accessibilityState={{ selected: sel }}
              >
                {sel ? (
                  <View style={styles.card}>
                    <View style={styles.cardLight} />
                    <View style={styles.bigIcon}>{t.big}</View>
                    <OutlineText size={14} strokeWidth={2.5} depth={1.5} containerStyle={styles.cardLabel}>
                      {t.label}
                    </OutlineText>
                  </View>
                ) : (
                  <View style={styles.icon}>{t.icon}</View>
                )}
                {badge > 0 ? (
                  <View style={[styles.badge, sel && styles.badgeSel]} pointerEvents="none">
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}

export default React.memo(TabBar);

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bar: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: '#22448E',
    backgroundImage: 'linear-gradient(#2C55A8, #1A3474)',
    borderTopWidth: 3,
    borderTopColor: OUTLINE,
    boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.18)',
  },
  row: { flex: 1, flexDirection: 'row' },
  slot: { flex: 1 },
  slotSel: { flex: 1.5 },
  divider: { borderRightWidth: 2, borderRightColor: 'rgba(10,20,50,0.45)' },
  press: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { opacity: 0.95 },
  card: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: -16,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: OUTLINE,
    backgroundColor: '#3F86DF',
    backgroundImage: 'linear-gradient(#64ABF5, #2F6FCF)',
    alignItems: 'center',
    overflow: 'visible',
  },
  cardLight: { position: 'absolute', left: 10, right: 10, top: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  bigIcon: { marginTop: -16 },
  cardLabel: { marginTop: -4 },
  badge: {
    position: 'absolute',
    top: 4,
    right: '14%',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: OUTLINE,
    backgroundColor: '#43B52A',
    backgroundImage: 'linear-gradient(#9BEA62, #3FAE25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSel: { top: -18 },
  badgeText: { fontFamily: GAME_FONT, color: '#FFFFFF', fontSize: 13, lineHeight: 16, includeFontPadding: false, textShadowColor: OUTLINE, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0.1 },
});

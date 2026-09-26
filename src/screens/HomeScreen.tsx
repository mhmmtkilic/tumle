import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import BgPattern from '../components/BgPattern';
import CityScene from '../components/CityScene';
import GameButton from '../components/GameButton';
import { GearIcon, TrophyIcon } from '../components/icons';
import { useEconomy } from '../economy/EconomyContext';
import { ITEMS } from '../economy/items';
import { useAchievements } from '../achievements/AchievementsContext';
import { useSettings } from '../settings/SettingsContext';
import { formatTL } from '../game/levels';

interface Props {
  onPlay: () => void;
  onShop: () => void;
  onCity: () => void;
  onSettings: () => void;
  onAchievements: () => void;
}

export default function HomeScreen({ onPlay, onShop, onCity, onSettings, onAchievements }: Props) {
  const { width } = useWindowDimensions();
  const { wallet, owned } = useEconomy();
  const { musicOn, setMusicOn } = useSettings();
  const { claimable } = useAchievements();
  const sceneWidth = Math.min(width - 32, 420);
  const ownedCount = ITEMS.filter((i) => owned.includes(i.id)).length;

  return (
    <View style={styles.root}>
      <BgPattern />
      <View style={styles.settingsBtn}>
        <GameButton label="Ayarlar" size="sm" variant="white" onPress={onSettings} icon={<GearIcon size={22} />} />
      </View>
      <View style={styles.soundBtn}>
        <GameButton
          label={musicOn ? '🔊' : '🔇'}
          size="sm"
          variant="white"
          onPress={() => setMusicOn(!musicOn)}
          textStyle={styles.soundIcon}
        />
      </View>
      <View style={styles.achievementsBtn}>
        <GameButton label="Başarımlar" size="sm" variant="white" onPress={onAchievements} icon={<TrophyIcon size={22} />} />
        {claimable > 0 ? (
          <View style={styles.badge} pointerEvents="none">
            <Text style={styles.badgeText}>{claimable}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.walletChip}>
        <Text style={styles.walletLabel}>BİRİKİM</Text>
        <Text style={styles.walletValue} numberOfLines={1} adjustsFontSizeToFit>
          {formatTL(wallet)}
        </Text>
        <Text style={styles.stageLine}>
          🏘 {ownedCount} / {ITEMS.length} eşya
        </Text>
      </View>

      <Pressable onPress={onCity}>
        <CityScene owned={owned} width={sceneWidth} />
      </Pressable>

      <View style={styles.buttons}>
        <GameButton label="Oyna" size="lg" variant="green" onPress={onPlay} />
        <View style={styles.row}>
          <GameButton label="Mağaza" size="md" variant="amber" onPress={onShop} style={styles.flex1} />
          <GameButton label="Mahallem" size="md" variant="blue" onPress={onCity} style={styles.flex1} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },
  walletChip: {
    backgroundColor: '#E3EAE4',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
    minWidth: 170,
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#66766D',
  },
  walletValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#26332C',
    fontVariant: ['tabular-nums'],
  },
  stageLine: { fontSize: 12, fontWeight: '800', marginTop: 2, color: '#66766D' },
  buttons: { width: '100%', maxWidth: 420, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  settingsBtn: { position: 'absolute', top: 4, right: 16 },
  achievementsBtn: { position: 'absolute', top: 4, left: 16 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#E2453A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  soundBtn: { position: 'absolute', top: 58, right: 16 },
  soundIcon: { fontSize: 17, lineHeight: 22 },
});

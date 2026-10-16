import React from 'react';
import { StyleSheet, View } from 'react-native';
import AvatarView from '../components/AvatarView';
import { BagIcon, CrownIcon, GearIcon, HouseIcon, SpeakerIcon, TrophyIcon } from '../components/icons';
import ChunkyButton from '../ui/game/ChunkyButton';
import { GameText, Panel } from '../ui/game/Panel';
import { PANEL } from '../ui/game/skins';
import { useEconomy } from '../economy/EconomyContext';
import { ITEMS } from '../economy/items';
import { useAchievements } from '../achievements/AchievementsContext';
import { useProfile } from '../profile/ProfileContext';
import { useSettings } from '../settings/SettingsContext';
import { formatTL } from '../game/levels';
import { space } from '../ui/theme';

interface Props {
  onPlay: () => void;
  onShop: () => void;
  onCity: () => void;
  onSettings: () => void;
  onAchievements: () => void;
  onProfile: () => void;
  onLeaderboard: () => void;
}

const ICON = { size: 24, color: '#FFFFFF' };

/** Ana menü: arkada oyuncunun dönen 3D mahallesi (App çizer), önde Clash Royale tarzı panel ve butonlar */
export default function HomeScreen({ onPlay, onShop, onCity, onSettings, onAchievements, onProfile, onLeaderboard }: Props) {
  const { wallet, owned } = useEconomy();
  const { musicOn, setMusicOn } = useSettings();
  const { claimable } = useAchievements();
  const { avatar, name } = useProfile();
  const ownedCount = ITEMS.filter((i) => owned.includes(i.id)).length;

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <ChunkyButton
          label="Profil"
          square
          skin="blue"
          onPress={onProfile}
          icon={
            <View style={styles.avatarClip}>
              <AvatarView config={avatar} size={40} />
            </View>
          }
        />
        {/* Profil ve ayarlar butonlarıyla aynı yükseklik: üst bar tek hizada */}
        <Panel style={styles.wallet} innerStyle={styles.walletInner}>
          <GameText size={12} style={styles.walletLabel} numberOfLines={1}>
            {name || 'BİRİKİM'}
          </GameText>
          <GameText size={21} style={styles.walletValue} numberOfLines={1}>
            {formatTL(wallet)}
          </GameText>
        </Panel>
        <ChunkyButton label="Ayarlar" square skin="blue" onPress={onSettings} icon={<GearIcon {...ICON} />} />
      </View>
      <View style={styles.sideCol}>
        <ChunkyButton label="Başarımlar" square skin="blue" badge={claimable} onPress={onAchievements} icon={<TrophyIcon {...ICON} />} />
        <ChunkyButton label="Zenginler" square skin="blue" onPress={onLeaderboard} icon={<CrownIcon size={28} />} />
        <ChunkyButton
          label={musicOn ? 'Müziği kapat' : 'Müziği aç'}
          square
          skin="blue"
          onPress={() => setMusicOn(!musicOn)}
          icon={<SpeakerIcon muted={!musicOn} {...ICON} />}
        />
      </View>

      <View style={styles.spacer} />

      <View style={styles.bottom}>
        <Panel style={styles.progress}>
          <GameText size={15}>
            🏘 {ownedCount} / {ITEMS.length} eşya
          </GameText>
        </Panel>
        <ChunkyButton label="OYNA" size="large" skin="yellow" onPress={onPlay} />
        <View style={styles.row}>
          <ChunkyButton label="MAĞAZA" skin="blue" icon={<BagIcon {...ICON} />} onPress={onShop} style={styles.flex1} />
          <ChunkyButton label="MAHALLEM" skin="green" icon={<HouseIcon {...ICON} />} onPress={onCity} style={styles.flex1} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.l },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s },
  avatarClip: { width: 40, height: 40, borderRadius: 10, overflow: 'hidden' },
  // ChunkyButton (medium, kare) toplam yüksekliği: 52 + 2×2.5 kontur
  wallet: { flex: 1, height: 57 },
  walletInner: { flex: 1, paddingVertical: 0, justifyContent: 'center' },
  walletLabel: { color: PANEL.subtext, lineHeight: 14 },
  walletValue: { lineHeight: 25 },
  sideCol: { alignSelf: 'flex-end', gap: space.s, marginTop: space.s },
  spacer: { flex: 1 },
  bottom: { gap: space.m, width: '100%', maxWidth: 420, alignSelf: 'center' },
  progress: { alignSelf: 'center' },
  row: { flexDirection: 'row', gap: space.m },
  flex1: { flex: 1 },
});

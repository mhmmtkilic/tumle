import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AvatarView from '../components/AvatarView';
import NextItemCard from '../components/NextItemCard';
import { GearIcon, HouseIcon } from '../components/icons';
import CoinIcon from '../ui/game/CoinIcon';
import CurrencyChip from '../ui/game/CurrencyChip';
import PlayButton from '../ui/game/PlayButton';
import { OUTLINE } from '../ui/game/skins';
import { useEconomy } from '../economy/EconomyContext';
import { earnMultiplier, formatMult, ITEMS } from '../economy/items';
import { useProfile } from '../profile/ProfileContext';
import { formatMoney } from '../game/levels';
import { space } from '../ui/theme';

interface Props {
  onPlay: () => void;
  onShop: () => void;
  onCity: () => void;
  onSettings: () => void;
  onProfile: () => void;
}

const COIN = <CoinIcon size={42} />;
const HOUSE = <HouseIcon size={36} />;
const GEAR = <GearIcon size={30} />;

/**
 * Ana sayfa: arkada oyuncunun dönen 3D mahallesi (App çizer). Üstte avatar,
 * cüzdan ve eşya sayacı; altta sıradaki eşya hedefi ve büyük Oyna butonu.
 * Diğer ekranlara alt gezinti çubuğundan (App) gidilir.
 */
export default function HomeScreen({ onPlay, onShop, onCity, onSettings, onProfile }: Props) {
  const { wallet, owned } = useEconomy();
  const { avatar } = useProfile();
  const ownedCount = ITEMS.filter((i) => owned.includes(i.id)).length;
  const mult = earnMultiplier(owned);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.top}>
        <Pressable onPress={onProfile} hitSlop={4} accessibilityRole="button" accessibilityLabel="Profil">
          {({ pressed }) => (
            <View style={[styles.avatarFrame, pressed && styles.pressed]}>
              <View style={styles.avatarClip}>
                <AvatarView config={avatar} size={42} />
              </View>
            </View>
          )}
        </Pressable>
        <CurrencyChip icon={COIN} value={formatMoney(wallet)} plus onPress={onShop} label="Birikim, mağazaya git" style={styles.wallet} />
        <CurrencyChip icon={HOUSE} value={`${ownedCount}/${ITEMS.length}`} onPress={onCity} label="Eşyalar, Mahallem" style={styles.items} />
        <Pressable onPress={onSettings} hitSlop={4} accessibilityRole="button" accessibilityLabel="Ayarlar">
          {({ pressed }) => <View style={[styles.gear, pressed && styles.pressed]}>{GEAR}</View>}
        </Pressable>
      </View>

      <View style={styles.spacer} pointerEvents="none" />

      <View style={styles.bottom}>
        <NextItemCard owned={owned} wallet={wallet} onPress={onShop} />
        <View style={styles.play}>
          <PlayButton label="Oyna" sub={mult > 1 ? `Kazanç ${formatMult(mult)}` : undefined} onPress={onPlay} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.m },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  pressed: { transform: [{ scale: 0.94 }] },
  avatarFrame: {
    width: 54,
    height: 54,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: OUTLINE,
    padding: 3,
    backgroundColor: '#F2A91B',
    backgroundImage: 'linear-gradient(#FFE58A, #F2A91B 60%, #C97A0C)',
    boxShadow: `0 3px 0 ${OUTLINE}`,
  },
  avatarClip: { flex: 1, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: '#9A5A08', backgroundColor: '#8FD3FF', alignItems: 'center', justifyContent: 'center' },
  wallet: { flex: 1.6 },
  items: { flex: 1 },
  gear: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    borderColor: OUTLINE,
    backgroundColor: '#2E8CF0',
    backgroundImage: 'linear-gradient(#7FD0FF, #2E8CF0)',
    boxShadow: `inset 0 3px 0 rgba(255,255,255,0.35), 0 3px 0 ${OUTLINE}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { flex: 1 },
  bottom: { gap: space.l, width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: space.s, paddingBottom: space.m },
  play: { alignItems: 'center' },
});

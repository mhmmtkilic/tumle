import React, { useRef, useState } from 'react';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import GameButton from '../components/GameButton';
import { ITEM_ART } from '../components/ItemSvg';
import { getItem, ITEMS, ShopItem } from '../economy/items';
import { BuyCheck, checkBuy } from '../economy/progress';
import { useEconomy } from '../economy/EconomyContext';
import { formatTL } from '../game/levels';
import { playMerge } from '../audio';

interface Props {
  onBack: () => void;
  /** Bir şey alınınca. Eşya yerine iner, mağazada kalınır. */
  onBought: (id: string) => void;
}

/** Satın alınmamış eşyanın silüeti: gerçek çizim, tek düz gri tonda */
const SKELETON = '#C3D2C8';

function buyLabel(check: BuyCheck): string {
  if (check.block === 'requires') return `Önce: ${getItem(check.missing[0]).name}`;
  return 'Satın Al';
}

/** Katalog: tek liste, ucuzdan pahalıya. Kilit yok — para ve ön şart yeter. */
export default function CatalogScreen({ onBack, onBought }: Props) {
  const { wallet, owned, buy } = useEconomy();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBuy = (item: ShopItem) => {
    if (!buy(item.id)) return;
    playMerge('note');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBought(item.id);
    setToast(`${item.name} → Mahalle ✓`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const ownedCount = ITEMS.filter((i) => owned.includes(i.id)).length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <GameButton label="‹" size="sm" variant="white" onPress={onBack} textStyle={styles.backIcon} />
        <View style={styles.titleWrap} pointerEvents="none">
          <Text style={styles.title}>Mağaza</Text>
        </View>
        <View style={styles.walletChip}>
          <Text style={styles.walletValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatTL(wallet)}
          </Text>
        </View>
      </View>

      <Text style={styles.counter}>
        {ownedCount} / {ITEMS.length} eşya alındı
      </Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {ITEMS.map((item) => (
          <ItemRow key={item.id} item={item} owned={owned} wallet={wallet} onBuy={() => handleBuy(item)} />
        ))}
        <Text style={styles.hint}>
          {ownedCount === ITEMS.length ? 'Mahalle tamamlandı! 🏆' : 'Para birleştir, biriktir, mahalleni kur. 🏗'}
        </Text>
      </ScrollView>

      {toast ? (
        <Animated.View key={toast} entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(180)} style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function ItemRow({ item, owned, wallet, onBuy }: { item: ShopItem; owned: string[]; wallet: number; onBuy: () => void }) {
  const Art = ITEM_ART[item.id];
  const isOwned = owned.includes(item.id);
  const check = checkBuy(owned, wallet, item);
  return (
    <View style={styles.card}>
      <View style={styles.thumb}>{isOwned ? <Art /> : <Art tint={SKELETON} />}</View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.desc}
        </Text>
        <Text style={styles.price} numberOfLines={1}>
          {formatTL(item.price)}
        </Text>
      </View>
      {isOwned ? (
        <View style={styles.ownedBtn}>
          <Text style={styles.ownedText}>Alındı ✓</Text>
        </View>
      ) : (
        <GameButton
          label={buyLabel(check)}
          size="sm"
          variant={check.ok ? 'amber' : 'gray'}
          disabled={!check.ok}
          onPress={onBuy}
          style={styles.buyBtn}
          textStyle={check.block === 'requires' ? styles.smallLabel : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, paddingHorizontal: 16 },
  backIcon: { fontSize: 22, lineHeight: 24 },
  titleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#26332C' },
  walletChip: { backgroundColor: '#E3EAE4', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, maxWidth: 150 },
  walletValue: { fontSize: 15, fontWeight: '800', color: '#26332C', fontVariant: ['tabular-nums'] },

  counter: { textAlign: 'center', color: '#9AA8A0', fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 },

  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DFE8E2',
    padding: 12,
    gap: 12,
  },
  thumb: { width: 62, height: 62 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: '#26332C' },
  desc: { fontSize: 12, color: '#66766D', marginTop: 1 },
  price: { fontSize: 14, fontWeight: '800', color: '#3E8E68', marginTop: 4, fontVariant: ['tabular-nums'] },
  buyBtn: { flexShrink: 0, maxWidth: 130 },
  smallLabel: { fontSize: 11.5 },
  ownedBtn: { backgroundColor: '#EDF2ED', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  ownedText: { color: '#3E8E68', fontWeight: '800', fontSize: 14 },
  hint: { textAlign: 'center', color: '#9AA8A0', fontSize: 13, marginTop: 8 },
  toast: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(38,51,44,0.86)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});

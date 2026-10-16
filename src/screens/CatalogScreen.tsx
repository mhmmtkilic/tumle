import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckIcon } from '../components/icons';
import ChunkyButton from '../ui/game/ChunkyButton';
import GameToast from '../ui/game/GameToast';
import GameTopBar from '../ui/game/GameTopBar';
import { ITEM_ART } from '../components/ItemArt';
import { getItem, ITEMS, ShopItem } from '../economy/items';
import { BuyCheck, checkBuy } from '../economy/progress';
import { useEconomy } from '../economy/EconomyContext';
import { formatTL } from '../game/levels';
import { playMerge } from '../audio';
import { colors, numeric, panelStyle, radius, space, type } from '../ui/theme';

interface Props {
  onBack: () => void;
  /** Bir şey alınınca. Eşya yerine iner, mağazada kalınır. */
  onBought: (id: string) => void;
}

/** Satın alınmamış eşyanın silüeti: gerçek çizim, tek düz ton (lacivert kart üstünde) */
const SKELETON = '#5677AE';

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
    setToast(`${item.name} mahallene eklendi`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const ownedCount = ITEMS.filter((i) => owned.includes(i.id)).length;

  return (
    <View style={styles.root}>
      <View style={styles.pad}>
        <GameTopBar title="Mağaza" onBack={onBack} />
        <View style={styles.summary}>
          <View style={styles.walletPanel}>
            <Text style={styles.walletLabel}>BİRİKİM</Text>
            <Text style={styles.wallet} numberOfLines={1} adjustsFontSizeToFit>
              {formatTL(wallet)}
            </Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {ownedCount}/{ITEMS.length}
            </Text>
            <Text style={styles.counterLabel}>eşya</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {ITEMS.map((item) => (
          <ItemRow key={item.id} item={item} owned={owned} wallet={wallet} onBuy={() => handleBuy(item)} />
        ))}
        <Text style={styles.hint}>
          {ownedCount === ITEMS.length ? 'Mahalle tamamlandı.' : 'Para birleştir, biriktir, mahalleni kur.'}
        </Text>
      </ScrollView>

      {toast ? <GameToast key={toast} text={toast} style={styles.toast} /> : null}
    </View>
  );
}

function ItemRow({ item, owned, wallet, onBuy }: { item: ShopItem; owned: string[]; wallet: number; onBuy: () => void }) {
  const Art = ITEM_ART[item.id];
  const isOwned = owned.includes(item.id);
  const check = checkBuy(owned, wallet, item);
  return (
    <View style={styles.card}>
      <View style={styles.thumb}>
        <View style={styles.thumbArt}>{isOwned ? <Art /> : <Art tint={SKELETON} />}</View>
      </View>
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
        <View style={styles.owned}>
          <CheckIcon size={26} />
          <Text style={styles.ownedText}>Alındı</Text>
        </View>
      ) : (
        <ChunkyButton label={buyLabel(check)} size="small" skin="green" disabled={!check.ok} onPress={onBuy} style={styles.buyBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: space.l },
  summary: { flexDirection: 'row', gap: space.s, marginTop: space.m, marginBottom: space.m },
  walletPanel: { ...panelStyle, flex: 1, paddingVertical: space.xs, paddingHorizontal: space.m },
  walletLabel: { ...type.overline, color: colors.secondaryLabel },
  wallet: { ...type.title2, ...numeric, color: colors.gold },
  counter: { ...panelStyle, paddingHorizontal: space.m, alignItems: 'center', justifyContent: 'center' },
  counterText: { ...type.title3, ...numeric, color: colors.label },
  counterLabel: { ...type.caption, color: colors.secondaryLabel, marginTop: -4 },
  list: { paddingHorizontal: space.l, paddingBottom: space.xxl, gap: space.s },
  card: { ...panelStyle, flexDirection: 'row', alignItems: 'center', padding: space.s, gap: space.m },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.m,
    backgroundColor: colors.surfaceTop,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbArt: { width: 60, height: 60 },
  info: { flex: 1 },
  name: { ...type.headline, color: colors.label },
  desc: { ...type.caption, color: colors.secondaryLabel, marginTop: 1 },
  price: { ...type.headline, ...numeric, color: colors.gold, marginTop: 2 },
  buyBtn: { flexShrink: 0, maxWidth: 150 },
  owned: { alignItems: 'center', paddingHorizontal: space.s },
  ownedText: { ...type.caption, color: colors.accent },
  hint: { ...type.subhead, textAlign: 'center', color: colors.label, marginTop: space.m, textShadowColor: colors.outline, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0.1 },
  toast: { bottom: space.l },
});

import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';
import { CheckIcon, HouseIcon, LockIcon } from '../components/icons';
import ChunkyButton from '../ui/game/ChunkyButton';
import CoinIcon from '../ui/game/CoinIcon';
import CurrencyChip from '../ui/game/CurrencyChip';
import GameDialog from '../ui/game/GameDialog';
import GameToast from '../ui/game/GameToast';
import GameTopBar from '../ui/game/GameTopBar';
import OutlineText from '../ui/game/OutlineText';
import { OUTLINE } from '../ui/game/skins';
import { ITEM_ART } from '../components/ItemArt';
import { getItem, ITEMS, perkLabel, ShopItem } from '../economy/items';
import { BuyCheck, checkBuy } from '../economy/progress';
import { useEconomy } from '../economy/EconomyContext';
import { formatMoney, formatShort } from '../game/levels';
import { playMerge } from '../audio';
import * as Haptics from 'expo-haptics';
import { BODY_FONT, colors, space } from '../ui/theme';

interface Props {
  /** Bir şey alınınca: App Mahallem'e geçer, eşya orada gökten iner */
  onBought: (id: string) => void;
}

const COIN = <CoinIcon size={42} />;
const HOUSE = <HouseIcon size={36} />;
const CHECK = <CheckIcon size={26} />;
const LOCK = <LockIcon size={22} />;

/**
 * Mağaza: iki sütunlu kart ızgarası. Kartta yalnız resim, ad ve fiyat butonu;
 * açıklama ve etki karta dokununca açılan pencerede. Liste ucuzdan pahalıya.
 * Bütün eşyalar listede yer tutar ama ön şartı (arsa) eksik olanın İÇERİĞİ
 * gizlidir: resim yerine soru işareti, ad yerine "???"; silüet de çizilmez ki
 * oyuncu ne olduğunu kestiremesin. Yalnız hangi arsanın açtığı yazar; karta
 * dokununca ayrıntı penceresi açılmaz, aynı ipucu bildirim olarak çıkar.
 */
export default function CatalogScreen({ onBought }: Props) {
  const { wallet, owned, buy } = useEconomy();
  const [toast, setToast] = useState<string | null>(null);
  const [detail, setDetail] = useState<ShopItem | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const handleBuy = (item: ShopItem) => {
    if (!buy(item.id)) return;
    playMerge('note');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetail(null);
    // Bildirim yok: ekran hemen Mahallem'e geçer, eşyanın inişi zaten kutlamadır
    onBought(item.id);
  };

  /** Karta dokunuş: gizli eşya içeriğini göstermez, yalnız neyin açtığını söyler */
  const handleOpen = (item: ShopItem) => {
    const check = checkBuy(owned, wallet, item);
    if (check.block === 'requires') flash(`Önce ${getItem(check.missing[0]).name} alınmalı`);
    else setDetail(item);
  };

  const ownedCount = ITEMS.filter((i) => owned.includes(i.id)).length;

  return (
    <View style={styles.root}>
      <View style={styles.pad}>
        <GameTopBar title="Mağaza" />
        <View style={styles.summary}>
          <CurrencyChip icon={COIN} value={formatMoney(wallet)} label="Birikim" style={styles.wallet} />
          <CurrencyChip icon={HOUSE} value={`${ownedCount}/${ITEMS.length}`} label="Alınan eşya" style={styles.items} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {/* Alınanlar sona: göz önce alınabilecek olanı görsün */}
        {[...ITEMS.filter((i) => !owned.includes(i.id)), ...ITEMS.filter((i) => owned.includes(i.id))].map((item) => (
          <ItemCard key={item.id} item={item} owned={owned} wallet={wallet} onOpen={() => handleOpen(item)} />
        ))}
      </ScrollView>

      {detail ? <ItemDetail item={detail} wallet={wallet} check={checkBuy(owned, wallet, detail)} onBuy={() => handleBuy(detail)} onClose={() => setDetail(null)} /> : null}
      {toast ? <GameToast key={toast} text={toast} style={styles.toast} /> : null}
    </View>
  );
}

/**
 * Kartın alt butonu: alınabilir → yeşil fiyat; para yetmez → soluk fiyat; ön şart →
 * kilit; alındı → tik. Fiyat butonu doğrudan satın almaz, ayrıntı penceresini açar:
 * milyarlık bir alım yanlış dokunuşla gitmesin, onay oradaki "Satın Al"dadır.
 */
function PriceButton({ item, check, onOpen }: { item: ShopItem; check: BuyCheck; onOpen: () => void }) {
  if (check.block === 'owned') {
    return (
      <View style={[styles.state, styles.stateOwned]}>
        {CHECK}
        <OutlineText size={15} strokeWidth={2.5} depth={1}>
          Senin
        </OutlineText>
      </View>
    );
  }
  if (check.block === 'requires') {
    return (
      <View style={styles.state}>
        {LOCK}
        <Text style={styles.stateText} numberOfLines={1}>
          {getItem(check.missing[0]).name}
        </Text>
      </View>
    );
  }
  return <ChunkyButton label={formatShort(item.price)} size="small" skin={check.ok ? 'green' : 'blue'} onPress={onOpen} style={styles.price} />;
}

function ItemCard({ item, owned, wallet, onOpen }: { item: ShopItem; owned: string[]; wallet: number; onOpen: () => void }) {
  const Art = ITEM_ART[item.id];
  const check = checkBuy(owned, wallet, item);
  const hidden = check.block === 'requires';
  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={hidden ? 'Gizli eşya' : item.name}>
        {({ pressed }) => (
          <View style={[styles.cardTop, pressed && styles.pressed]}>
            <View style={[styles.art, hidden && styles.artHidden]}>
              {hidden ? (
                <OutlineText size={46} strokeWidth={4} depth={2} color="#9DB9EC">
                  ?
                </OutlineText>
              ) : (
                <View style={styles.artBox}>
                  <Art />
                </View>
              )}
            </View>
            <OutlineText size={15} strokeWidth={2.5} depth={1} containerStyle={styles.name}>
              {hidden ? '???' : item.name}
            </OutlineText>
          </View>
        )}
      </Pressable>
      <PriceButton item={item} check={check} onOpen={onOpen} />
    </View>
  );
}

/** Ayrıntı penceresi: büyük resim, açıklama, etki ve satın alma */
function ItemDetail({ item, wallet, check, onBuy, onClose }: { item: ShopItem; wallet: number; check: BuyCheck; onBuy: () => void; onClose: () => void }) {
  const Art = ITEM_ART[item.id];
  const isTool = 'tool' in item.perk;
  return (
    <Modal transparent statusBarTranslucent visible animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(160)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={ZoomIn.duration(200).easing(Easing.out(Easing.cubic))} style={styles.dialog}>
          <GameDialog title={item.name} tone="blue" onClose={onClose}>
            <View style={styles.detailArt}>
              <View style={styles.detailArtBox}>
                <Art />
              </View>
            </View>
            <Text style={styles.detailDesc}>{item.desc}</Text>
            <View style={[styles.perk, isTool ? styles.perkTool : styles.perkBonus]}>
              <OutlineText size={16} strokeWidth={2.5} depth={1}>
                {isTool ? `Her oyunda ${perkLabel(item.perk)}` : `Oyunda ${perkLabel(item.perk).toLowerCase()}`}
              </OutlineText>
            </View>
            <View style={styles.detailAction}>
              {check.block === 'owned' ? (
                <Text style={styles.detailNote}>Bu eşya mahallende.</Text>
              ) : (
                <>
                  <ChunkyButton label={`Satın Al  ${formatShort(item.price)}`} skin="green" disabled={!check.ok} onPress={onBuy} />
                  {!check.ok ? <Text style={styles.detailNote}>{formatShort(Math.ceil(item.price - wallet))} daha gerekiyor</Text> : null}
                </>
              )}
            </View>
          </GameDialog>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: space.l },
  summary: { flexDirection: 'row', gap: space.m, marginTop: space.m, marginBottom: space.s, paddingLeft: space.xs },
  wallet: { flex: 1.6 },
  items: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: space.l, paddingTop: space.s, paddingBottom: space.xxl, rowGap: space.l },
  card: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 2.5,
    borderBottomWidth: 6,
    borderColor: OUTLINE,
    backgroundColor: colors.surface,
    backgroundImage: 'linear-gradient(#2F5BA8, #22437F)',
    boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.14)',
    padding: 6,
    gap: 4,
  },
  cardTop: { gap: 2 },
  pressed: { transform: [{ scale: 0.97 }] },
  art: {
    aspectRatio: 1.4,
    borderRadius: 13,
    backgroundColor: '#E6F3FF',
    backgroundImage: 'radial-gradient(#FFFFFF, #BFE0FF)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artHidden: { backgroundColor: '#2A4A86', backgroundImage: 'radial-gradient(#3B63AA, #24427C)' },
  artBox: { width: '78%', height: '86%' },
  name: { alignSelf: 'stretch' },
  price: { alignSelf: 'stretch' },
  state: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: space.s,
    borderRadius: 14,
    backgroundColor: 'rgba(14,26,61,0.55)',
  },
  stateText: { fontFamily: BODY_FONT, fontSize: 13, color: '#C9D8F2', flexShrink: 1 },
  stateOwned: { backgroundColor: 'rgba(30,110,40,0.55)' },
  toast: { bottom: space.l },
  backdrop: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  dialog: { width: '100%', maxWidth: 340, alignItems: 'center' },
  detailArt: {
    width: 150,
    height: 130,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: OUTLINE,
    backgroundColor: '#E6F3FF',
    backgroundImage: 'radial-gradient(#FFFFFF, #BFE0FF)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailArtBox: { width: 120, height: 110 },
  detailDesc: { fontFamily: BODY_FONT, fontSize: 15, lineHeight: 21, color: '#FFFFFF', textAlign: 'center', marginTop: space.m },
  perk: { marginTop: space.m, height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2.5, borderColor: OUTLINE, justifyContent: 'center' },
  perkBonus: { backgroundColor: '#43B52A', backgroundImage: 'linear-gradient(#9BEA62, #3FAE25)' },
  perkTool: { backgroundColor: '#3A9BE8', backgroundImage: 'linear-gradient(#8FE1FF, #3A9BE8)' },
  detailAction: { alignSelf: 'stretch', marginTop: space.l, gap: space.s, alignItems: 'stretch' },
  detailNote: { fontFamily: BODY_FONT, fontSize: 13, color: '#C9D8F2', textAlign: 'center' },
});

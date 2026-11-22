import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { MinusIcon, PlusIcon, ShareIcon } from '../components/icons';
import ChunkyButton from '../ui/game/ChunkyButton';
import GameTopBar from '../ui/game/GameTopBar';
import OutlineText from '../ui/game/OutlineText';
import { TAB_BAR_HEIGHT } from '../ui/game/TabBar';
import { GameText, Panel } from '../ui/game/Panel';
import { PANEL } from '../ui/game/skins';
import { earnMultiplier, formatMult, getItem, isPlaceable, perkLabel, PLACED_ITEMS } from '../economy/items';
import { totalValue } from '../economy/progress';
import { useEconomy } from '../economy/EconomyContext';
import { fits, findFreeSpot } from '../city/grid';
import { useCityLayout } from '../city/LayoutContext';
import { useStage } from '../city/StageContext';
import { MAHALLE_NAME } from '../city/world';
import { formatMoney } from '../game/levels';
import { BODY_FONT, space } from '../ui/theme';
import { ITEM_ART } from '../components/ItemArt';

/*
 * Mahallem: tam ekran 3D sahne (gökyüzü kenardan kenara), arayüz üstünde yüzer.
 * Sahne App'in tek 3D sahnesidir (ana ekranla ortak); bu ekran yalnız arayüzü
 * çizer ve sahneye kumanda eder. Ekran açılışta kurulur ve bellekte kalır.
 */

/** Prop'suz: geçişte yeniden çizilmez; ayrılınca seçimi sahne sıfırlar. Mağazaya alt çubuktan gidilir */
function CityScreen() {
  const insets = useSafeAreaInsets();
  const { owned } = useEconomy();
  const { layout, moveItem, arranged } = useCityLayout();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const { scene: sceneRef, events } = useStage();

  // Sahnenin olayları bu ekrana gelir
  events.current = { onSelect: setSelected, onMove: (id, pos) => moveItem(id, pos), onEditChange: setEditing };

  useEffect(() => {
    sceneRef.current?.select(selected);
  }, [selected]);

  // Mağazadan gelen eşyalar dünyaya bakılmadan alınmış olabilir: varsayılan
  // hücresi doluysa ilk boş hücreye kaydır (her ziyarette, tüm eşyalar için)
  useEffect(() => {
    let cur = layout;
    for (const id of owned) {
      if (!isPlaceable(id)) continue;
      if (!cur[id] || !fits(cur, owned, id, cur[id])) {
        const free = findFreeSpot(cur, owned, id);
        if (free) {
          cur = { ...cur, [id]: free };
          moveItem(id, free, false);
        }
      }
    }
  }, [owned]);

  const remaining = PLACED_ITEMS.filter((i) => !owned.includes(i.id)).length;
  const sceneValue = totalValue(owned);

  const share = async () => {
    try {
      setSharing(true);
      setSelected(null);
      const uri = await sceneRef.current?.snapshot();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `${MAHALLE_NAME} paylaş` });
      }
    } catch {
      // paylaşım iptal edildiyse sessizce geç
    } finally {
      setSharing(false);
    }
  };

  const selectedItem = selected ? getItem(selected) : null;
  const hint = editing
    ? 'Sürükle, boş bir hücreye bırak'
    : !arranged && owned.some(isPlaceable)
      ? 'Eşyayı basılı tut, sürükleyerek taşı'
      : null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* üst: gezinme + mağaza + ipucu */}
      <View style={[styles.top, { paddingTop: insets.top + space.s }]} pointerEvents="box-none">
        <GameTopBar
          title={MAHALLE_NAME}
          right={<ChunkyButton label="Paylaş" square skin="green" onPress={share} disabled={sharing} icon={<ShareIcon size={24} color="#FFFFFF" />} />}
        />
        <View style={styles.topRow} pointerEvents="box-none">
          {hint ? (
            <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} pointerEvents="none" style={styles.hintWrap}>
              <Panel>
                <GameText size={14}>{hint}</GameText>
              </Panel>
            </Animated.View>
          ) : (
            <View />
          )}
        </View>
      </View>

      {/* alt: seçili eşya kartı, mahalle değeri, yakınlaştırma */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + space.m }]} pointerEvents="box-none">
        {selectedItem ? (
          <Animated.View key={selectedItem.id} entering={FadeInDown.duration(180)} exiting={FadeOut.duration(120)} style={styles.card}>
            <View style={styles.cardFrame}>
              <View style={styles.cardInner}>
                <View style={styles.thumb}>
                  <SelectedArt id={selectedItem.id} />
                </View>
                <View style={styles.cardText}>
                  <OutlineText size={19} strokeWidth={2.5} depth={1.5} style={styles.left}>
                    {selectedItem.name}
                  </OutlineText>
                  <Text style={styles.desc} numberOfLines={2}>
                    {selectedItem.desc}
                  </Text>
                  <View style={styles.cardFoot}>
                    <View style={[styles.perkPill, 'tool' in selectedItem.perk ? styles.perkTool : styles.perkBonus]}>
                      <OutlineText size={12.5} strokeWidth={2} depth={1}>
                        {perkLabel(selectedItem.perk)}
                      </OutlineText>
                    </View>
                    <Text style={styles.moveHint}>Taşımak için basılı tut</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}
        <View style={styles.bottomRow} pointerEvents="box-none">
          <Panel style={styles.value}>
            <GameText size={12} style={styles.sub}>
              {remaining === 0 ? 'MAHALLE TAMAMLANDI!' : 'MAHALLE DEĞERİ'}
            </GameText>
            <OutlineText size={22} strokeWidth={3} color="#FFD43B" style={styles.left}>
              {formatMoney(sceneValue)}
            </OutlineText>
            {earnMultiplier(owned) > 1 ? (
              <GameText size={13} style={styles.perk} numberOfLines={1}>
                Oyunda kazanç {formatMult(earnMultiplier(owned))}
              </GameText>
            ) : null}
          </Panel>
          <View style={styles.zoomBtns}>
            <ChunkyButton label="Yakınlaştır" square size="small" skin="blue" onPress={() => sceneRef.current?.zoomIn()} icon={<PlusIcon size={20} color="#FFFFFF" />} />
            <ChunkyButton label="Uzaklaştır" square size="small" skin="blue" onPress={() => sceneRef.current?.zoomOut()} icon={<MinusIcon size={20} color="#FFFFFF" />} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Seçili eşyanın görseli (kartta) */
function SelectedArt({ id }: { id: string }) {
  const Art = ITEM_ART[id];
  return Art ? <Art /> : null;
}

export default React.memo(CityScreen);

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: space.m },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: space.m },
  hintWrap: { maxWidth: '76%' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.m },
  card: { marginBottom: space.m },
  cardFrame: {
    borderRadius: 20,
    padding: 3,
    borderWidth: 2.5,
    borderColor: '#1B2238',
    backgroundColor: '#F2B12A',
    backgroundImage: 'linear-gradient(#FFE58A, #E9A11A)',
    boxShadow: '0 4px 0 #1B2238',
  },
  cardInner: {
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    padding: space.s,
    backgroundColor: '#26498F',
    backgroundImage: 'linear-gradient(#2F5BA8, #1D3B7A)',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.15)',
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#1B2238',
    backgroundColor: '#E6F3FF',
    backgroundImage: 'radial-gradient(#FFFFFF, #BFE0FF)',
    padding: 5,
  },
  cardText: { flex: 1, gap: 2 },
  desc: { fontFamily: BODY_FONT, fontSize: 13, color: PANEL.subtext },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: space.s, marginTop: 4, flexWrap: 'wrap' },
  perkPill: { height: 22, paddingHorizontal: 8, borderRadius: 11, borderWidth: 2, borderColor: '#1B2238', justifyContent: 'center' },
  perkBonus: { backgroundColor: '#43B52A', backgroundImage: 'linear-gradient(#9BEA62, #3FAE25)' },
  perkTool: { backgroundColor: '#3A9BE8', backgroundImage: 'linear-gradient(#8FE1FF, #3A9BE8)' },
  moveHint: { fontFamily: BODY_FONT, fontSize: 12, color: '#FFD43B' },
  sub: { color: PANEL.subtext, marginTop: 2 },
  accent: { color: '#FFD43B', marginTop: 6 },
  perk: { color: '#7CE24F', marginTop: 4 },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.m },
  value: { flexShrink: 1 },
  left: { textAlign: 'left' },
  zoomBtns: { gap: space.s },
});

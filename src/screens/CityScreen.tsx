import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { BagIcon, MinusIcon, PlusIcon, ShareIcon } from '../components/icons';
import ChunkyButton from '../ui/game/ChunkyButton';
import GameTopBar from '../ui/game/GameTopBar';
import { GameText, Panel } from '../ui/game/Panel';
import { PANEL } from '../ui/game/skins';
import { getItem, isPlaceable, ITEMS, PLACED_ITEMS } from '../economy/items';
import { checkBuy, totalValue } from '../economy/progress';
import { useEconomy } from '../economy/EconomyContext';
import { fits, findFreeSpot } from '../city/grid';
import { useCityLayout } from '../city/LayoutContext';
import { useStage } from '../city/StageContext';
import { MAHALLE_NAME } from '../city/world';
import { formatTL } from '../game/levels';
import { space } from '../ui/theme';

/*
 * Mahallem: tam ekran 3D sahne (gökyüzü kenardan kenara), arayüz üstünde yüzer.
 * Sahne App'in tek 3D sahnesidir (ana ekranla ortak); bu ekran yalnız arayüzü
 * çizer ve sahneye kumanda eder. Ekran açılışta kurulur ve bellekte kalır.
 */

interface Props {
  onBack: () => void;
  onShop: () => void;
}

/** Geçişte yeniden çizilmesin diye prop'ları sabit; ayrılınca seçimi sahne sıfırlar */
function CityScreen({ onBack, onShop }: Props) {
  const insets = useSafeAreaInsets();
  const { owned, wallet } = useEconomy();
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
  const buyableCount = ITEMS.filter((i) => checkBuy(owned, wallet, i).ok).length;

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
          onBack={onBack}
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
          <ChunkyButton label="Mağaza" square skin="yellow" onPress={onShop} badge={buyableCount} icon={<BagIcon size={26} color="#FFFFFF" />} />
        </View>
      </View>

      {/* alt: seçili eşya kartı, mahalle değeri, yakınlaştırma */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.m }]} pointerEvents="box-none">
        {selectedItem ? (
          <Animated.View key={selectedItem.id} entering={FadeInDown.duration(180)} exiting={FadeOut.duration(120)} style={styles.card}>
            <Panel>
              <GameText size={20}>{selectedItem.name}</GameText>
              <GameText size={14} style={styles.sub}>
                {selectedItem.desc}
              </GameText>
              <GameText size={13} style={styles.accent}>
                Taşımak için basılı tut
              </GameText>
            </Panel>
          </Animated.View>
        ) : null}
        <View style={styles.bottomRow} pointerEvents="box-none">
          <Panel style={styles.value}>
            <GameText size={12} style={styles.sub}>
              {remaining === 0 ? 'MAHALLE TAMAMLANDI!' : 'MAHALLE DEĞERİ'}
            </GameText>
            <GameText size={22} numberOfLines={1}>
              {formatTL(sceneValue)}
            </GameText>
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

export default React.memo(CityScreen);

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: space.m },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: space.m },
  hintWrap: { maxWidth: '76%' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.m },
  card: { marginBottom: space.s },
  sub: { color: PANEL.subtext, marginTop: 2 },
  accent: { color: '#FFD43B', marginTop: 6 },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.m },
  value: { flexShrink: 1 },
  zoomBtns: { gap: space.s },
});

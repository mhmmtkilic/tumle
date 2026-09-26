import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import BgPattern from '../components/BgPattern';
import CityScene, { sceneHeightFor } from '../components/CityScene';
import GameButton from '../components/GameButton';
import { ShopIcon } from '../components/icons';
import { isPlaceable, ITEMS, PLACED_ITEMS } from '../economy/items';
import { checkBuy, totalValue } from '../economy/progress';
import { useEconomy } from '../economy/EconomyContext';
import { fits, findFreeSpot, resolveDrop } from '../city/grid';
import { useCityLayout } from '../city/LayoutContext';
import { MAHALLE_NAME, sceneFrame } from '../city/world';
import { formatTL } from '../game/levels';

interface Props {
  onBack: () => void;
  onShop: () => void;
  /** Son ziyaretten beri alınan eşya id'leri (iniş ve arsa açılış animasyonu) */
  justBought?: string[];
}

const MAX_PINCH = 3.5;
const ZOOMS = [1, 1.6, 2.2, 3];
// Bırakınca sekmeden, tek harekette yumuşakça döner
const RETURN = { duration: 240, easing: Easing.out(Easing.cubic) };

function clamp(v: number, min: number, max: number): number {
  'worklet';
  return Math.min(max, Math.max(min, v));
}

export default function CityScreen({ onBack, onShop, justBought = [] }: Props) {
  const { width } = useWindowDimensions();
  const { owned, wallet } = useEconomy();
  const { layout, moveItem, arranged } = useCityLayout();
  const [selected, setSelected] = useState<string | null>(null);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const shotRef = useRef<View>(null);
  const sceneWidth = width - 16;
  const bought = justBought;

  // Taşıma modu: basılı tutulan eşya pan hareketiyle sürüklenir
  const editingSV = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const startEdit = (id: string) => {
    setSelected(null);
    setEditing(id);
    editingSV.value = 1;
    dragX.value = 0;
    dragY.value = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const frame = sceneFrame(owned);
  const sceneHeight = sceneHeightFor(owned, sceneWidth);

  const commitDrop = (dxInner: number, dyInner: number) => {
    if (editing) {
      const worldPerPx = frame.w / sceneWidth;
      const target = resolveDrop(layout, owned, editing, dxInner * worldPerPx, dyInner * worldPerPx);
      if (target) {
        moveItem(editing, target);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (Math.abs(dxInner) + Math.abs(dyInner) > 4) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    setEditing(null);
    dragX.value = 0;
    dragY.value = 0;
  };

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

  const applyZoomRef = useRef<(i: number) => void>(() => {});

  const remaining = PLACED_ITEMS.filter((i) => !owned.includes(i.id)).length;
  const sceneValue = totalValue(owned);
  const buyableCount = ITEMS.filter((i) => checkBuy(owned, wallet, i).ok).length;

  /** Buton zoom'u kalıcıdır; pinch onun üstüne biner ve bırakınca geri döner */
  const baseScale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      pinchScale.value = clamp(e.scale, 0.85, MAX_PINCH / baseScale.value);
    })
    .onEnd(() => {
      pinchScale.value = withTiming(1, RETURN);
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onUpdate((e) => {
      if (editingSV.value === 1) {
        dragX.value = e.translationX / baseScale.value;
        dragY.value = e.translationY / baseScale.value;
        return;
      }
      const base = baseScale.value;
      if (base > 1.01) {
        const mx = (sceneWidth * (base - 1)) / 2;
        const my = (sceneHeight * (base - 1)) / 2;
        tx.value = clamp(savedTx.value + e.translationX, -mx, mx);
        ty.value = clamp(savedTy.value + e.translationY, -my, my);
      } else {
        tx.value = clamp(e.translationX, -sceneWidth / 2, sceneWidth / 2);
        ty.value = clamp(e.translationY, -sceneHeight / 2, sceneHeight / 2);
      }
    })
    .onEnd(() => {
      if (editingSV.value === 1) {
        editingSV.value = 0;
        runOnJS(commitDrop)(dragX.value, dragY.value);
        return;
      }
      if (baseScale.value > 1.01) {
        savedTx.value = tx.value;
        savedTy.value = ty.value;
      } else {
        tx.value = withTiming(0, RETURN);
        ty.value = withTiming(0, RETURN);
        savedTx.value = 0;
        savedTy.value = 0;
      }
    })
    .onFinalize(() => {
      if (editingSV.value === 1) {
        editingSV.value = 0;
        runOnJS(commitDrop)(dragX.value, dragY.value);
      }
    });

  const gestures = Gesture.Simultaneous(pan, pinch);

  const applyZoom = (idx: number) => {
    const z = ZOOMS[idx];
    setZoomIdx(idx);
    baseScale.value = withTiming(z, RETURN);
    const mx = (sceneWidth * (z - 1)) / 2;
    const my = (sceneHeight * (z - 1)) / 2;
    const nx = Math.max(-mx, Math.min(mx, savedTx.value));
    const ny = Math.max(-my, Math.min(my, savedTy.value));
    savedTx.value = nx;
    savedTy.value = ny;
    tx.value = withTiming(nx, RETURN);
    ty.value = withTiming(ny, RETURN);
  };
  applyZoomRef.current = applyZoom;

  const share = async () => {
    try {
      setSharing(true);
      setSelected(null);
      await new Promise((r) => setTimeout(r, 60));
      const uri = await captureRef(shotRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `${MAHALLE_NAME} paylaş` });
      }
    } catch {
      // paylaşım iptal edildiyse sessizce geç
    } finally {
      setSharing(false);
    }
  };

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: baseScale.value * pinchScale.value }],
  }));

  return (
    <View style={styles.root}>
      <BgPattern />
      <View style={styles.header}>
        <GameButton label="‹" size="sm" variant="white" onPress={onBack} textStyle={styles.backIcon} />
        <View style={styles.titleWrap} pointerEvents="none">
          <Text style={styles.title}>{MAHALLE_NAME}</Text>
        </View>
        <GameButton label="Paylaş" size="sm" variant="blue" onPress={share} disabled={sharing} />
      </View>

      <GestureDetector gesture={gestures}>
        <View style={styles.sceneWrap}>
          <Animated.View entering={ZoomIn.duration(260)} exiting={FadeOut.duration(140)} style={zoomStyle}>
            <View ref={shotRef} collapsable={false} style={[styles.shotArea, sharing && styles.shotAreaSharing]}>
              <CityScene
                owned={owned}
                justBought={bought}
                width={sceneWidth}
                selected={selected}
                onItemPress={(id) => setSelected((cur) => (id === null || cur === id ? null : id))}
                onItemLongPress={startEdit}
                edit={{ id: editing, dragX, dragY }}
              />
            </View>
          </Animated.View>

          {/* sağ üst: katalog balonu */}
          <Pressable style={[styles.bubble, styles.shopBubble]} onPress={onShop} hitSlop={6}>
            <ShopIcon size={30} />
            {buyableCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{buyableCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <View style={styles.zoomBtns} pointerEvents="box-none">
            <GameButton label="+" size="sm" variant="white" disabled={zoomIdx >= ZOOMS.length - 1} onPress={() => applyZoom(zoomIdx + 1)} textStyle={styles.zoomIcon} />
            <GameButton label="−" size="sm" variant="white" disabled={zoomIdx <= 0} onPress={() => applyZoom(zoomIdx - 1)} textStyle={styles.zoomIcon} />
          </View>

          {editing ? (
            <View style={styles.pill} pointerEvents="none">
              <Text style={styles.pillText}>Sürükle, boş bir hücreye bırak</Text>
            </View>
          ) : !arranged && owned.some(isPlaceable) ? (
            <View style={[styles.pill, styles.pillBuild]} pointerEvents="none">
              <Text style={styles.pillText}>🏗 Eşyayı basılı tut, sürükleyerek yerleştir</Text>
            </View>
          ) : null}
        </View>
      </GestureDetector>

      <Animated.View entering={FadeIn.duration(200)} style={styles.valueChip}>
        <Text style={styles.valueLabel}>MAHALLE DEĞERİ</Text>
        <Text style={styles.valueText} numberOfLines={1} adjustsFontSizeToFit>
          {formatTL(sceneValue)}
        </Text>
      </Animated.View>

      {remaining === 0 ? (
        <Text style={styles.doneText}>Mahalle tamamlandı! 🏆 Burası artık senin.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 8, marginBottom: 8 },
  backIcon: { fontSize: 22, lineHeight: 24 },
  titleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#26332C' },
  sceneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 18 },
  zoomBtns: { position: 'absolute', right: 10, bottom: 10, gap: 8 },
  bubble: {
    position: 'absolute',
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DFE8E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#26332C',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  shopBubble: { top: 10 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: '#E2453A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  zoomIcon: { fontSize: 22, lineHeight: 24 },
  shotArea: { borderRadius: 12, padding: 6 },
  shotAreaSharing: { backgroundColor: '#F2F6F3' },
  pill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(38,51,44,0.78)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    maxWidth: '72%',
  },
  pillText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700', textAlign: 'center' },
  pillBuild: { backgroundColor: 'rgba(240,154,62,0.95)' },
  valueChip: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#E3EAE4',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 22,
    marginVertical: 8,
    minWidth: 180,
  },
  valueLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: '#66766D' },
  valueText: { fontSize: 18, fontWeight: '800', color: '#26332C', fontVariant: ['tabular-nums'] },
  doneText: { textAlign: 'center', color: '#3E8E68', fontWeight: '800', fontSize: 15, marginBottom: 16 },

});

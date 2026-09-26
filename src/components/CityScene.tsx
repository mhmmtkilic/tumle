import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Polygon, Polyline, Rect as SvgRect, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { isPlaceable, ITEMS, ShopItem } from '../economy/items';
import { formatTL } from '../game/levels';
import {
  artRect,
  BLOCK_TOP,
  blocksFor,
  cellCenter,
  CityLayout,
  CityPos,
  footOf,
  GRID_A,
  GRID_C,
  gridLines,
  occupancyGrid,
  snapCell,
} from '../city/grid';
import { BlockDef, BlockId, Frame, getBlock, openBlocks, sceneFrame } from '../city/world';
import { useCityLayout } from '../city/LayoutContext';
import { HelikopterSvg, ITEM_ART } from './ItemSvg';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---- Zemin: mahalle ----------------------------------------------------------
// Koordinatlar dünya birimidir; viewBox sahne çerçevesinden gelir.

function Ground({ frame, children }: { frame: Frame; children: React.ReactNode }) {
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
      width="100%"
      height="100%"
    >
      {children}
    </Svg>
  );
}

function Lot1() {
  return (
    <>
      <Polygon points="200,120 390,215 200,310 10,215" fill="#B9E29F" />
      <Polygon points="200,132 378,215 200,298 22,215" fill="none" stroke="#A3D488" strokeWidth={1.5} />
      {/* ön kenar boyunca yol */}
      <Polygon points="10,215 200,310 390,215 390,249 200,344 10,249" fill="#C6CDD1" />
      <Polyline points="10,215 200,310 390,215" fill="none" stroke="#B0BDB4" strokeWidth={2} />
      <Polyline points="10,232 200,327 390,232" fill="none" stroke="#F5F0E6" strokeWidth={2.5} strokeDasharray="10 12" />
    </>
  );
}

function Lot2() {
  return (
    <>
      <Polygon points="390,25 580,120 390,215 200,120" fill="#B9E29F" />
      <Polygon points="390,37 568,120 390,203 222,120" fill="none" stroke="#A3D488" strokeWidth={1.5} />
      <Polygon points="390,215 580,120 580,154 390,249" fill="#C6CDD1" />
      <Polyline points="390,215 580,120" fill="none" stroke="#B0BDB4" strokeWidth={2} />
      <Polyline points="390,232 580,137" fill="none" stroke="#F5F0E6" strokeWidth={2.5} strokeDasharray="10 12" />
    </>
  );
}

function Sahil() {
  return (
    <>
      <Polygon points="580,154 770,249 580,344 390,249" fill="#B9E29F" />
      <Polygon points="580,166 758,249 580,332 402,249" fill="none" stroke="#A3D488" strokeWidth={1.5} />
      <Polygon points="770,249 580,344 584.5,352.9 774.5,257.9" fill="#EFDFA8" />
      <Polygon points="774.5,257.9 584.5,352.9 594.5,372.6 784.5,277.6" fill="#7FC4E8" />
      <Path d="M700 300 q6 -3 12 0" stroke="#D9F0FA" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M640 332 q6 -3 12 0" stroke="#D9F0FA" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  );
}

function BlockGround({ block }: { block: BlockDef }) {
  if (block.id === 'lot1') return <Lot1 />;
  if (block.id === 'lot2') return <Lot2 />;
  return <Sahil />;
}

// ---- Konfeti + toz -------------------------------------------------------------

const CONFETTI = [
  { dx: -30, delay: 0, rot: -120, color: '#E8B93C' },
  { dx: 26, delay: 60, rot: 140, color: '#D97E6A' },
  { dx: -14, delay: 120, rot: -200, color: '#8ABD88' },
  { dx: 38, delay: 30, rot: 220, color: '#75619F' },
  { dx: -40, delay: 90, rot: 160, color: '#3E8E9E' },
  { dx: 12, delay: 150, rot: -160, color: '#F2C14E' },
  { dx: -24, delay: 45, rot: 180, color: '#E39A4C' },
  { dx: 32, delay: 110, rot: -140, color: '#A9CBD9' },
];

function ConfettiPiece({ cfg, originX, originY, baseDelay = 400 }: { cfg: (typeof CONFETTI)[number]; originX: number; originY: number; baseDelay?: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(baseDelay + cfg.delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 1 - t.value,
    transform: [
      { translateX: cfg.dx * t.value },
      { translateY: -50 * t.value + 90 * t.value * t.value },
      { rotate: `${cfg.rot * t.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', left: originX, top: originY, width: 5, height: 8, borderRadius: 1.5, backgroundColor: cfg.color }, style]}
    />
  );
}

/**
 * Blok açılışı: yeni arsa/oda kendi yönünden izometrik eksende kayarak gelir,
 * ardından toz bulutu ve konfeti.
 */
function BlockReveal({ block, celebrate, scale, frame }: { block: BlockDef; celebrate: boolean; scale: number; frame: Frame }) {
  const t = useSharedValue(celebrate ? 1 : 0);
  const dust = useSharedValue(0);

  useEffect(() => {
    if (celebrate) {
      t.value = withDelay(250, withSpring(0, { damping: 15, stiffness: 90, mass: 0.9 }));
      dust.value = withDelay(600, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));
    }
  }, [celebrate]);

  const slide = useAnimatedStyle(() => ({
    opacity: 1 - t.value * 0.9,
    transform: [{ translateX: block.reveal.dx * scale * t.value }, { translateY: block.reveal.dy * scale * t.value }],
  }));
  const dustStyle = useAnimatedStyle(() => ({
    opacity: dust.value === 0 ? 0 : 0.5 * (1 - dust.value),
    transform: [{ scaleX: 0.4 + dust.value * 1.3 }],
  }));
  const cx = (block.top.x - frame.x) * scale;
  const cy = (block.top.y + 95 - frame.y) * scale;

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, slide]}>
        <Ground frame={frame}>
          <BlockGround block={block} />
        </Ground>
      </Animated.View>
      {celebrate ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', left: cx - 90 * scale, top: cy + 10 * scale, width: 180 * scale, height: 26 * scale, borderRadius: 999, backgroundColor: '#CDBFA3' },
              dustStyle,
            ]}
          />
          {CONFETTI.map((cfg, i) => (
            <ConfettiPiece key={i} cfg={cfg} originX={cx} originY={cy - 20 * scale} baseDelay={600} />
          ))}
        </>
      ) : null}
    </>
  );
}

// ---- Ambiyans -------------------------------------------------------------------

function SmokePuff({ x, y, delay }: { x: number; y: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.15 ? t.value * 3 : 0.45 * (1 - t.value),
    transform: [{ translateY: -22 * t.value }, { translateX: 5 * t.value }, { scale: 0.5 + t.value * 0.9 }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E6ECE8' }, style]} />
  );
}

/** Ağaç: tabanından tutunup rüzgarda hafifçe salınır */
function Sway({ children, deg = 4, duration = 2100 }: { children: React.ReactNode; deg?: number; duration?: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value * deg - deg / 2}deg` }] }));
  return <Animated.View style={[{ width: '100%', height: '100%', transformOrigin: '50% 90%' }, style]}>{children}</Animated.View>;
}

function RotorFx({ w, h }: { w: number; h: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 150, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 - t.value * 0.85 }] }));
  const bw = w * 0.55;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: w * 0.5 - bw / 2, top: h * 0.257, width: bw, height: Math.max(2, w * 0.03), borderRadius: 999, backgroundColor: '#3A423E' }, style]}
    />
  );
}

function PoolFx({ w, h }: { w: number; h: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const s1 = useAnimatedStyle(() => ({ opacity: 0.25 + t.value * 0.55, transform: [{ translateX: t.value * w * 0.03 }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: 0.8 - t.value * 0.55, transform: [{ translateX: -t.value * w * 0.03 }] }));
  const streak = { position: 'absolute' as const, height: Math.max(1.5, h * 0.035), borderRadius: 999, backgroundColor: '#DFF4FB' };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[streak, { left: w * 0.34, top: h * 0.4, width: w * 0.2 }, s1]} />
      <Animated.View style={[streak, { left: w * 0.48, top: h * 0.3, width: w * 0.13 }, s2]} />
    </View>
  );
}

// ---- Düzenleme modu ızgarası --------------------------------------------------

function GridOverlay({ blocks, frame }: { blocks: BlockId[]; frame: Frame }) {
  return (
    <Ground frame={frame}>
      {blocks.flatMap((b) =>
        gridLines(b).map((l, i) => (
          <Line key={`${b}-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2} />
        ))
      )}
    </Ground>
  );
}

function cellTick() {
  Haptics.selectionAsync();
}

/**
 * Sürükleme sırasında hedef hücreyi canlı boyar: boşsa koyu yeşil, doluysa
 * kırmızı. Konum ve geçerlilik UI thread'de hesaplanır, parmağı gecikmesiz izler.
 */
function DropHighlight({ id, dragX, dragY, layout, owned, scale, frame }: {
  id: string; dragX: SharedValue<number>; dragY: SharedValue<number>; layout: CityLayout; owned: string[]; scale: number; frame: Frame;
}) {
  const s = footOf(id);
  const c0 = cellCenter(layout[id], s);
  const blocks = blocksFor(id, owned);
  const occ = occupancyGrid(layout, owned, id, blocks);
  const ox = frame.x, oy = frame.y;
  const w = 2 * s * GRID_A * scale;
  const h = s * GRID_A * scale;
  const pts = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;

  const cellKey = useDerivedValue(() => {
    const p = snapCell(c0.x + dragX.value / scale, c0.y + dragY.value / scale, s, blocks);
    return `${p.b}:${p.i}:${p.j}`;
  });
  useAnimatedReaction(
    () => cellKey.value,
    (cur, prev) => {
      if (prev !== null && cur !== prev) runOnJS(cellTick)();
    }
  );

  const validSV = useDerivedValue(() => {
    const p = snapCell(c0.x + dragX.value / scale, c0.y + dragY.value / scale, s, blocks);
    const grid = occ[p.b];
    for (let di = 0; di < s; di++) {
      for (let dj = 0; dj < s; dj++) {
        if (grid[p.i + di][p.j + dj]) return 0;
      }
    }
    return 1;
  });

  const posStyle = useAnimatedStyle(() => {
    const p = snapCell(c0.x + dragX.value / scale, c0.y + dragY.value / scale, s, blocks);
    const t = BLOCK_TOP[p.b];
    const px = (t.x + (p.i - p.j) * GRID_A - ox) * scale;
    const py = (t.y + (p.i + p.j + s) * GRID_C - oy) * scale;
    return { transform: [{ translateX: px - w / 2 }, { translateY: py - h / 2 }] };
  });
  const greenStyle = useAnimatedStyle(() => ({ opacity: validSV.value }));
  const redStyle = useAnimatedStyle(() => ({ opacity: 1 - validSV.value }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, posStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, greenStyle]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
          <Polygon points={pts} fill="rgba(47,122,84,0.45)" stroke="#2F7A54" strokeWidth={1.5} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, redStyle]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
          <Polygon points={pts} fill="rgba(226,69,58,0.5)" stroke="#C0392B" strokeWidth={1.5} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

// ---- Yerleştirilen eşya (iniş + toz + konfeti; taşıma modu) -------------------

function PlacedItem({ item, pos, rect, scale, frame, blocks, justBought, onPress, onLongPress, editing, dragX, dragY }: {
  item: ShopItem;
  pos: CityPos;
  rect: Rect;
  scale: number;
  frame: Frame;
  blocks: BlockId[];
  justBought: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  editing?: boolean;
  dragX?: SharedValue<number>;
  dragY?: SharedValue<number>;
}) {
  const Art = ITEM_ART[item.id];
  const drop = useSharedValue(justBought ? 1 : 0);
  const dust = useSharedValue(0);

  useEffect(() => {
    if (justBought) {
      drop.value = 1;
      drop.value = withDelay(150, withSpring(0, { damping: 13, stiffness: 120, mass: 0.9 }));
      dust.value = withDelay(420, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    }
  }, [justBought]);

  const dropStyle = useAnimatedStyle(() => ({
    opacity: 1 - drop.value * 0.4,
    transform: [{ translateY: -110 * drop.value }, { scale: 1 - drop.value * 0.25 }],
  }));
  const dustStyle = useAnimatedStyle(() => ({
    opacity: dust.value === 0 ? 0 : 0.5 * (1 - dust.value),
    transform: [{ scaleX: 0.4 + dust.value * 1.3 }, { scaleY: 0.5 + dust.value * 0.5 }],
  }));

  // Taşıma modunda eşya parmağı pürüzsüz izlemez: kilitli hücreden hücreye
  // atlar (Clash mantığı) ve ızgara dışına asla çıkamaz
  const s = footOf(item.id);
  const c0 = cellCenter(pos, s);
  const editStyle = useAnimatedStyle(() => {
    if (!editing || !dragX || !dragY) {
      return { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }], opacity: 1 };
    }
    const p = snapCell(c0.x + dragX.value / scale, c0.y + dragY.value / scale, s, blocks);
    const t = BLOCK_TOP[p.b];
    const cx = t.x + (p.i - p.j) * GRID_A;
    const cy = t.y + (p.i + p.j + s) * GRID_C;
    return {
      transform: [{ translateX: (cx - c0.x) * scale }, { translateY: (cy - c0.y) * scale }, { scale: 1.08 }],
      opacity: 0.9,
    };
  }, [editing, blocks, scale, c0.x, c0.y]);

  const w = rect.w * scale;
  const h = rect.h * scale;

  return (
    <Pressable
      disabled={!onPress && !onLongPress}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={{ position: 'absolute', left: (rect.x - frame.x) * scale, top: (rect.y - frame.y) * scale, width: w, height: h, zIndex: editing ? 10 : undefined }}
    >
      <Animated.View style={[{ width: '100%', height: '100%' }, editStyle]}>
        <Animated.View style={[{ width: '100%', height: '100%' }, dropStyle]}>
          {item.id === 'agac' ? (
            <Sway>
              <Art />
            </Sway>
          ) : item.id === 'helikopter' ? (
            <>
              <HelikopterSvg hideRotor />
              <RotorFx w={w} h={h} />
            </>
          ) : item.id === 'havuz' ? (
            <>
              <Art />
              <PoolFx w={w} h={h} />
            </>
          ) : item.id === 'ofisbitkisi' ? (
            <Sway deg={2.5} duration={2600}>
              <Art />
            </Sway>
          ) : (
            <Art />
          )}
        </Animated.View>
        {justBought ? (
          <>
            <Animated.View
              style={[{ position: 'absolute', bottom: h * 0.02, left: w * 0.15, width: w * 0.7, height: h * 0.16, borderRadius: 999, backgroundColor: '#CDBFA3' }, dustStyle]}
            />
            {CONFETTI.map((cfg, i) => (
              <ConfettiPiece key={i} cfg={cfg} originX={w / 2} originY={h * 0.35} />
            ))}
          </>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

// ---- Bilgi baloncuğu --------------------------------------------------------------

function InfoBubble({ item, rect, scale, width, frame }: { item: ShopItem; rect: Rect; scale: number; width: number; frame: Frame }) {
  const bw = 172;
  const rx = (rect.x - frame.x) * scale;
  const ry = (rect.y - frame.y) * scale;
  const cx = rx + (rect.w * scale) / 2;
  const left = Math.min(Math.max(cx - bw / 2, 6), width - bw - 6);
  const topAbove = ry - 84;
  const below = topAbove < 4;
  const top = below ? ry + rect.h * scale + 12 : topAbove;
  const arrowLeft = Math.min(Math.max(cx - left - 7, 12), bw - 26);

  return (
    <Animated.View key={item.id} entering={ZoomIn.duration(180)} pointerEvents="none" style={[styles.bubble, { left, top, width: bw }]}>
      <Text style={styles.bubbleTitle}>{item.name}</Text>
      <Text style={styles.bubbleDesc}>{item.desc}</Text>
      <Text style={styles.bubblePrice} numberOfLines={1} adjustsFontSizeToFit>
        Değeri: {formatTL(item.price)}
      </Text>
      <View style={[below ? styles.arrowUp : styles.arrowDown, { left: arrowLeft }]} />
    </Animated.View>
  );
}

// ---- Sahne ---------------------------------------------------------------------

interface Props {
  owned: string[];
  /** Yeni alınan eşya/olay id'leri: iniş / blok açılış animasyonu */
  justBought?: string[];
  width: number;
  /** Bir eşyaya dokununca çağrılır (null = boşluğa dokunuldu). Verilmezse sahne tıklanamaz. */
  onItemPress?: (id: string | null) => void;
  selected?: string | null;
  /** Basılı tutunca taşıma modu (yalnız Mahallem ekranında verilir) */
  onItemLongPress?: (id: string) => void;
  edit?: { id: string | null; dragX: SharedValue<number>; dragY: SharedValue<number> };
}

export function sceneHeightFor(owned: string[], width: number): number {
  const f = sceneFrame(owned);
  return (f.h / f.w) * width;
}

export default function CityScene({ owned, justBought = [], width, onItemPress, selected, onItemLongPress, edit }: Props) {
  const { layout } = useCityLayout();
  const frame = sceneFrame(owned);
  const scale = width / frame.w;
  const height = frame.h * scale;
  const blocks = openBlocks(owned);

  // Sahip olunan, yerleştirilebilir eşyalar; derinlik alt kenara göre
  const placed = ITEMS.filter((i) => isPlaceable(i.id) && owned.includes(i.id) && layout[i.id])
    .map((item) => ({ item, pos: layout[item.id], rect: artRect(item, layout[item.id]) }))
    .sort((a, b) => a.rect.y + a.rect.h - (b.rect.y + b.rect.h));
  const evPlaced = placed.find((p) => p.item.id === 'ev');
  const selectedPlaced = selected ? placed.find((p) => p.item.id === selected) : undefined;

  return (
    <Pressable disabled={!onItemPress} onPress={() => onItemPress?.(null)} style={[styles.root, { width, height }]}>
      {/* zemin kırpılır; eşyalar ve bilgi balonu serbest kalır */}
      <View style={[StyleSheet.absoluteFill, styles.clipped]}>
        {blocks.map((id) => {
          const b = getBlock(id);
          return b.unlockedBy ? (
            <BlockReveal key={id} block={b} celebrate={justBought.includes(b.unlockedBy)} scale={scale} frame={frame} />
          ) : (
            <Ground key={id} frame={frame}>
              <BlockGround block={b} />
            </Ground>
          );
        })}
        {edit?.id ? (
          <>
            <GridOverlay blocks={blocksFor(edit.id, owned)} frame={frame} />
            <DropHighlight id={edit.id} dragX={edit.dragX} dragY={edit.dragY} layout={layout} owned={owned} scale={scale} frame={frame} />
          </>
        ) : null}
      </View>
      {placed.map(({ item, pos, rect }) => (
        <PlacedItem
          key={item.id}
          item={item}
          pos={pos}
          rect={rect}
          scale={scale}
          frame={frame}
          blocks={blocks}
          justBought={justBought.includes(item.id)}
          onPress={onItemPress ? () => onItemPress(item.id) : undefined}
          onLongPress={onItemLongPress ? () => onItemLongPress(item.id) : undefined}
          editing={edit?.id === item.id}
          dragX={edit?.dragX}
          dragY={edit?.dragY}
        />
      ))}
      {evPlaced ? (
        <>
          <SmokePuff x={(evPlaced.rect.x + 76 - frame.x) * scale} y={(evPlaced.rect.y + 8 - frame.y) * scale} delay={0} />
          <SmokePuff x={(evPlaced.rect.x + 76 - frame.x) * scale} y={(evPlaced.rect.y + 8 - frame.y) * scale} delay={1300} />
        </>
      ) : null}
      {selectedPlaced ? <InfoBubble item={selectedPlaced.item} rect={selectedPlaced.rect} scale={scale} width={width} frame={frame} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {},
  clipped: { overflow: 'hidden' },
  bubble: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    shadowColor: '#26332C',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  bubbleTitle: { fontSize: 14, fontWeight: '900', color: '#26332C' },
  bubbleDesc: { fontSize: 11.5, color: '#66766D', marginTop: 1 },
  bubblePrice: { fontSize: 12.5, fontWeight: '800', color: '#3E8E68', marginTop: 3 },
  arrowDown: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  arrowUp: {
    position: 'absolute',
    top: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
});

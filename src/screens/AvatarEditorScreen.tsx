import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SvgXml } from 'react-native-svg';
import AvatarView from '../components/AvatarView';
import { CheckIcon, ShuffleIcon } from '../components/icons';
import ChunkyButton from '../ui/game/ChunkyButton';
import GameTopBar from '../ui/game/GameTopBar';
import { AvatarCategory, AvatarConfig, AvatarKey, avatarSvg, CATEGORIES, NONE, randomAvatar } from '../profile/avatar';
import { useProfile } from '../profile/ProfileContext';
import { useSettings } from '../settings/SettingsContext';
import { colors, panelStyle, radius, space, type } from '../ui/theme';

/*
 * Avatar düzenleme sayfası: üstte büyük karakter, altında kategori sekmeleri
 * ve seçili kategorinin seçenekleri.
 *
 * Akıcılık için:
 *  - Yalnız SEÇİLİ kategorinin ızgarası kurulur (her kare tam bir avatar SVG'si;
 *    hepsini birden kurmak takılma yapıyordu).
 *  - Kareler kategoriye girildiği anki avatarın "fotoğrafından" üretilir; aynı
 *    kategoride seçim yapınca yeniden üretilmez (yalnız işaret ve büyük avatar).
 *  - Kareler karede birkaç tane olmak üzere kademeli belirir: ilk kare hemen çizilir.
 */

const COLS = 3;
const DOT_COLS = 5;
const GAP = 12;
const SIDE = 16;
/** Kademeli kurulum: her karede kaç seçenek eklenir */
const BATCH = 6;

interface Props {
  onBack: () => void;
  /** Kaydet: taslak kalıcı olur, profile dönülür */
  onSaved: () => void;
}

type PickFn = (key: AvatarKey, v: string) => void;

/** Listeyi sabit sütunlu satırlara böler; son satır boş hücrelerle tamamlanır ki hizası kaymasın */
function toRows<T>(list: T[], cols: number): (T | null)[][] {
  const rows: (T | null)[][] = [];
  for (let i = 0; i < list.length; i += cols) {
    const row: (T | null)[] = list.slice(i, i + cols);
    while (row.length < cols) row.push(null);
    rows.push(row);
  }
  return rows;
}

/** Önizleme SVG metniyle karşılaştırılır: yalnızca görüntüsü ya da seçimi değişen kare yeniden çizilir */
const PartTile = memo(function PartTile({
  catKey,
  opt,
  xml,
  size,
  selected,
  onPick,
}: {
  catKey: AvatarKey;
  opt: string;
  xml: string;
  size: number;
  selected: boolean;
  onPick: PickFn;
}) {
  return (
    <Pressable onPress={() => onPick(catKey, opt)} style={[styles.tile, selected && styles.tileOn]}>
      <SvgXml xml={xml} width={size} height={size} />
      {opt === NONE ? (
        <View style={styles.noneTag} pointerEvents="none">
          <Text style={styles.noneText}>Yok</Text>
        </View>
      ) : null}
      {selected ? (
        <View style={styles.check} pointerEvents="none">
          <CheckIcon size={24} />
        </View>
      ) : null}
    </Pressable>
  );
});

const ColorDot = memo(function ColorDot({ catKey, hex, selected, onPick }: { catKey: AvatarKey; hex: string; selected: boolean; onPick: PickFn }) {
  return (
    <Pressable onPress={() => onPick(catKey, hex)} hitSlop={4} style={[styles.dotRing, selected && styles.dotRingOn]}>
      <View style={[styles.dot, { backgroundColor: `#${hex}` }]} />
    </Pressable>
  );
});

/** Bir kategorinin seçenekleri; kareler kademeli kurulur */
function OptionGrid({
  cat,
  draft,
  value,
  tileSize,
  onPick,
}: {
  cat: AvatarCategory;
  /** Önizlemelerin üretildiği avatar (kategoriye girildiği anki fotoğraf) */
  draft: AvatarConfig;
  /** Bu kategorideki güncel seçim (yalnız işaret için) */
  value: string;
  tileSize: number;
  onPick: PickFn;
}) {
  const [shown, setShown] = useState(BATCH);
  useEffect(() => {
    if (shown >= cat.options.length) return;
    const id = requestAnimationFrame(() => setShown((n) => n + BATCH));
    return () => cancelAnimationFrame(id);
  }, [shown, cat.options.length]);

  if (cat.kind === 'color') {
    return (
      <View style={styles.gridCol}>
        {toRows(cat.options, DOT_COLS).map((row, r) => (
          <View key={r} style={styles.gridRow}>
            {row.map((hex, i) => (
              <View key={hex ?? `e${i}`} style={styles.dotCell}>
                {hex ? <ColorDot catKey={cat.key} hex={hex} selected={value === hex} onPick={onPick} /> : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  const visible = cat.options.slice(0, shown);
  return (
    <View style={styles.gridCol}>
      {toRows(visible, COLS).map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map((opt, i) =>
            opt ? (
              <PartTile
                key={opt}
                catKey={cat.key}
                opt={opt}
                xml={avatarSvg({ ...draft, [cat.key]: opt }, cat.zoom)}
                size={tileSize}
                selected={value === opt}
                onPick={onPick}
              />
            ) : (
              <View key={`e${i}`} style={styles.tileEmpty} />
            )
          )}
        </View>
      ))}
    </View>
  );
}

/** Kategori sekmeleri: seçili sekme görünür alanın dışındaysa şerit ona kayar */
function CategoryTabs({ cats, index, onSelect }: { cats: AvatarCategory[]; index: number; onSelect: (i: number) => void }) {
  const ref = useRef<ScrollView>(null);
  const tabs = useRef<{ x: number; w: number }[]>([]);
  const barW = useRef(0);
  const scrollX = useRef(0);

  useEffect(() => {
    const t = tabs.current[index];
    if (!t || !barW.current) return;
    const PAD = 24;
    const left = scrollX.current;
    const right = left + barW.current;
    if (t.x - PAD < left) ref.current?.scrollTo({ x: Math.max(0, t.x - PAD), animated: true });
    else if (t.x + t.w + PAD > right) ref.current?.scrollTo({ x: t.x + t.w + PAD - barW.current, animated: true });
  }, [index]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabs}
      style={styles.tabsBar}
      scrollEventThrottle={32}
      onLayout={(e) => (barW.current = e.nativeEvent.layout.width)}
      onScroll={(e) => (scrollX.current = e.nativeEvent.contentOffset.x)}
    >
      {cats.map((c, i) => {
        const on = i === index;
        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(i)}
            onLayout={(e) => (tabs.current[i] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width })}
            style={[styles.tab, on && styles.tabOn]}
          >
            <Text style={styles.tabText}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const SHUFFLE_ICON = <ShuffleIcon size={28} />;

export default function AvatarEditorScreen({ onBack, onSaved }: Props) {
  const { width, height } = useWindowDimensions();
  const { draft, setDraftAvatar: setAvatar, save } = useProfile();
  const avatar = draft.avatar;
  const { hapticsOn } = useSettings();
  const [catKey, setCatKey] = useState(CATEGORIES[0].key);
  // Kategoriye girildiği anki avatar: o kategorinin kareleri bundan üretilir
  const [snapshot, setSnapshot] = useState(avatar);

  // Seçili parçaya bağlı kategoriler (şapka rengi, sakal rengi…) koşula göre görünür
  const cats = CATEGORIES.filter((c) => !c.when || c.when(avatar));
  const index = Math.max(0, cats.findIndex((c) => c.key === catKey));
  const cat = cats[index];

  const previewSize = Math.min(width * 0.46, height * 0.24, 210);
  const tileSize = Math.floor((width - SIDE * 2 - GAP * (COLS - 1)) / COLS) - 6;

  // Seçim fonksiyonu sabit kalsın (kareler memo'lu); güncel değerler ref'ten
  const avatarRef = useRef(avatar);
  avatarRef.current = avatar;
  const hapticsRef = useRef(hapticsOn);
  hapticsRef.current = hapticsOn;
  const pick = useCallback(
    (key: AvatarKey, v: string) => {
      const cur = avatarRef.current;
      if (cur[key] === v) return;
      if (hapticsRef.current) Haptics.selectionAsync();
      setAvatar({ ...cur, [key]: v });
    },
    [setAvatar]
  );

  const selectCat = (i: number) => {
    if (hapticsOn) Haptics.selectionAsync();
    setSnapshot(avatarRef.current);
    setCatKey(cats[i].key);
  };

  const shuffle = () => {
    if (hapticsOn) Haptics.selectionAsync();
    const next = randomAvatar();
    setAvatar(next);
    setSnapshot(next);
  };

  return (
    <View style={styles.root}>
      <GameTopBar
        title="Avatarı Düzenle"
        onBack={onBack}
        style={styles.bar}
        right={<ChunkyButton label="Karıştır" square skin="blue" onPress={shuffle} icon={SHUFFLE_ICON} />}
      />

      <View style={styles.previewRow}>
        <View style={[styles.preview, { width: previewSize + 10, height: previewSize + 10, borderRadius: (previewSize + 10) / 2 }]}>
          <View style={{ width: previewSize, height: previewSize, borderRadius: previewSize / 2, overflow: 'hidden' }}>
            <AvatarView config={avatar} size={previewSize} />
          </View>
        </View>
      </View>

      <CategoryTabs cats={cats} index={index} onSelect={selectCat} />

      <View style={styles.panel}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {cat ? <OptionGrid key={cat.key} cat={cat} draft={snapshot} value={avatar[cat.key]} tileSize={tileSize} onPick={pick} /> : null}
        </ScrollView>
      </View>

      <ChunkyButton
        label="KAYDET"
        skin="green"
        icon={<CheckIcon size={28} />}
        onPress={() => {
          save();
          if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSaved();
        }}
        style={styles.save}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.l },
  bar: { marginBottom: space.s },
  previewRow: { alignItems: 'center', marginBottom: space.m },
  preview: {
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBar: { flexGrow: 0, marginHorizontal: -space.l },
  tabs: { paddingHorizontal: space.l, gap: space.s, paddingBottom: space.m },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.outline,
    borderBottomWidth: 4.5,
  },
  tabOn: { backgroundColor: '#FFB21E' },
  tabText: { ...type.headline, fontSize: 15, color: colors.label },
  panel: { ...panelStyle, flex: 1, marginHorizontal: -space.xs, overflow: 'hidden' },
  save: { marginTop: space.m },
  body: { padding: SIDE - space.xs, paddingBottom: space.xxl },
  gridCol: { gap: GAP },
  gridRow: { flexDirection: 'row', gap: GAP },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.l,
    backgroundColor: colors.surfaceTop,
    borderWidth: 2.5,
    borderColor: colors.outline,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileOn: { borderColor: '#FFC531' },
  tileEmpty: { flex: 1 },
  noneTag: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.s,
    paddingHorizontal: space.s,
    paddingVertical: 1,
  },
  noneText: { ...type.caption, color: colors.secondaryLabel },
  check: { position: 'absolute', top: 4, right: 4 },
  dotCell: { flex: 1, alignItems: 'center' },
  dotRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRingOn: { borderColor: '#FFC531' },
  dot: { width: 42, height: 42, borderRadius: 21, borderWidth: 2.5, borderColor: colors.outline },
});

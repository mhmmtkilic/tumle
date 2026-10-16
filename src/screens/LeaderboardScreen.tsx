import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AvatarView from '../components/AvatarView';
import { ITEM_ART } from '../components/ItemArt';
import { CrownIcon } from '../components/icons';
import GameTopBar from '../ui/game/GameTopBar';
import { useEconomy } from '../economy/EconomyContext';
import { totalValue } from '../economy/progress';
import { formatWorth, Rival, rivalsAt } from '../leaderboard/rivals';
import { DEFAULT_AVATAR } from '../profile/avatar';
import { useProfile } from '../profile/ProfileContext';
import { colors, GAME_FONT, panelStyle, radius, space, textOutline, type } from '../ui/theme';

/*
 * Zenginler Listesi: ilk üç kürsüde (taç, altın/gümüş/bronz basamak), geri
 * kalanı (ilk 10'a kadar) lacivert kartlarda. Oyuncunun satırı sarı çerçeveli; altta sabit
 * panel sırasını ve bir üstteki rakibe kalan farkı gösterir.
 * Servet = birikim + mahalledeki eşyaların değeri.
 */

const PLAYER_ID = 'me';
/** Listede gösterilen kişi sayısı; oyuncu dışarıdaysa sırası alttaki panelde */
const TOP = 10;

interface Entry extends Rival {
  me?: boolean;
}

const MEDAL = [
  { face: '#FFD43B', side: '#D99A0B' },
  { face: '#E3E9F2', side: '#A4AFC0' },
  { face: '#F2A65A', side: '#B8692A' },
];

interface Props {
  onBack: () => void;
  /** Ekran görünür mü: görünürken rakip servetleri dakikada bir tazelenir */
  active: boolean;
}

export default function LeaderboardScreen({ onBack, active }: Props) {
  const { wallet, owned } = useEconomy();
  const { name, avatar } = useProfile();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [active]);

  const rivals = useMemo(() => rivalsAt(now), [now]);
  const worth = wallet + totalValue(owned);
  const me: Entry = useMemo(
    () => ({ id: PLAYER_ID, name: name || 'Sen', avatar: avatar ?? DEFAULT_AVATAR, worth, best: null, me: true }),
    [name, avatar, worth]
  );
  const list: Entry[] = useMemo(() => [...rivals, me].sort((a, b) => b.worth - a.worth), [rivals, me]);
  const myRank = list.findIndex((e) => e.me) + 1;
  const above = myRank > 1 ? list[myRank - 2] : null;

  // Ekran her açılışta listenin başından başlar
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (active) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [active]);

  return (
    <View style={styles.root}>
      <GameTopBar title="Zenginler" onBack={onBack} style={styles.bar} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Podium top={list.slice(0, 3)} />
        <View style={styles.list}>
          {list.slice(3, TOP).map((e, i) => (
            <Row key={e.id} entry={e} rank={i + 4} />
          ))}
        </View>
      </ScrollView>

      <MyBar rank={myRank} total={list.length} worth={worth} above={above} />
    </View>
  );
}

/** İlk üç: ortada birinci (büyük, taçlı), solda ikinci, sağda üçüncü */
function Podium({ top }: { top: Entry[] }) {
  const order = [1, 0, 2];
  const heights = [96, 128, 76];
  const sizes = [64, 84, 60];
  return (
    <View style={styles.podium}>
      {order.map((idx, col) => {
        const e = top[idx];
        if (!e) return <View key={col} style={styles.podiumCol} />;
        const m = MEDAL[idx];
        const size = sizes[col];
        return (
          <View key={e.id} style={styles.podiumCol}>
            {idx === 0 ? (
              <View style={styles.crown}>
                <CrownIcon size={40} />
              </View>
            ) : null}
            <View style={[styles.podiumAvatar, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, borderColor: e.me ? '#FFB21E' : colors.outline }]}>
              <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
                <AvatarView config={e.avatar} size={size} />
              </View>
            </View>
            <Text style={[styles.podiumName, e.me && styles.meText]} numberOfLines={1}>
              {e.me ? 'Sen' : e.name}
            </Text>
            <Text style={styles.podiumWorth} numberOfLines={1}>
              {formatWorth(e.worth)}
            </Text>
            <View style={[styles.step, { height: heights[col], backgroundColor: m.side }]}>
              <View style={[styles.stepFace, { backgroundColor: m.face }]} />
              <Text style={[styles.stepRank, { color: m.face }]}>{idx + 1}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const Row = memo(function Row({ entry, rank }: { entry: Entry; rank: number }) {
  const Art = entry.best ? ITEM_ART[entry.best.id] : null;
  return (
    <View style={[styles.row, entry.me && styles.rowMe]}>
      <View style={[styles.rankBadge, entry.me && styles.rankBadgeMe]}>
        <Text style={styles.rankText} numberOfLines={1} adjustsFontSizeToFit>
          {rank}
        </Text>
      </View>
      <View style={styles.rowAvatar}>
        <AvatarView config={entry.avatar} size={44} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.me ? `${entry.name.trim()} (Sen)` : entry.name}
        </Text>
        <Text style={styles.rowWorth} numberOfLines={1}>
          {formatWorth(entry.worth)}
        </Text>
      </View>
      {Art ? (
        <View style={styles.rowArt}>
          <Art />
        </View>
      ) : null}
    </View>
  );
});

/** Alttaki sabit panel: sıran ve bir üsttekine kalan fark */
function MyBar({ rank, total, worth, above }: { rank: number; total: number; worth: number; above: Entry | null }) {
  const gap = above ? above.worth - worth : 0;
  // Bir üst sıraya ne kadar yaklaşıldı (logaritmik: küçük servetlerde de ilerleme görünsün)
  const progress = above ? Math.min(1, Math.max(0.04, Math.log10(Math.max(worth, 1)) / Math.log10(Math.max(above.worth, 10)))) : 1;
  return (
    <View style={styles.myBar}>
      <View style={styles.myRank}>
        <Text style={styles.myRankLabel}>SIRAN</Text>
        <Text style={styles.myRankText}>#{rank}</Text>
      </View>
      <View style={styles.myInfo}>
        <Text style={styles.myLine} numberOfLines={1}>
          {above ? `${above.name} için ${formatWorth(gap)} daha` : `Zirvedesin! ${total} kişi arkanda`}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]}>
            <View style={styles.shine} />
          </View>
        </View>
        <Text style={styles.myWorth} numberOfLines={1}>
          Servetin: {formatWorth(worth)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.l },
  bar: { marginBottom: space.s },
  body: { paddingBottom: 130 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: space.s, marginTop: space.l, marginBottom: space.m },
  podiumCol: { flex: 1, alignItems: 'center' },
  crown: { marginBottom: -10, zIndex: 2 },
  podiumAvatar: { backgroundColor: colors.surface, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  podiumName: { ...type.headline, fontSize: 16, color: colors.label, marginTop: 4, maxWidth: '100%' },
  podiumWorth: { ...type.headline, fontSize: 15, color: colors.gold, marginTop: -4 },
  meText: { color: '#FFD43B' },
  step: {
    width: '100%',
    marginTop: space.s,
    borderTopLeftRadius: radius.m,
    borderTopRightRadius: radius.m,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  stepFace: { height: 18, borderBottomWidth: 2.5, borderBottomColor: 'rgba(27,34,56,0.3)' },
  stepRank: { fontFamily: GAME_FONT, fontSize: 44, lineHeight: 56, textAlign: 'center', marginTop: 2, ...textOutline, textShadowOffset: { width: 0, height: 3 } },
  list: { gap: space.s },
  row: { ...panelStyle, flexDirection: 'row', alignItems: 'center', paddingVertical: space.s, paddingHorizontal: space.s, gap: space.m },
  rowMe: { borderColor: '#FFB21E', backgroundColor: '#2E5390' },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceTop,
    borderWidth: 2.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeMe: { backgroundColor: '#FFB21E' },
  rankText: { fontFamily: GAME_FONT, fontSize: 16, color: colors.label, ...textOutline, textShadowOffset: { width: 0, height: 1.5 } },
  rowAvatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: colors.outline },
  rowInfo: { flex: 1 },
  rowName: { ...type.body, color: colors.label },
  rowWorth: { ...type.headline, fontSize: 17, color: colors.gold, marginTop: -2 },
  rowArt: { width: 44, height: 44 },
  myBar: {
    ...panelStyle,
    position: 'absolute',
    left: space.l,
    right: space.l,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    padding: space.m,
    borderColor: colors.outline,
    backgroundColor: '#2E5390',
  },
  myRank: {
    minWidth: 64,
    paddingHorizontal: space.s,
    paddingVertical: 2,
    borderRadius: radius.m,
    backgroundColor: '#FFB21E',
    borderWidth: 2.5,
    borderBottomWidth: 4.5,
    borderColor: colors.outline,
    alignItems: 'center',
  },
  myRankLabel: { ...type.overline, fontSize: 10, color: '#8A4E00' },
  myRankText: { fontFamily: GAME_FONT, fontSize: 24, lineHeight: 28, color: colors.label, ...textOutline },
  myInfo: { flex: 1, gap: 4 },
  myLine: { ...type.subhead, color: colors.label },
  track: { height: 14, borderRadius: 7, backgroundColor: colors.outline, padding: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: '#43B52A' },
  shine: { position: 'absolute', top: 1, left: 4, right: 4, height: '35%', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  myWorth: { ...type.caption, color: colors.secondaryLabel },
});

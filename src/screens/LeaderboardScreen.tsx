import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import AvatarView from '../components/AvatarView';
import { CrownIcon } from '../components/icons';
import GameTopBar from '../ui/game/GameTopBar';
import OutlineText from '../ui/game/OutlineText';
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
  /** Ekran görünür mü: görünürken rakip servetleri dakikada bir tazelenir */
  active: boolean;
}

export default function LeaderboardScreen({ active }: Props) {
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
  const scrollRef = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    if (active) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [active]);

  return (
    <View style={styles.root}>
      <GameTopBar title="Zenginler" style={styles.bar} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Podium top={list.slice(0, 3)} />
        <View style={styles.list}>
          {list.slice(3, TOP).map((e, i) => (
            <Row key={e.id} entry={e} rank={i + 4} />
          ))}
        </View>
      </ScrollView>

      <MyBar rank={myRank} worth={worth} above={above} />
    </View>
  );
}

/** İlk üç: ortada birinci (büyük, taçlı), solda ikinci, sağda üçüncü */
function Podium({ top }: { top: Entry[] }) {
  const order = [1, 0, 2];
  const heights = [58, 78, 44];
  const sizes = [60, 76, 56];
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
            <OutlineText size={15} strokeWidth={2.5} depth={1} color="#FFD43B">
              {formatWorth(e.worth)}
            </OutlineText>
            <View style={[styles.step, { height: heights[col], backgroundColor: m.side, backgroundImage: `linear-gradient(${m.side}, ${m.side} 30%, rgba(0,0,0,0.25))` }]}>
              <Text style={[styles.stepRank, { color: m.face }]}>{idx + 1}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Liste satırı: sıra, avatar, ad, sağda servet. Başka bir şey yok. */
const Row = memo(function Row({ entry, rank }: { entry: Entry; rank: number }) {
  return (
    <View style={[styles.row, entry.me && styles.rowMe]}>
      <OutlineText size={18} strokeWidth={2.5} depth={1} containerStyle={styles.rank}>
        {String(rank)}
      </OutlineText>
      <View style={styles.rowAvatar}>
        <AvatarView config={entry.avatar} size={40} />
      </View>
      <Text style={styles.rowName} numberOfLines={1}>
        {entry.me ? 'Sen' : entry.name}
      </Text>
      <OutlineText size={17} strokeWidth={2.5} depth={1} color="#FFD43B">
        {formatWorth(entry.worth)}
      </OutlineText>
    </View>
  );
});

/** Alttaki sabit satır: sıran, servetin ve bir üsttekine kalan fark (tek kısa satır) */
function MyBar({ rank, worth, above }: { rank: number; worth: number; above: Entry | null }) {
  return (
    <View style={styles.myBar}>
      <OutlineText size={20} strokeWidth={2.5} depth={1} color="#FFD43B" containerStyle={styles.myRank}>
        {`#${rank}`}
      </OutlineText>
      <View style={styles.myInfo}>
        <OutlineText size={17} strokeWidth={2.5} depth={1} style={styles.left}>
          Sen
        </OutlineText>
        <Text style={styles.myLine} numberOfLines={1}>
          {above ? `${above.name}: ${formatWorth(above.worth - worth)} kaldı` : 'Zirvedesin!'}
        </Text>
      </View>
      <OutlineText size={18} strokeWidth={2.5} depth={1} color="#FFD43B">
        {formatWorth(worth)}
      </OutlineText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.l },
  bar: { marginBottom: space.s },
  body: { paddingBottom: 96 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: space.s, marginTop: space.m, marginBottom: space.m },
  podiumCol: { flex: 1, alignItems: 'center' },
  crown: { marginBottom: -10, zIndex: 2 },
  podiumAvatar: { backgroundColor: colors.surface, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  podiumName: { ...type.headline, fontSize: 15, color: colors.label, marginTop: 4, maxWidth: '100%' },
  meText: { color: '#FFD43B' },
  step: {
    width: '100%',
    marginTop: space.xs,
    borderTopLeftRadius: radius.m,
    borderTopRightRadius: radius.m,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: colors.outline,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  stepRank: { fontFamily: GAME_FONT, fontSize: 28, lineHeight: 36, textAlign: 'center', ...textOutline, textShadowOffset: { width: 0, height: 2 } },
  list: { gap: space.s },
  row: { ...panelStyle, flexDirection: 'row', alignItems: 'center', height: 58, paddingHorizontal: space.m, gap: space.m },
  rowMe: { backgroundImage: 'linear-gradient(#3B70C4, #2A559C)' },
  rank: { width: 24 },
  left: { textAlign: 'left' },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: colors.outline },
  rowName: { ...type.body, flex: 1, color: colors.label },
  myBar: {
    ...panelStyle,
    position: 'absolute',
    left: space.l,
    right: space.l,
    bottom: space.s,
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
    paddingHorizontal: space.m,
    gap: space.m,
    borderColor: '#E9A11A',
    borderBottomColor: colors.outline,
    backgroundImage: 'linear-gradient(#3566B8, #22468A)',
    boxShadow: '0 0 0 2.5px #1B2238, inset 0 3px 0 rgba(255,255,255,0.18)',
  },
  myRank: { minWidth: 40 },
  myInfo: { flex: 1 },
  myLine: { ...type.caption, color: colors.secondaryLabel },
});

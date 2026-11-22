import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import BadgeSvg from '../components/BadgeSvg';
import { CheckIcon } from '../components/icons';
import ChunkyButton from '../ui/game/ChunkyButton';
import CoinIcon from '../ui/game/CoinIcon';
import GameTopBar from '../ui/game/GameTopBar';
import OutlineText from '../ui/game/OutlineText';
import { OUTLINE } from '../ui/game/skins';
import { ACHIEVEMENTS, AchievementDef, rewardOf } from '../achievements/defs';
import { useAchievements } from '../achievements/AchievementsContext';
import { useEconomy } from '../economy/EconomyContext';
import { earnMultiplier } from '../economy/items';
import { formatShort } from '../game/levels';
import { BODY_FONT, colors, panelStyle, space } from '../ui/theme';

const CHECK = <CheckIcon size={26} />;
const COIN = <CoinIcon size={20} />;

/**
 * Tek satırlık başarım: solda rozet, ortada ad + kısa açıklama (+ sayaçlıysa
 * ince ilerleme çubuğu), sağda durum: ödül hazırsa yeşil "Al" butonu, değilse
 * soluk ödül tutarı, alınmışsa tik.
 */
function BadgeRow({
  def,
  unlocked,
  claimed,
  progress,
  mult,
  onClaim,
}: {
  def: AchievementDef;
  unlocked: boolean;
  claimed: boolean;
  /** Sayaçlı rozette ilerleme (kilitliyken gösterilir) */
  progress: { cur: number; n: number } | null;
  /** Oyuncunun kazanç çarpanı: ödül bununla ölçeklenir */
  mult: number;
  onClaim: () => void;
}) {
  const reward = formatShort(rewardOf(def, mult));
  const ready = unlocked && !claimed;
  return (
    <View style={[styles.row, ready && styles.rowReady, claimed && styles.rowDone]}>
      <BadgeSvg id={def.id} tier={def.tier} locked={!unlocked} size={56} />
      <View style={styles.info}>
        <OutlineText size={16} strokeWidth={2.5} depth={1} color={unlocked ? undefined : '#C9D8F2'} style={styles.left}>
          {def.title}
        </OutlineText>
        <Text style={styles.desc} numberOfLines={2}>
          {def.desc}
        </Text>
        {progress && !unlocked ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(4, (progress.cur / progress.n) * 100)}%` }]} />
          </View>
        ) : null}
      </View>
      <View style={styles.side}>
        {ready ? (
          <ChunkyButton label={`Al ${reward}`} size="small" skin="green" onPress={onClaim} />
        ) : claimed ? (
          CHECK
        ) : (
          <View style={styles.reward}>
            {COIN}
            <Text style={styles.rewardText}>{reward}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const { unlocked, claimed, claimable, claim, progressOf } = useAchievements();
  const { owned } = useEconomy();
  const mult = earnMultiplier(owned);

  // Sıra: alınmayı bekleyen ödüller en üstte, sonra kilitliler, en altta alınmışlar
  const rank = (id: string) => (unlocked.includes(id) ? (claimed.includes(id) ? 2 : 0) : 1);
  const sorted = [...ACHIEVEMENTS].sort((a, b) => rank(a.id) - rank(b.id));

  const handleClaim = (id: string) => {
    if (claim(id)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.root}>
      <GameTopBar
        title="Başarımlar"
        style={styles.bar}
        right={
          <View style={[styles.countChip, claimable > 0 && styles.countReady]}>
            <OutlineText size={15} strokeWidth={2.5} depth={1}>
              {claimable > 0 ? `${claimable} ödül` : `${unlocked.length}/${ACHIEVEMENTS.length}`}
            </OutlineText>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sorted.map((a) => (
          <BadgeRow
            key={a.id}
            def={a}
            unlocked={unlocked.includes(a.id)}
            claimed={claimed.includes(a.id)}
            progress={progressOf(a.id)}
            mult={mult}
            onClaim={() => handleClaim(a.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.l },
  bar: { marginBottom: space.m },
  countChip: {
    height: 32,
    minWidth: 60,
    paddingHorizontal: space.s,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#0D1533',
    backgroundColor: '#1A2854',
    backgroundImage: 'linear-gradient(#22346A, #15224A)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countReady: { borderColor: OUTLINE, backgroundColor: '#43B52A', backgroundImage: 'linear-gradient(#9BEA62, #3FAE25)' },
  list: { gap: space.s, paddingBottom: space.xxl },
  row: { ...panelStyle, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.s, paddingLeft: space.s, paddingRight: space.m },
  /** Ödülü bekleyen satır biraz daha parlak: göz önce onu bulsun */
  rowReady: { backgroundImage: 'linear-gradient(#3B70C4, #2A559C)' },
  rowDone: { opacity: 0.7 },
  info: { flex: 1, gap: 1 },
  left: { textAlign: 'left' },
  desc: { fontFamily: BODY_FONT, fontSize: 12.5, color: colors.secondaryLabel },
  track: { height: 8, marginTop: 4, borderRadius: 4, backgroundColor: '#0E1A3D', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#43B52A', backgroundImage: 'linear-gradient(#A6F06A, #47B82B)' },
  side: { minWidth: 70, alignItems: 'flex-end' },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.75 },
  rewardText: { fontFamily: BODY_FONT, fontSize: 13, color: '#FFD43B' },
});

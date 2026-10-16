import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BadgeSvg from '../components/BadgeSvg';
import { CheckIcon } from '../components/icons';
import ChunkyButton from '../ui/game/ChunkyButton';
import GameTopBar from '../ui/game/GameTopBar';
import { ACHIEVEMENTS, AchievementDef, rewardOf } from '../achievements/defs';
import { formatTL } from '../game/levels';
import * as Haptics from 'expo-haptics';
import { useAchievements } from '../achievements/AchievementsContext';
import { colors, numeric, panelStyle, radius, space, type } from '../ui/theme';

interface Props {
  onBack: () => void;
}

function BadgeCard({
  def,
  unlocked,
  claimed,
  progress,
  onClaim,
}: {
  def: AchievementDef;
  unlocked: boolean;
  claimed: boolean;
  /** Sayaçlı rozette ilerleme (kilitliyken gösterilir) */
  progress: { cur: number; n: number } | null;
  onClaim: () => void;
}) {
  const reward = formatTL(rewardOf(def));
  return (
    <View style={[styles.card, !unlocked && styles.cardLocked]}>
      <BadgeSvg id={def.id} tier={def.tier} locked={!unlocked} size={84} />
      <Text style={[styles.name, !unlocked && styles.nameLocked]}>{def.title}</Text>
      <Text style={styles.desc}>{def.desc}</Text>
      {progress && !unlocked ? (
        <View style={styles.progress}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(4, (progress.cur / progress.n) * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {def.goal?.stat === 'earned' ? `${formatTL(Math.floor(progress.cur))} / ${formatTL(progress.n)}` : `${progress.cur} / ${progress.n}`}
          </Text>
        </View>
      ) : null}
      <View style={styles.rewardRow}>
        <Text style={[styles.reward, !unlocked && styles.rewardLocked, claimed && styles.rewardClaimed]} numberOfLines={1} adjustsFontSizeToFit>
          {reward}
        </Text>
        {claimed ? (
          <Text style={styles.claimedText}>Alındı</Text>
        ) : unlocked ? (
          <ChunkyButton label="Ödülü Al" size="small" skin="green" icon={<CheckIcon size={20} />} onPress={onClaim} />
        ) : null}
      </View>
    </View>
  );
}

export default function AchievementsScreen({ onBack }: Props) {
  const { unlocked, claimed, claimable, claim, progressOf } = useAchievements();

  const handleClaim = (id: string) => {
    if (claim(id)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.root}>
      <GameTopBar
        title="Başarımlar"
        onBack={onBack}
        style={styles.bar}
        right={
          <View style={[styles.countChip, claimable > 0 && styles.countReady]}>
            <Text style={styles.count} numberOfLines={1} adjustsFontSizeToFit>
              {claimable > 0 ? `${claimable} ödül` : `${unlocked.length}/${ACHIEVEMENTS.length}`}
            </Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a) => (
            <BadgeCard
              key={a.id}
              def={a}
              unlocked={unlocked.includes(a.id)}
              claimed={claimed.includes(a.id)}
              progress={progressOf(a.id)}
              onClaim={() => handleClaim(a.id)}
            />
          ))}
        </View>

        <Text style={styles.hint}>Gri rozetler seni bekliyor. Her rozetin ödülü cüzdana.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.l },
  bar: { marginBottom: space.m },
  countChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    borderColor: colors.outline,
    borderBottomWidth: 4.5,
    paddingHorizontal: space.s,
    paddingVertical: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  countReady: { backgroundColor: '#43B52A' },
  count: { ...type.headline, fontSize: 15, ...numeric, color: colors.label },
  list: { paddingBottom: space.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.m },
  card: {
    ...panelStyle,
    width: '47%',
    flexGrow: 1,
    paddingVertical: space.l,
    paddingHorizontal: space.m,
    alignItems: 'center',
  },
  cardLocked: { backgroundColor: '#2A3F63' },
  name: { ...type.headline, color: colors.label, marginTop: space.s, textAlign: 'center' },
  nameLocked: { color: colors.secondaryLabel },
  desc: { ...type.caption, color: colors.secondaryLabel, textAlign: 'center', marginTop: 2, lineHeight: 16 },
  progress: { alignSelf: 'stretch', marginTop: space.s, gap: 2, alignItems: 'center' },
  track: { alignSelf: 'stretch', height: 12, borderRadius: 6, backgroundColor: colors.outline, padding: 2 },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#43B52A' },
  progressText: { ...type.caption, ...numeric, color: colors.label },
  rewardRow: { marginTop: space.m, alignItems: 'center', gap: space.s, alignSelf: 'stretch' },
  reward: { ...type.title3, ...numeric, color: colors.gold },
  rewardLocked: { color: colors.tertiaryLabel },
  rewardClaimed: { color: colors.secondaryLabel },
  claimedText: { ...type.footnote, color: colors.accent },
  hint: { ...type.subhead, textAlign: 'center', color: colors.label, marginTop: space.xl, ...{ textShadowColor: colors.outline, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0.1 } },
});

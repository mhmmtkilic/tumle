import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BgPattern from '../components/BgPattern';
import BadgeSvg from '../components/BadgeSvg';
import GameButton from '../components/GameButton';
import { ACHIEVEMENTS, AchievementDef, rewardOf } from '../achievements/defs';
import { formatTL } from '../game/levels';
import * as Haptics from 'expo-haptics';
import { useAchievements } from '../achievements/AchievementsContext';

interface Props {
  onBack: () => void;
}

function BadgeCard({ def, unlocked, claimed, onClaim }: { def: AchievementDef; unlocked: boolean; claimed: boolean; onClaim: () => void }) {
  const reward = formatTL(rewardOf(def));
  return (
    <View style={[styles.card, !unlocked && styles.cardLocked, unlocked && !claimed && styles.cardReady]}>
      <BadgeSvg id={def.id} tier={def.tier} locked={!unlocked} size={84} />
      <Text style={[styles.name, !unlocked && styles.nameLocked]}>{def.title}</Text>
      <Text style={styles.desc}>{def.desc}</Text>
      <View style={styles.rewardRow}>
        <Text style={[styles.reward, !unlocked && styles.rewardLocked, claimed && styles.rewardClaimed]} numberOfLines={1} adjustsFontSizeToFit>
          {reward}
        </Text>
        {claimed ? (
          <Text style={styles.claimedText}>Alındı ✓</Text>
        ) : unlocked ? (
          <GameButton label="Ödülü Al" size="sm" variant="amber" onPress={onClaim} textStyle={styles.claimLabel} />
        ) : null}
      </View>
    </View>
  );
}

export default function AchievementsScreen({ onBack }: Props) {
  const { unlocked, claimed, claimable, claim } = useAchievements();

  const handleClaim = (id: string) => {
    if (claim(id)) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.root}>
      <BgPattern />
      <View style={styles.header}>
        <GameButton label="‹" size="sm" variant="white" onPress={onBack} textStyle={styles.backIcon} />
        <View style={styles.titleWrap} pointerEvents="none">
          <Text style={styles.title}>Başarımlar</Text>
        </View>
        <View style={[styles.countChip, claimable > 0 && styles.countChipReady]}>
          <Text style={[styles.countText, claimable > 0 && styles.countTextReady]}>
            {claimable > 0 ? `${claimable} ödül` : `${unlocked.length}/${ACHIEVEMENTS.length}`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a) => (
            <BadgeCard key={a.id} def={a} unlocked={unlocked.includes(a.id)} claimed={claimed.includes(a.id)} onClaim={() => handleClaim(a.id)} />
          ))}
        </View>

        <Text style={styles.hint}>Gri rozetler seni bekliyor. Her rozetin ödülü cüzdana. 🏅</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  backIcon: { fontSize: 22, lineHeight: 24 },
  titleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#26332C' },
  countChip: {
    backgroundColor: '#E3EAE4',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  countText: { fontSize: 15, fontWeight: '800', color: '#3E8E68', fontVariant: ['tabular-nums'] },
  list: { paddingTop: 8, paddingBottom: 28 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DFE8E2',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  cardLocked: {
    backgroundColor: '#F6F8F6',
  },
  cardReady: { borderColor: '#F6B93B' },
  rewardRow: { marginTop: 8, alignItems: 'center', gap: 6, alignSelf: 'stretch' },
  reward: { color: '#C48815', fontWeight: '900', fontSize: 15, fontVariant: ['tabular-nums'] },
  rewardLocked: { color: '#9AA8A0', fontWeight: '700' },
  rewardClaimed: { color: '#3E8E68' },
  claimLabel: { fontSize: 13 },
  claimedText: { color: '#3E8E68', fontWeight: '800', fontSize: 12 },
  countChipReady: { backgroundColor: '#F6B93B' },
  countTextReady: { color: '#5C430D' },
  name: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#26332C',
    marginTop: 6,
    textAlign: 'center',
  },
  nameLocked: { color: '#9AA8A0' },
  desc: {
    fontSize: 11.5,
    color: '#66766D',
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 15,
  },
  hint: { textAlign: 'center', color: '#9AA8A0', fontSize: 13, marginTop: 18 },
});

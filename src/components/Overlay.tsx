import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import ChunkyButton from '../ui/game/ChunkyButton';
import { formatTL } from '../game/levels';
import { colors, numeric, panelStyle, space, type } from '../ui/theme';

interface Props {
  mode: 'over' | 'won' | 'final';
  earned: number;
  onRestart: () => void;
  onContinue?: () => void;
}

const CONTENT = {
  over: {
    emoji: '💸',
    title: 'Cüzdan Tıkandı',
    msg: 'Hamle kalmadı, ekonomi kilitlendi. Enflasyona yenildin ama skorun cebinde.',
  },
  won: {
    emoji: '🏆',
    title: 'Külçeye Ulaştın',
    msg: 'Kuruştan başladın, külçeyi kaptın. Merkez bankası seni arayabilir. Ama zincir burada bitmiyor…',
  },
  final: {
    emoji: '🌍',
    title: 'Dünya Serveti Sende',
    msg: 'Bir kuruştan dünyanın servetine. Ekonomi kitapları artık seni yazacak.',
  },
} as const;

export default function Overlay({ mode, earned, onRestart, onContinue }: Props) {
  const c = CONTENT[mode];
  const canContinue = mode !== 'over' && !!onContinue;
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.emoji}>{c.emoji}</Text>
        <Text style={styles.title}>{c.title}</Text>
        <Text style={styles.msg}>{c.msg}</Text>
        <Text style={styles.scoreLabel}>Kazanç</Text>
        <Text style={styles.score} numberOfLines={1} adjustsFontSizeToFit>
          {formatTL(earned)}
        </Text>
        <View style={styles.buttons}>
          {canContinue ? <ChunkyButton label="Devam Et" size="large" skin="green" onPress={onContinue} /> : null}
          <ChunkyButton label="Yeniden Başla" size={canContinue ? 'medium' : 'large'} skin={canContinue ? 'blue' : 'yellow'} onPress={onRestart} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  card: { ...panelStyle, padding: space.xl, paddingTop: space.xxl, alignItems: 'center', width: '88%', maxWidth: 360 },
  emoji: { fontSize: 52, marginBottom: space.s },
  title: { ...type.title1, color: colors.label, textAlign: 'center' },
  msg: { ...type.subhead, color: colors.secondaryLabel, textAlign: 'center', marginTop: space.s, lineHeight: 20 },
  scoreLabel: { ...type.overline, color: colors.secondaryLabel, marginTop: space.l },
  score: { ...type.largeTitle, ...numeric, color: colors.gold },
  buttons: { alignSelf: 'stretch', gap: space.m, marginTop: space.xl },
});

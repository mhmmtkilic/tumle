import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import GameButton from './GameButton';
import { formatTL } from '../game/levels';

interface Props {
  mode: 'over' | 'won' | 'final';
  earned: number;
  onRestart: () => void;
  onContinue?: () => void;
}

const CONTENT = {
  over: {
    emoji: '💸',
    title: 'Cüzdan Tıkandı!',
    msg: 'Hamle kalmadı, ekonomi kilitlendi. Enflasyona yenildin ama skorun cebinde.',
  },
  won: {
    emoji: '🏆',
    title: 'Külçeye Ulaştın!',
    msg: 'Kuruştan başladın, külçeyi kaptın. Merkez bankası seni arayabilir. Ama zincir burada bitmiyor…',
  },
  final: {
    emoji: '🌍',
    title: 'Dünya Serveti Sende!',
    msg: 'Bir kuruştan dünyanın servetine. Ekonomi kitapları artık seni yazacak.',
  },
} as const;

export default function Overlay({ mode, earned, onRestart, onContinue }: Props) {
  const isOver = mode === 'over';
  const c = CONTENT[mode];
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.emoji}>{c.emoji}</Text>
        <Text style={styles.title}>{c.title}</Text>
        <Text style={styles.msg}>{c.msg}</Text>
        <Text style={styles.score} numberOfLines={1} adjustsFontSizeToFit>Kazanç: {formatTL(earned)}</Text>
        <View style={styles.buttons}>
          {!isOver && onContinue ? (
            <GameButton label="Devam Et" size="md" variant="white" onPress={onContinue} />
          ) : null}
          <GameButton label="Yeniden Başla" size="md" variant="green" onPress={onRestart} />
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
    backgroundColor: 'rgba(242,246,243,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '84%',
    maxWidth: 360,
    shadowColor: '#26332C',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  emoji: { fontSize: 44, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#26332C',
    marginBottom: 8,
    textAlign: 'center',
  },
  msg: {
    fontSize: 14,
    color: '#66766D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  score: {
    fontSize: 17,
    fontWeight: '800',
    color: '#3E8E68',
    marginBottom: 18,
  },
  buttons: { flexDirection: 'row', gap: 10 },
});

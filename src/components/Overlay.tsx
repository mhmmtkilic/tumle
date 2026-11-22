import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import ChunkyButton from '../ui/game/ChunkyButton';
import CoinIcon from '../ui/game/CoinIcon';
import GameDialog from '../ui/game/GameDialog';
import OutlineText from '../ui/game/OutlineText';
import { CrownIcon, HammerIcon, TrophyIcon, UndoIcon } from './icons';
import { formatMoney } from '../game/levels';
import { colors, space, type } from '../ui/theme';

interface Props {
  mode: 'over' | 'won' | 'final';
  earned: number;
  onRestart: () => void;
  onContinue?: () => void;
  /** Tıkanınca kurtarma: kalan araç hakları (0 ise buton gösterilmez) */
  undoLeft?: number;
  hammerLeft?: number;
  onUndo?: () => void;
  onHammer?: () => void;
}

const CONTENT = {
  over: {
    art: <CoinIcon size={76} />,
    tone: 'red',
    title: 'Cüzdan Tıkandı',
    msg: 'Hamle kalmadı, ekonomi kilitlendi. Enflasyona yenildin ama skorun cebinde.',
  },
  won: {
    art: <TrophyIcon size={76} />,
    tone: 'green',
    title: 'Külçeye Ulaştın',
    msg: 'Kuruştan başladın, külçeyi kaptın. Merkez bankası seni arayabilir. Ama zincir burada bitmiyor…',
  },
  final: {
    art: <CrownIcon size={80} />,
    tone: 'green',
    title: 'Dünya Serveti Sende',
    msg: 'Bir kuruştan dünyanın servetine. Ekonomi kitapları artık seni yazacak.',
  },
} as const satisfies Record<string, { art: React.ReactNode; tone: 'red' | 'green'; title: string; msg: string }>;

export default function Overlay({ mode, earned, onRestart, onContinue, undoLeft = 0, hammerLeft = 0, onUndo, onHammer }: Props) {
  const c = CONTENT[mode];
  const canContinue = mode !== 'over' && !!onContinue;
  const rescue = mode === 'over' && ((undoLeft > 0 && !!onUndo) || (hammerLeft > 0 && !!onHammer));
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop}>
      <GameDialog title={c.title} tone={c.tone} style={styles.card}>
        <View style={styles.art}>{c.art}</View>
        <Text style={styles.msg}>{c.msg}</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>BU OYUNDA KAZANDIN</Text>
          <OutlineText size={34} color="#FFD43B" strokeWidth={3}>
            {formatMoney(earned)}
          </OutlineText>
        </View>
        <View style={styles.buttons}>
          {rescue ? (
            <View style={styles.rescue}>
              {undoLeft > 0 && onUndo ? (
                <ChunkyButton label={`Geri Al ×${undoLeft}`} skin="green" icon={<UndoIcon size={24} />} onPress={onUndo} style={styles.flex1} />
              ) : null}
              {hammerLeft > 0 && onHammer ? (
                <ChunkyButton label={`Çekiç ×${hammerLeft}`} skin="blue" icon={<HammerIcon size={24} />} onPress={onHammer} style={styles.flex1} />
              ) : null}
            </View>
          ) : null}
          {canContinue ? <ChunkyButton label="Devam Et" size="large" skin="green" onPress={onContinue} /> : null}
          <ChunkyButton label="Yeniden Başla" size={canContinue || rescue ? 'medium' : 'large'} skin={canContinue ? 'blue' : 'yellow'} onPress={onRestart} />
        </View>
      </GameDialog>
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
  card: { width: '90%' },
  art: { marginTop: -4, marginBottom: space.s },
  msg: { ...type.subhead, color: colors.secondaryLabel, textAlign: 'center', lineHeight: 20 },
  scoreBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: space.l,
    paddingVertical: space.s,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0B1230',
    backgroundColor: '#13265A',
  },
  scoreLabel: { ...type.overline, color: colors.secondaryLabel },
  buttons: { alignSelf: 'stretch', gap: space.m, marginTop: space.xl },
  rescue: { flexDirection: 'row', gap: space.s },
  flex1: { flex: 1 },
});

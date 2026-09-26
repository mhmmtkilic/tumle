import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import BgPattern from '../components/BgPattern';
import BoardView from '../components/BoardView';
import Hud from '../components/Hud';
import Overlay from '../components/Overlay';
import { aliveTiles, Direction, GRID } from '../game/engine';
import { formatTL } from '../game/levels';
import { COMBO_START, comboMultiplier, useGame } from '../useGame';
import { useAchievements } from '../achievements/AchievementsContext';
import { useEconomy } from '../economy/EconomyContext';

const SWIPE_THRESHOLD = 24;

interface Props {
  onBack: () => void;
}

/** Seri büyüdükçe kademe: renk ısınır, yazı büyür, coşku artar */
function comboTier(mult: number) {
  if (mult >= 10) return { color: '#B14BD9', shadow: 'rgba(106,32,140,0.6)', size: 60, word: 'EFSANE! 👑' };
  if (mult >= 8) return { color: '#E2453A', shadow: 'rgba(140,30,22,0.6)', size: 56, word: 'Çılgınca! 🔥' };
  if (mult >= 6) return { color: '#F0762E', shadow: 'rgba(150,62,14,0.6)', size: 52, word: 'Süper!' };
  if (mult >= 4) return { color: '#F09A3E', shadow: 'rgba(160,90,15,0.55)', size: 48, word: '' };
  return { color: '#F6B93B', shadow: 'rgba(180,114,10,0.55)', size: 44, word: '' };
}

/** Oyunlardaki gibi ekran ortasında arka plansız patlayan COMBO yazısı */
function ComboBurst({ combo, gain }: { combo: number; gain: number }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const mult = comboMultiplier(combo);
  const tier = comboTier(mult);
  // Her patlama hafif farklı açıyla gelir
  const tilt = combo % 2 === 0 ? -5 : 5;

  useEffect(() => {
    scale.value = 0.4;
    opacity.value = 0;
    scale.value = withSequence(
      withTiming(1.35, { duration: 160, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(520, withTiming(0, { duration: 280, easing: Easing.out(Easing.quad) }))
    );
  }, [combo]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${tilt}deg` }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.comboWrap, style]}>
      <Text style={[styles.comboText, { color: tier.color, fontSize: tier.size, textShadowColor: tier.shadow }]}>
        COMBO x{mult}
      </Text>
      {tier.word ? (
        <Text style={[styles.comboWord, { color: tier.color, textShadowColor: tier.shadow }]}>{tier.word}</Text>
      ) : null}
      {gain > 0 ? (
        <Text style={[styles.comboGain, { color: tier.color, textShadowColor: tier.shadow }]}>
          +{formatTL(gain)}
        </Text>
      ) : null}
    </Animated.View>
  );
}

export default function GameScreen({ onBack }: Props) {
  const { width } = useWindowDimensions();
  const { wallet, addEarnings } = useEconomy();
  const game = useGame(addEarnings);
  const { reportBoard, reportCombo, reportGameEarned } = useAchievements();

  // Başarım tetikleri: tahtadaki taşlar, combo çarpanı/serisi, oyun kazancı
  useEffect(() => {
    const levels = aliveTiles(game.tiles).map((t) => t.level);
    if (levels.length > 0) reportBoard(levels);
  }, [game.tiles, reportBoard]);
  useEffect(() => {
    reportCombo(comboMultiplier(game.combo), game.combo);
  }, [game.combo, reportCombo]);
  useEffect(() => {
    reportGameEarned(game.earned);
  }, [game.earned, reportGameEarned]);

  const boardSize = Math.min(width - 32, 420);

  // onSwipe her hamlede değişir; gesture'ın her render'da yeniden
  // kurulup bağlanmaması için ref üzerinden sabit bir köprü kullanılır
  const onSwipeRef = useRef(game.onSwipe);
  onSwipeRef.current = game.onSwipe;
  const handleSwipe = useCallback((dir: Direction) => onSwipeRef.current(dir), []);

  // Swipe ekranın tamamında çalışır (grid dışı dahil)
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(10)
        .onEnd((e) => {
          const { translationX: dx, translationY: dy } = e;
          if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
          const dir: Direction =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          runOnJS(handleSwipe)(dir);
        }),
    [handleSwipe]
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root}>
        <BgPattern />
        <View style={{ width: boardSize }}>
          <Hud earned={game.earned} total={wallet} onRestart={game.restart} onBack={onBack} />
          <BoardView tiles={game.tiles} size={boardSize} gridSize={GRID} />
        </View>
        {game.combo >= COMBO_START ? (
          // key YOK: bileşen combo değişince useEffect ile yeniden patlar;
          // her hamlede tam ekran katmanı söküp kurmak takılma yaratıyordu
          <ComboBurst combo={game.combo} gain={game.comboGain} />
        ) : null}
        {game.over ? (
          <Overlay mode="over" earned={game.earned} onRestart={game.restart} />
        ) : game.final && !game.finalContinued ? (
          <Overlay mode="final" earned={game.earned} onRestart={game.restart} onContinue={game.keepPlayingFinal} />
        ) : game.won && !game.continued ? (
          <Overlay mode="won" earned={game.earned} onRestart={game.restart} onContinue={game.keepPlaying} />
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  comboText: {
    fontWeight: '900',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  comboWord: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  comboGain: {
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

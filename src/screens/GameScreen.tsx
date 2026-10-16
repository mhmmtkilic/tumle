import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import BoardView from '../components/BoardView';
import ComboBurst from '../components/ComboBurst';
import Hud from '../components/Hud';
import Overlay from '../components/Overlay';
import { aliveTiles, Direction, GRID } from '../game/engine';
import { COMBO_START, comboMultiplier, useGame } from '../useGame';
import { useAchievements } from '../achievements/AchievementsContext';
import { useEconomy } from '../economy/EconomyContext';

const SWIPE_THRESHOLD = 24;

interface Props {
  onBack: () => void;
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

  // Combo damgası çarpınca tahta kısaca sarsılır
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }, { translateY: shake.value * -0.5 }] }));

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
        <View style={{ width: boardSize }}>
          <Hud earned={game.earned} total={wallet} onRestart={game.restart} onBack={onBack} />
          <Animated.View style={shakeStyle}>
            <BoardView tiles={game.tiles} size={boardSize} gridSize={GRID} />
          </Animated.View>
        </View>
        {game.combo >= COMBO_START ? (
          // key YOK: bileşen combo değişince useEffect ile yeniden patlar;
          // her hamlede tam ekran katmanı söküp kurmak takılma yaratıyordu
          <ComboBurst combo={game.combo} gain={game.comboGain} shake={shake} />
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
});

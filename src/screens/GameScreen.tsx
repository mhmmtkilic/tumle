import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import BoardView from '../components/BoardView';
import ComboBurst from '../components/ComboBurst';
import ConfirmModal from '../components/ConfirmModal';
import Hud from '../components/Hud';
import Overlay from '../components/Overlay';
import ToolBar from '../components/ToolBar';
import { aliveTiles, Direction, GRID } from '../game/engine';
import { formatMoney } from '../game/levels';
import { COMBO_START, comboMultiplier, useGame } from '../useGame';
import { useAchievements } from '../achievements/AchievementsContext';
import { useEconomy } from '../economy/EconomyContext';
import { earnMultiplier, toolCharges } from '../economy/items';

const SWIPE_THRESHOLD = 24;

interface Props {
  onBack: () => void;
}

export default function GameScreen({ onBack }: Props) {
  const { width } = useWindowDimensions();
  const { owned, addEarnings, getWallet, subscribeWallet } = useEconomy();
  // Oyun sürerken bağlamdaki `wallet` dondurulur (diğer ekranlar yeniden çizilmesin);
  // bu ekran anlık değeri doğrudan abonelikle okur
  const wallet = useSyncExternalStore(subscribeWallet, getWallet);
  const { reportBoard, reportCombo, reportGameEarned, reportMerge } = useAchievements();
  // Mahalle oyuna geri verir: eşyaların kazanç çarpanı ve araç hakları
  const mods = useMemo(() => ({ mult: earnMultiplier(owned), charges: toolCharges(owned) }), [owned]);
  const game = useGame(addEarnings, GRID, reportMerge, mods);

  // Çekiç modu: tahtadaki taşlar dokunulabilir olur, kaydırma durur
  const [hammering, setHammering] = useState(false);
  const hammeringRef = useRef(false);
  hammeringRef.current = hammering;
  const startHammer = useCallback(() => setHammering(true), []);
  const cancelHammer = useCallback(() => setHammering(false), []);
  const smashRef = useRef(game.smash);
  smashRef.current = game.smash;
  const onPickTile = useCallback((id: number) => {
    smashRef.current(id);
    setHammering(false);
  }, []);

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

  // Tahta altın çerçeveyle her yandan ~10 px taşar; ekran kenarına yapışmasın
  const boardSize = Math.min(width - 48, 410);

  // Yeniden başla: süren bir oyunda yanlışlıkla dokunuş tahtayı silmesin diye onay
  // istenir. Henüz kazanç yoksa ya da oyun bittiyse kaybedilecek bir şey yoktur.
  const [askRestart, setAskRestart] = useState(false);
  const needsConfirm = game.earned > 0 && !game.over;
  const needsConfirmRef = useRef(needsConfirm);
  needsConfirmRef.current = needsConfirm;
  const restartRef = useRef(game.restart);
  restartRef.current = game.restart;
  const onRestartPress = useCallback(() => {
    if (needsConfirmRef.current) setAskRestart(true);
    else restartRef.current();
  }, []);
  const confirmRestart = useCallback(() => {
    setAskRestart(false);
    restartRef.current();
  }, []);
  const cancelRestart = useCallback(() => setAskRestart(false), []);

  // Combo damgası çarpınca tahta kısaca sarsılır
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }, { translateY: shake.value * -0.5 }] }));

  // onSwipe her hamlede değişir; gesture'ın her render'da yeniden
  // kurulup bağlanmaması için ref üzerinden sabit bir köprü kullanılır
  const onSwipeRef = useRef(game.onSwipe);
  onSwipeRef.current = game.onSwipe;
  const handleSwipe = useCallback((dir: Direction) => {
    if (!hammeringRef.current) onSwipeRef.current(dir);
  }, []);

  // Swipe ekranın tamamında çalışır (grid dışı dahil). Hamle parmak KALKINCA değil,
  // eşik aşıldığı an tetiklenir (her dokunuşta bir kez): taşlar parmakla birlikte
  // kayar, bırakmayı beklemek her hamleye hissedilir bir gecikme ekliyordu
  const fired = useSharedValue(false);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(10)
        .onBegin(() => {
          fired.value = false;
        })
        .onUpdate((e) => {
          if (fired.value) return;
          const { translationX: dx, translationY: dy } = e;
          if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
          fired.value = true;
          const dir: Direction =
            Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          runOnJS(handleSwipe)(dir);
        }),
    [handleSwipe, fired]
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root}>
        <View style={{ width: boardSize }}>
          <Hud earned={game.earned} total={wallet} onRestart={onRestartPress} onBack={onBack} />
          <Animated.View style={shakeStyle}>
            <BoardView tiles={game.tiles} size={boardSize} gridSize={GRID} onPickTile={hammering ? onPickTile : undefined} />
          </Animated.View>
          <ToolBar
            mult={mods.mult}
            charges={mods.charges}
            undoLeft={game.undoLeft}
            hammerLeft={game.hammerLeft}
            canUndo={game.canUndo}
            canHammer={aliveTiles(game.tiles).length > 1}
            hammering={hammering}
            onUndo={game.undo}
            onHammer={startHammer}
            onCancelHammer={cancelHammer}
          />
        </View>
        {/* Hep kurulu durur (boştayken saydam): serinin başladığı hamlede 12 para +
            görselleri sıfırdan kurmak o karede takılma yaratıyordu. comboGain yalnız
            combolu hamlede dolar: Geri Al / Çekiç sonrası patlama tekrar oynamaz */}
        <ComboBurst combo={game.combo >= COMBO_START && game.comboGain > 0 ? game.combo : 0} gain={game.comboGain} shake={shake} />
        {hammering ? null : game.over ? (
          <Overlay
            mode="over"
            earned={game.earned}
            onRestart={game.restart}
            undoLeft={game.canUndo ? game.undoLeft : 0}
            hammerLeft={game.hammerLeft}
            onUndo={game.undo}
            onHammer={startHammer}
          />
        ) : game.final && !game.finalContinued ? (
          <Overlay mode="final" earned={game.earned} onRestart={game.restart} onContinue={game.keepPlayingFinal} />
        ) : game.won && !game.continued ? (
          <Overlay mode="won" earned={game.earned} onRestart={game.restart} onContinue={game.keepPlaying} />
        ) : null}
        <ConfirmModal
          visible={askRestart}
          title="Yeniden Başlansın mı?"
          message={`Tahtadaki taşlar silinir. Bu oyunda kazandığın ${formatMoney(game.earned)} birikiminde kalır.`}
          confirmLabel="Yeniden Başla"
          cancelLabel="Devam Et"
          confirmSkin="yellow"
          onConfirm={confirmRestart}
          onCancel={cancelRestart}
        />
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

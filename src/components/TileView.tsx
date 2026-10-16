import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COIN_IMAGES } from './coinImages';
import { Tile } from '../game/engine';
import { LEVELS } from '../game/levels';

const SLIDE_MS = 160;
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1); // yumuşak hızlanma-yavaşlama
const SPRING = { damping: 14, stiffness: 180, mass: 0.6 };

interface Props {
  tile: Tile;
  cellSize: number;
  gap: number;
}

function cellPos(index: number, cellSize: number, gap: number): number {
  'worklet';
  return gap + index * (cellSize + gap);
}

function TileView({ tile, cellSize, gap }: Props) {
  const x = useSharedValue(cellPos(tile.col, cellSize, gap));
  const y = useSharedValue(cellPos(tile.row, cellSize, gap));
  const scale = useSharedValue(tile.spawned ? 0 : 1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    x.value = withTiming(cellPos(tile.col, cellSize, gap), { duration: SLIDE_MS, easing: EASE });
    y.value = withTiming(cellPos(tile.row, cellSize, gap), { duration: SLIDE_MS, easing: EASE });
  }, [tile.row, tile.col, cellSize, gap]);

  useEffect(() => {
    if (tile.spawned) {
      // Kayma bittikten sonra yay fiziğiyle yumuşakça belir
      scale.value = 0;
      scale.value = withDelay(SLIDE_MS, withSpring(1, SPRING));
    } else if (tile.popped) {
      // Birleşme pop'u: hedefe varınca büyüyüp yaylanarak otur
      scale.value = withDelay(
        SLIDE_MS - 30,
        withSequence(
          withTiming(1.15, { duration: 110, easing: EASE }),
          withSpring(1, SPRING)
        )
      );
    }
    if (tile.dying) {
      // Hedefe varır varmaz hızla yok ol: yeni taşın altından kenar sızmasın
      opacity.value = withDelay(SLIDE_MS - 60, withTiming(0, { duration: 40 }));
      scale.value = withDelay(SLIDE_MS - 60, withTiming(0.85, { duration: 40 }));
    }
  }, [tile.spawned, tile.popped, tile.dying]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          width: cellSize,
          height: cellSize,
          borderRadius: cellSize * 0.14,
          backgroundColor: LEVELS[tile.level].bg,
          zIndex: tile.dying ? 1 : 2,
        },
        style,
      ]}
    >
      {/* Para çizimi hazır resim (MoneySvg'nin birebir PNG'si, scripts/render-coins.mjs):
          her doğan/birleşen taşta SVG ağacı kurmak UI iş parçacığını kilitliyordu */}
      <Image source={COIN_IMAGES[tile.level]} style={styles.art} resizeMode="contain" fadeDuration={0} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: { width: '100%', height: '100%' },
});

// move() her hamlede tüm taş nesnelerini yeniden yarattığı için referans
// karşılaştırması yetmez; görseli etkileyen alanlar değişmediyse render atlanır
export default React.memo(
  TileView,
  (prev, next) =>
    prev.cellSize === next.cellSize &&
    prev.gap === next.gap &&
    prev.tile.id === next.tile.id &&
    prev.tile.level === next.tile.level &&
    prev.tile.row === next.tile.row &&
    prev.tile.col === next.tile.col &&
    prev.tile.spawned === next.tile.spawned &&
    prev.tile.popped === next.tile.popped &&
    prev.tile.dying === next.tile.dying
);

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import TileView from './TileView';
import { Tile } from '../game/engine';

interface Props {
  tiles: Tile[];
  size: number;
  gridSize: number;
}

export default function BoardView({ tiles, size, gridSize }: Props) {
  const gap = size * 0.025;
  const cellSize = (size - gap * (gridSize + 1)) / gridSize;

  // Zemin hücreleri statiktir; her hamlede yeniden kurulmasın
  const cells = useMemo(() => {
    const out = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        out.push(
          <View
            key={`${r}-${c}`}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                borderRadius: cellSize * 0.14,
                left: gap + c * (cellSize + gap),
                top: gap + r * (cellSize + gap),
              },
            ]}
          />
        );
      }
    }
    return out;
  }, [gridSize, cellSize, gap]);

  // Dış çerçeve (kontur + alt kalınlık) ayrı katman: taş koordinatları tahtanın
  // kendi kutusuna göre hesaplanır, çerçeve onları kaydırmaz
  return (
    <View style={[styles.frame, { borderRadius: size * 0.04 + FRAME }]}>
      <View style={[styles.board, { width: size, height: size, borderRadius: size * 0.04 }]}>
        {cells}
        {tiles.map((t) => (
          <TileView key={t.id} tile={t} cellSize={cellSize} gap={gap} />
        ))}
      </View>
    </View>
  );
}

/** Çerçeve kalınlığı: oyun panelleriyle aynı koyu dış çizgi, altta derinlik */
const FRAME = 3;

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#1B2238',
    padding: FRAME,
    paddingBottom: FRAME + 5,
    alignSelf: 'center',
  },
  board: {
    backgroundColor: '#24406E',
    overflow: 'hidden',
  },
  cell: {
    position: 'absolute',
    backgroundColor: '#33558C',
  },
});

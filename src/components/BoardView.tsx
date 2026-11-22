import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import TileView from './TileView';
import { aliveTiles, Tile } from '../game/engine';

interface Props {
  tiles: Tile[];
  size: number;
  gridSize: number;
  /** Çekiç modu: verilirse her taş dokunulabilir olur ve kırmızı çerçeveyle işaretlenir */
  onPickTile?: (tileId: number) => void;
}

export default function BoardView({ tiles, size, gridSize, onPickTile }: Props) {
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
    <View style={[styles.frame, { borderRadius: size * 0.04 + FRAME + RIM + 2 }]}>
      <View style={[styles.rim, { borderRadius: size * 0.04 + RIM + 2 }]}>
      <View style={[styles.board, { width: size, height: size, borderRadius: size * 0.04 }]}>
        {cells}
        {tiles.map((t) => (
          <TileView key={t.id} tile={t} cellSize={cellSize} gap={gap} />
        ))}
        {onPickTile
          ? aliveTiles(tiles).map((t) => (
              <Pressable
                key={`pick-${t.id}`}
                accessibilityLabel="Bu taşı kır"
                onPress={() => onPickTile(t.id)}
                style={({ pressed }) => [
                  styles.pick,
                  {
                    width: cellSize,
                    height: cellSize,
                    borderRadius: cellSize * 0.14,
                    left: gap + t.col * (cellSize + gap),
                    top: gap + t.row * (cellSize + gap),
                  },
                  pressed && styles.pickPressed,
                ]}
              />
            ))
          : null}
      </View>
      </View>
    </View>
  );
}

/** Çerçeve kalınlığı: oyun panelleriyle aynı koyu dış çizgi, altta derinlik */
const FRAME = 2.5;
/** Koyu kontur ile tahta arasındaki altın kenar */
const RIM = 5;

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#1B2238',
    padding: FRAME,
    paddingBottom: FRAME + 5,
    alignSelf: 'center',
  },
  /** Altın kenar (pencere çerçeveleriyle aynı), içte ince koyu çizgiyle tahtaya oturur */
  rim: {
    padding: RIM,
    backgroundColor: '#F2B12A',
    backgroundImage: 'linear-gradient(#FFE58A, #E9A11A 55%, #C97A0C)',
    borderWidth: 2,
    borderColor: '#1B2238',
  },
  board: {
    backgroundColor: '#24406E',
    backgroundImage: 'linear-gradient(#1F3A70, #2A4C8A)',
    overflow: 'hidden',
  },
  /** Boş hücre: hafif çukur görünsün diye üstte iç gölge */
  cell: {
    position: 'absolute',
    backgroundColor: '#33558C',
    backgroundImage: 'linear-gradient(#2C4D88, #3A62A2)',
    boxShadow: 'inset 0 3px 0 rgba(10,20,50,0.35)',
  },
  pick: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FF5A4E',
    backgroundColor: 'rgba(255,90,78,0.12)',
  },
  pickPressed: { backgroundColor: 'rgba(255,90,78,0.4)' },
});

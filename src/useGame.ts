import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  aliveTiles,
  canMove,
  denominate,
  Direction,
  ensureNextIdAbove,
  hasReached,
  move,
  newGame,
  spawnRandom,
  Tile,
} from './game/engine';
import { KULCE_LEVEL, levelKind, MAX_LEVEL, VALUES_TL } from './game/levels';
import { playCombo, playMerge, playMove } from './audio';

/** Combo bu kadar ardışık birleşmeden SONRA başlar */
export const COMBO_START = 3;
/** Combo çarpanı üst sınırı */
export const MAX_COMBO = 10;
/**
 * Combolu hamlede ek bonus: tahtadaki en yüksek taşın değeri × bu oran × çarpan.
 * Küçük taşlarla yapılan combolar da oyuncunun servet ölçeğinde kazandırsın diye
 * bonus, birleşen taşa değil tahtadaki en büyük taşa endekslidir (simülasyonla
 * kalibre edildi: toplam kazancın ~%40'ı bonustan gelir).
 */
export const COMBO_BONUS_RATE = 0.02;

export function comboMultiplier(combo: number): number {
  return combo >= COMBO_START ? Math.min(combo, MAX_COMBO) : 1;
}

const GAME_KEY = '@gamemoney/game_v1';

interface SavedTile {
  id: number;
  level: number;
  row: number;
  col: number;
}

interface SavedGame {
  gridSize: number;
  tiles: SavedTile[];
  earned: number;
  combo: number;
  over: boolean;
  won: boolean;
  continued: boolean;
  final?: boolean;
  finalContinued?: boolean;
}

function persistGame(snap: SavedGame) {
  AsyncStorage.setItem(GAME_KEY, JSON.stringify(snap)).catch(() => {});
}

/** Kayıtlı oyunu siler; bir sonraki açılışta sıfırdan başlar (ilerleme sıfırlamada kullanılır) */
export function clearSavedGame() {
  AsyncStorage.removeItem(GAME_KEY).catch(() => {});
}

function isValidSave(s: SavedGame, gridSize: number): boolean {
  return (
    s != null &&
    s.gridSize === gridSize &&
    Array.isArray(s.tiles) &&
    s.tiles.length > 0 &&
    s.tiles.every(
      (t) =>
        Number.isInteger(t.id) &&
        Number.isInteger(t.level) &&
        t.level >= 1 &&
        t.level <= MAX_LEVEL &&
        Number.isInteger(t.row) &&
        t.row >= 0 &&
        t.row < gridSize &&
        Number.isInteger(t.col) &&
        t.col >= 0 &&
        t.col < gridSize
    )
  );
}

export interface GameApi {
  tiles: Tile[];
  /** Bu oyunda birleşmelerden kazanılan para (TL) */
  earned: number;
  /** Art arda birleşmeli hamle sayısı */
  combo: number;
  /** Son combolu hamlede kazanılan toplam para (TL) — combo patlamasında gösterilir */
  comboGain: number;
  over: boolean;
  /** Külçe Altın'a (12) ulaşıldı — ara kutlama */
  won: boolean;
  continued: boolean;
  /** Dünya Serveti'ne (24) ulaşıldı — nihai zafer */
  final: boolean;
  finalContinued: boolean;
  onSwipe: (dir: Direction) => void;
  restart: () => void;
  keepPlaying: () => void;
  keepPlayingFinal: () => void;
}

export function useGame(onEarn?: (tl: number) => void, gridSize: number = 4): GameApi {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [earned, setEarned] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboGain, setComboGain] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [continued, setContinued] = useState(false);
  const [final, setFinal] = useState(false);
  const [finalContinued, setFinalContinued] = useState(false);

  // Açılışta kayıtlı oyunu yükle; yoksa (veya ızgara boyutu uyuşmuyorsa) yeni oyun kur.
  // Yeni kurulan oyun diske YAZILMAZ — ayarlar geç yüklenirken eski kayıt ezilmesin.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(GAME_KEY);
        if (!cancelled && raw) {
          const s = JSON.parse(raw) as SavedGame;
          if (isValidSave(s, gridSize)) {
            const restored: Tile[] = s.tiles.map((t) => ({
              id: t.id,
              level: t.level,
              row: t.row,
              col: t.col,
              spawned: false,
              popped: false,
              dying: false,
            }));
            ensureNextIdAbove(restored);
            setTiles(restored);
            setEarned(s.earned || 0);
            setCombo(s.combo || 0);
            setOver(!!s.over);
            setWon(!!s.won);
            setContinued(!!s.continued);
            setFinal(!!s.final);
            setFinalContinued(!!s.finalContinued);
            return;
          }
        }
      } catch {}
      if (!cancelled) {
        setTiles(newGame(gridSize));
        setEarned(0);
        setCombo(0);
        setOver(false);
        setWon(false);
        setContinued(false);
        setFinal(false);
        setFinalContinued(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gridSize]);

  const snapshot = useCallback(
    (
      t: Tile[],
      e: number,
      c: number,
      o: boolean,
      w: boolean,
      cont: boolean,
      fin: boolean,
      finCont: boolean
    ): SavedGame => ({
      gridSize,
      tiles: aliveTiles(t).map(({ id, level, row, col }) => ({ id, level, row, col })),
      earned: e,
      combo: c,
      over: o,
      won: w,
      continued: cont,
      final: fin,
      finalContinued: finCont,
    }),
    [gridSize]
  );

  const onSwipe = useCallback(
    (dir: Direction) => {
      if (over) return;
      const result = move(tiles, dir, gridSize);
      if (!result.moved) return;

      const next = denominate(spawnRandom(result.tiles, gridSize));
      setTiles(next);

      let newEarned = earned;
      let newCombo: number;
      if (result.mergedLevels.length > 0) {
        const top = Math.max(...result.mergedLevels);
        playMerge(levelKind(top));

        // Combo: ardışık birleşmeler kazancı katlar
        newCombo = combo + 1;
        const multiplier = comboMultiplier(newCombo);
        if (newCombo >= COMBO_START) playCombo(multiplier);
        const baseTL = result.mergedLevels.reduce((sum, lv) => sum + VALUES_TL[lv], 0);
        let gainedTL = baseTL * multiplier;
        if (multiplier > 1) {
          // Bonus tahtadaki en yüksek taşa endeksli: combo her aşamada anlamlı kazandırır
          const maxLevel = Math.max(...aliveTiles(next).map((t) => t.level));
          const bonus = VALUES_TL[maxLevel] * COMBO_BONUS_RATE * multiplier;
          gainedTL = Math.round((gainedTL + bonus) * 100) / 100;
          setComboGain(gainedTL);
        } else {
          setComboGain(0);
        }
        newEarned = earned + gainedTL;
        setEarned(newEarned);
        onEarn?.(gainedTL);
      } else {
        newCombo = 0;
        setComboGain(0);
        playMove();
      }
      setCombo(newCombo);

      const newWon = won || hasReached(next, KULCE_LEVEL);
      const newFinal = final || hasReached(next, MAX_LEVEL);
      const newOver = !canMove(next, gridSize);
      if (newWon) setWon(true);
      if (newFinal) setFinal(true);
      if (newOver) setOver(true);

      persistGame(snapshot(next, newEarned, newCombo, newOver, newWon, continued, newFinal, finalContinued));
    },
    [tiles, over, won, continued, final, finalContinued, combo, earned, onEarn, gridSize, snapshot]
  );

  const restart = useCallback(() => {
    const fresh = newGame(gridSize);
    setTiles(fresh);
    setEarned(0);
    setCombo(0);
    setComboGain(0);
    setOver(false);
    setWon(false);
    setContinued(false);
    setFinal(false);
    setFinalContinued(false);
    persistGame(snapshot(fresh, 0, 0, false, false, false, false, false));
  }, [gridSize, snapshot]);

  const keepPlaying = useCallback(() => {
    setContinued(true);
    persistGame(snapshot(tiles, earned, combo, over, won, true, final, finalContinued));
  }, [tiles, earned, combo, over, won, final, finalContinued, snapshot]);

  const keepPlayingFinal = useCallback(() => {
    setFinalContinued(true);
    persistGame(snapshot(tiles, earned, combo, over, won, continued, final, true));
  }, [tiles, earned, combo, over, won, continued, final, snapshot]);

  return {
    tiles,
    earned,
    combo,
    comboGain,
    over,
    won,
    continued,
    final,
    finalContinued,
    onSwipe,
    restart,
    keepPlaying,
    keepPlayingFinal,
  };
}

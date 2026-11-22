import { useCallback, useEffect, useRef, useState } from 'react';
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
import { KULCE_LEVEL, levelKind, MAX_LEVEL } from './game/levels';
import { COMBO_START, comboMultiplier, moveEarnings } from './game/payout';
import { playCombo, playMerge, playMove, playSmash, playUndo } from './audio';
import type { Tool } from './economy/items';

export { COMBO_START, MAX_COMBO, comboMultiplier } from './game/payout';

// v3: gerçek fiyat ölçeği + kazanç çarpanı; eski kayıttaki oyun kazancı eski ölçekte
const GAME_KEY = '@gamemoney/game_v3';

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
  /** Bu oyunda harcanan araç hakları */
  undoUsed?: number;
  hammerUsed?: number;
}

function persistGame(snap: SavedGame) {
  AsyncStorage.setItem(GAME_KEY, JSON.stringify(snap)).catch(() => {});
}

interface GameState {
  tiles: Tile[];
  earned: number;
  combo: number;
  comboGain: number;
  over: boolean;
  won: boolean;
  continued: boolean;
  final: boolean;
  finalContinued: boolean;
  undoUsed: number;
  hammerUsed: number;
}

const EMPTY: GameState = {
  tiles: [],
  earned: 0,
  combo: 0,
  comboGain: 0,
  over: false,
  won: false,
  continued: false,
  final: false,
  finalContinued: false,
  undoUsed: 0,
  hammerUsed: 0,
};

function toSave(g: GameState, gridSize: number): SavedGame {
  return {
    gridSize,
    tiles: aliveTiles(g.tiles).map(({ id, level, row, col }) => ({ id, level, row, col })),
    earned: g.earned,
    combo: g.combo,
    over: g.over,
    won: g.won,
    continued: g.continued,
    final: g.final,
    finalContinued: g.finalContinued,
    undoUsed: g.undoUsed,
    hammerUsed: g.hammerUsed,
  };
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
  /** Bu oyunda kalan araç hakları (sahip olunan eşyalardan) */
  undoLeft: number;
  hammerLeft: number;
  /** Geri alınacak bir hamle var mı (oyun başında ya da çekiçten sonra yok) */
  canUndo: boolean;
  /** Son hamleyi geri alır; kazancı da cüzdandan geri düşer. Oyun bitince de çalışır */
  undo: () => void;
  /** Bir taşı kırar (en az iki taş varken). Tıkanmış tahtayı açabilir */
  smash: (tileId: number) => void;
  onSwipe: (dir: Direction) => void;
  restart: () => void;
  keepPlaying: () => void;
  keepPlayingFinal: () => void;
}

export function useGame(
  onEarn?: (tl: number) => void,
  gridSize: number = 4,
  /**
   * Her birleşmeli hamlede: oluşan seviyeler, ham combo serisi, kazanılan TL
   * (başarım sayaçları). `revert`: hamle Geri Al ile geri alındı, sayaçlardan düş.
   */
  onMerge?: (levels: number[], combo: number, gainedTL: number, revert?: boolean) => void,
  /** Mahalle etkileri: kalıcı kazanç çarpanı ve oyun başına araç hakları */
  mods: { mult: number; charges: Record<Tool, number> } = { mult: 1, charges: { undo: 0, hammer: 0 } }
): GameApi {
  /*
   * Oyun durumunun TEK doğru kaynağı ref'tir; React durumu yalnız çizim içindir.
   * Eskiden onSwipe durumu render kapanışından okuyordu: JS iş parçacığı meşgulken
   * iki kaydırma aynı render'a düşünce ikisi de ESKİ tahtadan hesaplanıyor, bir
   * hamle kayboluyor, kazanç ve başarım sayaçları iki kez yazılıyordu. Ref her
   * hamlede eşzamanlı güncellendiği için art arda gelen kaydırmalar sıralı işlenir.
   */
  const ref = useRef<GameState>(EMPTY);
  const [state, setState] = useState<GameState>(EMPTY);
  /** Kayıt yüklenmeden oyuncu oyunu değiştirdiyse (ör. yeniden başla) yükleme onu ezmesin */
  const touched = useRef(false);
  /** Geri Al için son hamleden önceki durum, o hamlenin kazancı ve birleşmeleri (tek adım) */
  const prev = useRef<{ state: GameState; gained: number; levels: number[]; combo: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const modsRef = useRef(mods);
  modsRef.current = mods;

  const commit = useCallback(
    (next: GameState, save = true) => {
      ref.current = next;
      setState(next);
      if (save) persistGame(toSave(next, gridSize));
    },
    [gridSize]
  );

  // Açılışta kayıtlı oyunu yükle; yoksa (veya ızgara boyutu uyuşmuyorsa) yeni oyun kur.
  // Yeni kurulan oyun diske YAZILMAZ — ayarlar geç yüklenirken eski kayıt ezilmesin.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded: GameState | null = null;
      try {
        const raw = await AsyncStorage.getItem(GAME_KEY);
        if (raw) {
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
            loaded = {
              tiles: restored,
              earned: s.earned || 0,
              combo: s.combo || 0,
              comboGain: 0,
              over: !!s.over,
              won: !!s.won,
              continued: !!s.continued,
              final: !!s.final,
              finalContinued: !!s.finalContinued,
              undoUsed: Number.isInteger(s.undoUsed) ? s.undoUsed! : 0,
              hammerUsed: Number.isInteger(s.hammerUsed) ? s.hammerUsed! : 0,
            };
          }
        }
      } catch {}
      if (cancelled || touched.current) return;
      commit(loaded ?? { ...EMPTY, tiles: newGame(gridSize) }, false);
    })();
    return () => {
      cancelled = true;
    };
  }, [gridSize, commit]);

  const onSwipe = useCallback(
    (dir: Direction) => {
      const cur = ref.current;
      // Kutlama penceresi (Külçe / Dünya Serveti) açıkken tahta oynanmaz: kaydırma
      // tüm ekranda dinlendiği için pencerenin arkasında görünmeden hamle yapılıyordu
      if (cur.over || (cur.won && !cur.continued) || (cur.final && !cur.finalContinued)) return;
      const result = move(cur.tiles, dir, gridSize);
      if (!result.moved) return;
      touched.current = true;

      const next = denominate(spawnRandom(result.tiles, gridSize));
      let earned = cur.earned;
      let combo: number;
      let comboGain = 0;
      let gainedTL = 0;
      if (result.mergedLevels.length > 0) {
        const top = Math.max(...result.mergedLevels);
        playMerge(levelKind(top));

        // Combo: ardışık birleşmeler kazancı katlar
        combo = cur.combo + 1;
        const multiplier = comboMultiplier(combo);
        if (combo >= COMBO_START) playCombo(multiplier);
        const boardMax = Math.max(...aliveTiles(next).map((t) => t.level));
        gainedTL = moveEarnings(result.mergedLevels, combo, boardMax, modsRef.current.mult);
        if (multiplier > 1) comboGain = gainedTL;
        earned += gainedTL;
        onEarn?.(gainedTL);
        onMerge?.(result.mergedLevels, combo, gainedTL);
      } else {
        combo = 0;
        playMove();
      }

      prev.current = { state: cur, gained: gainedTL, levels: result.mergedLevels, combo };
      setCanUndo(true);
      commit({
        ...cur,
        tiles: next,
        earned,
        combo,
        comboGain,
        won: cur.won || hasReached(next, KULCE_LEVEL),
        final: cur.final || hasReached(next, MAX_LEVEL),
        over: !canMove(next, gridSize),
      });
    },
    [onEarn, onMerge, gridSize, commit]
  );

  const restart = useCallback(() => {
    touched.current = true;
    prev.current = null;
    setCanUndo(false);
    commit({ ...EMPTY, tiles: newGame(gridSize) });
  }, [gridSize, commit]);

  const undo = useCallback(() => {
    const cur = ref.current;
    const p = prev.current;
    if (!p || cur.undoUsed >= modsRef.current.charges.undo) return;
    prev.current = null;
    setCanUndo(false);
    playUndo();
    // Hamlenin kazancı cüzdandan geri alınır; kutlama durumları (won/final) korunur
    if (p.gained) onEarn?.(-p.gained);
    // Başarım sayaçları da (toplam kazanç, ×5/×10'a ulaşma, oluşturulan taşlar) geri alınır
    if (p.levels.length > 0) onMerge?.(p.levels, p.combo, p.gained, true);
    commit({
      ...p.state,
      // Önceki hamlenin canlandırma işaretleri temizlenir; sönmüş taşlar zaten yoktu
      tiles: p.state.tiles.filter((t) => !t.dying).map((t) => ({ ...t, spawned: false, popped: false })),
      comboGain: 0,
      won: cur.won,
      continued: cur.continued,
      final: cur.final,
      finalContinued: cur.finalContinued,
      undoUsed: cur.undoUsed + 1,
      hammerUsed: cur.hammerUsed,
    });
  }, [onEarn, onMerge, commit]);

  const smash = useCallback(
    (tileId: number) => {
      const cur = ref.current;
      if (cur.hammerUsed >= modsRef.current.charges.hammer) return;
      const alive = aliveTiles(cur.tiles);
      if (alive.length < 2 || !alive.some((t) => t.id === tileId)) return;
      prev.current = null; // çekiç geri alınamaz
      setCanUndo(false);
      playSmash();
      // Kırılan taş yerinde söner (dying); sonraki hamlede listeden düşer
      const tiles = cur.tiles
        .filter((t) => !t.dying)
        .map((t) => (t.id === tileId ? { ...t, dying: true, popped: false, spawned: false } : { ...t, popped: false, spawned: false }));
      commit({ ...cur, tiles, comboGain: 0, over: !canMove(tiles, gridSize), hammerUsed: cur.hammerUsed + 1 });
    },
    [gridSize, commit]
  );

  const keepPlaying = useCallback(() => commit({ ...ref.current, continued: true }), [commit]);
  const keepPlayingFinal = useCallback(() => commit({ ...ref.current, finalContinued: true }), [commit]);

  const { tiles, earned, combo, comboGain, over, won, continued, final, finalContinued } = state;
  const undoLeft = Math.max(0, mods.charges.undo - state.undoUsed);
  const hammerLeft = Math.max(0, mods.charges.hammer - state.hammerUsed);
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
    undoLeft,
    hammerLeft,
    canUndo,
    undo,
    smash,
    onSwipe,
    restart,
    keepPlaying,
    keepPlayingFinal,
  };
}

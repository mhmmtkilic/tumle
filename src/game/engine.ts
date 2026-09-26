import { MAX_LEVEL, mergeScore } from './levels';

/** Oyun ızgarası her zaman 4x4'tür */
export const GRID = 4;

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Tile {
  id: number;
  level: number;
  row: number;
  col: number;
  /** Bu hamlede doğdu → sıfırdan büyüme animasyonu */
  spawned: boolean;
  /** Bu hamlede birleşme sonucu oluştu → pop animasyonu */
  popped: boolean;
  /** Birleşmede yutulan taş: hedefe kayar, sonraki hamlede silinir */
  dying: boolean;
}

export interface MoveResult {
  tiles: Tile[];
  moved: boolean;
  gained: number;
  /** Bu hamlede oluşan yeni seviyeler (ses/haptik seçimi için) */
  mergedLevels: number[];
}

let nextId = 1;

function newTile(level: number, row: number, col: number, spawned = false): Tile {
  return { id: nextId++, level, row, col, spawned, popped: false, dying: false };
}

export function aliveTiles(tiles: Tile[]): Tile[] {
  return tiles.filter((t) => !t.dying);
}

/** Kayıttan geri yüklenen taşlardan sonra ID sayacını çakışmayacak yere taşır */
export function ensureNextIdAbove(tiles: Tile[]): void {
  for (const t of tiles) {
    if (t.id >= nextId) nextId = t.id + 1;
  }
}

function emptyCells(tiles: Tile[], size: number): { row: number; col: number }[] {
  const occupied = new Set(aliveTiles(tiles).map((t) => t.row * size + t.col));
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!occupied.has(r * size + c)) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

/**
 * Yükselen taban: doğan taş, tahtadaki en yüksek taşın bu kadar altından başlar.
 * Her seviye atlama böylece sabit zorlukta kalır (~2^8 taban taşlık iş);
 * K küçülürse oyun kolaylaşıp para musluğuna döner, büyürse üst seviyeler
 * bugünkü gibi ulaşılamaz olur (simülasyonla kalibre edildi).
 */
export const SPAWN_FLOOR_GAP = 7;

/** Doğan taşların alt seviyesi: max(1, en yüksek taş - SPAWN_FLOOR_GAP) */
export function spawnFloor(tiles: Tile[]): number {
  const alive = aliveTiles(tiles);
  if (alive.length === 0) return 1;
  return Math.max(1, Math.max(...alive.map((t) => t.level)) - SPAWN_FLOOR_GAP);
}

/** %90 taban seviye, %10 taban+1 (açılışta 1 Kuruş / 10 Kuruş) */
export function spawnRandom(tiles: Tile[], size: number = GRID, rng: () => number = Math.random): Tile[] {
  const cells = emptyCells(tiles, size);
  if (cells.length === 0) return tiles;
  const cell = cells[Math.floor(rng() * cells.length)];
  const floor = spawnFloor(tiles);
  const level = rng() < 0.9 ? floor : floor + 1;
  return [...tiles, newTile(level, cell.row, cell.col, true)];
}

/**
 * Denominasyon: taban yükselince altında kalan taşlar tabana yükseltilir —
 * eşi artık doğmayacak taşların tahtayı sonsuza dek işgal etmesini önler.
 * Yükseltilen taş pop animasyonu alır.
 */
export function denominate(tiles: Tile[]): Tile[] {
  const floor = spawnFloor(tiles);
  if (floor <= 1) return tiles;
  let changed = false;
  const out = tiles.map((t) => {
    if (!t.dying && t.level < floor) {
      changed = true;
      return { ...t, level: floor, popped: true };
    }
    return t;
  });
  return changed ? out : tiles;
}

export function newGame(size: number = GRID, rng: () => number = Math.random): Tile[] {
  return spawnRandom(spawnRandom([], size, rng), size, rng);
}

interface LineSpec {
  /** Hattaki hücreler, kayma yönünün kenarından içeri doğru sıralı */
  cells: { row: number; col: number }[];
}

function lines(dir: Direction, size: number): LineSpec[] {
  const specs: LineSpec[] = [];
  for (let i = 0; i < size; i++) {
    const cells: { row: number; col: number }[] = [];
    for (let j = 0; j < size; j++) {
      switch (dir) {
        case 'left':
          cells.push({ row: i, col: j });
          break;
        case 'right':
          cells.push({ row: i, col: size - 1 - j });
          break;
        case 'up':
          cells.push({ row: j, col: i });
          break;
        case 'down':
          cells.push({ row: size - 1 - j, col: i });
          break;
      }
    }
    specs.push({ cells });
  }
  return specs;
}

export function move(tiles: Tile[], dir: Direction, size: number = GRID): MoveResult {
  const alive = aliveTiles(tiles);
  const byCell = new Map<number, Tile>();
  for (const t of alive) byCell.set(t.row * size + t.col, t);

  const result: Tile[] = [];
  let moved = false;
  let gained = 0;
  const mergedLevels: number[] = [];

  for (const line of lines(dir, size)) {
    const lineTiles = line.cells
      .map((c) => byCell.get(c.row * size + c.col))
      .filter((t): t is Tile => t !== undefined);

    let slot = 0;
    for (let i = 0; i < lineTiles.length; i++) {
      const t = lineTiles[i];
      const next = lineTiles[i + 1];
      const target = line.cells[slot];

      if (next && next.level === t.level && t.level < MAX_LEVEL) {
        // Birleşme: t hedefe ilerleyip seviye atlar, next aynı hedefe kayıp yok olur
        const level = t.level + 1;
        result.push({ ...t, level, row: target.row, col: target.col, spawned: false, popped: true });
        result.push({ ...next, row: target.row, col: target.col, spawned: false, popped: false, dying: true });
        gained += mergeScore(level);
        mergedLevels.push(level);
        moved = true;
        i++; // next tüketildi
      } else {
        if (t.row !== target.row || t.col !== target.col) moved = true;
        result.push({ ...t, row: target.row, col: target.col, spawned: false, popped: false });
      }
      slot++;
    }
  }

  return { tiles: result, moved, gained, mergedLevels };
}

export function canMove(tiles: Tile[], size: number = GRID): boolean {
  const alive = aliveTiles(tiles);
  if (alive.length < size * size) return true;
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  for (const t of alive) grid[t.row][t.col] = t.level;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c];
      if (v < MAX_LEVEL) {
        if (r + 1 < size && grid[r + 1][c] === v) return true;
        if (c + 1 < size && grid[r][c + 1] === v) return true;
      }
    }
  }
  return false;
}

export function hasReached(tiles: Tile[], level: number): boolean {
  return aliveTiles(tiles).some((t) => t.level >= level);
}

/** Nihai hedef: zincirdeki son seviye */
export function hasWon(tiles: Tile[]): boolean {
  return hasReached(tiles, MAX_LEVEL);
}

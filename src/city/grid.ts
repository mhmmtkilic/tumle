import { getItem, hasItem, isPlaceable } from '../economy/items';
import { BlockId, BLOCKS, getBlock, isBlockId, openBlocks } from './world';

/*
 * Yerleşim ızgarası. Her arsa bloğu CELLS×CELLS hücreye bölünür. Hücre
 * koordinatları (i, j): i doğuya (+x), j güneye (+z) gider. Eşyalar kare ayak
 * izleriyle hücrelere oturur, çakışamaz. Dünya birimi = 1 hücre.
 */

export const CELLS = 6;

export interface CityPos {
  b: BlockId;
  i: number;
  j: number;
}

export type CityLayout = Record<string, CityPos>;

export function footOf(id: string): number {
  return hasItem(id) ? getItem(id).foot : 1;
}

/** Eşyanın varsayılan bloğu (açılış diziliminden) */
export function homeBlockOf(id: string): BlockId {
  return DEFAULT_LAYOUT[id]?.b ?? 'lot1';
}

/** Açılış dizilimi: eski sabit yerleşime yakın, çakışmasız */
export const DEFAULT_LAYOUT: CityLayout = {
  // mahalle
  gokdelen: { b: 'lot1', i: 3, j: 0 },
  dukkan: { b: 'lot1', i: 3, j: 4 },
  araba: { b: 'lot1', i: 4, j: 2 },
  agac: { b: 'lot1', i: 1, j: 5 },
  kart: { b: 'lot1', i: 2, j: 5 },
  kedi: { b: 'lot1', i: 5, j: 5 },
  ev: { b: 'lot1', i: 1, j: 3 },
  // yan arsa
  villa: { b: 'lot2', i: 1, j: 1 },
  fiskiye: { b: 'lot2', i: 3, j: 3 },
  bufe: { b: 'lot2', i: 0, j: 3 },
  turbin: { b: 'lot2', i: 3, j: 0 },
  park: { b: 'lot2', i: 0, j: 4 },
  // sahil
  malikane: { b: 'sahil', i: 1, j: 1 },
  gemi: { b: 'sahil', i: 4, j: 0 },
  roket: { b: 'sahil', i: 4, j: 2 },
  ada: { b: 'sahil', i: 2, j: 4 },
  yat: { b: 'sahil', i: 0, j: 4 },
};

/** Ayak izi merkezinin dünya koordinatı (x, z) */
export function cellCenter(pos: CityPos, s: number): { x: number; z: number } {
  const b = BLOCKS[pos.b];
  return { x: b.x + pos.i + s / 2, z: b.z + pos.j + s / 2 };
}

export function isValidPos(p: unknown): p is CityPos {
  if (p == null || typeof p !== 'object') return false;
  const q = p as CityPos;
  return (
    isBlockId(q.b) &&
    Number.isInteger(q.i) &&
    Number.isInteger(q.j) &&
    q.i >= 0 &&
    q.i < CELLS &&
    q.j >= 0 &&
    q.j < CELLS
  );
}

/**
 * Konum geçerli mi: ızgara sınırları içinde, bloğu açık, başka eşyayla
 * çakışmıyor.
 */
export function fits(layout: CityLayout, owned: readonly string[], id: string, pos: CityPos): boolean {
  const s = footOf(id);
  if (pos.i < 0 || pos.j < 0 || pos.i + s > CELLS || pos.j + s > CELLS) return false;
  const block = getBlock(pos.b);
  if (block.unlockedBy && !owned.includes(block.unlockedBy)) return false;
  for (const other of owned) {
    if (other === id || !isPlaceable(other)) continue;
    const p2 = layout[other];
    if (!p2 || p2.b !== pos.b) continue;
    const s2 = footOf(other);
    const disjoint = pos.i + s <= p2.i || p2.i + s2 <= pos.i || pos.j + s <= p2.j || p2.j + s2 <= pos.j;
    if (!disjoint) return false;
  }
  return true;
}

/**
 * Dünya noktasını ızgaraya kilitler: verilen bloklar içinde, sınırlara
 * kırpılmış EN YAKIN ayak izini döndürür. Nokta bloğun dışına taşsa bile kenar
 * hücresine kilitlenir — eşya ızgara dışına asla çıkamaz.
 */
export function snapCell(x: number, z: number, s: number, blocks: BlockId[]): CityPos {
  let best: CityPos = { b: blocks[0], i: 0, j: 0 };
  let bestD = Infinity;
  for (const id of blocks) {
    const b = BLOCKS[id];
    const i = Math.min(CELLS - s, Math.max(0, Math.round(x - b.x - s / 2)));
    const j = Math.min(CELLS - s, Math.max(0, Math.round(z - b.z - s / 2)));
    const cx = b.x + i + s / 2;
    const cz = b.z + j + s / 2;
    const d = (x - cx) * (x - cx) + (z - cz) * (z - cz);
    if (d < bestD) {
      bestD = d;
      best = { b: id, i, j };
    }
  }
  return best;
}

/** Eşyanın sürüklenebileceği bloklar: açık arsalar */
export function blocksFor(_id: string, owned: readonly string[]): BlockId[] {
  return openBlocks(owned);
}

/** Yeni alınan eşya için ilk boş yeri tarar (önce varsayılan bloğu) */
export function findFreeSpot(layout: CityLayout, owned: readonly string[], id: string): CityPos | null {
  const s = footOf(id);
  const preferred = homeBlockOf(id);
  const all = blocksFor(id, owned);
  const blocks: BlockId[] = all.includes(preferred) ? [preferred, ...all.filter((b) => b !== preferred)] : all;
  for (const b of blocks) {
    for (let j = 0; j <= CELLS - s; j++) {
      for (let i = 0; i <= CELLS - s; i++) {
        const pos: CityPos = { b, i, j };
        if (fits(layout, owned, id, pos)) return pos;
      }
    }
  }
  return null;
}

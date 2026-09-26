import { getItem, hasItem, isPlaceable, ShopItem } from '../economy/items';
import { BlockId, BLOCKS, getBlock, isBlockId, openBlocks } from './world';

/*
 * Yerleşim ızgarası. Her arsa bloğu CELLS×CELLS izometrik hücreye bölünür.
 * Hücre koordinatları (i, j): i ekseni bloğun tepe köşesinden sağ-alt köşeye,
 * j ekseni sol-alt köşeye gider. Eşyalar kare ayak izleriyle hücrelere
 * oturur, çakışamaz.
 */

export const CELLS = 6;
/** İzometrik hücre adımı: x ve y bileşenleri (blok 380x190, 2:1 perspektif) */
const A = 190 / CELLS;
const C = 95 / CELLS;

// Sürükleme vurgusu UI thread'de (worklet) hesaplanır; sabitler dışarı açılır
export const GRID_A = A;
export const GRID_C = C;
/** Blok id → tepe köşe (worklet'ler için düz nesne) */
export const BLOCK_TOP: Record<BlockId, { x: number; y: number }> = Object.fromEntries(
  Object.values(BLOCKS).map((b) => [b.id, b.top])
) as Record<BlockId, { x: number; y: number }>;

export interface CityPos {
  b: BlockId;
  i: number;
  j: number;
}

export type CityLayout = Record<string, CityPos>;

export function footOf(id: string): number {
  return hasItem(id) ? getItem(id).place?.foot ?? 1 : 1;
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
  motosiklet: { b: 'lot1', i: 2, j: 5 },
  bisiklet: { b: 'lot1', i: 5, j: 5 },
  ev: { b: 'lot1', i: 1, j: 3 },
  villa: { b: 'lot2', i: 1, j: 1 },
  havuz: { b: 'lot2', i: 3, j: 3 },
  karavan: { b: 'lot2', i: 0, j: 3 },
  helikopter: { b: 'lot2', i: 3, j: 0 },
  park: { b: 'lot2', i: 5, j: 2 },
  malikane: { b: 'sahil', i: 1, j: 1 },
  jet: { b: 'sahil', i: 4, j: 0 },
  roket: { b: 'sahil', i: 4, j: 2 },
  ada: { b: 'sahil', i: 2, j: 4 },
  yat: { b: 'sahil', i: 0, j: 4 },
};

/** Ayak izi merkezinin dünya koordinatı */
export function cellCenter(pos: CityPos, s: number): { x: number; y: number } {
  const t = BLOCK_TOP[pos.b];
  const k = pos.i + s / 2;
  const m = pos.j + s / 2;
  return { x: t.x + (k - m) * A, y: t.y + (k + m) * C };
}

export function anchorOf(item: ShopItem): { x: number; y: number } {
  return item.place?.anchor ?? { x: item.art.w / 2, y: item.art.h * 0.85 };
}

/** Eşyanın çiziminin dünya koordinatındaki dikdörtgeni (taban merkezi = hücre merkezi) */
export function artRect(item: ShopItem, pos: CityPos): { x: number; y: number; w: number; h: number } {
  const s = footOf(item.id);
  const c = cellCenter(pos, s);
  const a = anchorOf(item);
  return { x: c.x - a.x, y: c.y - a.y, w: item.art.w, h: item.art.h };
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
 * Sürüklenen noktayı ızgaraya kilitler: verilen bloklar içinde, sınırlara
 * kırpılmış EN YAKIN hücreyi döndürür. Nokta bloğun dışına taşsa bile kenar
 * hücresine kilitlenir — eşya ızgara dışına asla çıkamaz. Hem JS'te (bırakma)
 * hem UI thread'de (sürükleme/vurgu) kullanılır.
 */
export function snapCell(nx: number, ny: number, s: number, blocks: BlockId[]): CityPos {
  'worklet';
  let best: CityPos = { b: blocks[0], i: 0, j: 0 };
  let bestD = Infinity;
  for (const b of blocks) {
    const t = BLOCK_TOP[b];
    const dx = nx - t.x;
    const dy = ny - t.y;
    const fi = (dx / GRID_A + dy / GRID_C) / 2;
    const fj = (dy / GRID_C - dx / GRID_A) / 2;
    const i = Math.min(CELLS - s, Math.max(0, Math.round(fi - s / 2)));
    const j = Math.min(CELLS - s, Math.max(0, Math.round(fj - s / 2)));
    const cx = t.x + (i - j) * GRID_A;
    const cy = t.y + (i + j + s) * GRID_C;
    const d = (nx - cx) * (nx - cx) + (ny - cy) * (ny - cy);
    if (d < bestD) {
      bestD = d;
      best = { b, i, j };
    }
  }
  return best;
}

/** Eşyanın sürüklenebileceği bloklar: açık arsalar */
export function blocksFor(_id: string, owned: readonly string[]): BlockId[] {
  return openBlocks(owned);
}

/**
 * Bırakma anında hedef: kilitli hücre boşsa oraya, doluysa null (eşya eski
 * yerine döner). Kullanıcının gördüğü vurguyla birebir aynı mantık.
 */
export function resolveDrop(
  layout: CityLayout,
  owned: readonly string[],
  id: string,
  dxW: number,
  dyW: number
): CityPos | null {
  const s = footOf(id);
  const c = cellCenter(layout[id], s);
  const pos = snapCell(c.x + dxW, c.y + dyW, s, blocksFor(id, owned));
  return fits(layout, owned, id, pos) ? pos : null;
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

/**
 * Sürükleme vurgusu için doluluk haritası: taşınan eşya hariç, sahip olunan
 * eşyaların kapladığı hücreler (blok → [i][j] → dolu mu). Yalnız verilen
 * bloklar için üretilir.
 */
export function occupancyGrid(
  layout: CityLayout,
  owned: readonly string[],
  excludeId: string,
  blocks: BlockId[]
): Record<string, boolean[][]> {
  const make = () => Array.from({ length: CELLS }, () => Array<boolean>(CELLS).fill(false));
  const occ: Record<string, boolean[][]> = {};
  for (const b of blocks) occ[b] = make();
  for (const id of owned) {
    if (id === excludeId || !isPlaceable(id)) continue;
    const p = layout[id];
    if (!p || !occ[p.b]) continue;
    const s = footOf(id);
    for (let di = 0; di < s; di++) {
      for (let dj = 0; dj < s; dj++) {
        const i = p.i + di;
        const j = p.j + dj;
        if (i < CELLS && j < CELLS) occ[p.b][i][j] = true;
      }
    }
  }
  return occ;
}

/** Düzenleme modunda çizilecek ızgara çizgileri (dünya koordinatında) */
export function gridLines(b: BlockId): { x1: number; y1: number; x2: number; y2: number }[] {
  const t = BLOCK_TOP[b];
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let k = 0; k <= CELLS; k++) {
    out.push({ x1: t.x - k * A, y1: t.y + k * C, x2: t.x - k * A + CELLS * A, y2: t.y + k * C + CELLS * C });
    out.push({ x1: t.x + k * A, y1: t.y + k * C, x2: t.x + k * A - CELLS * A, y2: t.y + k * C + CELLS * C });
  }
  return out;
}

/** Bloğun dört köşesi (tepe, sağ, alt, sol) — zemin/duvar çizimi için */
export function blockCorners(b: BlockId): { top: [number, number]; right: [number, number]; bottom: [number, number]; left: [number, number] } {
  const t = BLOCK_TOP[b];
  return {
    top: [t.x, t.y],
    right: [t.x + CELLS * A, t.y + CELLS * C],
    bottom: [t.x, t.y + 2 * CELLS * C],
    left: [t.x - CELLS * A, t.y + CELLS * C],
  };
}

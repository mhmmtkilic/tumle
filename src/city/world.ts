/*
 * Dünya: tek sahne — Mahallem. Çimen arsalar + yol. Bloklar: lot1 (baştan
 * açık), lot2 (Yan Arsa), sahil (Sahil Arsası).
 *
 * Her blok CELLS×CELLS izometrik hücreye bölünür (grid.ts). Blok "açılması"
 * hep aynı mekaniktir: `unlockedBy` eşyası alınınca blok toz+konfetiyle
 * sahneye kayar.
 */

export type BlockId = 'lot1' | 'lot2' | 'sahil';

export interface BlockDef {
  id: BlockId;
  name: string;
  /** Bloğun tepe (arka) köşesi, sahne dünya koordinatında */
  top: { x: number; y: number };
  /** Bu eşya alınmadan blok yoktur. undefined = baştan açık */
  unlockedBy?: string;
  /** Açılış animasyonunda bloğun geldiği yön (dünya birimi) */
  reveal: { dx: number; dy: number };
}

/** Blok genişliği (dünya birimi): 2:1 izometrik eşkenar dörtgen 380×190 */
export const BLOCK_W = 380;
export const BLOCK_H = 190;

export const MAHALLE_NAME = 'Mahallem';

const BLOCK_LIST: BlockDef[] = [
  { id: 'lot1', name: 'Mahalle', top: { x: 200, y: 120 }, reveal: { dx: 0, dy: 0 } },
  { id: 'lot2', name: 'Yan Arsa', top: { x: 390, y: 25 }, unlockedBy: 'arsa', reveal: { dx: 46, dy: -23 } },
  { id: 'sahil', name: 'Sahil Arsası', top: { x: 580, y: 154 }, unlockedBy: 'arsa2', reveal: { dx: 46, dy: 23 } },
];

export const BLOCKS: Record<BlockId, BlockDef> = Object.fromEntries(
  BLOCK_LIST.map((b) => [b.id, b])
) as Record<BlockId, BlockDef>;

export function getBlock(id: BlockId): BlockDef {
  return BLOCKS[id];
}

export function isBlockId(v: unknown): v is BlockId {
  return typeof v === 'string' && v in BLOCKS;
}

export function isBlockOpen(id: BlockId, owned: readonly string[]): boolean {
  const b = BLOCKS[id];
  return !b.unlockedBy || owned.includes(b.unlockedBy);
}

/** Açık bloklar, tanım sırasıyla */
export function openBlocks(owned: readonly string[]): BlockId[] {
  return BLOCK_LIST.filter((b) => isBlockOpen(b.id, owned)).map((b) => b.id);
}

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Sahnenin sabit çerçeveleri (mevcut sahne çizimleriyle birebir) */
const FRAMES: Record<BlockId, Frame> = {
  lot1: { x: 0, y: 0, w: 400, h: 360 },
  lot2: { x: 0, y: 0, w: 640, h: 360 },
  sahil: { x: 0, y: 0, w: 780, h: 360 },
};

/** Sahnenin görünür dünya çerçevesi (viewBox); arsalar açıldıkça sabit adımlarla genişler */
export function sceneFrame(owned: readonly string[]): Frame {
  const open = openBlocks(owned);
  const last = open[open.length - 1];
  return FRAMES[last] ?? FRAMES.lot1;
}

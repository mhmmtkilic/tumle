/*
 * Dünya: tek sahne — Mahallem (3D). Üç arsa bloğu doğu yönünde yan yana
 * dizilir, aralarında ve çevrelerinde yollar vardır: lot1 (baştan açık),
 * lot2 (Yan Arsa), sahil (Sahil Arsası, doğusu deniz).
 *
 * Birim: 1 = bir ızgara hücresi (3D'de 1 birim). Her blok CELLS×CELLS
 * hücredir (grid.ts). Kilitli blok sahnede "satılık" arsa olarak durur;
 * `unlockedBy` eşyası alınınca açılır.
 */

export type BlockId = 'lot1' | 'lot2' | 'sahil';

export interface BlockDef {
  id: BlockId;
  name: string;
  /** Bloğun kuzeybatı köşesi (hücre (0,0)'ın köşesi), dünya x/z */
  x: number;
  z: number;
  /** Zemin türü */
  ground: 'grass' | 'sand';
  /** Bu eşya alınmadan blok kilitlidir. undefined = baştan açık */
  unlockedBy?: string;
}

/** Blok kenarı (hücre) ve bloklar arası yol genişliği */
export const BLOCK_SIZE = 6;
export const ROAD = 1;

export const MAHALLE_NAME = 'Mahallem';

const BLOCK_LIST: BlockDef[] = [
  { id: 'lot1', name: 'Mahalle', x: 0, z: 0, ground: 'grass' },
  { id: 'lot2', name: 'Yan Arsa', x: BLOCK_SIZE + ROAD, z: 0, ground: 'grass', unlockedBy: 'arsa' },
  { id: 'sahil', name: 'Sahil Arsası', x: 2 * (BLOCK_SIZE + ROAD), z: 0, ground: 'sand', unlockedBy: 'arsa2' },
];

export const BLOCKS: Record<BlockId, BlockDef> = Object.fromEntries(
  BLOCK_LIST.map((b) => [b.id, b])
) as Record<BlockId, BlockDef>;

export const ALL_BLOCKS: readonly BlockDef[] = BLOCK_LIST;

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

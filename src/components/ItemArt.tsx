import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { ITEMS } from '../economy/items';
import { ITEM_ICONS } from './itemIcons';

/*
 * Eşya görselleri: Kenney modellerinden 2D mahalle ızgarasıyla aynı izometrik
 * açıda render edilmiş PNG'ler (scripts/render-item-icons.mjs). Görsel kutuyu
 * oranını koruyarak doldurur; `tint` verilirse tek renk silüet olur (kilitli).
 */

type ArtProps = { tint?: string };

function makeArt(id: string): React.ComponentType<ArtProps> {
  const source = ITEM_ICONS[id];
  function Art({ tint }: ArtProps) {
    return <Image source={source} style={styles.fill} resizeMode="contain" tintColor={tint} />;
  }
  Art.displayName = `ItemArt(${id})`;
  return Art;
}

export const ITEM_ART: Record<string, React.ComponentType<ArtProps>> = Object.fromEntries(
  ITEMS.map((it) => [it.id, makeArt(it.id)])
);

// Katalogdaki her eşyanın görseli olmalı; eksikse geliştirme anında patlasın
for (const it of ITEMS) {
  if (!ITEM_ICONS[it.id]) throw new Error(`Görseli olmayan eşya: ${it.id} (npm run icons)`);
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
});

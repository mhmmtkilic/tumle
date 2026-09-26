import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CityLayout, CityPos, DEFAULT_LAYOUT, isValidPos } from './grid';
import { BlockId } from './world';

// v2: blok id'leri sayı yerine isim (lot1/lot2/sahil). v1 kaydı okunup dönüştürülür.
// Katalogdan kalkmış eşyalar ve artık var olmayan bloklar okunurken ayıklanır.
const LAYOUT_KEY = '@gamemoney/layout_v2';
const LEGACY_KEY = '@gamemoney/layout_v1';
const LEGACY_BLOCKS: Record<number, BlockId> = { 1: 'lot1', 2: 'lot2', 3: 'sahil' };

interface LayoutApi {
  /** Eşya id → ızgara konumu. Her eşya için her zaman bir konum vardır */
  layout: CityLayout;
  /** byUser=false: otomatik taşıma (ör. yeni alınan eşyaya boş yer bulma) — ipucunu söndürmez */
  moveItem: (id: string, pos: CityPos, byUser?: boolean) => void;
  /** Yerleşimi açılış dizilimine döndürür */
  resetLayout: () => void;
  /** Kullanıcı en az bir kez eşya taşıdı mı? (öğretici ipucunu gizlemek için) */
  arranged: boolean;
}

const Ctx = createContext<LayoutApi | null>(null);

/** Kayıtlı yerleşimi doğrulayıp varsayılanla birleştirir; bozuk girdiler atlanır */
function mergeSaved(raw: string, legacy: boolean): CityLayout {
  const saved = JSON.parse(raw) as Record<string, unknown>;
  const merged: CityLayout = { ...DEFAULT_LAYOUT };
  for (const id of Object.keys(saved)) {
    if (!merged[id]) continue;
    let p = saved[id] as { b: unknown; i: number; j: number };
    if (legacy && typeof p?.b === 'number') p = { ...p, b: LEGACY_BLOCKS[p.b] };
    if (isValidPos(p)) merged[id] = p;
  }
  return merged;
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<CityLayout>(DEFAULT_LAYOUT);
  const [arranged, setArranged] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v2 = await AsyncStorage.getItem(LAYOUT_KEY);
        if (v2) {
          setArranged(true); // kayıtlı yerleşim varsa taşımayı zaten öğrenmiş
          setLayout(mergeSaved(v2, false));
          return;
        }
        const v1 = await AsyncStorage.getItem(LEGACY_KEY);
        if (v1) {
          const migrated = mergeSaved(v1, true);
          setArranged(true);
          setLayout(migrated);
          await AsyncStorage.setItem(LAYOUT_KEY, JSON.stringify(migrated));
          await AsyncStorage.removeItem(LEGACY_KEY);
        }
      } catch {}
    })();
  }, []);

  const moveItem = useCallback((id: string, pos: CityPos, byUser: boolean = true) => {
    if (byUser) setArranged(true);
    setLayout((cur) => {
      const next = { ...cur, [id]: pos };
      AsyncStorage.setItem(LAYOUT_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    setArranged(false);
    AsyncStorage.removeItem(LAYOUT_KEY).catch(() => {});
  }, []);

  return <Ctx.Provider value={{ layout, moveItem, resetLayout, arranged }}>{children}</Ctx.Provider>;
}

export function useCityLayout(): LayoutApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('LayoutProvider eksik');
  return v;
}

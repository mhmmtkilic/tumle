import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItem, hasItem } from './items';
import { checkBuy } from './progress';

/** TEST MODU: true iken cüzdan sınırsızdır ve satın almalar para düşmez. Yayınlamadan önce false yap! */
export const DEV_UNLIMITED_MONEY = false;
const DEV_WALLET = 99_999_999_999;

// v4: ekonomi yeniden kalibre edildi (ödeme tablosu ve fiyatlar ~1000 kat
// küçüldü). Eski ölçekteki cüzdan yeni mağazayı tek dokunuşta bitireceği için
// herkes yeni ekonomiyle sıfırdan başlar. Eski anahtarlar diskte durur.
// v5: fiyatlar gerçek Türkiye ölçeğine geçti (₺35 bin → ₺30 Mr) ve eşya etkisi
// +% yerine çarpan oldu; eski cüzdan ve eşyalar yeni dengeye taşınmaz.
const WALLET_KEY = '@gamemoney/wallet_v5';
const OWNED_KEY = '@gamemoney/owned_v5';

interface Economy {
  /** Harcanabilir birikim (TL) */
  wallet: number;
  /** Satın alınmış eşya id'leri (düz liste) */
  owned: string[];
  addEarnings: (tl: number) => void;
  /**
   * Başarılıysa true döner ve parayı düşer. Ön şartlar ve para burada da
   * denetlenir (UI yalnızca gösterim için progress.checkBuy kullanır).
   */
  buy: (id: string) => boolean;
  /** Cüzdanı ve satın alınan her şeyi sıfırlar */
  resetProgress: () => void;
  /**
   * Oyun sırasında: `wallet` durumu dondurulur, dönen fonksiyon çağrılınca güncel
   * değere eşitlenir. Para yine anında ref'e ve diske yazılır; yalnız React
   * yeniden çizimi ertelenir. Aksi halde her birleşme cüzdanı kullanan bütün
   * ekranları (ana sayfa, mağaza, sıralama, başarımlar…) arka planda yeniden
   * çizdiriyor, JS iş parçacığı sıradaki kaydırmaya geç yanıt veriyordu.
   */
  holdWallet: () => () => void;
  /** Cüzdanın anlık (dondurulmamış) değeri ve değişim aboneliği — oyun ekranı için */
  getWallet: () => number;
  subscribeWallet: (fn: () => void) => () => void;
}

const Ctx = createContext<Economy | null>(null);

export function EconomyProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState(0);
  const [owned, setOwned] = useState<string[]>([]);
  const walletRef = useRef(0);
  const ownedRef = useRef<string[]>([]);
  const hydratedRef = useRef(false);
  const holds = useRef(0);
  const listeners = useRef(new Set<() => void>());

  /** Cüzdan değişti: aboneler hep haberdar olur, React durumu yalnız dondurulmamışken */
  const publishWallet = useCallback(() => {
    for (const fn of listeners.current) fn();
    if (holds.current === 0) setWallet(walletRef.current);
  }, []);

  const holdWallet = useCallback(() => {
    holds.current++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--holds.current === 0) setWallet(walletRef.current);
    };
  }, []);
  const getWallet = useCallback(() => walletRef.current, []);
  const subscribeWallet = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const persistWallet = useCallback(() => {
    // Diskten okuma bitmeden yazma: eski kayıt yarım veriyle ezilmesin
    if (!hydratedRef.current) return;
    // Test modunda şişirilmiş cüzdanı diske yazma; gerçek kayıt bozulmasın
    if (!DEV_UNLIMITED_MONEY) {
      AsyncStorage.setItem(WALLET_KEY, String(walletRef.current)).catch(() => {});
    }
  }, []);

  const persist = useCallback(() => {
    if (!hydratedRef.current) return;
    persistWallet();
    AsyncStorage.setItem(OWNED_KEY, JSON.stringify(ownedRef.current)).catch(() => {});
  }, [persistWallet]);

  useEffect(() => {
    (async () => {
      let stored = 0;
      let storedOwned: string[] = [];
      try {
        const [w, o] = await Promise.all([
          AsyncStorage.getItem(WALLET_KEY),
          AsyncStorage.getItem(OWNED_KEY),
        ]);
        stored = Number(w) || 0;
        // Katalogdan kaldırılmış/bilinmeyen id'ler ayıklanır; kayıt bozulmaz
        storedOwned = o ? (JSON.parse(o) as string[]).filter((id) => typeof id === 'string' && hasItem(id)) : [];
      } catch {}
      // Okuma sürerken gelen kazançlar ref'te birikmiştir; diskten geleni ÜSTÜNE ekle, ezme
      walletRef.current = DEV_UNLIMITED_MONEY ? DEV_WALLET : stored + walletRef.current;
      ownedRef.current = [...storedOwned, ...ownedRef.current.filter((id) => !storedOwned.includes(id))];
      hydratedRef.current = true;
      publishWallet();
      setOwned(ownedRef.current);
      persist();
    })();
  }, [persist, publishWallet]);

  const addEarnings = useCallback(
    (tl: number) => {
      walletRef.current += tl;
      publishWallet();
      // Her birleşmede çağrılır: yalnız cüzdan yazılır, eşya listesi değişmedi
      persistWallet();
    },
    [persistWallet, publishWallet]
  );

  const buy = useCallback(
    (id: string) => {
      if (!hasItem(id)) return false;
      const item = getItem(id);
      const wallet = DEV_UNLIMITED_MONEY ? Infinity : walletRef.current;
      if (!checkBuy(ownedRef.current, wallet, item).ok) return false;
      if (!DEV_UNLIMITED_MONEY) walletRef.current -= item.price;
      ownedRef.current = [...ownedRef.current, id];
      publishWallet();
      setOwned(ownedRef.current);
      persist();
      return true;
    },
    [persist, publishWallet]
  );

  const resetProgress = useCallback(() => {
    walletRef.current = DEV_UNLIMITED_MONEY ? DEV_WALLET : 0;
    ownedRef.current = [];
    publishWallet();
    setOwned([]);
    persist();
  }, [persist, publishWallet]);

  const value = useMemo<Economy>(
    () => ({ wallet, owned, addEarnings, buy, resetProgress, holdWallet, getWallet, subscribeWallet }),
    [wallet, owned, addEarnings, buy, resetProgress, holdWallet, getWallet, subscribeWallet]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEconomy(): Economy {
  const v = useContext(Ctx);
  if (!v) throw new Error('EconomyProvider eksik');
  return v;
}

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACHIEVEMENTS, AchievementDef, rewardOf } from './defs';
import { KULCE_LEVEL, MAX_LEVEL } from '../game/levels';
import { PLACED_ITEMS } from '../economy/items';
import { useEconomy } from '../economy/EconomyContext';
import { playMerge } from '../audio';
import { formatTL } from '../game/levels';
import BadgeSvg from '../components/BadgeSvg';

// v2: başarımlar sınırsız para döneminde kendiliğinden açılıp ödül ödemiş
// olabilir (birikim/eşya eşikleri). Gerçek ekonomiyle birlikte onlar da sıfırlanır.
const ACH_KEY = '@gamemoney/achievements_v2';
const CLAIMED_KEY = '@gamemoney/achievements_claimed_v2';

interface AchApi {
  /** Açılmış başarım id'leri */
  unlocked: string[];
  /** Ödülü cüzdana aktarılmış başarım id'leri */
  claimed: string[];
  /** Açılmış ama ödülü alınmamış başarım sayısı (rozet sayacı) */
  claimable: number;
  /** Ödülü cüzdana ekler; başarım açık ve daha önce alınmamışsa true döner */
  claim: (id: string) => boolean;
  /** Tahtadaki canlı taşların seviyeleri (para/altın/külçe/koleksiyon başarımları) */
  reportBoard: (levels: number[]) => void;
  /** Ulaşılan combo çarpanı ve ham seri uzunluğu */
  reportCombo: (mult: number, streak: number) => void;
  /** Devam eden oyunda birikmiş kazanç */
  reportGameEarned: (tl: number) => void;
  /** Tüm başarımları kilitler ve kaydı siler (ilerleme sıfırlamada kullanılır) */
  resetAchievements: () => void;
}

const Ctx = createContext<AchApi | null>(null);

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const unlockedRef = useRef<string[]>([]);
  const [claimed, setClaimed] = useState<string[]>([]);
  const claimedRef = useRef<string[]>([]);
  const [toast, setToast] = useState<AchievementDef | null>(null);
  const { wallet, owned, addEarnings } = useEconomy();

  useEffect(() => {
    const valid = (raw: string | null) =>
      raw ? (JSON.parse(raw) as string[]).filter((id) => ACHIEVEMENTS.some((a) => a.id === id)) : [];
    Promise.all([AsyncStorage.getItem(ACH_KEY), AsyncStorage.getItem(CLAIMED_KEY)])
      .then(([u, c]) => {
        const ids = valid(u);
        // Yalnız açık olanlar alınmış sayılabilir
        const got = valid(c).filter((id) => ids.includes(id));
        unlockedRef.current = ids;
        claimedRef.current = got;
        setUnlocked(ids);
        setClaimed(got);
      })
      .catch(() => {});
  }, []);

  const claim = useCallback(
    (id: string) => {
      if (!unlockedRef.current.includes(id) || claimedRef.current.includes(id)) return false;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return false;
      claimedRef.current = [...claimedRef.current, id];
      setClaimed(claimedRef.current);
      AsyncStorage.setItem(CLAIMED_KEY, JSON.stringify(claimedRef.current)).catch(() => {});
      addEarnings(rewardOf(def));
      playMerge('gold');
      return true;
    },
    [addEarnings]
  );

  const unlock = useCallback((id: string) => {
    if (unlockedRef.current.includes(id)) return;
    unlockedRef.current = [...unlockedRef.current, id];
    setUnlocked(unlockedRef.current);
    AsyncStorage.setItem(ACH_KEY, JSON.stringify(unlockedRef.current)).catch(() => {});
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) {
      playMerge('gold');
      setToast(def);
      setTimeout(() => setToast((cur) => (cur?.id === def.id ? null : cur)), 2800);
    }
  }, []);

  // Ekonomiye bağlı başarımlar burada, ekranlardan bağımsız izlenir
  useEffect(() => {
    if (owned.length >= 1) unlock('anahtar');
    if (owned.includes('arsa')) unlock('agalik');
    if (PLACED_ITEMS.every((i) => owned.includes(i.id))) unlock('kral');
  }, [owned, unlock]);

  useEffect(() => {
    if (wallet >= 1_000_000) unlock('milyoner');
    if (wallet >= 10_000_000) unlock('holding');
  }, [wallet, unlock]);

  const reportBoard = useCallback(
    (levels: number[]) => {
      let max = 0;
      let kulceCount = 0;
      let goldCount = 0;
      let gemCount = 0;
      const distinct = new Set<number>();
      for (const lv of levels) {
        if (lv > max) max = lv;
        if (lv >= KULCE_LEVEL) kulceCount++;
        if (lv >= 9) goldCount++;
        if (lv >= 13 && lv <= 18) gemCount++; // Yeşim…Pembe Elmas
        distinct.add(lv);
      }
      if (max >= 8) unlock('dolar');
      if (max >= 9) unlock('altin');
      if (max >= KULCE_LEVEL) unlock('kulce');
      if (kulceCount >= 2) unlock('ciftekulce');
      if (goldCount >= 4) unlock('altincag');
      if (distinct.size >= KULCE_LEVEL) unlock('numizmat');
      // Efsanevi: zincirin mücevher/kripto/epik ucu
      if (max >= 13) unlock('kuyumcu');
      if (gemCount >= 3) unlock('mucevherkutusu');
      if (max >= 19) unlock('elmaseller');
      if (max >= 20) unlock('sogukdepo');
      if (max >= 21) unlock('define');
      if (max >= MAX_LEVEL) unlock('dunyanin');
    },
    [unlock]
  );

  const reportCombo = useCallback(
    (mult: number, streak: number) => {
      if (mult >= 5) unlock('zincir');
      if (mult >= 10) unlock('efsane');
      if (streak >= 15) unlock('serimanyagi');
    },
    [unlock]
  );

  const reportGameEarned = useCallback(
    (tl: number) => {
      if (tl >= 100_000) unlock('boga');
      if (tl >= 1_000_000) unlock('hiper');
    },
    [unlock]
  );

  const resetAchievements = useCallback(() => {
    unlockedRef.current = [];
    claimedRef.current = [];
    setUnlocked([]);
    setClaimed([]);
    setToast(null);
    AsyncStorage.multiRemove([ACH_KEY, CLAIMED_KEY]).catch(() => {});
  }, []);

  const claimable = unlocked.filter((id) => !claimed.includes(id)).length;

  return (
    <Ctx.Provider value={{ unlocked, claimed, claimable, claim, reportBoard, reportCombo, reportGameEarned, resetAchievements }}>
      <View style={styles.fill}>
        {children}
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(260)}
            exiting={FadeOutUp.duration(220)}
            style={styles.toast}
            pointerEvents="none"
          >
            <View style={styles.toastBadge}>
              <BadgeSvg id={toast.id} tier={toast.tier} locked={false} size={40} />
            </View>
            <View style={styles.toastText}>
              <Text style={styles.toastTitle}>Başarım açıldı!</Text>
              <Text style={styles.toastName}>{toast.title}</Text>
              <Text style={styles.toastReward}>Ödül: {formatTL(rewardOf(toast))} · Başarımlar’dan al</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Ctx.Provider>
  );
}

export function useAchievements(): AchApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('AchievementsProvider eksik');
  return v;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  toast: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#26332C',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 100,
    shadowColor: '#26332C',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  toastBadge: { width: 40, height: 44 },
  toastText: {},
  toastTitle: { color: '#9DBBA9', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  toastReward: { color: '#F6B93B', fontSize: 11, fontWeight: '800', marginTop: 1 },
  toastName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

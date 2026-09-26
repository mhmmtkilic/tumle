import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initMusic, setHapticsEnabled, setMusicEnabled, setSoundEnabled } from '../audio';

const SETTINGS_KEY = '@gamemoney/settings';

interface Settings {
  soundOn: boolean;
  musicOn: boolean;
  hapticsOn: boolean;
  setSoundOn: (v: boolean) => void;
  setMusicOn: (v: boolean) => void;
  setHapticsOn: (v: boolean) => void;
}

const Ctx = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [soundOn, _setSoundOn] = useState(true);
  const [musicOn, _setMusicOn] = useState(true);
  const [hapticsOn, _setHapticsOn] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (!raw) return;
        const s = JSON.parse(raw);
        if (typeof s.soundOn === 'boolean') {
          _setSoundOn(s.soundOn);
          setSoundEnabled(s.soundOn);
        }
        if (typeof s.musicOn === 'boolean') {
          _setMusicOn(s.musicOn);
          setMusicEnabled(s.musicOn);
        }
        if (typeof s.hapticsOn === 'boolean') {
          _setHapticsOn(s.hapticsOn);
          setHapticsEnabled(s.hapticsOn);
        }
      })
      .catch(() => {})
      .finally(() => {
        // Ayar okunduktan sonra başlat: müzik kapalıysa açılışta çalıp susmaz
        initMusic();
      });
  }, []);

  const persist = useCallback(
    (next: { soundOn: boolean; musicOn: boolean; hapticsOn: boolean }) => {
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
    },
    []
  );

  const setSoundOn = useCallback(
    (v: boolean) => {
      _setSoundOn(v);
      setSoundEnabled(v);
      persist({ soundOn: v, musicOn, hapticsOn });
    },
    [musicOn, hapticsOn, persist]
  );

  const setMusicOn = useCallback(
    (v: boolean) => {
      _setMusicOn(v);
      setMusicEnabled(v);
      persist({ soundOn, musicOn: v, hapticsOn });
    },
    [soundOn, hapticsOn, persist]
  );

  const setHapticsOn = useCallback(
    (v: boolean) => {
      _setHapticsOn(v);
      setHapticsEnabled(v);
      persist({ soundOn, musicOn, hapticsOn: v });
    },
    [soundOn, musicOn, persist]
  );

  return (
    <Ctx.Provider value={{ soundOn, musicOn, hapticsOn, setSoundOn, setMusicOn, setHapticsOn }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings(): Settings {
  const v = useContext(Ctx);
  if (!v) throw new Error('SettingsProvider eksik');
  return v;
}

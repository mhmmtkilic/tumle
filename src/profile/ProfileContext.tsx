import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarConfig, DEFAULT_AVATAR, sanitizeAvatar } from './avatar';

const PROFILE_KEY = '@gamemoney/profile';
export const NAME_MAX = 16;

interface Profile {
  /** Kayıtlı (ana ekranda, sıralamada görünen) ad ve avatar */
  name: string;
  avatar: AvatarConfig;
  /**
   * Profil ve avatar sayfasında düzenlenen taslak: "Kaydet"e basılana kadar
   * kayıtlı profili değiştirmez
   */
  draft: { name: string; avatar: AvatarConfig };
  setDraftName: (v: string) => void;
  setDraftAvatar: (v: AvatarConfig) => void;
  /** Taslak kayıtlıdan farklı mı */
  dirty: boolean;
  save: () => void;
  /** Taslağı kayıtlı profile geri döndürür */
  discard: () => void;
}

const Ctx = createContext<Profile | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [name, _setName] = useState('');
  const [avatar, _setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const ref = useRef({ name: '', avatar: DEFAULT_AVATAR });
  const hydratedRef = useRef(false);

  const persist = useCallback(() => {
    // Diskten okuma bitmeden yazma: kayıtlı profil varsayılanla ezilmesin
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(ref.current)).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY)
      .then((raw) => {
        if (!raw) return;
        const s = JSON.parse(raw);
        ref.current = {
          name: typeof s.name === 'string' ? s.name.slice(0, NAME_MAX) : '',
          avatar: sanitizeAvatar(s.avatar),
        };
        _setName(ref.current.name);
        _setAvatar(ref.current.avatar);
      })
      .catch(() => {})
      .finally(() => {
        hydratedRef.current = true;
      });
  }, []);

  const setName = useCallback(
    (v: string) => {
      ref.current = { ...ref.current, name: v.slice(0, NAME_MAX) };
      _setName(ref.current.name);
      persist();
    },
    [persist]
  );

  const setAvatar = useCallback(
    (v: AvatarConfig) => {
      ref.current = { ...ref.current, avatar: v };
      _setAvatar(v);
      persist();
    },
    [persist]
  );

  const [draft, setDraft] = useState({ name: '', avatar: DEFAULT_AVATAR });
  // Diskten okunan profil taslağa da geçer
  useEffect(() => setDraft({ name, avatar }), [name, avatar]);

  const setDraftName = useCallback((v: string) => setDraft((d) => ({ ...d, name: v.slice(0, NAME_MAX) })), []);
  const setDraftAvatar = useCallback((v: AvatarConfig) => setDraft((d) => ({ ...d, avatar: v })), []);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const save = useCallback(() => {
    setName(draftRef.current.name.trim());
    setAvatar(draftRef.current.avatar);
  }, [setName, setAvatar]);
  const discard = useCallback(() => setDraft({ name: ref.current.name, avatar: ref.current.avatar }), []);
  const dirty = draft.name.trim() !== name.trim() || JSON.stringify(draft.avatar) !== JSON.stringify(avatar);

  const value = useMemo<Profile>(
    () => ({ name, avatar, draft, setDraftName, setDraftAvatar, dirty, save, discard }),
    [name, avatar, draft, setDraftName, setDraftAvatar, dirty, save, discard]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile(): Profile {
  const v = useContext(Ctx);
  if (!v) throw new Error('ProfileProvider eksik');
  return v;
}

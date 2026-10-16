import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import AvatarView from '../components/AvatarView';
import { CheckIcon, PencilIcon, ShuffleIcon } from '../components/icons';
import ConfirmModal from '../components/ConfirmModal';
import GameToast from '../ui/game/GameToast';
import ChunkyButton from '../ui/game/ChunkyButton';
import GameStats from '../ui/game/GameStats';
import GameTopBar from '../ui/game/GameTopBar';
import { ACHIEVEMENTS } from '../achievements/defs';
import { useAchievements } from '../achievements/AchievementsContext';
import { useEconomy } from '../economy/EconomyContext';
import { ITEMS } from '../economy/items';
import { formatTL } from '../game/levels';
import { randomAvatar } from '../profile/avatar';
import { NAME_MAX, useProfile } from '../profile/ProfileContext';
import { useSettings } from '../settings/SettingsContext';
import { colors, panelStyle, radius, space, type } from '../ui/theme';

interface Props {
  onBack: () => void;
  /** Avatar düzenleme sayfasını aç */
  onEditAvatar: () => void;
  /** App'in donanım geri tuşu bu ekrandayken buradaki işlevi çağırır */
  backRef: React.RefObject<(() => void) | null>;
}

/**
 * Profil: ad ve avatar bir TASLAK üzerinde düzenlenir (avatar sayfası da aynı
 * taslağı düzenler); "Kaydet" ile kalıcı olur. Kaydetmeden çıkarken sorulur.
 */
export default function ProfileScreen({ onBack, onEditAvatar, backRef }: Props) {
  const { width } = useWindowDimensions();
  const { draft, setDraftName, setDraftAvatar, dirty, save, discard } = useProfile();
  const { name, avatar } = draft;
  const [asking, setAsking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { wallet, owned } = useEconomy();
  const { unlocked } = useAchievements();
  const { hapticsOn } = useSettings();

  const ownedCount = ITEMS.filter((i) => owned.includes(i.id)).length;
  const bigSize = Math.min(width * 0.52, 220);

  const tick = () => {
    if (hapticsOn) Haptics.selectionAsync();
  };

  const shuffle = () => {
    tick();
    setDraftAvatar(randomAvatar());
  };

  const onSave = () => {
    save();
    if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast('Profil kaydedildi');
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  const back = () => {
    if (dirty) setAsking(true);
    else onBack();
  };
  const backFn = useRef(back);
  backFn.current = back;
  useEffect(() => {
    backRef.current = () => backFn.current();
  }, [backRef]);

  return (
    <View style={styles.root}>
      <GameTopBar title="Profil" onBack={back} style={styles.bar} />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={onEditAvatar} style={[styles.avatarFrame, { width: bigSize + 12, height: bigSize + 12, borderRadius: (bigSize + 12) / 2 }]}>
          <View style={{ width: bigSize, height: bigSize, borderRadius: bigSize / 2, overflow: 'hidden' }}>
            <AvatarView config={avatar} size={bigSize} />
          </View>
          <View style={styles.editBadge} pointerEvents="none">
            <PencilIcon size={22} />
          </View>
        </Pressable>

        <TextInput
          value={name}
          onChangeText={setDraftName}
          placeholder="Adını yaz"
          placeholderTextColor={colors.tertiaryLabel}
          maxLength={NAME_MAX}
          style={styles.nameInput}
          returnKeyType="done"
          autoCorrect={false}
        />

        <View style={styles.actions}>
          <ChunkyButton label="Avatarı Düzenle" skin="green" icon={<PencilIcon size={24} />} onPress={onEditAvatar} style={styles.flex1} />
          <ChunkyButton label="Karıştır" square skin="blue" icon={<ShuffleIcon size={28} />} onPress={shuffle} />
        </View>

        <ChunkyButton
          label={dirty ? 'KAYDET' : 'KAYDEDİLDİ'}
          size="large"
          skin="green"
          disabled={!dirty}
          icon={<CheckIcon size={30} />}
          onPress={onSave}
          style={styles.save}
        />

        <GameStats
          style={styles.stats}
          items={[
            { label: 'Birikim', value: formatTL(wallet) },
            { label: 'Eşya', value: `${ownedCount}/${ITEMS.length}` },
            { label: 'Başarım', value: `${unlocked.length}/${ACHIEVEMENTS.length}` },
          ]}
        />
      </ScrollView>

      {toast ? <GameToast key={toast} text={toast} style={styles.toast} /> : null}

      <ConfirmModal
        visible={asking}
        title="Kaydedilsin mi?"
        message="Profilinde kaydedilmemiş değişiklikler var."
        confirmLabel="Kaydet"
        cancelLabel="Kaydetme"
        confirmSkin="green"
        onConfirm={() => {
          setAsking(false);
          save();
          onBack();
        }}
        onCancel={() => {
          setAsking(false);
          discard();
          onBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.l },
  bar: { marginBottom: space.s },
  body: { alignItems: 'center', paddingBottom: space.xxl },
  avatarFrame: {
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.s,
  },
  editBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFC531',
    borderWidth: 3,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    ...type.title2,
    marginTop: space.l,
    minWidth: 200,
    textAlign: 'center',
    color: colors.label,
    ...panelStyle,
    paddingVertical: space.xs,
    paddingHorizontal: space.l,
  },
  actions: { flexDirection: 'row', gap: space.m, width: '100%', maxWidth: 420, marginTop: space.xl },
  flex1: { flex: 1 },
  save: { width: '100%', maxWidth: 420, marginTop: space.l },
  stats: { width: '100%', maxWidth: 420, marginTop: space.l },
  toast: { bottom: space.l },
});

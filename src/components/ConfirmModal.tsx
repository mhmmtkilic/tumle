import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';
import ChunkyButton from '../ui/game/ChunkyButton';
import GameDialog from '../ui/game/GameDialog';
import { Skin } from '../ui/game/skins';
import { colors, space, type } from '../ui/theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  /** Silinecek şeylerin kısa listesi */
  items?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  /** Onay butonunun rengi (silme: kırmızı, kaydetme: yeşil) */
  confirmSkin?: Skin;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Oyun diyaloğu: altın çerçeveli pencere, kurdele başlık, altta iki kalın buton (vazgeç / onayla) */
export default function ConfirmModal({
  visible,
  title,
  message,
  items,
  confirmLabel = 'Evet',
  cancelLabel = 'Vazgeç',
  confirmSkin = 'red',
  onConfirm,
  onCancel,
}: Props) {
  if (!visible) return null;
  return (
    <Modal transparent statusBarTranslucent visible animationType="none" onRequestClose={onCancel}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View entering={ZoomIn.duration(200).easing(Easing.out(Easing.cubic))} style={styles.card}>
          <GameDialog title={title} tone={confirmSkin === 'red' ? 'red' : 'blue'} onClose={onCancel}>
          <View style={styles.body}>
            <Text style={styles.message}>{message}</Text>
            {items && items.length > 0 ? (
              <View style={styles.list}>
                {items.map((it) => (
                  <Text key={it} style={styles.listText}>
                    • {it}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.actions}>
            <ChunkyButton label={cancelLabel} skin="gray" size="small" onPress={onCancel} style={styles.flex1} />
            <ChunkyButton label={confirmLabel} skin={confirmSkin} size="small" onPress={onConfirm} style={styles.flex1} />
          </View>
          </GameDialog>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
  },
  card: { width: '100%', maxWidth: 340, alignItems: 'center' },
  body: { alignItems: 'center', alignSelf: 'stretch' },
  message: { ...type.callout, color: colors.label, textAlign: 'center', lineHeight: 21 },
  list: { alignSelf: 'stretch', marginTop: space.m, gap: 3 },
  listText: { ...type.subhead, color: colors.label },
  actions: { flexDirection: 'row', gap: space.s, marginTop: space.l, alignSelf: 'stretch' },
  flex1: { flex: 1 },
});

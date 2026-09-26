import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import GameButton from './GameButton';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  /** Silinecek şeylerin kısa listesi; her satırın önüne ✕ konur */
  items?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function WarnIcon({ size = 56 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      <Circle cx={50} cy={54} r={44} fill="rgba(0,0,0,0.12)" />
      <Circle cx={50} cy={50} r={44} fill="#E2604A" />
      <Circle cx={50} cy={50} r={44} fill="none" stroke="#A83E2C" strokeWidth={5} />
      <Path d="M50 26 L50 58" stroke="#FFFFFF" strokeWidth={11} strokeLinecap="round" />
      <Circle cx={50} cy={72} r={6} fill="#FFFFFF" />
    </Svg>
  );
}

/** Oyun stiline uygun onay diyaloğu: karartılmış zemin, zıplayarak gelen kart */
export default function ConfirmModal({
  visible,
  title,
  message,
  items,
  confirmLabel = 'Evet',
  cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
}: Props) {
  if (!visible) return null;
  return (
    <Modal transparent statusBarTranslucent visible animationType="none" onRequestClose={onCancel}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        {/* Sadece açılış animasyonu: taşma/sekme olmadan tam boyuta büyür, kapanış animasyonsuz */}
        <Animated.View entering={ZoomIn.duration(200).easing(Easing.out(Easing.cubic))} style={styles.card}>
          <View style={styles.iconWrap}>
            <WarnIcon />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {items && items.length > 0 ? (
            <View style={styles.list}>
              {items.map((it) => (
                <View key={it} style={styles.listRow}>
                  <Text style={styles.listX}>✕</Text>
                  <Text style={styles.listText}>{it}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.buttons}>
            <GameButton label={cancelLabel} size="md" variant="white" onPress={onCancel} style={styles.flex1} />
            <GameButton label={confirmLabel} size="md" variant="red" onPress={onConfirm} style={styles.flex1} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,30,24,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#DFE8E2',
    paddingHorizontal: 22,
    paddingBottom: 20,
    paddingTop: 34,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  iconWrap: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#26332C',
    textAlign: 'center',
    marginTop: 4,
  },
  message: {
    fontSize: 14.5,
    color: '#66766D',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  list: {
    alignSelf: 'stretch',
    backgroundColor: '#F6F1EC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
    gap: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listX: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E2604A',
  },
  listText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#4E5B53',
    flexShrink: 1,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 18,
  },
  flex1: { flex: 1 },
});

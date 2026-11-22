import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { PlusIcon } from '../../components/icons';
import Ribbon from './Ribbon';
import { OUTLINE } from './skins';

interface Props {
  title: string;
  tone?: 'red' | 'blue' | 'green';
  /** Verilirse sağ üstte kırmızı yuvarlak kapatma butonu çıkar */
  onClose?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

/** Beyaz çarpı: artı simgesi 45° döndürülür (kırmızı zeminde kırmızı çarpı görünmez) */
const X_ICON = (
  <View style={{ transform: [{ rotate: '45deg' }] }}>
    <PlusIcon size={24} />
  </View>
);

/**
 * Açılır pencere çerçevesi: altın kenarlı kalın çerçeve, içte mavi panel,
 * üst kenara oturan başlık kurdelesi, sağ üstte kırmızı yuvarlak kapatma.
 */
function GameDialog({ title, tone = 'red', onClose, children, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.rim}>
        <View style={styles.inner}>{children}</View>
      </View>
      <View style={styles.ribbon} pointerEvents="none">
        <Ribbon title={title} tone={tone} size={22} />
      </View>
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kapat" style={styles.closeWrap}>
          {({ pressed }) => <View style={[styles.close, pressed && styles.pressed]}>{X_ICON}</View>}
        </Pressable>
      ) : null}
    </View>
  );
}

export default React.memo(GameDialog);

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 360, paddingTop: 24 },
  rim: {
    borderRadius: 26,
    borderWidth: 3,
    borderColor: OUTLINE,
    padding: 5,
    backgroundColor: '#F2B12A',
    backgroundImage: 'linear-gradient(#FFE58A, #E9A11A 50%, #C97A0C)',
    boxShadow: `0 6px 0 ${OUTLINE}`,
  },
  inner: {
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: OUTLINE,
    backgroundColor: '#24468A',
    backgroundImage: 'linear-gradient(#2F5BA8, #1D3B7A)',
    boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.15)',
    paddingTop: 38,
    paddingHorizontal: 18,
    paddingBottom: 18,
    alignItems: 'center',
  },
  ribbon: { position: 'absolute', top: 0, left: 16, right: 16, alignItems: 'center' },
  closeWrap: { position: 'absolute', top: 10, right: -10 },
  close: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    borderColor: OUTLINE,
    backgroundColor: '#E8413A',
    backgroundImage: 'linear-gradient(#FF8A7A, #E8413A 60%, #C42F29)',
    boxShadow: `inset 0 3px 0 rgba(255,255,255,0.35), 0 3px 0 ${OUTLINE}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.92 }] },
});

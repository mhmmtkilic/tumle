import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ChevronLeftIcon } from '../../components/icons';
import ChunkyButton from './ChunkyButton';
import Ribbon from './Ribbon';

/**
 * Oyun ekranlarının üst barı: solda kalın geri butonu, ortada konturlu oyun
 * fontuyla başlık, sağda isteğe bağlı buton(lar). Ana menüyle aynı görsel dil.
 */
export default function GameTopBar({ title, onBack, right, style }: { title: string; onBack?: () => void; right?: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.side}>
        {/* Sekmeli ekranlarda geri butonu yok: gezinme alt çubuktan */}
        {onBack ? <ChunkyButton label="Geri" square skin="blue" onPress={onBack} icon={<ChevronLeftIcon size={26} color="#FFFFFF" />} /> : null}
      </View>
      <View style={styles.title}>
        <Ribbon title={title} />
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { width: 64 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, alignItems: 'center' },
});

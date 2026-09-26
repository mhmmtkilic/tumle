import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import GameButton from '../components/GameButton';
import { useAchievements } from '../achievements/AchievementsContext';
import { useCityLayout } from '../city/LayoutContext';
import { useEconomy } from '../economy/EconomyContext';
import { useSettings } from '../settings/SettingsContext';
import { clearSavedGame } from '../useGame';

interface Props {
  onBack: () => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.track, value && styles.trackOn]}
      hitSlop={8}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

export default function SettingsScreen({ onBack }: Props) {
  const { soundOn, musicOn, hapticsOn, setSoundOn, setMusicOn, setHapticsOn } = useSettings();
  const { resetProgress } = useEconomy();
  const { resetLayout } = useCityLayout();
  const { resetAchievements } = useAchievements();
  const [askReset, setAskReset] = useState(false);

  const doReset = () => {
    setAskReset(false);
    resetProgress();
    resetLayout();
    resetAchievements();
    clearSavedGame();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <GameButton label="‹" size="sm" variant="white" onPress={onBack} textStyle={styles.backIcon} />
        <View style={styles.titleWrap} pointerEvents="none">
          <Text style={styles.title}>Ayarlar</Text>
        </View>
        <View style={{ width: 46 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Ses Efektleri</Text>
            <Text style={styles.rowDesc}>Metal şıkırtısı, kağıt hışırtısı, cha-ching</Text>
          </View>
          <Toggle value={soundOn} onChange={setSoundOn} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Müzik</Text>
            <Text style={styles.rowDesc}>Arkaplanda çalan neşeli melodi</Text>
          </View>
          <Toggle value={musicOn} onChange={setMusicOn} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Titreşim</Text>
            <Text style={styles.rowDesc}>Hamle ve birleşmelerde dokunsal geri bildirim</Text>
          </View>
          <Toggle value={hapticsOn} onChange={setHapticsOn} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowTitle}>İlerlemeyi Sıfırla</Text>
        <Text style={styles.rowDesc}>Birikim, eşyalar, başarımlar ve devam eden oyun dahil her şeyi siler. Geri alınamaz.</Text>
        <GameButton label="Sıfırla" size="md" variant="red" onPress={() => setAskReset(true)} style={styles.resetBtn} />
      </View>

      <ConfirmModal
        visible={askReset}
        title="Her Şey Sıfırlansın mı?"
        message="Bu işlem geri alınamaz. Şunlar kalıcı olarak silinecek:"
        items={[
          'Birikimin (cüzdan)',
          'Satın aldığın tüm eşyalar',
          'Mahalle yerleşimin',
          'Kazandığın başarımlar',
          'Devam eden oyunun',
        ]}
        confirmLabel="Sıfırla"
        cancelLabel="Vazgeç"
        onConfirm={doReset}
        onCancel={() => setAskReset(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  backIcon: { fontSize: 22, lineHeight: 24 },
  titleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#26332C' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DFE8E2',
    padding: 16,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: { flexShrink: 1 },
  rowTitle: { fontSize: 16, fontWeight: '800', color: '#26332C' },
  rowDesc: { fontSize: 12.5, color: '#66766D', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#EDF2ED', marginVertical: 14 },
  resetBtn: { marginTop: 12 },
  track: {
    width: 54,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C3D2C8',
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: '#4FB477' },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  knobOn: { alignSelf: 'flex-end' },
});

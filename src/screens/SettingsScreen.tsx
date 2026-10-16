import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import { MusicIcon, SpeakerIcon, TrashIcon, VibrateIcon } from '../components/icons';
import GameTopBar from '../ui/game/GameTopBar';
import GameToggle from '../ui/game/GameToggle';
import { Row, Section } from '../ui/game/GameList';
import { useAchievements } from '../achievements/AchievementsContext';
import { useCityLayout } from '../city/LayoutContext';
import { useEconomy } from '../economy/EconomyContext';
import { useSettings } from '../settings/SettingsContext';
import { clearSavedGame } from '../useGame';
import { space } from '../ui/theme';

interface Props {
  onBack: () => void;
}

const ICON = { size: 22, color: '#FFFFFF' };

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
    <ScrollView style={styles.root} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <GameTopBar title="Ayarlar" onBack={onBack} style={styles.bar} />

      <Section header="Ses ve dokunuş">
        <Row
          title="Ses Efektleri"
          subtitle="Metal şıkırtısı, kağıt hışırtısı, cha-ching"
          icon={<SpeakerIcon muted={!soundOn} {...ICON} />}
          iconBg="#2E8CF0"
          right={<GameToggle label="Ses efektleri" value={soundOn} onChange={setSoundOn} />}
        />
        <Row
          title="Müzik"
          subtitle="Arkaplanda çalan neşeli melodi"
          icon={<MusicIcon muted={!musicOn} {...ICON} />}
          iconBg="#B05CFF"
          right={<GameToggle label="Müzik" value={musicOn} onChange={setMusicOn} />}
        />
        <Row
          title="Titreşim"
          subtitle="Hamle ve birleşmelerde dokunsal geri bildirim"
          icon={<VibrateIcon {...ICON} />}
          iconBg="#FF8A3D"
          right={<GameToggle label="Titreşim" value={hapticsOn} onChange={setHapticsOn} />}
        />
      </Section>

      <Section footer="Birikim, eşyalar, başarımlar ve devam eden oyun dahil her şeyi siler. Geri alınamaz.">
        <Row title="İlerlemeyi Sıfırla" icon={<TrashIcon {...ICON} />} destructive onPress={() => setAskReset(true)} />
      </Section>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: space.l, paddingBottom: space.xxl },
  bar: { marginBottom: space.l },
});

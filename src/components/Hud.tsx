import React from 'react';
import { StyleSheet, View } from 'react-native';
import ChunkyButton from '../ui/game/ChunkyButton';
import GameStats from '../ui/game/GameStats';
import { ChevronLeftIcon, RestartIcon } from './icons';
import { formatTL } from '../game/levels';
import { space } from '../ui/theme';

interface Props {
  earned: number;
  total: number;
  onRestart: () => void;
  onBack?: () => void;
}

// Sabit ikon elemanları: önbellekli butonlar her hamlede yeniden çizilmesin
const BACK_ICON = <ChevronLeftIcon size={22} />;
const RESTART_ICON = <RestartIcon size={22} />;

function Hud({ earned, total, onRestart, onBack }: Props) {
  return (
    <View style={styles.root}>
      {onBack ? (
        <ChunkyButton label="Geri" square size="small" skin="blue" onPress={onBack} icon={BACK_ICON} />
      ) : null}
      <GameStats
        style={styles.stats}
        items={[
          { label: 'Bu oyun', value: formatTL(earned) },
          { label: 'Birikim', value: formatTL(total) },
        ]}
      />
      <ChunkyButton label="Yeniden başla" square size="small" skin="yellow" onPress={onRestart} icon={RESTART_ICON} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: space.s,
    marginBottom: space.l,
  },
  stats: { flex: 1 },
});

export default React.memo(Hud);

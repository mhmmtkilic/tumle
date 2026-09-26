import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameButton from './GameButton';
import { formatTL } from '../game/levels';

interface Props {
  earned: number;
  total: number;
  onRestart: () => void;
  onBack?: () => void;
}

export default function Hud({ earned, total, onRestart, onBack }: Props) {
  return (
    <View style={styles.root}>
      {onBack ? <GameButton label="‹" size="sm" variant="white" onPress={onBack} textStyle={styles.icon} /> : null}
      <View style={styles.box}>
        <Text style={styles.label}>BU OYUN</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formatTL(earned)}
        </Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.label}>BİRİKİM</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formatTL(total)}
        </Text>
      </View>
      <GameButton label="↺" size="sm" variant="green" onPress={onRestart} textStyle={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 14,
  },
  box: {
    flex: 1,
    backgroundColor: '#E3EAE4',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#66766D',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#26332C',
    fontVariant: ['tabular-nums'],
  },
  icon: {
    fontSize: 22,
    lineHeight: 24,
  },
});

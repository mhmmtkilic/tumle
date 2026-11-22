import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ITEMS } from '../economy/items';
import { missingRequirements } from '../economy/progress';
import { formatWorth } from '../leaderboard/rivals';
import OutlineText from '../ui/game/OutlineText';
import { OUTLINE } from '../ui/game/skins';
import { BODY_FONT_HEAVY } from '../ui/theme';
import { ITEM_ART } from './ItemArt';

interface Props {
  owned: readonly string[];
  wallet: number;
  onPress: () => void;
}

/**
 * Ana sayfanın hedef kartı: sıradaki eşya, kazandıracağı etki ve cüzdanın o
 * fiyata ne kadar yaklaştığı. Oyuncuya her açılışta "şunun için oyna" der.
 * Hedef, ön şartı tamam olan alınmamış en ucuz eşyadır: arsaya bağlı ucuz eşyalar
 * listede arsadan önce durur ama arsa alınana dek gizlidir, hedef olarak gösterilmez.
 */
function NextItemCard({ owned, wallet, onPress }: Props) {
  const next = ITEMS.find((i) => !owned.includes(i.id) && missingRequirements(owned, i).length === 0);
  const Art = next ? ITEM_ART[next.id] : null;
  const ratio = next ? Math.min(1, wallet / next.price) : 1;
  const ready = !!next && ratio >= 1;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={next ? `Sıradaki eşya: ${next.name}` : 'Mahalle tamamlandı'}>
      {({ pressed }) => (
        <View style={[styles.frame, pressed && styles.pressed]}>
          <View style={styles.inner}>
            <View style={styles.pic}>{Art ? <Art /> : null}</View>
            <View style={styles.txt}>
              <Text style={styles.kicker}>{next ? (ready ? 'ALMAYA HAZIR!' : 'SIRADAKİ EŞYA') : 'MAHALLE TAMAMLANDI'}</Text>
              <OutlineText size={17} strokeWidth={2.5} depth={1.5} style={styles.left}>
                {next ? next.name : 'Bütün eşyalar senin!'}
              </OutlineText>
              {next ? (
                <View style={styles.bar}>
                  <View style={[styles.fill, { width: `${Math.max(ratio, 0.06) * 100}%` }, ready && styles.fillReady]} />
                  <OutlineText size={12.5} strokeWidth={2} depth={1} containerStyle={styles.barText}>
                    {ready ? 'Mağazaya git' : `${formatWorth(wallet)} / ${formatWorth(next.price)}`}
                  </OutlineText>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default React.memo(NextItemCard);

const styles = StyleSheet.create({
  frame: {
    borderRadius: 18,
    borderWidth: 2.5,
    borderBottomWidth: 6,
    borderColor: OUTLINE,
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.98 }] },
  inner: {
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 6,
    paddingRight: 12,
    backgroundColor: '#26498F',
    backgroundImage: 'linear-gradient(#2F5BA8, #1D3B7A)',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.15)',
  },
  pic: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: OUTLINE,
    backgroundColor: '#E6F3FF',
    backgroundImage: 'radial-gradient(#FFFFFF, #CFE8FF)',
    padding: 4,
  },
  txt: { flex: 1, gap: 1 },
  kicker: { fontFamily: BODY_FONT_HEAVY, fontSize: 11, letterSpacing: 0.4, color: '#BFE3FF' },
  left: { textAlign: 'left' },
  bar: {
    height: 20,
    marginTop: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0B1230',
    backgroundColor: '#0E1A3D',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: '#4CC22A',
    backgroundImage: 'linear-gradient(#A6F06A, #47B82B)',
    boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.35)',
  },
  fillReady: { backgroundImage: 'linear-gradient(#FFE36B, #FFB21E)' },
  barText: { marginTop: -1 },
});

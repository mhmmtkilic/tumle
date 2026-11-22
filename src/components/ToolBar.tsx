import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import ChunkyButton from '../ui/game/ChunkyButton';
import OutlineText from '../ui/game/OutlineText';
import { OUTLINE } from '../ui/game/skins';
import { HammerIcon, HouseIcon, UndoIcon } from './icons';
import { formatMult, Tool, TOOL_NAMES } from '../economy/items';
import { BODY_FONT_HEAVY, GAME_FONT, space } from '../ui/theme';

interface Props {
  /** Mahalle eşyalarının toplam kazanç çarpanı (eşyasız 1) */
  mult: number;
  /** Sahip olunan araç hakları (oyun başına) */
  charges: Record<Tool, number>;
  undoLeft: number;
  hammerLeft: number;
  canUndo: boolean;
  canHammer: boolean;
  hammering: boolean;
  onUndo: () => void;
  onHammer: () => void;
  onCancelHammer: () => void;
}

const ICONS: Record<Tool, React.ReactNode> = { undo: <UndoIcon size={34} />, hammer: <HammerIcon size={34} /> };
const HOUSE = <HouseIcon size={28} />;
/** Araç kutusunun iç rengi */
const FACE: Record<Tool, string> = {
  undo: 'linear-gradient(#9BEA62, #43B52A)',
  hammer: 'linear-gradient(#8FD6FF, #2E8CF0)',
};

/**
 * Güçlendirici kutusu: altın kenarlı kare, içinde aracın ikonu, sağ altta
 * kalan hak; hakkı bitince soluk. Yalnız sahip olunan araçlar için çizilir.
 */
function ToolTile({ tool, left, onPress }: { tool: Tool; left: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${TOOL_NAMES[tool]}, ${left} hak`}>
      {({ pressed }) => (
        <View style={[styles.tile, pressed && styles.pressed]}>
          <View style={[styles.tileFace, { backgroundImage: FACE[tool] }, left === 0 && styles.faceSpent]}>
            <View style={styles.tileLight} />
            {ICONS[tool]}
          </View>
          <View style={[styles.count, left === 0 && styles.countEmpty]}>
            <Text style={styles.countText}>{left}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Tahtanın altı: mahalle kazanç çarpanı + oyun araçları (Geri Al, Çekiç). Henüz satın
 * alınmamış araç hiç gösterilmez; ne çarpan ne araç varsa çubuk da çizilmez.
 */
function ToolBar({ mult, charges, undoLeft, hammerLeft, canUndo, canHammer, hammering, onUndo, onHammer, onCancelHammer }: Props) {
  const [hint, setHint] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const flash = (text: string) => {
    setHint(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHint(null), 2200);
  };

  const press = (tool: Tool, left: number, usable: boolean, run: () => void) => () => {
    if (left === 0) flash(`${TOOL_NAMES[tool]} hakkın bu oyunda bitti`);
    else if (!usable) flash(tool === 'undo' ? 'Geri alınacak hamle yok' : 'Tahtada kırılacak taş yok');
    else run();
  };

  if (hammering) {
    return (
      <Animated.View entering={FadeIn.duration(140)} style={styles.row}>
        <View style={[styles.bonus, styles.flex1]}>
          <OutlineText size={16} strokeWidth={2.5} depth={1}>
            Kırmak istediğin taşa dokun
          </OutlineText>
        </View>
        <ChunkyButton label="Vazgeç" size="small" skin="red" onPress={onCancelHammer} />
      </Animated.View>
    );
  }

  if (mult <= 1 && charges.undo === 0 && charges.hammer === 0) return null;

  return (
    <View>
      <View style={styles.row}>
        {/* Mahalle çarpanı yalnız varsa: küçük hap (ev + ×N). Yokken boşluk kalır, araçlar sağda */}
        <View style={styles.flex1}>
          {mult > 1 ? (
            <View style={styles.bonusChip} accessibilityLabel={`Mahalle kazanç çarpanı ${formatMult(mult)}`}>
              {HOUSE}
              <OutlineText size={18} strokeWidth={2.5} depth={1} color="#B8F59A">
                {formatMult(mult)}
              </OutlineText>
            </View>
          ) : null}
        </View>
        {charges.undo > 0 ? <ToolTile tool="undo" left={undoLeft} onPress={press('undo', undoLeft, canUndo, onUndo)} /> : null}
        {charges.hammer > 0 ? <ToolTile tool="hammer" left={hammerLeft} onPress={press('hammer', hammerLeft, canHammer, onHammer)} /> : null}
      </View>
      {hint ? (
        <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(140)} style={styles.hint} pointerEvents="none">
          <View style={styles.hintBubble}>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default React.memo(ToolBar);

const TILE = 60;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m, marginTop: space.l },
  flex1: { flex: 1 },
  bonus: {
    height: TILE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#0D1533',
    backgroundColor: '#1A2854',
    backgroundImage: 'linear-gradient(#22346A, #15224A)',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.12)',
    paddingHorizontal: space.s,
  },
  bonusChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#0D1533',
    backgroundColor: '#1A2854',
    backgroundImage: 'linear-gradient(#22346A, #15224A)',
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: OUTLINE,
    padding: 3,
    backgroundColor: '#F2B12A',
    backgroundImage: 'linear-gradient(#FFE58A, #E9A11A)',
    boxShadow: `0 4px 0 ${OUTLINE}`,
  },
  pressed: { transform: [{ translateY: 3 }], boxShadow: `0 1px 0 ${OUTLINE}` },
  tileFace: { flex: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  faceSpent: { opacity: 0.45 },
  tileLight: { position: 'absolute', left: 6, right: 6, top: 2, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  count: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: OUTLINE,
    backgroundColor: '#43B52A',
    backgroundImage: 'linear-gradient(#9BEA62, #3FAE25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countEmpty: { backgroundColor: '#8E99AB', backgroundImage: 'linear-gradient(#C9D0DC, #8E99AB)' },
  countText: { fontFamily: GAME_FONT, color: '#FFFFFF', fontSize: 14, lineHeight: 17, includeFontPadding: false, textShadowColor: OUTLINE, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 0.1 },
  hint: { position: 'absolute', top: '100%', left: 0, right: 0, alignItems: 'center', marginTop: space.m },
  hintBubble: { backgroundColor: 'rgba(27,34,56,0.92)', borderRadius: 14, paddingHorizontal: space.m, paddingVertical: 6 },
  hintText: { fontFamily: BODY_FONT_HEAVY, fontSize: 14, color: '#FFFFFF', textAlign: 'center' },
});

import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { GAME_FONT } from "../theme";
import { OUTLINE, SKINS, Skin } from "./skins";

/**
 * Clash Royale tarzı kalın buton:
 * koyu dış çizgi → alt gövde (derinlik) → degrade yüz → üstte parlak bant.
 * Basınca yüz gövdeye çöker.
 */

type Size = "small" | "medium" | "large";

const SIZES: Record<
  Size,
  { h: number; depth: number; r: number; font: number; ph: number }
> = {
  small: { h: 40, depth: 4, r: 12, font: 16, ph: 14 },
  medium: { h: 52, depth: 5, r: 14, font: 20, ph: 18 },
  large: { h: 64, depth: 6, r: 18, font: 28, ph: 24 },
};

const BORDER = 2.5;

interface Props {
  label: string;
  onPress?: () => void;
  skin?: Skin;
  size?: Size;
  disabled?: boolean;
  icon?: React.ReactNode;
  /** Kare ikon butonu: yazı gösterilmez, `label` yalnız ekran okuyucu içindir */
  square?: boolean;
  /** Sağ üst köşede kırmızı sayı */
  badge?: number;
  style?: ViewStyle;
}

function ChunkyButton({
  label,
  onPress,
  skin = "yellow",
  size = "medium",
  disabled,
  icon,
  square,
  badge,
  style,
}: Props) {
  const s = SIZES[size];
  const c = SKINS[disabled ? "gray" : skin];
  const faceH = s.h - s.depth;
  const id = `g-${skin}-${size}${disabled ? "-d" : ""}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[square && { width: s.h + BORDER * 2 }, style]}
    >
      {({ pressed }) => {
        const down = pressed && !disabled ? s.depth - 1 : 0;
        return (
          <View style={{ height: s.h + BORDER * 2 }}>
            {/* Görünmez ölçü: katmanlar mutlak konumlu olduğundan butonun doğal
                genişliği yazı + ikon kadar olsun (ortalanan/sıkışan yerlerde çökmesin) */}
            {square ? null : (
              <View style={[styles.sizer, { paddingHorizontal: s.ph + BORDER }]} pointerEvents="none">
                {icon ? <View style={styles.icon}>{icon}</View> : null}
                <Text style={[styles.label, { fontSize: s.font }]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            )}
            {/* Dış çizgi + alt gövde: sabit durur */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: s.r + BORDER,
                  backgroundColor: OUTLINE,
                  padding: BORDER,
                },
              ]}
            >
              <View
                style={{ flex: 1, borderRadius: s.r, backgroundColor: c.base }}
              />
            </View>
            {/* Yüz: degrade + parlak bant; basınca aşağı iner */}
            <View
              style={{
                position: "absolute",
                left: BORDER,
                right: BORDER,
                top: BORDER + down,
                height: faceH,
                borderRadius: s.r,
                overflow: "hidden",
              }}
            >
              {/* Degrade kutuyu yüzde ile doldurur: genişlik ölçümü (onLayout → state)
                  gerekmez; ölçüm her görünür oluşta butonu yeniden çizdiriyordu */}
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={c.top} />
                    <Stop offset="1" stopColor={c.bottom} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#${id})`} />
              </Svg>
              <View
                style={[styles.shine, { height: faceH * 0.36, borderRadius: faceH * 0.18 }]}
                pointerEvents="none"
              />
              <View
                style={[
                  styles.content,
                  { paddingHorizontal: square ? 0 : s.ph },
                ]}
              >
                {icon ? (
                  <View style={!square && styles.icon}>{icon}</View>
                ) : null}
                {square ? null : (
                  <Text
                    style={[
                      styles.label,
                      {
                        fontSize: s.font,
                        color: c.text,
                        textShadowColor: c.textShadow,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {label}
                  </Text>
                )}
              </View>
            </View>
            {badge ? (
              <View style={styles.badge} pointerEvents="none">
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { marginRight: 8 },
  shine: {
    position: "absolute",
    top: 3,
    left: 6,
    right: 6,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  sizer: { flexDirection: "row", alignItems: "center", height: "100%", opacity: 0 },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: "#E8413A",
    borderWidth: 2,
    borderColor: OUTLINE,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: GAME_FONT, color: "#FFFFFF", fontSize: 12 },
  label: {
    fontFamily: GAME_FONT,
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0.1,
  },
});

/**
 * Önbellekli: prop'lar değişmedikçe yeniden çizilmez (degrade SVG + ikon her
 * render'da pahalı). İkonu çağıran taraf sabit bir eleman olarak vermeli.
 */
export default React.memo(ChunkyButton);

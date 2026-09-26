import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

/**
 * Oyun tarzı "şeker" buton: koyu taban üstünde duran yüzey,
 * basınca yüzey tabana çöker (3D bas hissi).
 */

export type GameButtonVariant = 'green' | 'amber' | 'blue' | 'white' | 'gray' | 'red';

const VARIANTS: Record<GameButtonVariant, { face: string; base: string; text: string }> = {
  green: { face: '#4FB477', base: '#2E7A50', text: '#FFFFFF' },
  amber: { face: '#F6B93B', base: '#C48815', text: '#5C430D' },
  blue: { face: '#5FB6D9', base: '#3A7E9B', text: '#FFFFFF' },
  white: { face: '#FFFFFF', base: '#C3D2C8', text: '#26332C' },
  gray: { face: '#E3EAE4', base: '#C3D2C8', text: '#9AA8A0' },
  red: { face: '#E2604A', base: '#A83E2C', text: '#FFFFFF' },
};

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { pv: number; ph: number; fs: number; r: number; lift: number }> = {
  sm: { pv: 9, ph: 14, fs: 15, r: 14, lift: 4 },
  md: { pv: 13, ph: 20, fs: 17, r: 16, lift: 5 },
  lg: { pv: 16, ph: 24, fs: 21, r: 20, lift: 6 },
};

interface Props {
  label: string;
  onPress?: () => void;
  variant?: GameButtonVariant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  /** Verilirse yazı yerine ikon çizilir */
  icon?: React.ReactNode;
}

export default function GameButton({
  label,
  onPress,
  variant = 'green',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  icon,
}: Props) {
  const c = VARIANTS[disabled ? 'gray' : variant];
  const s = SIZES[size];
  const lift = disabled ? 2 : s.lift;

  return (
    <Pressable onPress={onPress} disabled={disabled} style={style} hitSlop={4}>
      {({ pressed }) => {
        const down = !disabled && pressed;
        return (
          <View>
            {/* koyu taban: her zaman yüzeyin altında sabit durur */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: lift,
                bottom: 0,
                backgroundColor: c.base,
                borderRadius: s.r,
              }}
            />
            {/* yüzey: basınca tabanın üstüne çöker, üstte boşluk bırakmaz */}
            <View
              style={[
                styles.face,
                {
                  backgroundColor: c.face,
                  borderRadius: s.r,
                  paddingVertical: s.pv,
                  paddingHorizontal: s.ph,
                  marginBottom: lift,
                  transform: [{ translateY: down ? lift - 1 : 0 }],
                },
              ]}
            >
              {icon ?? (
                <Text
                  style={[styles.label, { color: c.text, fontSize: s.fs }, textStyle]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});

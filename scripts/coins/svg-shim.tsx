/*
 * react-native-svg → tarayıcı SVG köprüsü (yalnız scripts/render-coins.mjs için):
 * para çizimleri uygulamadaki bileşenlerle birebir aynı kalsın diye aynı JSX
 * tarayıcıda düz SVG etiketlerine dönüştürülür.
 */
import React from 'react';

const tag = (name: string) =>
  function El(props: Record<string, unknown>) {
    return React.createElement(name, props);
  };

export default function Svg(props: Record<string, unknown>) {
  return React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', ...props });
}
export const Circle = tag('circle');
export const Defs = tag('defs');
export const Ellipse = tag('ellipse');
export const G = tag('g');
export const Line = tag('line');
export const Path = tag('path');
export const Polygon = tag('polygon');
export const RadialGradient = tag('radialGradient');
export const LinearGradient = tag('linearGradient');
export const Rect = tag('rect');
export const Stop = tag('stop');
export const Text = tag('text');

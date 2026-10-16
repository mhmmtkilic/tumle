import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MoneySvg } from '../../src/components/MoneySvg';
import { LEVELS } from '../../src/game/levels';

/** Her seviyenin para çizimi düz SVG metni olarak (1..N) */
export const coins: { level: number; svg: string }[] = [];
for (let level = 1; level < LEVELS.length; level++) {
  coins.push({ level, svg: renderToStaticMarkup(<MoneySvg level={level} />) });
}

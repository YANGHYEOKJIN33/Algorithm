/**
 * 산점도 바탕 — 축·격자·눈금과 x/y 변환기를 만든다. 점·선은 각 장면이 그 위에 그린다.
 * (마크 규칙: 1px 격자, 점 지름 8px 이상 + 바탕색 테두리, 글자는 글자색 토큰)
 */
import { s, scale, ticks } from './svg.js';
import { el } from '../ui/dom.js';
import { SPECIES } from '../core/data/practice.js';

export const SPECIES_SHAPE = ['●', '▲', '■'];

/**
 * @returns {{ svg, plot, sx, sy, W, H }} plot = 점을 그릴 <g>
 */
export function makeChart({ width = 560, height = 340, x: [x0, x1], y: [y0, y1], xLabel, yLabel, pad = { l: 52, r: 16, t: 14, b: 40 }, xTicks = 6, yTicks = 5, onClick = null }) {
  const sx = scale(x0, x1, pad.l, width - pad.r);
  const sy = scale(y0, y1, height - pad.b, pad.t);
  const grid = s('g.chart__grid');
  for (const t of ticks(x0, x1, xTicks)) {
    grid.append(s('line', { x1: sx(t), x2: sx(t), y1: pad.t, y2: height - pad.b }));
    grid.append(s('text.chart__tick', { x: sx(t), y: height - pad.b + 15, 'text-anchor': 'middle' }, String(t)));
  }
  for (const t of ticks(y0, y1, yTicks)) {
    grid.append(s('line', { x1: pad.l, x2: width - pad.r, y1: sy(t), y2: sy(t) }));
    grid.append(s('text.chart__tick', { x: pad.l - 6, y: sy(t) + 4, 'text-anchor': 'end' }, String(t)));
  }
  const axes = s('g.chart__axis',
    s('line', { x1: pad.l, x2: width - pad.r, y1: height - pad.b, y2: height - pad.b }),
    s('line', { x1: pad.l, x2: pad.l, y1: pad.t, y2: height - pad.b }),
    s('text.chart__label', { x: (pad.l + width - pad.r) / 2, y: height - 4, 'text-anchor': 'middle' }, xLabel),
    s('text.chart__label', { x: 11, y: (pad.t + height - pad.b) / 2, 'text-anchor': 'middle', transform: `rotate(-90 11 ${(pad.t + height - pad.b) / 2})` }, yLabel),
  );
  const plot = s('g.chart__plot');
  const svg = s('svg.chart', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${xLabel}–${yLabel} 산점도` }, grid, axes, plot);
  if (onClick) {
    svg.classList.add('chart--click');
    svg.addEventListener('click', (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      if (p.x < pad.l || p.x > width - pad.r || p.y < pad.t || p.y > height - pad.b) return;
      onClick(sx.invert(p.x), sy.invert(p.y));
    });
  }
  return { svg, plot, sx, sy, W: width, H: height, pad };
}

/** 종 범례 (색 + 모양 + 이름) */
export function speciesLegend(extra = []) {
  return el('div.legend', {},
    SPECIES.map((sp, i) => el('span.legend__item', {}, el(`span.legend__mark.sp${i}`, { 'aria-hidden': 'true' }, SPECIES_SHAPE[i]), sp)),
    extra,
  );
}

export const speciesIndex = (label) => SPECIES.indexOf(label);

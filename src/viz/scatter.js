/**
 * 산점도 장면 도우미 — 층(layer)을 나눠 두고, 장면마다 필요한 층만 다시 그린다.
 *   region(영역 색칠) → under(보조선) → links(이웃 잇는 선) → points(점) → over(새 점·중심·글자)
 * 움직이는 표식(중심·새 점)은 move()로 옮기면 CSS 전이로 미끄러진다.
 */
import { s } from './svg.js';
import { makeChart } from './chart.js';

export function createScatter(opts) {
  const c = makeChart(opts);
  const layers = {};
  for (const name of ['region', 'under', 'links', 'points', 'over', 'movers']) {
    layers[name] = s(`g.layer--${name}`);
    c.plot.append(layers[name]);
  }
  const movers = new Map();
  return {
    ...c,
    layers,
    clear(...names) { for (const n of names) layers[n].replaceChildren(); },
    /** 계속 남아 있는 표식 — 처음 한 번 만들고 그다음부터는 위치만 옮긴다 */
    mover(id, make) {
      if (!movers.has(id)) {
        const g = s('g.mover');
        g.append(make());
        layers.movers.append(g);
        movers.set(id, g);
      }
      return movers.get(id);
    },
    move(id, x, y, { hidden = false } = {}) {
      const g = movers.get(id);
      if (!g) return;
      g.style.transform = `translate(${c.sx(x)}px, ${c.sy(y)}px)`;
      g.style.opacity = hidden ? '0' : '1';
    },
    dropMovers() { for (const g of movers.values()) g.remove(); movers.clear(); },
  };
}

/** 별 모양 (새 펭귄·테스트 펭귄) — 원점 기준 */
export function starPath(r = 9) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`);
  }
  return s('path.star', { d: `M${pts.join('L')}Z` });
}

/** 중심 표식 (k-평균) — 원점 기준 십자 */
export function centerMark(cls) {
  return s('g', {},
    s(`circle.center__halo.${cls}`, { r: 11 }),
    s('path.center__cross', { d: 'M-6,-6L6,6M6,-6L-6,6' }));
}

/** 칸의 실제 크기에 맞춘 그림 크기 — viewBox를 칸 비율과 같게 만들어 글자가 일정하게 보이게 한다 */
export function sizeOf(container, { reserve = 0, min = [420, 220], max = [1100, 640] } = {}) {
  const w = Math.max(min[0], Math.min(max[0], Math.floor(container.clientWidth - 8)));
  const h = Math.max(min[1], Math.min(max[1], Math.floor(container.clientHeight - reserve - 8)));
  return { width: w, height: h };
}

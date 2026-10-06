/**
 * 🤖 선형 회귀 — ① 탐험(직선을 손으로 맞추고, 경사 하강으로 다가가기) · ② 최소제곱법 한 단계씩
 */
import { el, fill } from '../ui/dom.js';
import * as LR from '../core/ml/linreg.js';
import { linregData, LINREG_QUERY_X } from '../core/data/sets.js';
import { s, marker, scale } from '../viz/svg.js';
import { createScatter, sizeOf } from '../viz/scatter.js';
import { speciesLegend, speciesIndex } from '../viz/chart.js';
import { fmt } from '../core/stats.js';

const NB = '07_linear_regression';
const AXES = { x: [168, 236], y: [2800, 6200], xLabel: '날개길이 (mm)', yLabel: '몸무게 (g)' };

function drawPts(sc, pts, focus = null) {
  sc.clear('points');
  for (const p of pts) {
    const si = speciesIndex(p.label);
    sc.layers.points.append(marker(si, sc.sx(p.x), sc.sy(p.y), 6, { class: `pt sp${si}` }));
    if (p.id === focus) sc.layers.points.append(s('circle.pt-ring.pt-ring--current', { cx: sc.sx(p.x), cy: sc.sy(p.y), r: 11 }));
  }
}

function lineEl(sc, w, b, cls = 'fitline') {
  const [x0, x1] = AXES.x;
  return s(`line.${cls}`, { x1: sc.sx(x0), y1: sc.sy(w * x0 + b), x2: sc.sx(x1), y2: sc.sy(w * x1 + b) });
}

/* ═════════════ ① 탐험 ═════════════ */

function linregExplore(root) {
  const pts = linregData();
  const best = LR.fitLine(pts);
  const PIVOT = 200;                       // 이 날개길이에서의 높이(h)를 손잡이로 쓴다
  let w = 20;
  let h = 3600;                            // 날개 200mm일 때 몸무게
  const history = [];
  let timer = null;
  const sc = createScatter({ ...AXES, width: 620, height: 380 });
  const readout = el('div.lrx__read');
  const spark = el('div.lrx__spark');
  const inW = el('input', { type: 'range', min: -20, max: 90, step: 0.5, 'aria-label': '기울기 w', oninput: (e) => { stop(); w = Number(e.target.value); draw(true); } });
  const inH = el('input', { type: 'range', min: 3000, max: 5600, step: 10, 'aria-label': '직선 높이', oninput: (e) => { stop(); h = Number(e.target.value); draw(true); } });
  const lw = el('b'); const lh = el('b');
  const inX = el('input', { type: 'number', min: 160, max: 250, value: LINREG_QUERY_X, 'aria-label': '예측할 날개길이', oninput: () => draw(false) });
  const goBtn = el('button.pill.ctrl--primary', { type: 'button', onclick: () => (timer ? stop() : run()) }, '▶ 조금씩 고치기 (경사 하강법)');

  const bOf = () => h - w * PIVOT;

  function stop() { if (timer) { clearInterval(timer); timer = null; goBtn.textContent = '▶ 조금씩 고치기 (경사 하강법)'; } }
  function run() {
    goBtn.textContent = '⏸ 멈추기';
    let n = 0;
    timer = setInterval(() => {
      const next = LR.gradientStep(pts, w, bOf(), 0.18);
      w = next.w; h = next.w * PIVOT + next.b;
      draw(true);
      n += 1;
      if (n >= 45 || Math.abs(w - best.w) < 0.05) stop();
    }, 110);
  }

  function draw(record) {
    const b = bOf();
    const err = LR.mse(pts, w, b);
    if (record) { history.push(err); if (history.length > 60) history.shift(); }
    inW.value = w; inH.value = h;
    lw.textContent = fmt(w, 1); lh.textContent = `${Math.round(h)}g`;
    sc.clear('under', 'links', 'over');
    for (const p of pts) {
      const yh = w * p.x + b;
      sc.layers.under.append(s('line.resid', { x1: sc.sx(p.x), x2: sc.sx(p.x), y1: sc.sy(p.y), y2: sc.sy(yh) }));
    }
    sc.layers.links.append(lineEl(sc, w, b));
    const qx = Number(inX.value) || LINREG_QUERY_X;
    const qy = w * qx + b;
    sc.layers.over.append(s('line.guide', { x1: sc.sx(qx), x2: sc.sx(qx), y1: sc.sy(AXES.y[0]), y2: sc.sy(qy) }));
    sc.layers.over.append(s('line.guide', { x1: sc.sx(AXES.x[0]), x2: sc.sx(qx), y1: sc.sy(qy), y2: sc.sy(qy) }));
    sc.layers.over.append(s('circle.predpt', { cx: sc.sx(qx), cy: sc.sy(qy), r: 7 }));
    drawPts(sc, pts);
    const bestErr = LR.mse(pts, best.w, best.b);
    fill(readout,
      el('div.lrx__eq', {}, '몸무게 = ', el('b', {}, fmt(w, 2)), ' × 날개길이 ', b < 0 ? '− ' : '+ ', el('b', {}, fmt(Math.abs(b), 0))),
      el('div.lrx__err', {}, '평균 제곱 오차(MSE) ', el('b', {}, Math.round(err).toLocaleString()),
        el('span.panel__hint', {}, `  (가장 작은 값: ${Math.round(bestErr).toLocaleString()})`)),
      el('div.lrx__meter', {}, el('span', { style: `width:${Math.min(100, (bestErr / err) * 100)}%` })),
      el('div.lrx__pred', {}, `날개길이 `, inX, `mm → 예측 몸무게 `, el('b', {}, `${Math.round(qy).toLocaleString()}g`)));
    // 오차 기록(작아질수록 좋다)
    if (history.length > 1) {
      const W = 260; const H = 60;
      const mx = Math.max(...history); const mn = Math.min(bestErr, ...history);
      const xs = scale(0, Math.max(1, history.length - 1), 4, W - 4);
      const ys = scale(mn, mx === mn ? mn + 1 : mx, H - 6, 6);
      fill(spark, el('div.webx__cap', {}, '오차 기록 (오른쪽으로 갈수록 최근)'),
        s('svg.sparkline', { viewBox: `0 0 ${W} ${H}` }, s('polyline', { points: history.map((v, i) => `${xs(i)},${ys(v)}`).join(' ') })));
    } else fill(spark);
  }

  fill(root, el('div.knnx', {},
    el('div.knnx__main', {},
      el('div.knnx__tools', {},
        el('label.lrx__slider', {}, '기울기 w ', lw, inW),
        el('label.lrx__slider', {}, '높이(날개 200mm일 때) ', lh, inH),
        speciesLegend()),
      el('div.knnx__chart', {}, sc.svg),
      el('p.panel__hint', {}, '빨간 세로선 = 오차(실제 몸무게 − 직선이 예측한 몸무게). 오차를 제곱해 평균 낸 값(MSE)이 작을수록 좋은 직선이에요.')),
    el('div.knnx__side', {},
      readout,
      el('div.lrx__btns', {}, goBtn,
        el('button.pill', { type: 'button', onclick: () => { stop(); w = best.w; h = best.w * PIVOT + best.b; draw(true); } }, '📐 정답 직선(최소제곱법)'),
        el('button.pill', { type: 'button', onclick: () => { stop(); w = 20; h = 3600; history.length = 0; draw(true); } }, '↺ 처음으로')),
      spark,
      el('div.callout', {}, '💡 "학습" = 데이터를 보고 w와 b를 정하는 일이에요. 컴퓨터는 오차가 줄어드는 쪽으로 w, b를 조금씩 고치며(경사 하강법) 가장 좋은 직선에 다가가요.'))));
  draw(true);
  return { destroy: stop };
}

/* ═════════════ ② 최소제곱법 한 단계씩 ═════════════ */

const linregStep = {
  kind: 'step',
  pseudo: LR.PSEUDO,
  python: LR.PYTHON,
  notebook: NB,
  stageTitle: '날개길이와 몸무게 (펭귄 10마리)',
  stageHint: '초록 사각형 = dx×dy가 +, 빨간 사각형 = −',
  dataTitle: '계산표',
  rows: ['1.2fr', '0.95fr'],
  frames: () => LR.linregFrames(),
  mount({ stage, data }) {
    stage.classList.add('fit');
    const sc = createScatter({ ...AXES, ...sizeOf(stage, { reserve: 30 }) });
    fill(stage, speciesLegend(), el('div.fit__grow', {}, sc.svg));
    return {
      render(v) {
        const f = v.frame;
        sc.clear('under', 'links', 'over');
        if (f.xb !== null) {
          sc.layers.under.append(s('line.meanline', { x1: sc.sx(f.xb), x2: sc.sx(f.xb), y1: sc.sy(AXES.y[0]), y2: sc.sy(AXES.y[1]) }));
          sc.layers.under.append(s('line.meanline', { x1: sc.sx(AXES.x[0]), x2: sc.sx(AXES.x[1]), y1: sc.sy(f.yb), y2: sc.sy(f.yb) }));
          sc.layers.over.append(s('text.meanlbl', { x: sc.sx(f.xb) + 5, y: sc.sy(AXES.y[1]) + 12 }, `x̄ = ${fmt(f.xb, 1)}`));
          sc.layers.over.append(s('text.meanlbl', { x: sc.sx(AXES.x[0]) + 5, y: sc.sy(f.yb) - 5 }, `ȳ = ${fmt(f.yb, 0)}`));
          sc.layers.over.append(s('circle.meanpt', { cx: sc.sx(f.xb), cy: sc.sy(f.yb), r: 6 }));
        }
        const p = f.points.find((q) => q.id === f.focus);
        if (p && f.xb !== null) {
          const pos = (p.x - f.xb) * (p.y - f.yb) >= 0;
          const x0 = Math.min(sc.sx(p.x), sc.sx(f.xb)); const x1 = Math.max(sc.sx(p.x), sc.sx(f.xb));
          const y0 = Math.min(sc.sy(p.y), sc.sy(f.yb)); const y1 = Math.max(sc.sy(p.y), sc.sy(f.yb));
          sc.layers.under.append(s(`rect.dxdy${pos ? '.is-pos' : '.is-neg'}`, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }));
          sc.layers.over.append(s('text.dist-label', { x: (sc.sx(p.x) + sc.sx(f.xb)) / 2, y: sc.sy(f.yb) + 14, 'text-anchor': 'middle' }, `dx ${fmt(p.x - f.xb, 1)}`));
          sc.layers.over.append(s('text.dist-label', { x: sc.sx(p.x) + 6, y: (sc.sy(p.y) + sc.sy(f.yb)) / 2 }, `dy ${fmt(p.y - f.yb, 0)}`));
        }
        if (f.w !== null && f.b !== null) sc.layers.links.append(lineEl(sc, f.w, f.b));
        if (f.pred) {
          sc.layers.over.append(s('line.guide', { x1: sc.sx(f.pred.x), x2: sc.sx(f.pred.x), y1: sc.sy(AXES.y[0]), y2: sc.sy(f.pred.y) }));
          sc.layers.over.append(s('line.guide', { x1: sc.sx(AXES.x[0]), x2: sc.sx(f.pred.x), y1: sc.sy(f.pred.y), y2: sc.sy(f.pred.y) }));
          sc.layers.over.append(s('circle.predpt', { cx: sc.sx(f.pred.x), cy: sc.sy(f.pred.y), r: 7 }));
          sc.layers.over.append(s('text.dist-label', { x: sc.sx(f.pred.x) + 10, y: sc.sy(f.pred.y) + 4 }, `${f.pred.x}mm → ${Math.round(f.pred.y)}g`));
        }
        drawPts(sc, f.points, f.focus);

        const rows = f.rows;
        fill(data, el('div.lrds', {},
          el('table.mini.lrtable', {},
            el('thead', {}, el('tr', {}, ['번호', 'x 날개', 'y 몸무게', 'dx', 'dy', 'dx×dy', 'dx×dx'].map((h) => el('th', {}, h)))),
            el('tbody', {}, rows.map((r) => el(`tr${r.id === f.focus ? '.is-best' : ''}`, {},
              el('td', {}, `${r.id}번`), el('td', {}, String(r.x)), el('td', {}, String(r.y)),
              el('td', {}, fmt(r.dx, 1)), el('td', {}, fmt(r.dy, 0)),
              el(`td${r.dxdy >= 0 ? '.is-pos' : '.is-neg'}`, {}, fmt(r.dxdy, 0)), el('td', {}, fmt(r.dx2, 1))))),
            el('tfoot', {}, el('tr', {}, el('th', { colspan: 5 }, `합 (${rows.length}마리)`), el('th', {}, `위합 ${fmt(f.num, 0)}`), el('th', {}, `아래합 ${fmt(f.den, 1)}`)))),
          el('div.lrds__res', {},
            el('div.calcgrid', {},
              el(`div.calcgrid__cell${f.w !== null ? '.is-hot' : '.is-empty'}`, {}, el('span.calcgrid__k', {}, '기울기 w = 위합 ÷ 아래합'), el('span.calcgrid__v', {}, f.w !== null ? fmt(f.w, 2) : '?')),
              el(`div.calcgrid__cell${f.b !== null ? '.is-hot' : '.is-empty'}`, {}, el('span.calcgrid__k', {}, '절편 b = ȳ − w × x̄'), el('span.calcgrid__v', {}, f.b !== null ? fmt(f.b, 1) : '?'))))));
      },
    };
  },
};

export const LINREG_SCENES = {
  linregExplore: { kind: 'view', mount: linregExplore },
  linreg: linregStep,
};

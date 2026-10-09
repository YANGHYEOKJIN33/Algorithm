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

/**
 * 미션 신호: ctx.check('lr-hand') — 손잡이(w·b)만으로 오차 점수를 100,000 아래로 줄였을 때,
 *            ctx.check('lr-gd') — "컴퓨터가 조금씩 고치기"를 눌렀을 때,
 *            ctx.check('lr-best') — "가장 좋은 직선 보기"를 눌렀을 때
 */
const HAND_GOAL = 100000;

function linregExplore(root, ctx) {
  const pts = linregData();
  const best = LR.fitLine(pts);
  const PIVOT = 200;                       // 절편 b 손잡이는 날개 200mm일 때의 높이(h)로 움직인다(b = h − 200w)
  let w = 20;
  let h = 3600;                            // 날개 200mm일 때 몸무게
  const history = [];
  let timer = null;
  const sc = createScatter({ ...AXES, width: 620, height: 380 });
  const readout = el('div.lrx__read');
  const spark = el('div.lrx__spark');
  const byHand = () => { stop(); draw(true); if (LR.mse(pts, w, bOf()) < HAND_GOAL) ctx?.check('lr-hand'); };
  const inW = el('input', { type: 'range', min: -20, max: 90, step: 0.5, 'aria-label': '기울기 w', oninput: (e) => { w = Number(e.target.value); byHand(); } });
  const inH = el('input', { type: 'range', min: 3000, max: 5600, step: 10, 'aria-label': '절편 b — 날개 200mm일 때의 높이로 조절', oninput: (e) => { h = Number(e.target.value); byHand(); } });
  const lw = el('b'); const lb = el('b'); const lh = el('small.panel__hint');
  const inX = el('input', { type: 'number', min: 160, max: 250, value: LINREG_QUERY_X, 'aria-label': '예측할 날개길이', oninput: () => draw(false) });
  const label = (plain, term) => [plain, el('small', { style: 'opacity:.75;font-weight:400' }, ` ${term}`)];
  const goLabel = () => label('▶ 컴퓨터가 조금씩 고치기', '경사 하강법');
  const goBtn = el('button.pill.ctrl--primary', { type: 'button', onclick: () => (timer ? stop() : run()) }, goLabel());

  const bOf = () => h - w * PIVOT;

  function stop() { if (timer) { clearInterval(timer); timer = null; fill(goBtn, goLabel()); } }
  function run() {
    fill(goBtn, '⏸ 멈추기');
    ctx?.check('lr-gd');
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
    lw.textContent = fmt(w, 1);
    lb.textContent = `${b < 0 ? '−' : ''}${Math.round(Math.abs(b)).toLocaleString()}`;
    lh.textContent = `(날개 200mm일 때 높이 ${Math.round(h).toLocaleString()}g)`;
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
      el('div.lrx__err', {}, '오차 점수 ', el('b', {}, Math.round(err).toLocaleString()),
        el('span.panel__hint', {}, '  평균 제곱 오차(MSE) · 작을수록 좋아요'),
        el('div.panel__hint', {}, `가장 작은 값 ${Math.round(bestErr).toLocaleString()} · 손잡이 목표 ${HAND_GOAL.toLocaleString()} 아래`)),
      el('div.lrx__meter', {}, el('span', { style: `width:${Math.min(100, (bestErr / err) * 100)}%` })),
      el('div.lrx__pred', {}, '날개길이 ', inX, 'mm → 예측 몸무게 ', el('b', {}, `${Math.round(qy).toLocaleString()}g`)));
    // 오차 기록(작아질수록 좋다)
    if (history.length > 1) {
      const W = 260; const H = 60;
      const mx = Math.max(...history); const mn = Math.min(bestErr, ...history);
      const xs = scale(0, Math.max(1, history.length - 1), 4, W - 4);
      const ys = scale(mn, mx === mn ? mn + 1 : mx, H - 6, 6);
      fill(spark, el('div.webx__cap', {}, '오차 점수 기록 (오른쪽으로 갈수록 최근, 내려갈수록 좋아요)'),
        s('svg.sparkline', { viewBox: `0 0 ${W} ${H}` }, s('polyline', { points: history.map((v, i) => `${xs(i)},${ys(v)}`).join(' ') })));
    } else fill(spark);
  }

  fill(root, el('div.knnx', {},
    el('div.knnx__main', {},
      el('div.knnx__tools', {},
        el('label.lrx__slider', {}, '기울기 w ', lw, inW),
        el('label.lrx__slider', { title: '절편 b는 날개 0mm일 때의 높이라 그래프 밖에 있어요. 그래서 날개 200mm일 때의 높이로 b를 조절해요.' }, '절편 b ', lb, inH, lh),
        speciesLegend()),
      el('div.knnx__chart', {}, sc.svg),
      el('p.panel__hint', {}, '빨간 세로선 = 오차(실제 몸무게 − 직선의 예측). 오차를 제곱해 평균 낸 오차 점수(MSE)가 작을수록 좋은 직선이에요. 절편 b는 날개 0mm일 때의 높이라 그래프 밖에 있어서, 손잡이는 날개 200mm일 때의 높이로 b를 바꿔요.')),
    el('div.knnx__side', {},
      readout,
      el('div.lrx__btns', {}, goBtn,
        el('button.pill', { type: 'button', onclick: () => { stop(); w = best.w; h = best.w * PIVOT + best.b; draw(true); ctx?.check('lr-best'); } }, label('📐 가장 좋은 직선 보기', '최소제곱법')),
        el('button.pill', { type: 'button', onclick: () => { stop(); w = 20; h = 3600; history.length = 0; draw(true); } }, '↺ 처음으로')),
      spark,
      el('div.callout', {}, '💡 "학습" = 데이터를 보고 w와 b를 정하는 일이에요. 컴퓨터는 오차 점수가 줄어드는 쪽으로 w, b를 조금씩 고치며(경사 하강법) 가장 좋은 직선에 다가가요. 가장 좋은 직선은 공식 한 번으로도 구할 수 있어요(최소제곱법 — 다음 쪽).'))));
  draw(true);
  return { destroy: stop };
}

/* ═════════════ ② 최소제곱법 한 단계씩 ═════════════ */

/**
 * 평균 점을 기준으로 나뉜 네 칸에 dx×dy의 부호(+, −)를 옅게 적는다.
 * 지금 펭귄(p)이 있는 칸의 부호는 진하고 크게.
 */
function quadrantSigns(sc, xb, yb, p = null) {
  const [x0, x1] = AXES.x; const [y0, y1] = AXES.y;
  const cells = [
    { x: (xb + x1) / 2, y: (yb + y1) / 2, pos: true, right: true, up: true },
    { x: (x0 + xb) / 2, y: (y0 + yb) / 2, pos: true, right: false, up: false },
    { x: (x0 + xb) / 2, y: (yb + y1) / 2, pos: false, right: false, up: true },
    { x: (xb + x1) / 2, y: (y0 + yb) / 2, pos: false, right: true, up: false },
  ];
  for (const c of cells) {
    const here = p && (p.x >= xb) === c.right && (p.y >= yb) === c.up;
    sc.layers.under.append(s('text', {
      x: sc.sx(c.x), y: sc.sy(c.y) + (here ? 11 : 8), 'text-anchor': 'middle',
      style: `fill:var(${c.pos ? '--add' : '--warn'});font-size:${here ? 34 : 24}px;font-weight:800;opacity:${here ? 0.9 : 0.4}`,
    }, c.pos ? '+' : '−'));
  }
}

/** 지금 펭귄의 dx·dy 이름표 — 점과 겹치지 않게 평균선 반대쪽·점 바깥쪽으로 비켜 둔다 */
function dxdyLabels(sc, p, xb, yb) {
  const px = sc.sx(p.x); const py = sc.sy(p.y);
  const mx = sc.sx(xb); const my = sc.sy(yb);
  const right = px >= mx;
  const up = py <= my;
  // dx: 가로 평균선(ȳ)을 따라, 점이 없는 쪽(점이 위면 아래)에
  const narrow = Math.abs(px - mx) < 70;
  sc.layers.over.append(s('text.dist-label', {
    x: narrow ? mx + (right ? -6 : 6) : (px + mx) / 2,
    y: my + (up ? 16 : -8),
    'text-anchor': narrow ? (right ? 'end' : 'start') : 'middle',
  }, `dx ${fmt(p.x - xb, 1)}`));
  // dy: 점의 세로선 바깥쪽(평균에서 먼 쪽)에, 세로로 짧으면 점 위·아래로 비켜서
  const short = Math.abs(py - my) < 34;
  sc.layers.over.append(s('text.dist-label', {
    x: px + (right ? 16 : -16),
    y: short ? (up ? py - 12 : py + 22) : (py + my) / 2 + 4,
    'text-anchor': right ? 'start' : 'end',
  }, `dy ${fmt(p.y - yb, 1)}`));
}

/** 계산표 칸 안에서만 스크롤 — 지금 줄이 머리줄·합계줄에 가리지 않게(페이지는 그대로) */
function keepRowInView(box) {
  const row = box.querySelector('tbody tr.is-best') ?? box.querySelector('tbody tr:last-child');
  if (!row) { box.scrollTop = 0; return; }
  const head = box.querySelector('thead')?.getBoundingClientRect().height ?? 0;
  const foot = box.querySelector('tfoot')?.getBoundingClientRect().height ?? 0;
  const r = row.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const top = b.top + head;
  const bottom = b.bottom - foot;
  if (r.top < top) box.scrollTop -= top - r.top + 4;
  else if (r.bottom > bottom) box.scrollTop += r.bottom - bottom + 4;
}

const STICKY_HEAD = 'position:sticky;top:0;z-index:1';
const STICKY_FOOT = 'position:sticky;bottom:0;z-index:1';

const linregStep = {
  kind: 'step',
  pseudo: LR.PSEUDO,
  python: LR.PYTHON,
  notebook: NB,
  stageTitle: '날개길이와 몸무게 (펭귄 10마리)',
  stageHint: '평균 점 기준 오른쪽 위·왼쪽 아래 = +(초록), 왼쪽 위·오른쪽 아래 = −(빨강)',
  dataTitle: '계산표',
  rows: ['1.2fr', '0.95fr'],
  frames: () => LR.linregFrames(),
  mount({ stage, data }) {
    stage.classList.add('fit');
    const sc = createScatter({ ...AXES, ...sizeOf(stage, { reserve: 52 }) });
    fill(stage, speciesLegend(), el('div.fit__grow', {}, sc.svg));
    return {
      render(v) {
        const f = v.frame;
        sc.clear('under', 'links', 'over');
        const p = f.points.find((q) => q.id === f.focus);
        if (f.xb !== null) {
          quadrantSigns(sc, f.xb, f.yb, p);
          sc.layers.under.append(s('line.meanline', { x1: sc.sx(f.xb), x2: sc.sx(f.xb), y1: sc.sy(AXES.y[0]), y2: sc.sy(AXES.y[1]) }));
          sc.layers.under.append(s('line.meanline', { x1: sc.sx(AXES.x[0]), x2: sc.sx(AXES.x[1]), y1: sc.sy(f.yb), y2: sc.sy(f.yb) }));
          sc.layers.over.append(s('text.meanlbl', { x: sc.sx(f.xb) + 5, y: sc.sy(AXES.y[1]) + 12 }, `x̄ = ${fmt(f.xb, 1)}`));
          sc.layers.over.append(s('text.meanlbl', { x: sc.sx(AXES.x[0]) + 5, y: sc.sy(f.yb) - 5 }, `ȳ = ${fmt(f.yb, 1)}`));
          sc.layers.over.append(s('circle.meanpt', { cx: sc.sx(f.xb), cy: sc.sy(f.yb), r: 6 }));
        }
        if (p && f.xb !== null) {
          const pos = (p.x - f.xb) * (p.y - f.yb) >= 0;
          const x0 = Math.min(sc.sx(p.x), sc.sx(f.xb)); const x1 = Math.max(sc.sx(p.x), sc.sx(f.xb));
          const y0 = Math.min(sc.sy(p.y), sc.sy(f.yb)); const y1 = Math.max(sc.sy(p.y), sc.sy(f.yb));
          sc.layers.under.append(s(`rect.dxdy${pos ? '.is-pos' : '.is-neg'}`, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }));
          dxdyLabels(sc, p, f.xb, f.yb);
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
        // dx·dy만 잰 펭귄(아직 표에 안 들어감)은 dx×dy를 "?"로 둔 채 미리 보여 준다
        const pending = p && f.cur && !rows.some((r) => r.id === p.id) ? { id: p.id, x: p.x, y: p.y, ...f.cur } : null;
        fill(data, el('div.lrds', {},
          el('table.mini.lrtable', {},
            el('thead', {}, el('tr', {}, ['번호', 'x 날개', 'y 몸무게', 'dx', 'dy', 'dx×dy', 'dx×dx'].map((h) => el('th', { style: STICKY_HEAD }, h)))),
            el('tbody', {},
              rows.map((r) => el(`tr${r.id === f.focus ? '.is-best' : ''}`, {},
                el('td', {}, `${r.id}번`), el('td', {}, String(r.x)), el('td', {}, String(r.y)),
                el('td', {}, fmt(r.dx, 1)), el('td', {}, fmt(r.dy, 1)),
                el(`td${r.dxdy >= 0 ? '.is-pos' : '.is-neg'}`, {}, fmt(r.dxdy, 1)), el('td', {}, fmt(r.dx2, 1)))),
              pending ? el('tr.is-best', {},
                el('td', {}, `${pending.id}번`), el('td', {}, String(pending.x)), el('td', {}, String(pending.y)),
                el('td', {}, fmt(pending.dx, 1)), el('td', {}, fmt(pending.dy, 1)), el('td', {}, '?'), el('td', {}, '?')) : null),
            el('tfoot', {}, el('tr', {},
              el('th', { colspan: 5, style: STICKY_FOOT }, `합 (${rows.length}마리)`),
              el('th', { style: STICKY_FOOT }, `위합 ${fmt(f.num, 1)}`), el('th', { style: STICKY_FOOT }, `아래합 ${fmt(f.den, 1)}`)))),
          el('div.lrds__res', { style: 'position:sticky;top:0' },
            el('div.calcgrid', {},
              el(`div.calcgrid__cell${f.w !== null ? '.is-hot' : '.is-empty'}`, {}, el('span.calcgrid__k', {}, '기울기 w = 위합 ÷ 아래합'), el('span.calcgrid__v', {}, f.w !== null ? fmt(f.w, 2) : '?')),
              el(`div.calcgrid__cell${f.b !== null ? '.is-hot' : '.is-empty'}`, {}, el('span.calcgrid__k', {}, '절편 b = ȳ − w × x̄'), el('span.calcgrid__v', {}, f.b !== null ? fmt(f.b, 2) : '?'))),
            el('p.panel__hint', { style: 'margin-top:6px' }, '평균 점의 오른쪽 위·왼쪽 아래 → dx×dy가 +, 왼쪽 위·오른쪽 아래 → −'))));
        keepRowInView(data);
      },
    };
  },
};

export const LINREG_SCENES = {
  linregExplore: { kind: 'view', mount: linregExplore },
  linreg: linregStep,
};

/**
 * 🤖 k-평균 — ① 탐험(처음 중심을 골라 끝까지 돌려 보기) · ② 의사코드 한 단계씩
 */
import { el, fill } from '../ui/dom.js';
import * as KM from '../core/ml/kmeans.js';
import { KMEANS_INIT_IDS } from '../core/data/sets.js';
import { s, marker } from '../viz/svg.js';
import { createScatter, centerMark, sizeOf } from '../viz/scatter.js';
import { speciesIndex, SPECIES_SHAPE } from '../viz/chart.js';
import { SPECIES } from '../core/data/practice.js';
import { pyList, counters } from '../viz/bits.js';
import { fmt } from '../core/stats.js';

const NB = '08_kmeans';
const AXES = { x: [33, 56], y: [12.5, 22], xLabel: '부리길이 (mm)', yLabel: '부리깊이 (mm)' };
const CL_NAME = ['묶음 1', '묶음 2', '묶음 3'];
const CL_SHAPE = ['◆', '✚', '⬟'];

/** 묶음 범례 */
function clusterLegend(k = 3, extra = []) {
  return el('div.legend', {},
    el('span.legend__item', {}, el('span.legend__mark', { style: 'color:var(--text-muted)' }, '●'), '아직 안 정함'),
    Array.from({ length: k }, (_, j) => el('span.legend__item', {}, el(`span.legend__mark.cl${j}`, {}, '●'), CL_NAME[j])),
    el('span.legend__item', {}, el('span.legend__mark', {}, '⊗'), '중심'),
    extra);
}

/** 점 그리기 — 묶음 색. showSpecies면 모양으로 실제 종을 함께 보여 준다 */
function drawPoints(sc, points, assign, { focus = null, changed = [], showSpecies = false, picked = [] } = {}) {
  sc.clear('points');
  points.forEach((p, i) => {
    const a = assign[i];
    const shape = showSpecies ? speciesIndex(p.label) : 0;
    const cls = a === null || a === undefined ? 'pt unk' : `pt cl${a}`;
    sc.layers.points.append(marker(shape, sc.sx(p.x), sc.sy(p.y), 6, { class: cls }));
    if (p.id === focus || changed.includes(p.id)) sc.layers.points.append(s('circle.pt-ring.pt-ring--current', { cx: sc.sx(p.x), cy: sc.sy(p.y), r: 11 }));
    if (picked.includes(p.id)) sc.layers.points.append(s('circle.pt-ring.pt-ring--result', { cx: sc.sx(p.x), cy: sc.sy(p.y), r: 12 }));
  });
}

function drawTrails(sc, trail) {
  sc.clear('under');
  trail.forEach((t, j) => {
    if (t.length < 2) return;
    sc.layers.under.append(s(`polyline.trail.cl${j}`, { points: t.map((c) => `${sc.sx(c.x)},${sc.sy(c.y)}`).join(' ') }));
  });
}

/* ═════════════ ① 탐험 ═════════════ */

/**
 * 미션 신호: ctx.check('km-pick') — 그래프를 눌러 처음 중심 3개를 골랐을 때,
 *            ctx.check('km-end') — 중심이 멈출 때까지 돌렸을 때,
 *            ctx.check('km-compare') — 서로 다른 처음 중심 두 가지를 끝까지 돌려 봤을 때
 */
function kmeansExplore(root, ctx) {
  const points = KM.kmeansPoints();
  let picked = [...KMEANS_INIT_IDS];
  let run = null;          // { history, assign, iterations }
  let step = 0;            // 몇 번째 되풀이까지 보여 줄지
  let showSpecies = false;
  const finished = new Set();   // 끝까지 돌려 본 처음 중심들('1,6,14' 꼴)
  const sc = createScatter({
    ...AXES, width: 620, height: 380,
    onClick: (x, y) => {
      // 가장 가까운 점을 처음 중심으로 고른다(3개까지)
      let best = null; let bd = Infinity;
      for (const p of points) { const d = Math.hypot(p.x - x, (p.y - y) * 2.4); if (d < bd) { bd = d; best = p; } }
      if (!best || bd > 2.2) return;
      if (picked.includes(best.id)) picked = picked.filter((id) => id !== best.id);
      else if (picked.length < 3) picked = [...picked, best.id];
      else picked = [...picked.slice(1), best.id];
      if (picked.length === 3) ctx?.check('km-pick');
      run = null; step = 0; draw();
    },
  });
  for (let j = 0; j < 3; j += 1) sc.mover(`c${j}`, () => centerMark(`cl${j}`));
  const side = el('div.knnx__side');
  const status = el('div.kmx__status');

  function assignAt(stepN) {
    if (!run) return points.map(() => null);
    const centers = run.history[Math.min(stepN, run.history.length - 1) - 1] ?? run.history[0];
    return points.map((p) => {
      let best = 0; let bd = Infinity;
      centers.forEach((c, j) => { const d = Math.hypot(p.x - c.x, p.y - c.y); if (d < bd - 1e-12) { bd = d; best = j; } });
      return best;
    });
  }

  function draw() {
    const ready = picked.length === 3;
    let centers;
    let assign;
    if (run && step > 0) {
      centers = run.history[Math.min(step, run.history.length - 1)];
      assign = assignAt(step);
    } else {
      centers = picked.map((id) => points.find((p) => p.id === id));
      assign = points.map(() => null);
    }
    for (let j = 0; j < 3; j += 1) {
      const c = centers[j];
      if (c) sc.move(`c${j}`, c.x, c.y); else sc.move(`c${j}`, AXES.x[0], AXES.y[0], { hidden: true });
    }
    if (run && step > 0) drawTrails(sc, [0, 1, 2].map((j) => run.history.slice(0, step + 1).map((h) => h[j])));
    else sc.clear('under');
    drawPoints(sc, points, assign, { showSpecies, picked: run ? [] : picked });
    const done = run && step >= run.history.length - 1;
    if (done) {
      finished.add([...picked].sort((a, b) => a - b).join(','));
      ctx?.check('km-end');
      if (finished.size >= 2) ctx?.check('km-compare');
    }
    fill(status,
      run ? el('div', {}, `되풀이 ${Math.min(step, run.iterations)}번 ${done ? '— 중심이 멈췄어요 ✅' : ''}`)
        : el('div', {}, ready ? `처음 중심: ${picked.map((id) => `${id}번`).join(' · ')}. ⏭ 한 번 되풀이나 ⏩ 끝까지 실행을 눌러 보세요.` : `처음 중심이 될 점을 그래프에서 눌러 고르세요 (${picked.length}/3)`),
        finished.size ? el('div.panel__hint', {}, `끝까지 돌려 본 처음 중심 ${finished.size}가지`) : null);
    const counts = [0, 1, 2].map((j) => assign.filter((a) => a === j).length);
    const mix = [0, 1, 2].map((j) => SPECIES.map((sp) => points.filter((p, i) => assign[i] === j && p.label === sp).length));
    fill(side,
      status,
      el('div.lrx__btns', {},
        el('button.pill.ctrl--primary', { type: 'button', disabled: !ready || done, onclick: () => { if (!run) run = KM.runKMeans(points, picked); step += 1; draw(); } }, '⏭ 한 번 되풀이'),
        el('button.pill', { type: 'button', disabled: !ready, onclick: () => { if (!run) run = KM.runKMeans(points, picked); step = run.history.length - 1; draw(); } }, '⏩ 끝까지 실행'),
        el('button.pill', { type: 'button', onclick: () => { run = null; step = 0; draw(); } }, '↺ 처음 중심으로'),
        el('button.pill', { type: 'button', onclick: () => { picked = [1, 6, 14]; run = null; step = 0; draw(); } }, '🧪 아델리 3마리에서 시작')),
      el('label.kmx__toggle', {}, el('input', { type: 'checkbox', checked: showSpecies, onchange: (e) => { showSpecies = e.target.checked; draw(); } }), ' 실제 종을 모양으로 보기 (● 아델리 ▲ 턱끈 ■ 젠투)'),
      run && step > 0 ? el('table.mini', {},
        el('thead', {}, el('tr', {}, el('th', {}, '묶음'), el('th', {}, '마리'), el('th', {}, '그 안의 실제 종'))),
        el('tbody', {}, [0, 1, 2].map((j) => el('tr', {},
          el('td', {}, el(`span.legend__mark.cl${j}`, {}, '●'), ` ${CL_NAME[j]}`), el('td', {}, String(counts[j])),
          el('td', {}, SPECIES.map((sp, si) => (mix[j][si] ? `${SPECIES_SHAPE[si]}${sp} ${mix[j][si]} ` : '')).join('')))))) : null,
      el('div.callout', {}, '💡 k-평균은 정답(종)을 전혀 보지 않아요. 그런데도 가까운 것끼리 묶으면 실제 종과 꽤 비슷하게 나뉘어요. 단, 처음 중심을 잘못 고르면 엉뚱하게 묶이기도 해서, 실제로는 여러 번 다르게 시작해 가장 좋은 결과를 골라요(n_init).'));
  }

  fill(root, el('div.knnx', {},
    el('div.knnx__main', {},
      el('div.knnx__tools', {}, clusterLegend()),
      el('div.knnx__chart', {}, sc.svg),
      el('p.panel__hint', {}, '👆 점을 누르면 처음 중심으로 골라요(3개). 이미 고른 점을 다시 누르면 취소돼요.')),
    side));
  draw();
  return {};
}

/* ═════════════ ② 의사코드 한 단계씩 ═════════════ */

const kmeansStep = {
  kind: 'step',
  pseudo: KM.PSEUDO,
  python: KM.PYTHON,
  notebook: NB,
  stageTitle: '정답(종)을 지운 펭귄 18마리',
  stageHint: '⊗ = 중심, 점선 = 중심이 지나온 길',
  dataTitle: '중심표 · 소속목록',
  rows: ['1.2fr', '0.85fr'],
  frames: () => KM.kmeansFrames(),
  mount({ stage, data }) {
    stage.classList.add('fit');
    const sc = createScatter({ ...AXES, ...sizeOf(stage, { reserve: 30 }) });
    for (let j = 0; j < 3; j += 1) sc.mover(`c${j}`, () => centerMark(`cl${j}`));
    fill(stage, clusterLegend(), el('div.fit__grow', {}, sc.svg));
    return {
      render(v) {
        const f = v.frame;
        f.centers.forEach((c, j) => sc.move(`c${j}`, c.x, c.y));
        drawTrails(sc, f.trail);
        sc.clear('links');
        const p = f.points.find((q) => q.id === f.focus);
        if (p) {
          const a = f.assign[f.points.indexOf(p)];
          f.centers.forEach((c, j) => sc.layers.links.append(s(`line.link${j === a ? '.link--hot' : ''}`, { x1: sc.sx(p.x), y1: sc.sy(p.y), x2: sc.sx(c.x), y2: sc.sy(c.y), opacity: j === a ? 1 : 0.4 })));
        }
        drawPoints(sc, f.points, f.assign, { focus: f.focus, changed: f.changed });
        const counts = f.centers.map((_, j) => f.assign.filter((x) => x === j).length);
        fill(data, el('div.kmds', {},
          el('div', {},
            counters([['되풀이', `${f.iter}번`], ['배정한 점', `${f.assign.filter((x) => x !== null).length} / ${f.points.length}`]]),
            el('table.mini', {},
              el('thead', {}, el('tr', {}, el('th', {}, '묶음'), el('th', {}, '중심 (부리길이, 부리깊이)'), el('th', {}, '마리'))),
              el('tbody', {}, f.centers.map((c, j) => el(`tr${f.line === 4 ? '.is-best' : ''}`, {},
                el('td', {}, el(`span.legend__mark.cl${j}`, {}, '●'), ` ${CL_NAME[j]}`), el('td', {}, `(${fmt(c.x)}, ${fmt(c.y)})`), el('td', {}, String(counts[j]))))))),
          el('div', {}, pyList('소속목록', f.points.map((q, i) => ({
            key: `a${q.id}`, cls: q.id === f.focus || f.changed.includes(q.id) ? 'is-hot' : '',
            content: el('span', {}, `${q.id}번→`, f.assign[i] === null ? '?' : el(`b.cl${f.assign[i]}`, {}, String(f.assign[i] + 1))),
          })), { showIndex: false }))));
      },
    };
  },
};

export const KMEANS_SCENES = {
  kmeansExplore: { kind: 'view', mount: kmeansExplore },
  kmeans: kmeansStep,
};

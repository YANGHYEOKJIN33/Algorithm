/**
 * 🤖 k-최근접 이웃 — ① 탐험(새 펭귄을 옮기며 k 바꾸기) · ② 의사코드 한 단계씩
 *
 * 미션 신호(ctx.check)
 *   ① 'move-star' 그래프를 눌러 ★ 옮기기 · 'change-k' k 바꾸기 · 'region' 영역 색칠 켜기
 *   ② 'step-k'    그림 위의 k를 바꿔 다시 실행하기
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import * as KNN from '../core/ml/knn.js';
import { knnTrain, KNN_QUERY } from '../core/data/sets.js';
import { SPECIES } from '../core/data/practice.js';
import { s, marker } from '../viz/svg.js';
import { createScatter, starPath, sizeOf } from '../viz/scatter.js';
import { speciesLegend, speciesIndex, SPECIES_SHAPE } from '../viz/chart.js';
import { pyList, pyDict, varBox } from '../viz/bits.js';
import { fmt, round } from '../core/stats.js';

const NB = '05_knn';
const AXES = { x: [33, 56], y: [12.5, 22], xLabel: '부리길이 (mm)', yLabel: '부리깊이 (mm)' };
const KS = [1, 3, 5, 7];

function drawPoints(sc, train, { dim = null, ring = null, labels = null, query = null } = {}) {
  sc.clear('points', 'over');
  for (const p of train) {
    const si = speciesIndex(p.label);
    const cls = `pt sp${si}${dim && !dim.has(p.id) ? ' is-dim' : ''}`;
    sc.layers.points.append(marker(si, sc.sx(p.x), sc.sy(p.y), 6, { class: cls }));
    if (ring && ring.has(p.id)) sc.layers.points.append(s('circle.pt-ring.pt-ring--result', { cx: sc.sx(p.x), cy: sc.sy(p.y), r: 11 }));
  }
  if (labels?.size) drawLabels(sc, train, labels, query);
}

/**
 * 번호 글자('153번')를 점들 위 층(over)에, 다른 점·★·글자를 가리지 않는 자리에 놓는다.
 * 오른쪽 위 → 오른쪽 아래 → 왼쪽 위 → 왼쪽 아래 → 위 → 아래 순으로 시험해 가장 덜 겹치는 곳.
 */
function drawLabels(sc, train, labels, query) {
  const dots = train.map((p) => ({ id: p.id, x: sc.sx(p.x), y: sc.sy(p.y), r: 7 }));
  if (query) dots.push({ id: 'q', x: sc.sx(query.x), y: sc.sy(query.y), r: 12 });
  const placed = [];
  const hits = (box, selfId) => dots.filter((d) => d.id !== selfId
    && d.x + d.r > box.x0 && d.x - d.r < box.x1 && d.y + d.r > box.y0 && d.y - d.r < box.y1).length
    + placed.filter((b) => b.x1 > box.x0 && b.x0 < box.x1 && b.y1 > box.y0 && b.y0 < box.y1).length;
  for (const p of train.filter((t) => labels.has(t.id))) {
    const x = sc.sx(p.x); const y = sc.sy(p.y);
    const text = `${p.id}번`;
    const w = 6.2 * String(p.id).length + 11; const h = 11;
    const spots = [
      { x: x + 9, y: y - 8, anchor: 'start' }, { x: x + 9, y: y + 16, anchor: 'start' },
      { x: x - 9, y: y - 8, anchor: 'end' }, { x: x - 9, y: y + 16, anchor: 'end' },
      { x, y: y - 13, anchor: 'middle' }, { x, y: y + 22, anchor: 'middle' },
    ].map((sp) => {
      const x0 = sp.anchor === 'start' ? sp.x : sp.anchor === 'end' ? sp.x - w : sp.x - w / 2;
      const box = { x0, x1: x0 + w, y0: sp.y - h + 2, y1: sp.y + 2 };
      return { ...sp, box, n: hits(box, p.id) };
    });
    const best = spots.reduce((a, b) => (b.n < a.n ? b : a));
    placed.push(best.box);
    sc.layers.over.append(s('text.pt-label', { x: best.x, y: best.y, 'text-anchor': best.anchor }, text));
  }
}

function kSelector(get, set) {
  const seg = el('div.seg', { role: 'group', 'aria-label': 'k 고르기' },
    KS.map((k) => el('button', { type: 'button', 'data-k': k, onclick: () => set(k) }, `k = ${k}`)));
  const sync = () => seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.k) === get())));
  sync();
  return { seg, sync };
}

function voteBars(counts, pred, k) {
  return el('div.votes', {}, SPECIES.map((sp, i) => el(`div.votes__row${sp === pred ? '.is-win' : ''}`, {},
    el('span.votes__name', {}, el(`span.legend__mark.sp${i}`, {}, SPECIES_SHAPE[i]), ` ${sp}`),
    el('span.votes__bar', {}, el(`span.votes__fill.sp${i}bg`, { style: `width:${(counts[sp] / k) * 100}%` })),
    el('span.votes__n', {}, `${counts[sp]}표`))));
}

/* ═════════════ ① 탐험 ═════════════ */

function knnExplore(root, ctx) {
  const train = knnTrain();
  let q = { x: KNN_QUERY.x, y: KNN_QUERY.y };
  let k = 3;
  let region = false;
  const sc = createScatter({ ...AXES, width: 620, height: 380, onClick: (x, y) => { q = { x: round(x, 1), y: round(y, 1) }; draw(); ctx?.check('move-star'); } });
  sc.mover('q', () => starPath(11));
  const ks = kSelector(() => k, (v) => { if (v === k) return; k = v; ks.sync(); draw(); ctx?.check('change-k'); });
  const side = el('div.knnx__side');
  const regionBtn = el('button.pill', { type: 'button', onclick: () => { region = !region; draw(); if (region) ctx?.check('region'); } });

  function drawRegion() {
    sc.clear('region');
    if (!region) return;
    const nx = 46; const ny = 30;
    const [x0, x1] = AXES.x; const [y0, y1] = AXES.y;
    const dx = (x1 - x0) / nx; const dy = (y1 - y0) / ny;
    for (let i = 0; i < nx; i += 1) {
      for (let j = 0; j < ny; j += 1) {
        const cx = x0 + dx * (i + 0.5); const cy = y0 + dy * (j + 0.5);
        const { pred } = KNN.predict(train, { x: cx, y: cy }, k);
        sc.layers.region.append(s(`rect.region.sp${speciesIndex(pred)}`, {
          x: sc.sx(x0 + dx * i), y: sc.sy(y0 + dy * (j + 1)), width: sc.sx(x0 + dx) - sc.sx(x0) + 0.5, height: sc.sy(y0) - sc.sy(y0 + dy) + 0.5,
        }));
      }
    }
  }

  function draw() {
    regionBtn.textContent = region ? '🎨 영역 색칠 끄기' : '🎨 영역 색칠 (k에 따라 어떻게 나뉘나)';
    regionBtn.setAttribute('aria-pressed', String(region));
    drawRegion();
    const ranked = KNN.rankNeighbors(train, q);
    const nb = ranked.slice(0, k);
    const { counts, pred } = KNN.vote(nb);
    sc.clear('links');
    const far = nb[nb.length - 1].d;
    // 반지름 = k번째 이웃까지의 거리(축 비율이 달라 타원으로 그린다)
    sc.layers.links.append(s('ellipse.reach', {
      cx: sc.sx(q.x), cy: sc.sy(q.y),
      rx: Math.abs(sc.sx(q.x + far) - sc.sx(q.x)), ry: Math.abs(sc.sy(q.y + far) - sc.sy(q.y)),
    }));
    for (const n of nb) sc.layers.links.append(s('line.link.link--nb', { x1: sc.sx(q.x), y1: sc.sy(q.y), x2: sc.sx(n.x), y2: sc.sy(n.y) }));
    drawPoints(sc, train, { ring: new Set(nb.map((n) => n.id)) });
    sc.move('q', q.x, q.y);
    fill(side,
      el('div.knnx__q', {}, '★ 새 펭귄: 부리길이 ', el('b', {}, `${q.x}mm`), ', 부리깊이 ', el('b', {}, `${q.y}mm`)),
      el('table.mini', {},
        el('thead', {}, el('tr', {}, el('th', {}, '순위'), el('th', {}, '번호'), el('th', {}, '종'), el('th', {}, '거리'))),
        el('tbody', {}, nb.map((n, i) => el('tr', {}, el('td', {}, String(i + 1)), el('td', {}, `${n.id}번`),
          el('td', {}, el(`span.legend__mark.sp${speciesIndex(n.label)}`, {}, SPECIES_SHAPE[speciesIndex(n.label)]), ` ${n.label}`), el('td', {}, fmt(n.d)))))),
      voteBars(counts, pred, k),
      el('div.knnx__pred', {}, '예측: ', el('strong', {}, `${pred}펭귄`)),
      el('p.panel__hint', {}, `점선 원은 k번째(${k}번째) 이웃까지의 거리예요. 이 안에 든 펭귄들이 투표해요.`));
  }

  fill(root, el('div.knnx', {},
    el('div.knnx__main', {},
      el('div.knnx__tools', {}, el('span.panel__title', {}, '이웃 수'), ks.seg, regionBtn,
        el('button.pill', { type: 'button', onclick: () => { q = { x: KNN_QUERY.x, y: KNN_QUERY.y }; draw(); } }, '↺ 341번 펭귄으로'),
        speciesLegend([el('span.legend__item', {}, el('span.legend__mark', {}, '★'), '새 펭귄')])),
      el('div.knnx__chart', {}, sc.svg),
      el('p.panel__hint', {}, '👆 그래프의 빈 곳을 누르면 새 펭귄(★)이 그 자리로 옮겨 가요. 훈련 데이터는 18마리(종마다 6마리)예요. 341번은 이 펭귄의 원래 번호일 뿐, 341마리와는 상관없어요.')),
    side));
  draw();
  return {};
}

/* ═════════════ ② 의사코드 한 단계씩 ═════════════ */

let stepK = 3;

const knnStep = {
  kind: 'step',
  pseudo: KNN.PSEUDO,
  python: KNN.PYTHON,
  notebook: NB,
  stageTitle: '훈련 데이터 18마리와 새 펭귄 ★ (341번)',
  stageHint: '',
  dataTitle: '거리목록 → 이웃 → 세기표',
  rows: ['1.15fr', '0.95fr'],   // 자료구조 칸에 거리목록 3줄 + 세기표 + 예측이 한눈에 들어오게
  frames: () => KNN.knnFrames({ k: stepK }),
  mount({ stage, data, stageTools }, ctx) {
    stage.classList.add('fit');
    const sc = createScatter({ ...AXES, ...sizeOf(stage, { reserve: 52 }) });
    sc.mover('q', () => starPath(11));
    const ks = kSelector(() => stepK, (v) => { if (v === stepK) return; stepK = v; ks.sync(); ctx.reload(); ctx.check('step-k'); });
    fill(stageTools, ks.seg);
    const flip = createFlip();
    fill(stage, speciesLegend([el('span.legend__item', {}, el('span.legend__mark', {}, '★'), '새 펭귄(종을 모름)')]), el('div.fit__grow', {}, sc.svg));
    return {
      render(v) {
        const f = v.frame;
        const q = f.query;
        sc.move('q', q.x, q.y);
        sc.clear('links');
        const pById = new Map(f.train.map((p) => [p.id, p]));
        const line = (p, cls, extra = {}) => sc.layers.links.append(s(`line.${cls}`, { x1: sc.sx(q.x), y1: sc.sy(q.y), x2: sc.sx(p.x), y2: sc.sy(p.y), ...extra }));
        if (f.neighbors.length) {
          for (const id of f.neighbors) line(pById.get(id), 'link.link--nb');
        } else {
          for (const e of f.list) if (e.id !== f.focus) line(pById.get(e.id), 'link', { opacity: 0.35 });
          if (f.focus !== null) {
            const p = pById.get(f.focus);
            line(p, 'link.link--hot');
            const d = f.calc?.d ?? f.list.find((e) => e.id === f.focus)?.d;
            sc.layers.links.append(s('text.dist-label', { x: (sc.sx(q.x) + sc.sx(p.x)) / 2 + 4, y: (sc.sy(q.y) + sc.sy(p.y)) / 2 - 4 }, fmt(d)));
          }
        }
        const dim = f.neighbors.length ? new Set(f.neighbors) : null;
        const labels = new Set([...(f.neighbors ?? []), ...(f.focus !== null ? [f.focus] : [])]);
        drawPoints(sc, f.train, { dim, ring: f.focus !== null ? new Set([f.focus]) : null, labels, query: q });

        const items = f.list.map((e, i) => {
          const si = speciesIndex(e.label);
          const cls = [f.neighbors.includes(e.id) ? 'is-pick' : '', e.id === f.focus && !f.sorted ? 'is-new' : '', f.neighbors.length && !f.neighbors.includes(e.id) ? 'is-dim' : ''].filter(Boolean).join(' ');
          return { key: `d${e.id}`, cls, content: el('span', {}, `${fmt(e.d)} `, el(`span.legend__mark.sp${si}`, {}, SPECIES_SHAPE[si]), e.label) };
        });
        fill(data, el('div.knnds', {},
          el('div.knnds__list', {}, pyList('dists', items, { note: f.sorted ? ` = 거리목록 (정렬됨, 앞 ${f.k}개 = 이웃)` : ' = 거리목록', empty: '아직 비어 있어요' })),
          el('div.knnds__vote', {},
            pyDict('votes', f.counts ? SPECIES.map((sp) => [sp, f.counts[sp]]) : [], { hot: f.focus !== null ? f.train.find((t) => t.id === f.focus)?.label : null, note: ' = 세기표', empty: '아직 세지 않았어요' }),
            varBox('예측', f.pred ?? '?', { hot: Boolean(f.pred) }))));
        flip(data);
      },
    };
  },
};

export const KNN_SCENES = {
  knnExplore: { kind: 'view', mount: knnExplore },
  knn: knnStep,
};

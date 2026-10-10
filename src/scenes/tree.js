/**
 * 🤖 의사결정 트리 — ① 탐험(새 펭귄이 트리를 따라 내려가기) · ② 의사코드 한 단계씩(트리 키우기)
 *
 * 미션 신호(ctx.check) — ① 막대·그래프로 ★을 옮겨 예측이 바뀌었을 때
 *   'tree-gentoo' 젠투 잎에 닿음 · 'tree-adelie' 아델리 잎에 닿음 (처음 283번 펭귄은 턱끈)
 */
import { el, fill } from '../ui/dom.js';
import { infoTerm } from '../ui/infoTip.js';
import { createFlip } from '../ui/flip.js';
import * as TREE from '../core/ml/tree.js';
import { treeData, TREE_QUERY } from '../core/data/sets.js';
import { SPECIES } from '../core/data/practice.js';
import { s, marker } from '../viz/svg.js';
import { createScatter, starPath, sizeOf } from '../viz/scatter.js';
import { speciesLegend, speciesIndex, SPECIES_SHAPE } from '../viz/chart.js';
import { pyList } from '../viz/bits.js';
import { fmt } from '../core/stats.js';

const NB = '06_decision_tree';
const AXES = { x: [168, 236], y: [34, 54], xLabel: '날개길이 (mm)', yLabel: '부리길이 (mm)' };

/** 최종 트리 모양으로 노드 자리를 미리 정해 둔다 — 자라는 동안 자리가 흔들리지 않게 */
function layoutOf(tree) {
  const pos = new Map();
  let leafX = 0;
  const visit = (n) => {
    if (!n.yes) { pos.set(n.id, { x: leafX, y: n.depth }); leafX += 1; return; }
    visit(n.yes); visit(n.no);
    pos.set(n.id, { x: (pos.get(n.yes.id).x + pos.get(n.no.id).x) / 2, y: n.depth });
  };
  visit(tree);
  return { pos, leaves: leafX, depth: Math.max(...[...pos.values()].map((p) => p.y)) + 1 };
}

/** 노드 상자 하나 */
const BOX_H = 58;   // 노드 상자 높이 — 낮은 화면(1280×720)에서도 트리가 줄어들지 않게 작게

function nodeBox(n, x, y, { current = false, onPath = false, w = 168, h = BOX_H } = {}) {
  const g = s(`g.tnode2${current ? '.is-current' : ''}${onPath ? '.is-path' : ''}${n.leaf ? '.is-leaf' : ''}`, { transform: `translate(${x - w / 2},${y})` });
  g.append(s('rect.tnode2__box', { width: w, height: h, rx: 8 }));
  const title = n.leaf ? `🍃 ${n.leaf}` : n.split ? `${n.split.feature} ≤ ${n.split.threshold} ?` : '나눌 차례…';
  g.append(s('text.tnode2__title', { x: w / 2, y: 17, 'text-anchor': 'middle' }, title));
  // 종별 개수 막대
  const total = n.counts.reduce((a, b) => a + b, 0);
  let bx = 10;
  const bw = w - 20;
  n.counts.forEach((c, i) => {
    if (!c) return;
    const ww = (c / total) * bw;
    g.append(s(`rect.tnode2__bar.sp${i}`, { x: bx, y: 24, width: Math.max(1, ww - 1), height: 10, rx: 2 }));
    bx += ww;
  });
  g.append(s('text.tnode2__counts', { x: w / 2, y: 49, 'text-anchor': 'middle' },
    `${SPECIES_SHAPE[0]}${n.counts[0]} ${SPECIES_SHAPE[1]}${n.counts[1]} ${SPECIES_SHAPE[2]}${n.counts[2]} · 지니 ${fmt(n.gini, 3)}`));
  return g;
}

/** 트리 그림 — nodes: 지금까지 만든 노드(평평한 목록) */
function treeSvg(nodes, layout, { current = null, path = [], W = 560, H = 300 } = {}) {
  const colW = W / layout.leaves;
  const rowH = Math.max(BOX_H + 18, (H - BOX_H - 12) / Math.max(1, layout.depth - 1));
  const P = (id) => { const p = layout.pos.get(id); return { x: colW * (p.x + 0.5), y: 8 + p.y * rowH }; };
  const edges = [];
  const boxes = [];
  for (const n of nodes) {
    if (n.parent !== null && n.parent !== undefined) {
      const a = P(n.parent); const b = P(n.id);
      const onPath = path.includes(n.id) && path.includes(n.parent);
      edges.push(s(`path.tedge${onPath ? '.is-path' : ''}`, { d: `M${a.x},${a.y + BOX_H} C${a.x},${a.y + BOX_H + 14} ${b.x},${b.y - 14} ${b.x},${b.y}` }));
      // 가지 글자는 자식 상자 바로 위, 가지가 들어오지 않는 바깥쪽에 둔다(가지와 겹치지 않게).
      // 예(왼쪽 자식)는 가지가 오른쪽 위에서 오므로 왼쪽에, 아니오(오른쪽 자식)는 오른쪽에. 테두리(halo)로 선 위에서도 읽히게.
      const yes = n.side === 'yes';
      edges.push(s('text.tedge__lbl', {
        x: b.x + (yes ? -8 : 8), y: b.y - 6, 'text-anchor': yes ? 'end' : 'start',
        style: 'paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round;',
      }, yes ? '예' : '아니오'));
    }
    const p = P(n.id);
    boxes.push(nodeBox(n, p.x, p.y, { current: n.id === current, onPath: path.includes(n.id), w: Math.min(176, colW - 10) }));
  }
  // 마지막 줄에는 상자 높이만 — 빈 줄 높이를 더하지 않는다
  const h = 8 + (layout.depth - 1) * rowH + BOX_H + 4;
  return s('svg.tsvg', { viewBox: `0 0 ${W} ${h}`, role: 'img', 'aria-label': '의사결정 트리' }, edges, boxes);
}

/** 산점도 위에 나눔 선·잎 영역 그리기 */
function drawPartition(sc, nodes, { shade = true } = {}) {
  sc.clear('region', 'under');
  const box = { x0: AXES.x[0], x1: AXES.x[1], y0: AXES.y[0], y1: AXES.y[1] };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const kids = (id) => nodes.filter((n) => n.parent === id);
  const visit = (id, b) => {
    const n = byId.get(id);
    if (!n) return;
    const ch = kids(id);
    if (n.split && ch.length) {
      const { feature, threshold } = n.split;
      if (feature === '날개길이') {
        sc.layers.under.append(s('line.split-line', { x1: sc.sx(threshold), x2: sc.sx(threshold), y1: sc.sy(b.y0), y2: sc.sy(b.y1) }));
        sc.layers.under.append(s('text.split-label', { x: sc.sx(threshold) + 4, y: sc.sy(b.y1) + 14 }, `날개 ${threshold}`));
        for (const c of ch) visit(c.id, c.side === 'yes' ? { ...b, x1: threshold } : { ...b, x0: threshold });
      } else {
        sc.layers.under.append(s('line.split-line', { x1: sc.sx(b.x0), x2: sc.sx(b.x1), y1: sc.sy(threshold), y2: sc.sy(threshold) }));
        sc.layers.under.append(s('text.split-label', { x: sc.sx(b.x0) + 4, y: sc.sy(threshold) - 5 }, `부리 ${threshold}`));
        for (const c of ch) visit(c.id, c.side === 'yes' ? { ...b, y1: threshold } : { ...b, y0: threshold });
      }
    } else if (n.leaf && shade) {
      sc.layers.region.append(s(`rect.region.sp${speciesIndex(n.leaf)}`, {
        x: sc.sx(b.x0), y: sc.sy(b.y1), width: sc.sx(b.x1) - sc.sx(b.x0), height: sc.sy(b.y0) - sc.sy(b.y1),
      }));
    }
  };
  visit(0, box);
}

function drawItems(sc, items, { dim = null } = {}) {
  sc.clear('points');
  for (const p of items) {
    const si = speciesIndex(p.label);
    sc.layers.points.append(marker(si, sc.sx(p.날개길이), sc.sy(p.부리길이), 6, { class: `pt sp${si}${dim && !dim.has(p.id) ? ' is-dim' : ''}` }));
  }
}

/* ═════════════ ① 탐험 ═════════════ */

function treeExplore(root, ctx) {
  const items = treeData();
  const tree = TREE.buildTree(items);
  const flat = TREE.flatten(tree);
  const layout = layoutOf(tree);
  let q = { 날개길이: TREE_QUERY.날개길이, 부리길이: TREE_QUERY.부리길이 };
  const sc = createScatter({ ...AXES, width: 520, height: 340, onClick: (x, y) => { q = { 날개길이: Math.round(x), 부리길이: Math.round(y * 10) / 10 }; draw(true); } });
  sc.mover('q', () => starPath(11));
  const treeBox = el('div.treex__tree');
  const result = el('div.treex__result');
  const inW = el('input', { type: 'range', min: 170, max: 234, step: 1, 'aria-label': '날개길이', oninput: (e) => { q.날개길이 = Number(e.target.value); draw(true); } });
  const inB = el('input', { type: 'range', min: 34, max: 54, step: 0.1, 'aria-label': '부리길이', oninput: (e) => { q.부리길이 = Number(e.target.value); draw(true); } });
  const lw = el('b'); const lb = el('b');

  function draw(byHand = false) {
    inW.value = q.날개길이; inB.value = q.부리길이;
    lw.textContent = `${q.날개길이}mm`; lb.textContent = `${q.부리길이}mm`;
    const { path, pred } = TREE.walk(tree, q);
    if (byHand && pred === '젠투') ctx?.check('tree-gentoo');
    if (byHand && pred === '아델리') ctx?.check('tree-adelie');
    const ids = path.map((n) => n.id);
    fill(treeBox, treeSvg(flat, layout, { path: ids, W: 600, H: 320 }));
    drawPartition(sc, flat);
    drawItems(sc, items);
    sc.move('q', q.날개길이, q.부리길이);
    fill(result,
      el('ol.treex__steps', {}, path.filter((n) => n.split).map((n) => {
        const yes = q[n.split.feature] <= n.split.threshold;
        return el('li', {}, `${n.split.feature} ${q[n.split.feature]} ≤ ${n.split.threshold} ? → `, el('b', {}, yes ? '예(왼쪽)' : '아니오(오른쪽)'));
      })),
      el('div.knnx__pred', {}, '예측: ', el('strong', {}, `${pred}펭귄`)));
  }

  fill(root, el('div.treex', {},
    el('div.treex__left', {},
      el('div.treex__inputs', {},
        el('label', {}, '날개길이 ', lw, inW),
        el('label', {}, '부리길이 ', lb, inB),
        el('button.pill', { type: 'button', onclick: () => { q = { 날개길이: TREE_QUERY.날개길이, 부리길이: TREE_QUERY.부리길이 }; draw(); } }, '↺ 283번 펭귄으로')),
      // 지니 불순도가 노드마다 보이므로, 그림 바로 위에 한 줄로 뜻을 먼저 알려 준다
      el('p.panel__hint', {}, '📏 ', infoTerm('지니 불순도', { strong: true }), '는 한 노드에 여러 종이 섞인 정도예요. ',
        el('b', {}, '0이면 한 종만'), ' 있다는 뜻이에요(잎). 뿌리는 세 종이 섞여 있어서 0.664예요.'),
      treeBox, result),
    el('div.treex__right', {},
      speciesLegend([el('span.legend__item', {}, el('span.legend__mark', {}, '★'), '새 펭귄')]),
      el('div.knnx__chart', {}, sc.svg),
      el('p.panel__hint', {}, '점선은 트리의 질문(나눔 선)이고, 칸의 색은 그 칸에 들어온 펭귄에게 트리가 내놓는 답이에요. 그래프를 눌러도 새 펭귄을 옮길 수 있어요.'))));
  draw();
  return {};
}

/* ═════════════ ② 의사코드 한 단계씩 ═════════════ */

const treeStep = {
  kind: 'step',
  pseudo: TREE.PSEUDO,
  python: TREE.PYTHON,
  notebook: NB,
  stageTitle: '자라는 트리  |  같은 일을 그래프에서',
  stageHint: '파란 테두리 = 지금 나누는 노드',
  dataTitle: '질문 후보(불순도) · 할일 큐',
  rows: ['1.38fr', '0.82fr'],   // 질문 후보 표(3줄)가 잘리지 않게
  frames: () => TREE.treeFrames(),
  mount({ stage, data }) {
    stage.classList.add('fit');
    const items = treeData();
    const layout = layoutOf(TREE.buildTree(items));
    const size = sizeOf(stage, { reserve: 48 });
    const half = { width: Math.max(380, Math.floor(size.width * 0.46)), height: size.height };
    const sc = createScatter({ ...AXES, ...half });
    sc.mover('q', () => starPath(11));
    const treeHolder = el('div.treestep__tree');
    fill(stage, speciesLegend(), el('div.fit__grow.treestep', {}, treeHolder, el('div.treestep__chart', {}, sc.svg)));
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        fill(treeHolder, treeSvg(f.nodes, layout, { current: f.current, path: f.path ?? [], W: Math.floor(size.width * 0.52), H: size.height }));
        drawPartition(sc, f.nodes, { shade: true });
        const cur = f.nodes.find((n) => n.id === f.current);
        drawItems(sc, items, { dim: cur ? new Set(cur.ids) : null });
        sc.move('q', f.query.날개길이, f.query.부리길이, { hidden: !f.path });
        const cands = f.cands ? [...f.cands].sort((a, b) => a.score - b.score) : [];
        const top = cands.slice(0, 3);   // 1등과 그다음 둘 — 자료구조 칸에 잘리지 않고 들어가게
        fill(data, el('div.treeds', {},
          el('div.treeds__cands', {},
            el('div.webx__cap', {}, f.cands ? `질문 후보 ${f.cands.length}개 가운데 불순도가 가장 낮은 3개 (낮을수록 좋아요)` : '질문 후보'),
            f.cands ? el('table.mini', {},
              el('thead', {}, el('tr', {}, el('th', {}, '질문'), el('th', {}, '예 쪽 ●▲■'), el('th', {}, '아니오 쪽 ●▲■'), el('th', {}, '나눈 뒤 불순도(평균)'))),
              el('tbody', {}, top.map((c) => el(`tr${f.best && c.feature === f.best.feature && c.threshold === f.best.threshold ? '.is-best' : ''}`, {},
                el('td', {}, `${c.feature} ≤ ${c.threshold}`), el('td', {}, c.left.join(' · ')), el('td', {}, c.right.join(' · ')), el('td', {}, fmt(c.score, 3))))))
              : el('p.panel__hint', {}, '노드를 나눌 차례가 되면 모든 질문 후보를 시험해 봐요.')),
          el('div.treeds__queue', {}, pyList('할일', f.queue.map((id) => ({ key: `q${id}`, content: `노드 ${id}`, cls: '' })), { note: ' = 큐 (앞에서 꺼냄)', empty: f.line === 2 || f.line === 9 ? '비었어요 → 끝' : '비었어요 (꺼낸 노드를 처리하는 중)' }))));
        flip(data);
      },
    };
  },
};

export const TREE_SCENES = {
  treeExplore: { kind: 'view', mount: treeExplore },
  tree: treeStep,
};

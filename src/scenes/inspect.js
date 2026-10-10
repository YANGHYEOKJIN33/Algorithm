/**
 * 🔍 가공 — 결측치(여부·개수·위치)와 이상치(사분위수·상자그림)
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import * as INS from '../core/inspect.js';
import { dataTable } from '../viz/table.js';
import { pyList, calcGrid, counters } from '../viz/bits.js';
import { s, scale, ticks } from '../viz/svg.js';
import { fmt } from '../core/stats.js';

const NB = '02_missing_outlier';

/* ═════════════ 결측치 ① 여부 ═════════════ */

const mask = {
  kind: 'step',
  pseudo: INS.MASK_PSEUDO,
  python: INS.MASK_PYTHON,
  notebook: NB,
  stageTitle: '원래 표 df  →  결과표 df.isnull()',
  stageHint: 'True = 비었어요 · False = 값이 있어요',
  nodata: true,
  frames: () => INS.maskFrames(),
  mount({ stage }) {
    return {
      render(v) {
        const f = v.frame;
        const { table, mask: m } = f;
        const curCol = f.col === null ? null : table.columns[f.col];
        // 칸 하나씩 보는 열(f.upto)은 지금 칸까지만 채운다
        const left = dataTable({
          columns: table.columns, rows: table.rows,
          colClass: (c) => (c === curCol ? 'is-col' : ''),
          cellClass: (r, c, ri) => (f.cell !== null && c === curCol && ri === f.cell ? 'is-focus' : ''),
        });
        const done = new Set(f.done);
        const filled = (ri, ci) => done.has(ci) || (f.upto !== null && ci === f.col && ri <= f.upto);
        const maskRows = table.rows.map((_, ri) => Object.fromEntries(table.columns.map((c, ci) => [c, m[ri][ci]])));
        const t = dataTable({
          columns: table.columns, rows: maskRows,
          cell: (r, c, ri) => (filled(ri, table.columns.indexOf(c)) ? (r[c] ? 'True' : 'False') : '·'),
          cellClass: (r, c, ri) => {
            const ci = table.columns.indexOf(c);
            if (!filled(ri, ci)) return 'is-pending';
            const hit = c === curCol && (f.cell === null || ri === f.cell);
            return [r[c] ? 'is-true' : 'is-false', hit ? 'is-hit' : '', f.cell !== null && c === curCol && ri === f.cell ? 'is-focus' : ''].join(' ');
          },
          colClass: (c) => (c === curCol ? 'is-col' : ''),
        });
        // 위에서 아래로 차례로 뒤집히게 — 안쪽 반복(각 칸)이 눈에 보이도록
        t.querySelectorAll('tbody tr').forEach((tr, ri) => {
          tr.querySelectorAll('td.is-hit').forEach((td) => { td.style.animationDelay = `${ri * 70}ms`; });
        });
        const trues = f.done.reduce((n, ci) => n + m.filter((row) => row[ci]).length, 0)
          + (f.upto !== null && f.upto >= 0 ? m.slice(0, f.upto + 1).filter((row) => row[f.col]).length : 0);
        fill(stage,
          counters([['검사한 열', `${f.done.length} / ${table.columns.length}`], ['찾은 True', trues, trues ? 'warn' : null]]),
          el('div.duo', {},
            el('div.duo__col', {}, el('div.webx__cap', {}, '원래 표 df (빈칸 = NaN)'), left),
            el('div.duo__arrow', { 'aria-hidden': 'true' }, '→'),
            el('div.duo__col', {}, el('div.webx__cap', {}, '결과표 df.isnull()'), t)));
      },
    };
  },
};

/* ═════════════ 결측치 ② 개수 ═════════════ */

const count = {
  kind: 'step',
  pseudo: INS.COUNT_PSEUDO,
  python: INS.COUNT_PYTHON,
  notebook: NB,
  stageTitle: '결과표 df.isnull()  →  개수표 df.isnull().sum()',
  stageHint: 'True를 1, False를 0으로 더해요',
  nodata: true,
  frames: () => INS.countFrames(),
  mount({ stage }) {
    return {
      render(v) {
        const f = v.frame;
        const { table, mask: m } = f;
        const curCol = f.col === null ? null : table.columns[f.col];
        const rows = table.rows.map((_, ri) => Object.fromEntries(table.columns.map((c, ci) => [c, m[ri][ci]])));
        const foot = el('tr', {}, el('th.dtable__idx', {}, '합'), table.columns.map((c, ci) =>
          el(`td${c === curCol ? '.is-col' : ''}`, {}, String(f.counts[ci]))));
        const maskT = (dataTable({
          columns: table.columns, rows,
          cell: (r, c) => (r[c] ? 'True(1)' : 'False(0)'),
          cellClass: (r, c) => [r[c] ? 'is-true' : 'is-false', c === curCol && r[c] && f.phase === 'count' ? 'is-hit' : ''].join(' '),
          colClass: (c) => (c === curCol ? 'is-col' : ''),
          foot,
        }));
        const max = Math.max(1, ...f.counts);
        const series = (el('div.series', {},
          el('div.series__head', {}, el('span', {}, '열 이름'), el('span', {}, ''), el('span', {}, '결측치 개수')),
          table.columns.map((c, ci) => {
            const n = f.counts[ci];
            return el(`div.series__row${c === curCol ? '.is-hot' : ''}`, {},
              el('span.series__k', {}, c),
              el('span.series__bar', {}, el(`span.series__fill${n ? '.is-warn' : ''}`, { style: `width:${(n / max) * 100}%` })),
              el('span.series__v', {}, String(n)));
          }),
          f.total !== null ? el('div.series__row.series__row--total', {}, el('span.series__k', {}, '전체'), el('span.series__bar'), el('span.series__v', {}, String(f.total))) : null));
        fill(stage, el('div.duo', {},
          el('div.duo__col', {}, el('div.webx__cap', {}, '결과표 df.isnull() — 맨 아래 줄이 열마다의 합'), maskT),
          el('div.duo__arrow', { 'aria-hidden': 'true' }, '→'),
          el('div.duo__col.duo__col--grow', {}, el('div.webx__cap', {}, '개수표 (열 이름 → 결측치 개수)'), series)));
      },
    };
  },
};

/* ═════════════ 결측치 ③ 위치 ═════════════ */

const where = {
  kind: 'step',
  pseudo: INS.WHERE_PSEUDO,
  python: INS.WHERE_PYTHON,
  notebook: NB,
  stageTitle: '원래 표 df — 행을 하나씩 검사  →  위치목록',
  stageHint: '빨간 행 = 빈칸이 있는 행',
  nodata: true,
  frames: () => INS.whereFrames(),
  mount({ stage }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const hits = new Set(f.list);
        const table = dataTable({
          columns: f.table.columns, rows: f.table.rows,
          rowClass: (r, i) => [hits.has(i) || (i === f.row && f.hit) ? 'is-warn' : '', i === f.row ? 'is-row' : ''].join(' '),
        });
        const items = f.list.map((i) => ({ key: `w${i}`, cls: i === f.row && f.line === 4 ? 'is-new' : '', content: String(i) }));
        fill(stage, el('div.duo', {},
          el('div.duo__col', {}, el('div.webx__cap', {}, '원래 표 df'), table),
          el('div.duo__arrow', { 'aria-hidden': 'true' }, '→'),
          el('div.duo__col.duo__col--grow', {},
            pyList('where', items, { note: ' = 위치목록 (인덱스)' }),
            el('div.idxmap', {},
              el('div.webx__cap', {}, '인덱스 ≠ 펭귄 번호'),
              el('div.idxmap__list', {}, f.list.map((i) => el('span.idxmap__pair', { 'data-flip': `m${i}` }, el('b', {}, `인덱스 ${i}`), ' → ', `펭귄 ${f.table.rows[i].번호}번`)))))));
        flip(stage);
      },
    };
  },
};

/* ═════════════ 수직선 (사분위수·상자그림 공용) ═════════════ */

/** 이상치가 멀리 있으면 축을 끊어 그린다(≈). real=true면 실제 비율. */
function axisScale(values, stats, W, real) {
  const inside = values.filter((x) => x >= stats.lower && x <= stats.upper);
  const lo = Math.floor((Math.min(stats.lower, ...inside) - 100) / 100) * 100;
  const hiIn = Math.ceil((Math.max(stats.upper, ...inside) + 100) / 100) * 100;
  const far = stats.outliers.filter((x) => x > hiIn);
  if (real || far.length === 0) {
    const hi = Math.max(hiIn, ...values) + 100;
    const f = scale(lo, hi, 24, W - 16);
    return { x: f, segments: [[lo, hi]], broken: false };
  }
  const fl = Math.floor((Math.min(...far) - 200) / 100) * 100;
  const fh = Math.ceil((Math.max(...far) + 200) / 100) * 100;
  const a = scale(lo, hiIn, 24, W * 0.78);
  const b = scale(fl, fh, W * 0.86, W - 16);
  const x = (v) => (v <= hiIn ? a(v) : b(v));
  return { x, segments: [[lo, hiIn], [fl, fh]], broken: true, breakAt: W * 0.82 };
}

function numberLine({ items, stats, show, W = 640, H = 170, real = false, flags = {}, focus = null, marks = true }) {
  const values = items.map((it) => it.value);
  const ax = axisScale(values, stats, W, real);
  const yAxis = H - 34;
  const yBox = H - 82;
  const g = [];
  // 축과 눈금
  for (const [d0, d1] of ax.segments) {
    g.push(s('line.nl__axis', { x1: ax.x(d0), x2: ax.x(d1), y1: yAxis, y2: yAxis }));
    for (const t of ticks(d0, d1, ax.broken && d0 > stats.upper ? 2 : 6)) {
      g.push(s('line.nl__tick', { x1: ax.x(t), x2: ax.x(t), y1: yAxis, y2: yAxis + 5 }));
      g.push(s('text.chart__tick', { x: ax.x(t), y: yAxis + 18, 'text-anchor': 'middle' }, String(t)));
    }
  }
  if (ax.broken) g.push(s('text.nl__break', { x: ax.breakAt, y: yAxis + 5, 'text-anchor': 'middle' }, '≈'));
  // 울타리
  if (show.fences) {
    for (const [v, label] of [[stats.lower, '아래 울타리'], [stats.upper, '위 울타리']]) {
      g.push(s('line.nl__fence', { x1: ax.x(v), x2: ax.x(v), y1: 14, y2: yAxis }));
      g.push(s('text.nl__fencetxt', { x: ax.x(v), y: 11, 'text-anchor': 'middle' }, `${label} ${fmt(v)}`));
    }
  }
  // 상자그림
  const bh = 34;
  if (show.whiskers) {
    g.push(s('line.bp__whisker', { x1: ax.x(stats.whiskerLow), x2: ax.x(stats.q1), y1: yBox, y2: yBox }));
    g.push(s('line.bp__whisker', { x1: ax.x(stats.q3), x2: ax.x(stats.whiskerHigh), y1: yBox, y2: yBox }));
    for (const w of [stats.whiskerLow, stats.whiskerHigh]) g.push(s('line.bp__cap', { x1: ax.x(w), x2: ax.x(w), y1: yBox - 9, y2: yBox + 9 }));
  }
  if (show.box) g.push(s('rect.bp__box', { x: ax.x(stats.q1), y: yBox - bh / 2, width: Math.max(1, ax.x(stats.q3) - ax.x(stats.q1)), height: bh, rx: 3 }));
  if (show.median) g.push(s('line.bp__median', { x1: ax.x(stats.q2), x2: ax.x(stats.q2), y1: yBox - bh / 2, y2: yBox + bh / 2 }));
  if (show.outliers) for (const o of stats.outliers) g.push(s('circle.bp__out', { cx: ax.x(o), cy: yBox, r: 6 }));
  if (show.box && marks) {
    for (const [k, v] of [['Q1', stats.q1], ['Q2', stats.q2], ['Q3', stats.q3]]) {
      g.push(s('text.bp__lbl', { x: ax.x(v), y: yBox - bh / 2 - 6, 'text-anchor': 'middle' }, k));
    }
  }
  // 점 (값 하나하나) — 같은 값은 위로 쌓는다
  if (show.dots) {
    const seen = new Map();
    for (const it of items) {
      const n = seen.get(it.value) ?? 0;
      seen.set(it.value, n + 1);
      const fl = flags[it.id];
      g.push(s(`circle.nl__dot${fl === 'out' ? '.is-out' : fl === 'in' ? '.is-in' : ''}${focus === it.id ? '.is-focus' : ''}`, {
        cx: ax.x(it.value), cy: yAxis - 10 - n * 11, r: 5,
      }));
    }
  }
  return s('svg.nl', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '몸무게 수직선' }, g);
}

/* ═════════════ 이상치 ① 사분위수 ═════════════ */

const quartile = {
  kind: 'step',
  pseudo: INS.QUART_PSEUDO,
  python: INS.QUART_PYTHON,
  notebook: NB,
  stageTitle: '아델리펭귄 13마리의 몸무게(g)',
  stageHint: '카드 아래 숫자 = 줄 선 순서(몇 번째)',
  dataTitle: '계산표',
  rows: ['1.7fr', '0.62fr'],
  frames: () => INS.quartileFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const byId = new Map(f.items.map((it) => [it.id, it]));
        const markAt = {};
        for (const [k, pos] of Object.entries(f.marks)) markAt[pos] = k.toUpperCase();
        fill(stage,
          el('div.vcards', {}, f.order.map((id, pos) => {
            const it = byId.get(id);
            const fl = f.flags[id];
            const cls = [fl === 'out' ? 'is-out' : fl === 'in' ? 'is-in' : '', f.focus === id ? 'is-focus' : '', markAt[pos] ? 'is-mark' : ''].filter(Boolean).join('.');
            return el(`div.vcard${cls ? `.${cls}` : ''}`, { 'data-flip': `v${id}` },
              markAt[pos] && f.sorted ? el('span.vcard__mark', {}, markAt[pos]) : null,
              el('span.vcard__val', {}, String(it.value)),
              el('span.vcard__id', {}, `${id}번`),
              f.sorted ? el('span.vcard__pos', {}, `${pos + 1}번째`) : null);
          })),
          el('div.nlbox', {}, numberLine({ items: f.items, stats: f.stats, show: { dots: true, fences: 'lower' in f.calc && 'upper' in f.calc }, flags: f.flags, focus: f.focus })));
        flip(stage);
        const c = f.calc;
        const outs = f.order.filter((id) => f.flags[id] === 'out').map((id) => byId.get(id));
        fill(data, el('div.calcrow', {},
          calcGrid([
            ['Q1 (25%)', c.q1 !== undefined ? `${fmt(c.q1)}g` : null, f.phase === 'q1'],
            ['Q2 (중앙값)', c.q2 !== undefined ? `${fmt(c.q2)}g` : null, f.phase === 'q2'],
            ['Q3 (75%)', c.q3 !== undefined ? `${fmt(c.q3)}g` : null, f.phase === 'q3'],
            ['IQR = Q3 − Q1', c.iqr !== undefined ? `${fmt(c.iqr)}g` : null, f.phase === 'iqr'],
            ['아래 울타리', c.lower !== undefined ? `${fmt(c.lower)}g` : null, f.phase === 'lower'],
            ['위 울타리', c.upper !== undefined ? `${fmt(c.upper)}g` : null, f.phase === 'upper'],
          ]),
          pyList('이상치', outs.map((o) => ({ key: `o${o.id}`, cls: 'is-new', content: `${o.value} (${o.id}번)` })), { empty: '아직 없어요' })));
        flip(data);
      },
    };
  },
};

/* ═════════════ 이상치 ② 상자그림 ═════════════ */

const box = {
  kind: 'step',
  pseudo: INS.BOX_PSEUDO,
  python: INS.BOX_PYTHON,
  notebook: NB,
  stageTitle: '상자그림 (몸무게, g)',
  stageHint: '',
  dataTitle: '상자그림 읽는 법',
  rows: ['1.25fr', '0.85fr'],
  frames: () => INS.boxFrames(),
  mount({ stage, data, stageTools }, ctx) {
    stage.classList.add('fit');
    let real = false;
    let last = null;
    const seg = el('div.seg', {},
      el('button', { type: 'button', 'aria-pressed': 'true', onclick: () => { real = false; upd(); } }, '≈ 끊은 축'),
      el('button', { type: 'button', 'aria-pressed': 'false', onclick: () => { real = true; upd(); ctx.check('real-scale'); } }, '실제 비율로'));
    fill(stageTools, seg);
    function upd() {
      seg.children[0].setAttribute('aria-pressed', String(!real));
      seg.children[1].setAttribute('aria-pressed', String(real));
      if (last) draw(last);
    }
    function draw(v) {
      const f = v.frame;
      fill(stage,
        el('div.fit__grow', {}, numberLine({ items: f.items, stats: f.stats, show: { ...f.show, fences: false }, real, H: 190 })),
        el('p.panel__hint', {}, real
          ? '실제 비율: 8200g이 너무 멀리 있어서 상자가 아주 납작해 보여요. Colab 02의 13마리 셀도 방향만 세로일 뿐 이렇게 그려요.'
          : '≈ 표시는 축을 끊어 그렸다는 뜻이에요. 8200g은 실제로는 훨씬 멀리 있어요.'));
    }
    return {
      render(v) {
        last = v;
        draw(v);
        const f = v.frame;
        const st = f.stats;
        const part = (on, icon, name, text) => el(`div.bpread__row${on ? '' : '.is-off'}`, {}, el('span.bpread__icon', {}, icon), el('strong', {}, name), el('span', {}, text));
        fill(data, el('div.bpread', {},
          part(f.show.box, '▭', '상자', `Q1 ${fmt(st.q1)} ~ Q3 ${fmt(st.q3)} — 가운데 절반의 값`),
          part(f.show.median, '│', '가운데 선', `Q2 ${fmt(st.q2)} — 중앙값`),
          part(f.show.whiskers, '⟷', '수염', `${fmt(st.whiskerLow)} ~ ${fmt(st.whiskerHigh)} — 울타리(${fmt(st.lower)} ~ ${fmt(st.upper)}) 안의 가장 먼 값까지`),
          part(f.show.outliers, '●', '따로 찍힌 점', `${st.outliers.join(', ')} — 이상치`),
          f.compare ? part(true, '🐍', '345줄 전체', `상자 ${fmt(f.compare.q1)} ~ ${fmt(f.compare.q3)} · 선 ${fmt(f.compare.q2)} · 수염 ${fmt(f.compare.whiskerLow)} ~ ${fmt(f.compare.whiskerHigh)} · 점 ${f.compare.outliers.join(', ')} — Colab 02의 전체 그림. 읽는 법은 같고 값만 달라요`) : null));
      },
    };
  },
};

export const INSPECT_SCENES = { mask, count, where, quartile, box };

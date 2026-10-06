/**
 * 🧹 전처리 — 핵심 속성 · 데이터 삭제 · 결측치 삭제 · 평균값/최빈값 대체 · 텍스트 값 대체
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import * as PP from '../core/preprocess.js';
import { SPECIES } from '../core/data/practice.js';
import { dataTable } from '../viz/table.js';
import { pyList, pyDict, counters, varBox } from '../viz/bits.js';
import { s, scale, ticks, marker } from '../viz/svg.js';
import { speciesLegend, SPECIES_SHAPE } from '../viz/chart.js';
import { fmt, isMissing } from '../core/stats.js';
import { createRandom } from '../core/random.js';

const NB = '03_preprocessing';
const idx = (r) => String(r._i);

/* ═════════════ 핵심 속성: 종별 분포 그림 ═════════════ */

function stripPlot(profile, W = 640, H = 210) {
  const pad = { l: 64, r: 16, t: 10, b: 30 };
  const lo = profile.min - (profile.max - profile.min) * 0.04;
  const hi = profile.max + (profile.max - profile.min) * 0.04;
  const x = scale(lo, hi, pad.l, W - pad.r);
  const lane = (H - pad.t - pad.b) / 3;
  const g = [];
  for (const t of ticks(lo, hi, 6)) {
    g.push(s('line.strip__grid', { x1: x(t), x2: x(t), y1: pad.t, y2: H - pad.b }));
    g.push(s('text.chart__tick', { x: x(t), y: H - pad.b + 16, 'text-anchor': 'middle' }, String(t)));
  }
  const rand = createRandom(11);
  profile.bySpecies.forEach((vals, si) => {
    const cy = pad.t + lane * si + lane / 2;
    g.push(s('text.strip__lane', { x: pad.l - 8, y: cy + 4, 'text-anchor': 'end' }, SPECIES[si]));
    g.push(s('line.strip__base', { x1: pad.l, x2: W - pad.r, y1: cy, y2: cy }));
    for (const v of vals) {
      const jy = (rand() - 0.5) * lane * 0.62;
      g.push(marker(si, x(v), cy + jy, 3, { class: `pt pt--sm sp${si}` }));
    }
  });
  return s('svg.strip', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${profile.col} 종별 분포` }, g);
}

function countGrid(profile) {
  const max = Math.max(1, ...profile.counts.flat());
  return el('table.cgrid', {},
    el('thead', {}, el('tr', {}, el('th', {}, '종 \\ 값'), profile.values.map((v) => el('th', {}, String(v))))),
    el('tbody', {}, profile.counts.map((row, si) => el('tr', {},
      el('th', {}, el(`span.legend__mark.sp${si}`, {}, SPECIES_SHAPE[si]), ` ${SPECIES[si]}`),
      row.map((n) => el('td', {}, el('span.cgrid__bar', { style: `width:${(n / max) * 100}%` }), el('span.cgrid__n', {}, String(n))))))));
}

const features = {
  kind: 'step',
  pseudo: PP.FEATURE_PSEUDO,
  python: PP.FEATURE_PYTHON,
  notebook: NB,
  stageTitle: '속성 하나를 종(색)별로 펼쳐 보기',
  stageHint: '전체 344마리 원본 데이터',
  dataTitle: '고른 결과',
  rows: ['1.45fr', '0.75fr'],
  frames: () => PP.featureFrames(),
  mount({ stage, data }) {
    stage.classList.add('fit');
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const p = f.profile;
        fill(stage,
          el('div.feathead', {},
            el('h3.feathead__col', {}, p ? `속성: ${f.col}` : '목표: 펭귄의 종 맞히기 🎯'),
            f.verdict ? el(`span.tag${f.verdict.keep ? '.tag--add' : '.tag--warn'}`, {}, f.verdict.keep ? '✅ 핵심 속성으로 넣어요' : '✖️ 빼요') : null,
            speciesLegend()),
          p ? el('div.fit__grow', {}, p.kind === 'num' ? stripPlot(p) : countGrid(p))
            : el('div.fit__grow', {}, el('div.placeholder', {}, '정답 열은 \'종\'이에요. 나머지 8개 속성을 하나씩 꺼내 종과 관계있는지 봐요.')),
          f.verdict ? el('p.featwhy', {}, f.verdict.why) : null);
        const chip = (c, cls) => ({ key: `f-${c}`, cls, content: c });
        fill(data, el('div.xybox', {},
          el('div.xybox__col', {}, pyList('X (입력 속성)', f.kept.map((c) => chip(c, c === f.col ? 'is-new' : '')), { showIndex: false, empty: '아직 없어요' })),
          el('div.xybox__col', {}, pyList('y (정답)', [chip('종', 'is-pick')], { showIndex: false })),
          el('div.xybox__col', {}, pyList('뺀 속성', f.dropped.map((c) => chip(c, c === f.col ? 'is-dim is-new' : 'is-dim')), { showIndex: false, empty: '아직 없어요' }))));
        flip(data);
      },
    };
  },
};

/* ═════════════ 데이터 삭제 ═════════════ */

const drop = {
  kind: 'step',
  pseudo: PP.DROP_PSEUDO,
  python: PP.DROP_PYTHON,
  notebook: NB,
  stageTitle: '표 df',
  stageHint: '빨강 = 지울 것',
  dataTitle: '지금까지 지운 것',
  rows: ['1.3fr', '0.7fr'],
  frames: () => PP.dropFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    const removed = [];
    const all = PP.dropFrames()[0].table.rows;
    return {
      render(v) {
        const f = v.frame;
        const t = f.table;
        fill(stage, dataTable({
          columns: t.columns, rows: t.rows, index: idx, key: (r) => r._k,
          colClass: (c) => (c === f.markCol ? 'is-warncol' : ''),
          rowClass: (r) => (f.markRows.includes(r._k) ? 'is-warn' : ''),
        }));
        flip(stage);
        removed.length = 0;
        if (!t.columns.includes('연도')) removed.push({ key: 'd-col', content: "열 '연도'" });
        const ids = new Set(t.rows.map((r) => r._k));
        for (const r of all) if (!ids.has(r._k)) removed.push({ key: `d-${r._k}`, content: `행 ${r._i} (펭귄 ${r.번호}번${r.몸무게 > 6000 ? ', 8200g' : ', 겹침'})` });
        fill(data,
          counters([['행', t.rows.length], ['열', t.columns.length]]),
          pyList('지운 것', removed.map((x) => ({ ...x, cls: 'is-dim' })), { showIndex: false, empty: '아직 없어요' }));
      },
    };
  },
};

/* ═════════════ 결측치 삭제 ═════════════ */

const dropna = {
  kind: 'step',
  pseudo: PP.DROPNA_PSEUDO,
  python: PP.DROPNA_PYTHON,
  notebook: NB,
  stageTitle: '표 df → df.dropna()',
  stageHint: '빈칸이 있는 행은 통째로 사라져요',
  dataTitle: '얼마나 남았나',
  rows: ['1.35fr', '0.65fr'],
  frames: () => PP.dropnaFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const t = f.table;
        fill(stage, dataTable({
          columns: t.columns, rows: t.rows, index: idx, key: (r) => r._k,
          rowClass: (r) => (r._k === f.focus ? (t.columns.some((c) => isMissing(r[c])) ? 'is-warn is-row' : 'is-row') : ''),
        }));
        flip(stage);
        const left = t.rows.length;
        const lost = f.removed.length;
        fill(data,
          counters([['원래', `${f.total}행`], ['지운 행', lost, lost ? 'warn' : null], ['남은 행', left, 'add']]),
          el('div.lossbar', { role: 'img', 'aria-label': `남은 비율 ${Math.round((left / f.total) * 100)}%` },
            el('span.lossbar__keep', { style: `width:${(left / f.total) * 100}%` }, `남음 ${Math.round((left / f.total) * 100)}%`),
            lost ? el('span.lossbar__lost', { style: `width:${(lost / f.total) * 100}%` }, `잃음 ${Math.round((lost / f.total) * 100)}%`) : null));
      },
    };
  },
};

/* ═════════════ 평균값 대체 ═════════════ */

const fillmean = {
  kind: 'step',
  pseudo: PP.FILLMEAN_PSEUDO,
  python: PP.FILLMEAN_PYTHON,
  notebook: NB,
  stageTitle: '표 df',
  stageHint: '초록 = 평균으로 채운 칸',
  dataTitle: '평균 계산',
  rows: ['1.25fr', '0.75fr'],
  frames: () => PP.fillMeanFrames(),
  mount({ stage, data }) {
    return {
      render(v) {
        const f = v.frame;
        const t = f.table;
        fill(stage, dataTable({
          columns: t.columns, rows: t.rows, index: idx,
          cellClass: (r, c) => (f.filled[`${r._k}|${c}`] ? 'is-filled' : ''),
          colClass: (c) => (c === f.col ? 'is-col' : ''),
        }));
        const calc = f.calc;
        fill(data,
          calc ? el('div.meancalc', {},
            el('div.meancalc__eq', {},
              el('span.meancalc__name', {}, `'${calc.col}' 평균 = (`),
              calc.values.map((x, i) => el('span.meancalc__v', {}, `${fmt(x)}${i < calc.values.length - 1 ? ' +' : ''}`)),
              el('span.meancalc__name', {}, `) ÷ ${calc.count}`)),
            el('div.meancalc__res', {}, `= ${fmt(calc.sum)} ÷ ${calc.count} = `, el('strong', {}, fmt(calc.mean, 3))))
            : el('p.panel__hint', {}, '열을 고르면 빈칸이 아닌 값들의 합과 개수로 평균을 구해요.'),
          pyDict('평균표', Object.entries(f.means).map(([k, m]) => [k, fmt(m, 3)]), { hot: f.col, empty: '아직 없어요' }));
      },
    };
  },
};

/* ═════════════ 최빈값 대체 ═════════════ */

const fillmode = {
  kind: 'step',
  pseudo: PP.FILLMODE_PSEUDO,
  python: PP.FILLMODE_PYTHON,
  notebook: NB,
  stageTitle: '표 df (앞 쪽에서 숫자 빈칸을 채운 표)',
  stageHint: '초록 = 최빈값으로 채운 칸',
  dataTitle: '세기표 (사전)',
  rows: ['1.25fr', '0.75fr'],
  frames: () => PP.fillModeFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const t = f.table;
        fill(stage, dataTable({
          columns: t.columns, rows: t.rows, index: idx,
          cellClass: (r, c) => [f.filled[`${r._k}|${c}`] ? 'is-filled' : '', r._k === f.focus && c === '성별' ? 'is-focus' : ''].join(' '),
          colClass: (c) => (c === '성별' ? 'is-col' : ''),
        }));
        fill(data, el('div.varrow', {},
          pyDict('counts', f.counts, { hot: f.key, note: ' = 세기표', empty: '{ } 비어 있어요' }),
          varBox('최빈값', f.mode ?? '?', { hot: f.mode !== null })));
        flip(data);
      },
    };
  },
};

/* ═════════════ 텍스트 값 대체 ═════════════ */

const replace = {
  kind: 'step',
  pseudo: PP.REPLACE_PSEUDO,
  python: PP.REPLACE_PYTHON,
  notebook: NB,
  stageTitle: '표 df',
  stageHint: '주황 = 숫자로 바꾼 칸',
  dataTitle: '바꿈표 (사전)',
  rows: ['1.3fr', '0.7fr'],
  frames: () => PP.replaceFrames(),
  mount({ stage, data }) {
    return {
      render(v) {
        const f = v.frame;
        const t = f.table;
        fill(stage, dataTable({
          columns: t.columns, rows: t.rows, index: idx,
          cellClass: (r, c) => [f.changed[`${r._k}|${c}`] ? 'is-changed' : '', r._k === f.focus && c === f.col ? 'is-focus' : ''].join(' '),
          colClass: (c) => (c === f.col ? 'is-col' : ''),
        }));
        fill(data, f.dict
          ? el('div.varrow', {},
            pyDict(f.col === '종' ? 'sp_map' : 'sex_map', Object.entries(f.dict), { hot: f.key ?? null, note: ' = 바꿈표' }),
            el('div.varrow__note', {},
              el('p', {}, '칸의 글자를 열쇠로 바꿈표에서 찾아, 그 값(숫자)으로 바꿔 적어요.'),
              el('p', {}, '0·1·2는 이름표일 뿐 크기에 뜻이 없어요. (젠투가 아델리보다 "2배"인 게 아니에요!)')))
          : el('p.panel__hint', {}, '바꿈표를 먼저 만들어요.'));
      },
    };
  },
};

export const PREP_SCENES = { features, drop, dropna, fillmean, fillmode, replace };

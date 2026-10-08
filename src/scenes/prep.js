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
import { missingTable } from '../core/data/sets.js';
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
  stageHint: '345줄에서 겹친 행을 뺀 344마리 · 8200g 같은 함정은 원래 값으로 그렸어요',
  dataTitle: '고른 결과',
  rows: ['1.45fr', '0.75fr'],
  frames: () => PP.featureFrames(),
  mount({ stage, data }, ctx) {
    stage.classList.add('fit');
    const flip = createFlip();
    const guesses = {};     // 속성 → true(넣는다) / false(뺀다) — 판단을 보기 전에 고른 내 예상
    let last = null;

    function pick(col, keep) {
      guesses[col] = keep;
      ctx.check('guess');
      if (col === '번호') ctx.check('guess-id');
      if (last) drawStage(last.frame);
    }
    function guessBar(col) {
      const g = guesses[col];
      const btn = (keep, label) => el('button.pill.pill--sm', { type: 'button', 'aria-pressed': String(g === keep), onclick: () => pick(col, keep) }, label);
      return el('div.featwhy', {}, el('strong', {}, '🤔 내 예상은? '), btn(true, '✅ 넣는다'), ' ', btn(false, '✖️ 뺀다'),
        el('span.card__meta', {}, g === undefined ? '  고른 다음 ⏭ 한 단계로 확인해요.' : '  ⏭ 한 단계를 눌러 맞았는지 확인해요.'));
    }
    function verdictNote(f) {
      const g = guesses[f.col];
      return el('p.featwhy', {}, f.verdict.why,
        g === undefined ? null : el('strong', {}, g === f.verdict.keep ? '  ⭕ 내 예상과 같아요!' : '  🤔 내 예상과 달라요 — 까닭을 읽어 봐요.'));
    }
    function endNote() {
      const tried = PP.FEATURE_VERDICTS.filter((v) => guesses[v.col] !== undefined);
      const ok = tried.filter((v) => guesses[v.col] === v.keep).length;
      return el('div.placeholder', {},
        el('p', {}, '고른 속성 4개는 입력 X(독립변수), 맞힐 종은 정답 y(종속변수)예요. 아래 칸을 보세요.'),
        tried.length ? el('p', {}, el('strong', {}, `내 예상: ${tried.length}개 중 ${ok}개 맞힘`)) : null);
    }
    function drawStage(f) {
      const p = f.profile;
      const tag = !f.verdict ? null
        : f.verdict.keep ? el('span.tag.tag--add', {}, '✅ 핵심 속성으로 넣어요')
          : el('span.tag.tag--warn', {}, f.verdict.kind === 'id' ? '⚠️ 함정 — 빼요' : '✖️ 빼요');
      fill(stage,
        el('div.feathead', {},
          el('h3.feathead__col', {}, p ? `속성: ${f.col}` : '목표: 펭귄의 종 맞히기 🎯'),
          tag,
          speciesLegend()),
        p ? el('div.fit__grow', {}, p.kind === 'num' ? stripPlot(p) : countGrid(p))
          : el('div.fit__grow', {}, f.done ? endNote()
            : el('div.placeholder', {}, '정답 열은 \'종\'이에요. 나머지 8개 속성을 하나씩 꺼내, 넣을지 뺄지 먼저 예상한 뒤 확인해요.')),
        f.verdict ? verdictNote(f) : p ? guessBar(f.col) : null);
    }
    return {
      render(v) {
        last = v;
        const f = v.frame;
        drawStage(f);
        const chip = (c, cls) => ({ key: `f-${c}`, cls, content: c });
        fill(data, el('div.xybox', {},
          el('div.xybox__col', {}, pyList('X (입력 · 독립변수)', f.kept.map((c) => chip(c, c === f.col ? 'is-new' : '')), { showIndex: false, empty: '아직 없어요' })),
          el('div.xybox__col', {}, pyList('y (정답 · 종속변수)', [chip('종', 'is-pick')], { showIndex: false })),
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
  rows: ['1.1fr', '0.9fr'],
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
          pyList('지운 것', removed.map((x) => ({ ...x, cls: 'is-dim' })), { showIndex: false, empty: '아직 없어요' }),
          el('p.callout', { style: 'margin:var(--sp-2) 0 0' }, el('strong', {}, '🗂️ 3-1쪽에서 X에서 뺀 열은? '),
            '연도는 어디에도 안 써서 지워요. 번호는 4단원에서 짝을 찾는 열쇠로 쓰고, 섬·성별은 다른 목표(예: 성별 맞히기 프로젝트)에 쓸 수 있어 표에 남겨 둬요.'));
      },
    };
  },
};

/* ═════════════ 결측치: 방법 A(지우기)와 방법 B(채우기) 견주기 ═════════════
   3-3~3-5쪽은 2단원에서 본 같은 10행 표를 쓴다. 쪽마다 처음 표에서 다시 시작하므로
   "지운 행이 왜 돌아왔지?"가 생기지 않게 어느 방법인지 띠로 알려 주고, 끝에서 두 방법을 견준다. */
const SAMPLE = missingTable();
const SAMPLE_ROWS = SAMPLE.rows.length;
const SAMPLE_HOLES = SAMPLE.rows.reduce((n, r) => n + SAMPLE.columns.filter((c) => isMissing(r[c])).length, 0);
const LOST_A = PP.dropnaFrames().at(-1).removed.length;

function methodBand(which) {
  const [name, rest] = {
    A: ['방법 A · 지우기', ` — 빈칸이 있는 행을 통째로 지워요. 다음 쪽 방법 B는 같은 ${SAMPLE_ROWS}행을 지우지 않고 채워요.`],
    B1: ['방법 B ① · 평균값으로 채우기', ` — 앞 쪽(방법 A)과 같은 ${SAMPLE_ROWS}행이에요. 지웠던 행도 그대로 두고 빈칸만 채워요.`],
    B2: ['방법 B ② · 최빈값으로 채우기', ' — 앞 쪽에서 숫자 빈칸을 채운 표에 이어서, 글자 열을 채워요.'],
  }[which];
  return el(`p.callout${which === 'A' ? '' : '.callout--add'}`, { style: 'flex:1 1 300px; margin:0 0 var(--sp-2)' }, el('strong', {}, name), rest);
}

/** 두 방법을 한 줄로 견주기 — 남은 행 수와 어림값으로 채운 칸 수 */
function versus() {
  return counters([
    ['방법 A 지우기', `${SAMPLE_ROWS - LOST_A}행 남음 (${Math.round((LOST_A / SAMPLE_ROWS) * 100)}% 잃음)`, 'warn'],
    ['방법 B 채우기', `${SAMPLE_ROWS}행 남음 · 어림값 ${SAMPLE_HOLES}칸`, 'add'],
  ]);
}

/* ═════════════ 결측치 방법 A — 지우기 ═════════════ */

const dropna = {
  kind: 'step',
  pseudo: PP.DROPNA_PSEUDO,
  python: PP.DROPNA_PYTHON,
  notebook: NB,
  stageTitle: '방법 A · 지우기 — df.dropna()',
  stageHint: '빈칸이 있는 행은 통째로 사라져요',
  dataTitle: '얼마나 남았나',
  rows: ['1.38fr', '0.62fr'],
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
          methodBand('A'),
          el('div.varrow', { style: 'align-items:center' },
            counters([['원래', `${f.total}행`], ['지운 행', lost, lost ? 'warn' : null], ['남은 행', left, 'add']]),
            el('div.lossbar', { role: 'img', 'aria-label': `남은 비율 ${Math.round((left / f.total) * 100)}%`, style: 'flex:1 1 260px; margin-bottom:var(--sp-2)' },
              el('span.lossbar__keep', { style: `width:${(left / f.total) * 100}%` }, `남음 ${Math.round((left / f.total) * 100)}%`),
              lost ? el('span.lossbar__lost', { style: `width:${(lost / f.total) * 100}%` }, `잃음 ${Math.round((lost / f.total) * 100)}%`) : null)),
          f.sexOnly?.length ? el('p.callout.callout--warn', { style: 'margin:0' },
            `⚠️ ${f.sexOnly.map((n) => `${n}번`).join('·')} 펭귄은 입력 X에 쓰지도 않는 성별 한 칸만 비었는데, 측정값까지 통째로 잃었어요.`) : null);
      },
    };
  },
};

/* ═════════════ 결측치 방법 B ① — 평균값으로 채우기 ═════════════ */

const fillmean = {
  kind: 'step',
  pseudo: PP.FILLMEAN_PSEUDO,
  python: PP.FILLMEAN_PYTHON,
  notebook: NB,
  stageTitle: '방법 B ① · 채우기 — 표 df',
  stageHint: '같은 10행 · 초록 = 평균으로 채운 칸',
  dataTitle: '평균 계산',
  rows: ['1.38fr', '0.62fr'],
  frames: () => PP.fillMeanFrames(),
  mount({ stage, data }) {
    return {
      render(v) {
        const f = v.frame;
        const t = f.table;
        const guessAll = (r) => f.allGuess?.includes(r._k);
        fill(stage, dataTable({
          columns: t.columns, rows: t.rows, index: (r) => (guessAll(r) ? `${r._i} ⚠️` : idx(r)),
          cellClass: (r, c) => (f.filled[`${r._k}|${c}`] ? 'is-filled' : ''),
          colClass: (c) => (c === f.col ? 'is-col' : ''),
        }));
        const calc = f.calc;
        const filledN = Object.keys(f.filled).length;
        // 처음: 어느 방법인지 · 열마다: 평균 계산과 변수 m · 끝: 방법 A와 같은 눈금으로 견주기
        if (!f.col && !f.done) {
          fill(data, methodBand('B1'), el('p.panel__hint', {}, '열마다 빈칸이 아닌 값들의 합 ÷ 개수로 평균을 구해 빈칸에 적어요.'));
        } else if (f.done) {
          fill(data,
            counters([['원래', `${SAMPLE_ROWS}행`], ['지운 행', 0], ['남은 행', t.rows.length, 'add'], ['채운 칸', filledN, 'add']]),
            el('p.panel__hint', {}, `방법 A(지우기)는 같은 표에서 ${SAMPLE_ROWS - LOST_A}행만 남았어요. 방법 B는 행을 모두 지키지만, 채운 ${filledN}칸은 진짜가 아닌 어림값이에요.`),
            f.allGuess?.length ? el('p.callout.callout--warn', { style: 'margin:var(--sp-2) 0 0' },
              el('strong', {}, '⚠️ 모두 어림값 — '),
              `인덱스 ${t.rows.filter(guessAll).map((r) => `${r._i}행(펭귄 ${r.번호}번)`).join(', ')}은 측정값 ${PP.FILL_COLUMNS.length}칸이 전부 평균으로 채운 값이라, 진짜로 잰 값이 하나도 없어요. 이런 행은 어떻게 할지 3-5쪽 끝에서 골라 봐요.`) : null);
        } else {
          fill(data, el('div.varrow', {},
            calc ? el('div.meancalc', { style: 'flex:1 1 420px; margin:0' },
              el('div.meancalc__eq', {},
                el('span.meancalc__name', {}, `'${calc.col}' 평균 = (`),
                calc.values.map((x, i) => el('span.meancalc__v', {}, `${fmt(x)}${i < calc.values.length - 1 ? ' +' : ''}`)),
                el('span.meancalc__name', {}, `) ÷ ${calc.count}`)),
              el('div.meancalc__res', {}, `= ${fmt(calc.sum)} ÷ ${calc.count} = `, el('strong', {}, fmt(calc.mean, 3))))
              : el('p.panel__hint', { style: 'flex:1 1 420px' }, `'${f.col}' 열의 빈칸이 아닌 값들을 더하고 개수로 나눠요.`),
            varBox('m', calc ? fmt(calc.mean, 3) : '?', { hot: Boolean(calc), sub: `'${f.col}'의 평균` })));
        }
      },
    };
  },
};

/* ═════════════ 결측치 방법 B ② — 최빈값으로 채우기 ═════════════ */

const VALUE_COLUMNS = [...PP.FILL_COLUMNS, '성별'];

/** 🤔 마지막 장면 — 지울 행과 채울 행을 견주고, Colab이 쓰는 규칙을 보여 준다 */
function choosePanel(choose) {
  const [d] = choose.drop;
  const [f, ...more] = choose.fill;
  const vals = (x) => x.guess.map(([, v]) => (typeof v === 'number' ? fmt(v, 3) : v)).join(' · ');
  return el('div', {},
    el('div.varrow', { style: 'gap:var(--sp-2)' },
      d ? el('p.callout.callout--warn', { style: 'flex:1 1 280px; margin:0' },
        el('strong', {}, `🗑️ 지운다 — 펭귄 ${d.id}번 (인덱스 ${d.i})`), el('br'),
        `측정값 ${PP.FILL_COLUMNS.length}칸이 모두 빈칸 → 채우면 ${vals(d)}, 전부 어림값이에요.`) : null,
      f ? el('p.callout.callout--add', { style: 'flex:1 1 280px; margin:0' },
        el('strong', {}, `🖊️ 채운다 — 펭귄 ${f.id}번 (인덱스 ${f.i})`), el('br'),
        `${f.holes.join('·')} 한 칸만 빈칸 → ${VALUE_COLUMNS.filter((c) => !f.holes.includes(c)).join('·')}는 진짜 값이라 채워서 살려요.`,
        more.length ? ` (${more.map((x) => `${x.id}번`).join('·')}도 ${[...new Set(more.flatMap((x) => x.holes))].join('·')} 한 칸만 비어 채워요)` : '') : null),
    el('p.panel__hint', { style: 'margin-top:var(--sp-2)' },
      el('strong', {}, '고르는 규칙: 측정값이 모두 빈 행은 지우고, 한두 칸만 빈 행은 채워요. '),
      'Colab에서도 측정값이 모두 빈 2줄(4번·272번)만 지우고 나머지를 채워 341줄을 남겨요(dropna()만 하면 331줄).'));
}

const fillmode = {
  kind: 'step',
  pseudo: PP.FILLMODE_PSEUDO,
  python: PP.FILLMODE_PYTHON,
  notebook: NB,
  stageTitle: '방법 B ② · 채우기 — 숫자 빈칸을 채운 표 df',
  stageHint: '초록 = 최빈값으로 채운 칸',
  dataTitle: '세기표 (사전) · 끝: 지울까, 채울까?',
  rows: ['1.38fr', '0.62fr'],
  frames: () => PP.fillModeFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const t = f.table;
        const ch = f.choose;
        const isDrop = (r) => ch?.drop.some((x) => x.k === r._k);
        const isFill = (r) => ch?.fill.some((x) => x.k === r._k);
        fill(stage, dataTable({
          columns: t.columns, rows: t.rows,
          index: (r) => (isDrop(r) ? `${r._i} 🗑️` : isFill(r) ? `${r._i} 🖊️` : idx(r)),
          rowClass: (r) => (isDrop(r) ? 'is-warn' : ''),
          cellClass: (r, c) => [f.filled[`${r._k}|${c}`] ? 'is-filled' : '', r._k === f.focus && c === '성별' ? 'is-focus' : ''].join(' '),
          colClass: (c) => (c === '성별' && !ch ? 'is-col' : ''),
        }));
        if (ch) { fill(data, choosePanel(ch)); return; }
        fill(data, el('div.varrow', {},
          pyDict('counts', f.counts, { hot: f.key, note: ' = 세기표', empty: '{ } 비어 있어요' }),
          varBox('최빈값', f.mode ?? '?', { hot: f.mode !== null }),
          f.done ? el('div', { style: 'flex:1 1 300px' }, el('p.panel__hint', {}, `같은 ${SAMPLE_ROWS}행으로 견주면`), versus()) : methodBand('B2')));
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
  stageTitle: '빈칸을 모두 채운 표 df',
  stageHint: '주황 = 숫자로 바꾼 칸',
  dataTitle: '바꿈표 (사전)',
  rows: ['1.38fr', '0.62fr'],
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
            pyDict('아델리' in f.dict ? 'sp_map' : 'sex_map', Object.entries(f.dict), { hot: f.key ?? null, note: ' = 바꿈표' }),
            el('div.varrow__note', {},
              el('p', {}, '칸의 글자를 열쇠로 바꿈표에서 찾아, 그 값(숫자)으로 바꿔 적어요.'),
              '아델리' in f.dict
                ? el('p.callout.callout--warn', {}, '⚠️ 0·1·2는 이름표일 뿐 크기에 뜻이 없어요. 젠투(2)가 턱끈(1)의 2배인 것도, 아델리(0)보다 큰 것도 아니에요.')
                : el('p', {}, '수컷(0)·암컷(1)의 숫자도 이름표일 뿐, 크고 작음에 뜻이 없어요.')))
          : el('p.panel__hint', {}, '바꿈표를 먼저 만들어요.'));
      },
    };
  },
};

export const PREP_SCENES = { features, drop, dropna, fillmean, fillmode, replace };

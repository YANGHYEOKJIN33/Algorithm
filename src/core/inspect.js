/**
 * 🔍 데이터 가공 — 결측치(여부·개수·위치)와 이상치(사분위수·상자그림)를 한 단계씩 기록한다.
 * 판다스의 isnull() · isnull().sum() · 인덱스 찾기 · quantile() 과 같은 값을 낸다.
 */
import { missingTable, outlierValues } from './data/sets.js';
import { isMissing, quartiles, sorted, fmt } from './stats.js';

/* ═════════════════ 결측치 ① 여부 — df.isnull() ═════════════════ */

export const MASK_PSEUDO = [
  { code: '결과표 ← 표와 같은 크기의 빈 표', note: '칸마다 "비었나?"의 답을 적을 표를 준비해요. 행과 열의 개수가 원래 표와 같아요.' },
  { code: '반복: 표의 각 열', note: '열(속성)을 왼쪽부터 하나씩 살펴요.' },
  { code: '    반복: 그 열의 각 칸', note: '그 열의 칸을 위에서 아래로 하나씩 봐요.' },
  { code: '        만약 칸이 비어 있으면 → 결과표에 True', note: 'True(참)는 "네, 비었어요"라는 뜻이에요. 판다스는 빈칸을 NaN으로 보여 줘요.' },
  { code: '        아니면 → 결과표에 False', note: 'False(거짓)는 "아니요, 값이 있어요"라는 뜻이에요.' },
  { code: '결과표를 돌려준다', note: 'True/False로만 된 표가 완성돼요. 이 표가 다음 쪽(개수 세기)의 재료예요.' },
];
export const MASK_PYTHON = [
  '',
  '# 아래 한 줄이 반복 전체를 대신해요',
  '',
  'mask = df.isnull()   # 빈칸이면 True',
  '                     # 값이 있으면 False',
  'mask',
];

/** 표 → 칸마다 빈칸 여부(true/false) */
export function maskOf(table) {
  return table.rows.map((row) => table.columns.map((c) => isMissing(row[c])));
}

export function maskFrames(table = missingTable()) {
  const full = maskOf(table);
  const frames = [];
  const done = [];          // 이미 검사를 마친 열 index
  const snap = (extra) => frames.push({ table, mask: full, done: [...done], col: null, ...extra });

  snap({ line: 1, icon: '📋', say: `${table.rows.length}행 × ${table.columns.length}열짜리 결과표를 준비했어요. 아직 아무것도 적지 않았어요.` });
  table.columns.forEach((c, ci) => {
    const trues = full.filter((m) => m[ci]).length;
    done.push(ci);
    snap({
      line: trues ? 4 : 5, col: ci, icon: trues ? '🔎' : '✅',
      say: trues
        ? `'${c}' 열의 칸을 위에서부터 봤어요. 빈칸 ${trues}개 → True, 나머지는 False.`
        : `'${c}' 열은 모든 칸에 값이 있어요 → 모두 False.`,
    });
  });
  snap({ line: 6, icon: '🧾', say: 'True/False 결과표 완성! True가 있는 칸이 결측치예요. 눈으로 찾기 쉬워졌죠?' });
  return frames;
}

/* ═════════════════ 결측치 ② 개수 — df.isnull().sum() ═════════════════ */

export const COUNT_PSEUDO = [
  { code: '개수표 ← 열마다 0', note: '열 이름마다 개수를 적을 칸을 0으로 시작해요.' },
  { code: '반복: 결과표(True/False)의 각 열', note: '앞 쪽에서 만든 True/False 표를 열마다 봐요.' },
  { code: '    개수 ← 그 열에서 True의 개수', note: 'True를 1, False를 0으로 보고 더하면 True의 개수가 돼요. 그래서 판다스는 sum(합)을 써요.' },
  { code: '    개수표[열] ← 개수', note: '센 개수를 그 열의 칸에 적어요.' },
  { code: '개수표를 돌려준다', note: '열마다 결측치가 몇 개인지 한눈에 보여요. 다 더하면 표 전체의 결측치 수예요.' },
];
export const COUNT_PYTHON = [
  '',
  '# 열마다 True(=1)를 더한다',
  'counts = df.isnull().sum()',
  '',
  'counts                    # 전체: df.isnull().sum().sum()',
];

export function countFrames(table = missingTable()) {
  const mask = maskOf(table);
  const counts = table.columns.map(() => null);
  const frames = [];
  const snap = (extra) => frames.push({ table, mask, counts: [...counts], col: null, total: null, ...extra });

  counts.fill(0);
  snap({ line: 1, icon: '🧮', say: '열마다 개수를 0으로 시작했어요.' });
  table.columns.forEach((c, ci) => {
    snap({ line: 2, col: ci, phase: 'look', icon: '👀', say: `'${c}' 열의 True를 셀 차례예요.` });
    const n = mask.filter((m) => m[ci]).length;
    counts[ci] = n;
    snap({ line: 4, col: ci, phase: 'count', icon: n ? '🔢' : '✅',
      say: n ? `'${c}' 열: True ${n}개 → 결측치 ${n}개.` : `'${c}' 열: True가 없어요 → 0개.` });
  });
  const total = counts.reduce((a, b) => a + b, 0);
  snap({ line: 5, icon: '🧾', total, say: `개수표 완성! 결측치는 모두 ${total}개예요. '성별' 열이 가장 많이 비었어요.` });
  return frames;
}

/* ═════════════════ 결측치 ③ 위치(인덱스) ═════════════════ */

export const WHERE_PSEUDO = [
  { code: '위치목록 ← 빈 리스트', note: '결측치가 있는 행의 인덱스(자리 번호)를 모을 리스트예요.' },
  { code: '반복: 표의 각 행 i  (i는 0부터)', note: '판다스는 행마다 0, 1, 2… 인덱스를 붙여요. 펭귄 "번호"와는 다른 값이에요!' },
  { code: '    만약 그 행에 True가 하나라도 있으면', note: '그 행의 칸 중 하나라도 비었는지 봐요(any).' },
  { code: '        위치목록에 i 추가', note: '빈칸이 있는 행의 인덱스를 리스트 맨 뒤에 붙여요.' },
  { code: '위치목록을 돌려준다', note: '이제 어느 행을 고쳐야 할지 정확히 알아요. 삭제하거나 채울 때 이 위치를 써요.' },
];
export const WHERE_PYTHON = [
  '',
  '# 행마다(axis=1) True가 하나라도 있나?',
  'has_nan = df.isnull().any(axis=1)',
  'where = df[has_nan].index',
  'list(where)',
];

export function whereFrames(table = missingTable()) {
  const mask = maskOf(table);
  const list = [];
  const frames = [];
  const snap = (extra) => frames.push({ table, mask, list: [...list], row: null, ...extra });

  snap({ line: 1, icon: '📋', say: '위치목록이라는 빈 리스트를 만들었어요.' });
  table.rows.forEach((row, i) => {
    const miss = mask[i].map((m, ci) => (m ? table.columns[ci] : null)).filter(Boolean);
    if (miss.length) {
      snap({ line: 3, row: i, icon: '📍', hit: true, say: `인덱스 ${i}행(펭귄 ${row.번호}번)에 빈칸이 있어요: ${miss.join(', ')}` });
      list.push(i);
      snap({ line: 4, row: i, icon: '📥', hit: true, say: `위치목록에 ${i}를 추가했어요 → [${list.join(', ')}]` });
    } else {
      snap({ line: 3, row: i, icon: '✅', hit: false, say: `인덱스 ${i}행(펭귄 ${row.번호}번)은 빈칸이 없어요. 건너뛰어요.` });
    }
  });
  snap({ line: 5, icon: '🧾', say: `결측치가 있는 행은 [${list.join(', ')}] — ${table.rows.length}행 중 ${list.length}행이에요.` });
  return frames;
}

/* ═════════════════ 이상치 ① 사분위수 ═════════════════ */

export const QUART_PSEUDO = [
  { code: '값들 ← 몸무게를 작은 것부터 정렬한다', note: '사분위수는 값을 줄 세운 뒤 자리로 찾아요. 그래서 먼저 정렬해요.' },
  { code: 'Q2 ← 50% 자리의 값 (중앙값)', note: '한가운데 값이에요. 자리 = (개수−1)×0.5+1번째.' },
  { code: 'Q1 ← 25% 자리의 값', note: '아래에서 4분의 1 지점이에요. 자리 = (개수−1)×0.25+1번째.' },
  { code: 'Q3 ← 75% 자리의 값', note: '아래에서 4분의 3 지점이에요. 자리 = (개수−1)×0.75+1번째.' },
  { code: 'IQR ← Q3 − Q1', note: '가운데 절반(50%)의 값들이 퍼져 있는 폭이에요(사분위 범위).' },
  { code: '아래 울타리 ← Q1 − 1.5 × IQR', note: '이보다 작으면 "너무 작다"고 보는 경계예요.' },
  { code: '위 울타리 ← Q3 + 1.5 × IQR', note: '이보다 크면 "너무 크다"고 보는 경계예요.' },
  { code: '반복: 각 값 v', note: '값을 하나씩 울타리와 견줘 봐요.' },
  { code: '    만약 v < 아래 울타리 또는 v > 위 울타리 → 이상치', note: '울타리 밖에 있으면 이상치예요. 잘못 적은 값일 수도, 정말 특이한 펭귄일 수도 있어요.' },
];
export const QUART_PYTHON = [
  "s = df['몸무게']   # 판다스가 알아서 정렬해 계산해요",
  's.quantile(0.5)   # Q2',
  'q1 = s.quantile(0.25)',
  'q3 = s.quantile(0.75)',
  'iqr = q3 - q1',
  'low = q1 - 1.5 * iqr',
  'high = q3 + 1.5 * iqr',
  '',
  'df[(s < low) | (s > high)]   # 이상치인 행',
];

/** n개 값에서 비율 q의 자리(1부터 센 순번) — 13개면 0.25 → 4번째 */
export function rankOf(n, q) { return (n - 1) * q + 1; }

export function quartileFrames(items = outlierValues()) {
  const n = items.length;
  const order = [...items].sort((a, b) => a.value - b.value);
  const s = quartiles(items.map((it) => it.value));
  const frames = [];
  const calc = {};
  const flags = {};          // id -> 'in' | 'out'
  let isSorted = false;
  const marks = {};          // 'q1'|'q2'|'q3' -> 정렬된 자리(0부터)
  const snap = (extra) => frames.push({
    items, order: isSorted ? order.map((o) => o.id) : items.map((o) => o.id),
    sorted: isSorted, calc: { ...calc }, flags: { ...flags }, marks: { ...marks }, stats: s, focus: null, ...extra,
  });

  snap({ line: 1, icon: '⚖️', phase: 'raw', say: `아델리펭귄 ${n}마리의 몸무게예요. 관측한 순서대로라 뒤죽박죽이에요.` });
  isSorted = true;
  snap({ line: 1, icon: '📶', phase: 'sorted', say: '작은 것부터 줄을 세웠어요. 이제 자리(몇 번째)로 값을 찾을 수 있어요.' });

  const put = (key, q, line, label) => {
    const r = rankOf(n, q);
    marks[key] = r - 1;
    calc[key] = s[key];
    snap({ line, icon: '📍', phase: key, focus: order[r - 1].id,
      say: `${label}: 자리 = (${n}−1)×${q}+1 = ${r}번째 → ${fmt(s[key])}g` });
  };
  put('q2', 0.5, 2, 'Q2(중앙값)');
  put('q1', 0.25, 3, 'Q1');
  put('q3', 0.75, 4, 'Q3');

  calc.iqr = s.iqr;
  snap({ line: 5, icon: '📏', phase: 'iqr', say: `IQR = Q3 − Q1 = ${fmt(s.q3)} − ${fmt(s.q1)} = ${fmt(s.iqr)}g. 가운데 절반이 이만큼 퍼져 있어요.` });
  calc.lower = s.lower;
  snap({ line: 6, icon: '🚧', phase: 'lower', say: `아래 울타리 = ${fmt(s.q1)} − 1.5 × ${fmt(s.iqr)} = ${fmt(s.lower)}g` });
  calc.upper = s.upper;
  snap({ line: 7, icon: '🚧', phase: 'upper', say: `위 울타리 = ${fmt(s.q3)} + 1.5 × ${fmt(s.iqr)} = ${fmt(s.upper)}g` });

  for (const it of order) {
    const out = it.value < s.lower || it.value > s.upper;
    flags[it.id] = out ? 'out' : 'in';
    snap({ line: out ? 9 : 8, icon: out ? '🚨' : '✅', phase: 'check', focus: it.id,
      say: out
        ? `${it.value}g (펭귄 ${it.id}번)은 위 울타리 ${fmt(s.upper)}g보다 커요 → 이상치!`
        : `${it.value}g (펭귄 ${it.id}번)은 울타리 안이에요 → 정상.` });
  }
  const outs = order.filter((it) => flags[it.id] === 'out');
  snap({ line: 9, icon: '🧾', phase: 'done',
    say: `이상치 ${outs.length}개: ${outs.map((o) => `${o.value}g(${o.id}번)`).join(', ')}. 아델리는 보통 3~4.5kg이라, 3200을 8200으로 잘못 적은 것으로 보여요.` });
  return frames;
}

/* ═════════════════ 이상치 ② 상자그림 ═════════════════ */

export const BOX_PSEUDO = [
  { code: 'Q1, Q2, Q3, 울타리를 구한다', note: '앞 쪽(사분위수)에서 구한 값을 그대로 써요.' },
  { code: '상자 ← Q1부터 Q3까지 직사각형', note: '가운데 절반의 값이 이 상자 안에 들어 있어요. 상자가 길면 값이 많이 퍼진 거예요.' },
  { code: 'Q2(중앙값) 자리에 상자를 가로지르는 선', note: '상자 속 선이 한가운데 값이에요.' },
  { code: '수염 ← 상자에서 울타리 안쪽의 가장 먼 값까지 선', note: '울타리 안에서 가장 작은 값·가장 큰 값까지 선을 그어요. 울타리 자체까지가 아니에요!' },
  { code: '울타리 밖의 값 → 점으로 따로 찍는다', note: '수염 밖에 홀로 찍힌 점이 이상치예요. 상자그림에서는 한눈에 보여요.' },
];
export const BOX_PYTHON = [
  "s = df['몸무게']",
  'import matplotlib.pyplot as plt',
  '',
  "plt.boxplot(s.dropna())   # 상자·선·수염·점을 한 번에",
  'plt.show()',
];

export function boxFrames(items = outlierValues()) {
  const values = items.map((it) => it.value);
  const s = quartiles(values);
  const show = { dots: true, box: false, median: false, whiskers: false, outliers: false };
  const frames = [];
  const snap = (extra) => frames.push({ items, values: sorted(values), stats: s, show: { ...show }, ...extra });

  snap({ line: 1, icon: '📍', say: `값 13개를 수직선에 점으로 찍었어요. Q1=${fmt(s.q1)}, Q2=${fmt(s.q2)}, Q3=${fmt(s.q3)}, 울타리는 ${fmt(s.lower)} ~ ${fmt(s.upper)}g이에요.` });
  show.box = true;
  snap({ line: 2, icon: '▭', say: `Q1(${fmt(s.q1)})부터 Q3(${fmt(s.q3)})까지 상자를 그렸어요. 값의 가운데 절반이 이 안에 있어요.` });
  show.median = true;
  snap({ line: 3, icon: '│', say: `상자 속 ${fmt(s.q2)} 자리에 선을 그었어요 — 중앙값이에요.` });
  show.whiskers = true;
  snap({ line: 4, icon: '⟷', say: `수염은 울타리 안쪽에서 가장 먼 값(${fmt(s.whiskerLow)}g, ${fmt(s.whiskerHigh)}g)까지 뻗어요.` });
  show.outliers = true;
  snap({ line: 5, icon: '🚨', say: `수염 밖의 ${s.outliers.join(', ')}g은 점으로 따로 찍혀요. 이 점이 이상치예요!` });
  show.dots = false;
  snap({ line: 5, icon: '🧾', say: '완성된 상자그림이에요. Colab에서 plt.boxplot()을 실행하면 이 모양이 나와요(세로로 서 있을 뿐이에요).' });
  return frames;
}

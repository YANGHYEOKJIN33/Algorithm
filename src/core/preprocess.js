/**
 * 🧹 핵심 속성 추출과 전처리 — 표가 어떻게 바뀌는지 한 단계씩 기록한다.
 *   속성 고르기 · 데이터(열·행) 삭제 · 결측치 삭제 · 평균값 대체 · 최빈값 대체 · 텍스트 값 대체
 *
 * 표 = { columns: [...], rows: [{열: 값}] }. 행마다 화면용 고유 key(_k)를 붙여
 * 행이 지워지거나 움직일 때 "같은 행"을 따라갈 수 있게 한다.
 */
import { missingTable, dropTable } from './data/sets.js';
import { originalRecords, SPECIES } from './data/practice.js';
import { isMissing, mean, sum, present, mode, fmt } from './stats.js';

const withKeys = (table) => ({ columns: [...table.columns], rows: table.rows.map((r, i) => ({ ...r, _k: `r${i}` })) });
const cloneTable = (t) => ({ columns: [...t.columns], rows: t.rows.map((r) => ({ ...r })) });

/* ═════════════════ ① 핵심 속성 추출 ═════════════════ */

export const FEATURE_PSEUDO = [
  { code: '목표 ← "펭귄의 종을 알아맞히기"', note: '무엇을 맞힐지 먼저 정해야 어떤 속성이 쓸모 있는지 판단할 수 있어요.' },
  { code: '반복: 표의 각 속성(열)', note: '열을 하나씩 꺼내 목표와 관계있는지 따져 봐요.' },
  { code: '    종마다 값이 다르게 퍼져 있는지 본다', note: '색(종)마다 점이 따로 모여 있으면 그 속성으로 종을 가를 수 있어요.' },
  { code: '    만약 종을 가르는 데 도움이 되면 → 핵심 속성에 넣는다', note: '목표와 관계있는 속성만 남기면 모델이 헷갈리지 않고 빨라져요.' },
  { code: '    아니면 → 뺀다', note: '관계없는 속성, 그리고 번호처럼 기록한 순서일 뿐이라 새 펭귄에게 쓸 수 없는 속성은 빼요.' },
  { code: 'X ← 핵심 속성 열만 뽑은 표,  y ← 정답(종) 열', note: 'X는 입력(독립변수), y는 맞힐 정답(종속변수)이에요. 나눠 두면 4단원(학습 준비)으로 바로 이어져요.' },
];
export const FEATURE_PYTHON = [
  "# 목표: '종' 맞히기",
  "for col in df.columns:",
  "    print(df.groupby('종')[col].describe())   # 종마다 값 비교",
  "features = ['부리길이', '부리깊이', '날개길이', '몸무게']",
  '',
  "X = df[features];   y = df['종']",
];

/** 속성마다 판단과 이유 — 화면과 테스트가 함께 쓴다 */
export const FEATURE_VERDICTS = [
  { col: '번호', keep: false, kind: 'id', why: '함정이에요! 표를 종별로 모아 1번부터 번호를 매겨서 따로 모여 보일 뿐이에요. 새로 만난 펭귄의 번호로는 종을 알 수 없어요.' },
  { col: '섬', keep: false, kind: 'cat', why: '종과 관계는 있지만(젠투는 비스코섬에만) 펭귄의 몸 특징이 아니라 "어디서 봤나"예요. 다른 섬에서 만난 펭귄에는 쓸 수 없어 이번에는 빼요.' },
  { col: '부리길이', keep: true, kind: 'num', why: '아델리는 부리가 짧고, 턱끈·젠투는 길어요. 종마다 다른 곳에 모여 있어요.' },
  { col: '부리깊이', keep: true, kind: 'num', why: '젠투는 부리가 얇아(깊이가 작아) 다른 두 종과 확실히 갈려요.' },
  { col: '날개길이', keep: true, kind: 'num', why: '젠투의 날개가 눈에 띄게 길어요. 젠투를 가려내는 데 좋아요.' },
  { col: '몸무게', keep: true, kind: 'num', why: '젠투가 훨씬 무거워요. 아델리·턱끈은 비슷하지만 다른 속성과 함께 쓰면 도움이 돼요.' },
  { col: '성별', keep: false, kind: 'cat', why: '어느 종이든 수컷·암컷이 거의 반반이라 종을 가르지 못해요.' },
  { col: '연도', keep: false, kind: 'cat', why: '관측한 해일 뿐, 어느 해든 세 종이 고루 관측되어 종과 관계없어요.' },
];

/** 속성 하나의 종별 분포 — 숫자 열은 점 목록, 글자 열은 종×값 개수표 */
export function featureProfile(col) {
  const recs = originalRecords().filter((r) => !isMissing(r[col]) && !isMissing(r.종));
  const v = FEATURE_VERDICTS.find((f) => f.col === col);
  if (v && (v.kind === 'num' || v.kind === 'id')) {
    const bySpecies = SPECIES.map((sp) => recs.filter((r) => r.종 === sp).map((r) => r[col]));
    const all = recs.map((r) => r[col]);
    return { col, kind: 'num', bySpecies, min: Math.min(...all), max: Math.max(...all) };
  }
  const values = [...new Set(recs.map((r) => r[col]))].sort();
  const counts = SPECIES.map((sp) => values.map((val) => recs.filter((r) => r.종 === sp && r[col] === val).length));
  return { col, kind: 'cat', values, counts };
}

export function featureFrames() {
  const frames = [];
  const kept = [];
  const dropped = [];
  const snap = (extra) => frames.push({ kept: [...kept], dropped: [...dropped], col: null, profile: null, verdict: null, ...extra });

  snap({ line: 1, icon: '🎯', say: '목표는 "이 펭귄이 어떤 종인가?" 맞히기예요. 정답 열은 \'종\'이에요.' });
  for (const v of FEATURE_VERDICTS) {
    const profile = featureProfile(v.col);
    snap({ line: 3, icon: '👀', col: v.col, profile, say: `'${v.col}' — 색(종)마다 값이 따로 모여 있나요? 넣을지 뺄지 먼저 예상해 봐요.` });
    if (v.keep) kept.push(v.col); else dropped.push(v.col);
    snap({ line: v.keep ? 4 : 5, icon: v.keep ? '✅' : v.kind === 'id' ? '⚠️' : '✖️', col: v.col, profile, verdict: v,
      say: `${v.keep ? '넣어요' : '빼요'} — ${v.why}` });
  }
  snap({ line: 6, icon: '🧾', done: true,
    say: `핵심 속성 ${kept.length}개(${kept.join(', ')})는 입력 X(독립변수), 정답 '종'은 y(종속변수)예요. 뺀 속성: ${dropped.join(', ')}.` });
  return frames;
}

/* ═════════════════ ② 데이터 삭제 (열·겹친 행·잘못된 행) ═════════════════ */

export const DROP_PSEUDO = [
  { code: "지울 열 ← '연도'", note: '관측한 해는 종을 맞히는 데 쓰지 않아요(앞 쪽에서 뺀 속성).' },
  { code: '표에서 지울 열을 지운다', note: '열을 지우면 모든 행에서 그 칸이 함께 사라져요.' },
  { code: '겹친 행을 찾는다 (모든 값이 같은 행)', note: '크롤링할 때 쪽이 넘어가며 같은 줄이 두 번 실리는 일이 흔해요.' },
  { code: '표에서 겹친 행을 지운다 (처음 것은 남긴다)', note: '같은 펭귄을 두 번 세면 그 펭귄만 더 중요하게 배워 버려요.' },
  { code: '잘못된 행을 찾는다 (이상치: 몸무게 8200)', note: '2단원(가공)에서 찾은 이상치예요. 잘못 적은 값이고 바른 값을 모르면 지워요.' },
  { code: '표에서 그 행을 지운다', note: '행이 지워져도 남은 행의 인덱스는 그대로예요(빈 번호가 생겨요).' },
];
export const DROP_PYTHON = [
  '',
  "df = df.drop(columns=['연도'])",
  'df.duplicated()          # 겹친 행이면 True',
  'df = df.drop_duplicates()',
  "df[df['몸무게'] > 6000]   # 이상치 행 확인",
  "df = df.drop(index=2)    # 인덱스로 지우기",
];

export function dropFrames() {
  const t = withKeys(dropTable());
  t.rows.forEach((r, i) => { r._i = i; });       // 판다스 인덱스(지워도 바뀌지 않는다)
  let table = cloneTable(t);
  const frames = [];
  const snap = (extra) => frames.push({ table: cloneTable(table), markCol: null, markRows: [], ...extra });

  snap({ line: 1, icon: '📋', markCol: '연도', say: "표에 7행이 있어요(겹친 행·이상치 포함). 먼저 앞 쪽에서 뺀 '연도' 열을 지울 거예요." });
  table.columns = table.columns.filter((c) => c !== '연도');
  table.rows.forEach((r) => { delete r.연도; });
  snap({ line: 2, icon: '✂️', say: "'연도' 열을 지웠어요. 모든 행에서 그 칸이 사라졌어요." });

  const sig = (r) => table.columns.map((c) => r[c]).join('|');
  const seen = new Set();
  const dups = [];
  for (const r of table.rows) { if (seen.has(sig(r))) dups.push(r._k); seen.add(sig(r)); }
  snap({ line: 3, icon: '🔁', markRows: dups, say: `펭귄 50번이 두 번 실려 있어요(인덱스 ${table.rows.filter((r) => dups.includes(r._k)).map((r) => r._i).join(', ')}). 두 번째 것이 겹친 행이에요.` });
  table.rows = table.rows.filter((r) => !dups.includes(r._k));
  snap({ line: 4, icon: '🗑️', say: `겹친 행을 지웠어요. 이제 ${table.rows.length}행이에요.` });

  const bad = table.rows.filter((r) => r.몸무게 > 6000).map((r) => r._k);
  const badIdx = table.rows.filter((r) => bad.includes(r._k)).map((r) => r._i);
  snap({ line: 5, icon: '🔎', markRows: bad, say: `몸무게 8200g인 행(인덱스 ${badIdx.join(', ')}, 펭귄 13번)은 잘못 적은 값이에요.` });
  table.rows = table.rows.filter((r) => !bad.includes(r._k));
  const gone = t.rows.filter((r) => !table.rows.some((x) => x._k === r._k)).map((r) => r._i);
  snap({ line: 6, icon: '🗑️', say: `그 행을 지웠어요. 남은 ${table.rows.length}행의 인덱스를 보세요 — 지운 자리(${gone.join(', ')})가 비어 있어요.` });
  return frames;
}

/* ═════════════════ ③ 결측치 삭제 — dropna() ═════════════════ */

export const DROPNA_PSEUDO = [
  { code: '반복: 표의 각 행', note: '행을 위에서부터 하나씩 봐요.' },
  { code: '    만약 그 행에 빈칸이 하나라도 있으면', note: '어느 열이든 하나만 비어도 해당돼요.' },
  { code: '        그 행을 지운다', note: '빈칸 한 개 때문에 그 행의 멀쩡한 값까지 모두 사라져요.' },
  { code: '남은 행으로 새 표를 만든다', note: '가장 간단하지만, 데이터가 줄어들어요. 얼마나 잃었는지 꼭 확인해요.' },
];
export const DROPNA_PYTHON = [
  '# 반복과 조건을 판다스가 대신해요',
  '',
  'df_clean = df.dropna()',
  'len(df), len(df_clean)   # 몇 행이 남았나',
];

export function dropnaFrames(source = missingTable()) {
  const t = withKeys(source);
  t.rows.forEach((r, i) => { r._i = i; });
  const total = t.rows.length;
  const frames = [];
  const removed = [];
  const snap = (extra) => frames.push({
    table: { columns: t.columns, rows: t.rows.filter((r) => !removed.includes(r._k)).map((r) => ({ ...r })) },
    removed: [...removed], focus: null, total, ...extra,
  });

  snap({ line: 1, icon: '📋', say: `방법 A · 지우기 — 2단원에서 본 ${total}행 표예요. 빈칸이 있는 행을 통째로 지워 볼게요.` });
  for (const r of t.rows) {
    const miss = t.columns.filter((c) => isMissing(r[c]));
    if (miss.length) {
      snap({ line: 2, icon: '🔎', focus: r._k, say: `인덱스 ${r._i}행(펭귄 ${r.번호}번)에 빈칸이 있어요: ${miss.join(', ')}` });
      removed.push(r._k);
      snap({ line: 3, icon: '🗑️', say: `인덱스 ${r._i}행을 통째로 지웠어요. 멀쩡하던 다른 칸도 함께 사라졌어요.` });
    } else {
      snap({ line: 1, icon: '✅', focus: r._k, say: `인덱스 ${r._i}행은 빈칸이 없어요. 그대로 둬요.` });
    }
  }
  const left = total - removed.length;
  snap({ line: 4, icon: '🧾', done: true,
    say: `${total}행 중 ${removed.length}행을 지워 ${left}행이 남았어요(${Math.round((removed.length / total) * 100)}%를 잃음). 다음 쪽 방법 B에서는 같은 ${total}행을 지우지 않고 채워 봐요.` });
  return frames;
}

/* ═════════════════ ④ 평균값 대체 — fillna(mean) ═════════════════ */

export const FILLMEAN_PSEUDO = [
  { code: '반복: 숫자로 된 각 열 (부리길이, 날개길이, 몸무게)', note: '평균은 숫자에서만 구할 수 있어요. 글자 열(종·성별)은 다음 쪽에서 다뤄요.' },
  { code: '    평균 ← 빈칸이 아닌 값들의 합 ÷ 개수', note: '빈칸은 빼고 계산해요. 판다스의 mean()도 빈칸을 건너뛰어요.' },
  { code: '    그 열의 빈칸을 평균으로 채운다', note: '행을 지우지 않으니 데이터가 그대로 남아요. 대신 채운 값은 "진짜 값"이 아니라 어림값이에요.' },
];
export const FILLMEAN_PYTHON = [
  "for col in ['부리길이', '날개길이', '몸무게']:",
  '    m = df[col].mean()',
  '    df[col] = df[col].fillna(m)',
];
export const FILL_COLUMNS = ['부리길이', '날개길이', '몸무게'];

export function fillMeanFrames(source = missingTable()) {
  const table = withKeys(source);
  table.rows.forEach((r, i) => { r._i = i; });
  const filled = {};          // `${_k}|${col}` -> true
  const means = {};
  const frames = [];
  const snap = (extra) => frames.push({ table: cloneTable(table), filled: { ...filled }, means: { ...means }, col: null, calc: null, ...extra });

  snap({ line: 1, icon: '📋', say: `방법 B · 채우기 — 앞 쪽과 같은 ${table.rows.length}행 표예요(지웠던 행도 그대로). 이번엔 지우지 않고 숫자 빈칸을 평균으로 채워요.` });
  for (const col of FILL_COLUMNS) {
    const vals = table.rows.map((r) => r[col]);
    const xs = present(vals);
    const holes = table.rows.filter((r) => isMissing(r[col]));
    snap({ line: 1, icon: '📍', col, say: `'${col}' 열 — 빈칸 ${holes.length}개.` });
    const m = mean(vals);
    means[col] = m;
    const calc = { col, values: xs, sum: sum(xs), count: xs.length, mean: m };
    snap({ line: 2, icon: '🧮', col, calc, say: `평균 = 합 ${fmt(calc.sum)} ÷ 개수 ${calc.count} = ${fmt(m, 3)}` });
    for (const r of holes) { r[col] = m; filled[`${r._k}|${col}`] = true; }
    snap({ line: 3, icon: '🖊️', col, calc, say: `'${col}' 빈칸 ${holes.length}개를 ${fmt(m, 3)}(으)로 채웠어요.` });
  }
  snap({ line: 3, icon: '🧾', done: true, say: `숫자 빈칸 ${Object.keys(filled).length}칸을 채우고 ${table.rows.length}행이 모두 남았어요. 성별은 글자라 평균을 낼 수 없어 아직 비어 있어요 → 다음 쪽(최빈값).` });
  return frames;
}

/* ═════════════════ ⑤ 최빈값 대체 — fillna(mode) ═════════════════ */

export const FILLMODE_PSEUDO = [
  { code: '세기표 ← 빈 사전 { }', note: '값마다 몇 번 나왔는지 적을 사전(딕셔너리)이에요. 열쇠(값) → 개수.' },
  { code: '반복: 성별 열의 각 값 (빈칸은 건너뜀)', note: '위에서부터 값을 하나씩 읽어요.' },
  { code: '    세기표[값] ← 세기표[값] + 1', note: '처음 보는 값이면 1로, 본 적 있으면 1을 더해요.' },
  { code: '최빈값 ← 세기표에서 개수가 가장 큰 값', note: '가장 자주 나온 값이 최빈값이에요. 글자 열은 평균 대신 이 값을 써요.' },
  { code: '성별 열의 빈칸을 최빈값으로 채운다', note: '간단하지만, 실제로는 수컷인 펭귄이 암컷으로 채워질 수도 있어요(어림값!).' },
];
export const FILLMODE_PYTHON = [
  '# 판다스가 세어 줘요',
  '',
  "df['성별'].value_counts()",
  "m = df['성별'].mode()[0]",
  "df['성별'] = df['성별'].fillna(m)",
];

/** 평균 대체가 끝난 표 — 최빈값·텍스트 대체 쪽이 이어 쓴다 */
export function afterMeanFill(source = missingTable()) {
  const t = cloneTable(source);
  for (const col of FILL_COLUMNS) {
    const m = mean(t.rows.map((r) => r[col]));
    t.rows.forEach((r) => { if (isMissing(r[col])) r[col] = m; });
  }
  return t;
}

export function fillModeFrames(source = afterMeanFill()) {
  const table = withKeys(source);
  table.rows.forEach((r, i) => { r._i = i; });
  const col = '성별';
  const counts = [];          // [[값, 개수]] 처음 나온 순서
  const filled = {};
  const frames = [];
  const snap = (extra) => frames.push({ table: cloneTable(table), counts: counts.map((c) => [...c]), filled: { ...filled }, focus: null, mode: null, ...extra });

  snap({ line: 1, icon: '📒', say: "방법 B ② — 숫자 빈칸을 채운 표에 이어서 '성별'을 채워요. 먼저 빈 세기표(사전)를 만들어 값을 세요." });
  for (const r of table.rows) {
    const v = r[col];
    if (isMissing(v)) {
      snap({ line: 2, icon: '⏭️', focus: r._k, say: `인덱스 ${r._i}행은 빈칸이라 세지 않고 건너뛰어요.` });
      continue;
    }
    const hit = counts.find((c) => c[0] === v);
    if (hit) hit[1] += 1; else counts.push([v, 1]);
    snap({ line: 3, icon: '➕', focus: r._k, key: v, say: `'${v}' 하나 더 → 세기표 { ${counts.map(([k, n]) => `'${k}': ${n}`).join(', ')} }` });
  }
  const m = mode(table.rows.map((r) => r[col]));
  snap({ line: 4, icon: '🏆', mode: m, say: `가장 많이 나온 값은 '${m}'(${counts.find((c) => c[0] === m)[1]}번)이에요 → 최빈값.` });
  const holes = table.rows.filter((r) => isMissing(r[col]));
  for (const r of holes) { r[col] = m; filled[`${r._k}|${col}`] = true; }
  snap({ line: 5, icon: '🖊️', mode: m, done: true, say: `빈칸 ${holes.length}개를 '${m}'(으)로 채웠어요. 방법 A와 달리 ${table.rows.length}행이 모두 남은 채 빈칸이 0개예요.` });
  return frames;
}

/** 평균·최빈값 대체가 모두 끝난 표 — 텍스트 값 대체 쪽이 이어 쓴다 */
export function afterAllFill(source = missingTable()) {
  const t = afterMeanFill(source);
  const m = mode(t.rows.map((r) => r.성별));
  t.rows.forEach((r) => { if (isMissing(r.성별)) r.성별 = m; });
  return t;
}

/* ═════════════════ ⑥ 텍스트 값 대체 — replace / map ═════════════════ */

export const SEX_CODE = { 수컷: 0, 암컷: 1 };
export const SPECIES_CODE = Object.fromEntries(SPECIES.map((s, i) => [s, i]));

export const REPLACE_PSEUDO = [
  { code: "바꿈표 ← { '수컷': 0, '암컷': 1 }", note: '모델은 숫자로만 계산해요. 글자마다 바꿀 숫자를 사전으로 정해요.' },
  { code: '반복: 성별 열의 각 칸', note: '칸을 위에서부터 하나씩 봐요.' },
  { code: '    칸의 글자를 바꿈표에서 찾은 숫자로 바꾼다', note: '바꿈표에서 열쇠(글자)를 찾아 값(숫자)을 꺼내 칸에 적어요.' },
  { code: "바꿈표 ← { '아델리': 0, '턱끈': 1, '젠투': 2 }", note: '종처럼 값이 셋 이상이어도 같은 방법이에요. 숫자의 크기에는 뜻이 없어요(이름표일 뿐).' },
  { code: '반복: 종 열의 각 칸', note: '같은 일을 종 열에서 되풀이해요.' },
  { code: '    칸의 글자를 바꿈표에서 찾은 숫자로 바꾼다', note: '이제 표의 모든 값이 숫자예요 — 기계학습을 할 준비가 됐어요.' },
];
export const REPLACE_PYTHON = [
  "sex_map = {'수컷': 0, '암컷': 1}",
  '',
  "df['성별'] = df['성별'].map(sex_map)",
  "sp_map = {'아델리': 0, '턱끈': 1, '젠투': 2}",
  '',
  "df['종'] = df['종'].map(sp_map)",
];

export function replaceFrames(source = afterAllFill()) {
  const table = withKeys(source);
  table.rows.forEach((r, i) => { r._i = i; });
  const changed = {};
  const frames = [];
  let dict = null;
  const snap = (extra) => frames.push({ table: cloneTable(table), changed: { ...changed }, dict: dict ? { ...dict } : null, focus: null, col: null, ...extra });

  const run = (col, map, dictLine, cellLine, warn = null) => {
    dict = map;
    snap({ line: dictLine, icon: warn ? '⚠️' : '📒', col, say: `바꿈표를 만들었어요: ${Object.entries(map).map(([k, v]) => `'${k}'→${v}`).join(', ')}.${warn ? ` ${warn}` : ''}` });
    for (const r of table.rows) {
      const before = r[col];
      r[col] = map[before];
      changed[`${r._k}|${col}`] = true;
      snap({ line: cellLine, icon: '🔁', col, focus: r._k, key: before,
        say: `인덱스 ${r._i}행: '${before}' → ${r[col]}` });
    }
  };
  snap({ line: 1, icon: '📋', say: '방법 B로 빈칸을 모두 채운 표예요. 글자로 된 열(종·성별)을 숫자로 바꿔 볼게요.' });
  run('성별', SEX_CODE, 1, 3);
  run('종', SPECIES_CODE, 4, 6, '0·1·2는 이름표일 뿐 — 젠투(2)가 턱끈(1)의 2배라는 뜻이 아니에요.');
  snap({ line: 6, icon: '🧾', done: true, say: '모든 칸이 숫자가 되었어요. 기계학습 모델에 넣을 수 있는 표예요!' });
  return frames;
}

/**
 * 🧩 기계학습을 위한 준비 — 데이터 통합(세로·가로)과 훈련/테스트 분할.
 * pd.concat · pd.merge · train_test_split 이 하는 일을 한 단계씩 기록한다.
 */
import { CONCAT_TABLES, MERGE_LEFT, MERGE_RIGHT, splitTable } from './data/sets.js';
import { withJosa } from './josa.js';
import { shuffle } from './random.js';

/* ═════════════════ ① 세로로 합치기 — pd.concat ═════════════════ */

export const CONCAT_PSEUDO = [
  { code: '표1 ← 1쪽에서 모은 표,  표2 ← 2쪽에서 모은 표', note: '🔁 만약에 — 친구와 쪽을 나눠 크롤링했다면 표(파일)가 두 개가 돼요. 두 표는 열(속성)이 같아요.' },
  { code: '반복: 표2의 각 행', note: '친구 표(표2)의 행을 하나씩 옮겨요.' },
  { code: '    표1의 맨 아래에 그 행을 붙인다', note: '열 이름이 같으니 같은 열끼리 줄이 맞춰져요. 그래서 "세로로 쌓기"예요.' },
  { code: '인덱스를 0부터 다시 매긴다', note: '그대로 두면 0, 1, 2, 0, 1, 2처럼 인덱스가 겹쳐요. 그래서 이어 붙인 뒤 인덱스를 0부터 새로 매겨요.' },
];
export const CONCAT_PYTHON = [
  'df1, df2 = pages[0], pages[1]',
  '',
  'df = pd.concat([df1, df2])',
  'df = pd.concat([df1, df2], ignore_index=True)',
];

export function concatFrames() {
  const [a, b] = CONCAT_TABLES;
  const cols = a.columns;
  const top = a.rows.map((r, i) => ({ ...r, _k: `a${i}`, _i: i, _from: 1 }));
  const bottom = b.rows.map((r, i) => ({ ...r, _k: `b${i}`, _i: i, _from: 2 }));
  const result = top.map((r) => ({ ...r }));
  const waiting = bottom.map((r) => ({ ...r }));
  const frames = [];
  const snap = (extra) => frames.push({ columns: cols, result: result.map((r) => ({ ...r })), waiting: waiting.map((r) => ({ ...r })), focus: null, renumbered: false, ...extra });

  snap({ line: 1, icon: '📋', say: '🔁 만약에 친구와 쪽을 나눠 크롤링했다면 표가 두 개예요. 내 표(1쪽, 왼쪽)와 친구 표(2쪽, 오른쪽)의 열 이름이 똑같아요.' });
  while (waiting.length) {
    const r = waiting.shift();
    snap({ line: 2, icon: '👉', focus: r._k, say: `친구 표의 행(펭귄 ${r.번호}번)을 옮길 차례예요.` });
    result.push(r);
    snap({ line: 3, icon: waiting.length ? '⬇️' : '⚠️', focus: r._k, say: waiting.length
      ? `내 표의 맨 아래에 붙였어요. 인덱스는 친구 표에서 쓰던 것(${r._i})을 그대로 가져와요.`
      : `다 붙였어요. 그런데 인덱스가 ${result.map((x) => x._i).join(', ')} — 같은 번호가 두 번씩 있어요! "인덱스 1"은 어느 행일까요?` });
  }
  result.forEach((r, i) => { r._i = i; });
  snap({ line: 4, icon: '🔢', renumbered: true, say: `인덱스를 0~${withJosa(result.length - 1, '으로/로')} 새로 매겼어요. 이제 "인덱스 1"은 한 행뿐이고, ${result.length}마리가 한 표에 모였어요!` });
  return frames;
}

/* ═════════════════ ② 가로로 합치기 — pd.merge ═════════════════ */

export const MERGE_PSEUDO = [
  { code: '새 표 ← 빈 표', note: '두 표를 옆으로 붙인 결과를 담을 표예요.' },
  { code: '반복: 측정표의 각 행 a', note: '측정표(번호·부리·날개 — 종 칸이 없어요)의 행을 하나씩 봐요.' },
  { code: "    판정표에서 a와 '번호'가 같은 행 b를 찾는다", note: "두 표를 잇는 열쇠(key)는 '번호'예요. 순서가 달라도 번호로 짝을 찾아요." },
  { code: '    만약 찾았으면 → a와 b를 옆으로 이어 새 표에 추가', note: '같은 펭귄의 측정값과 종이 한 줄에 모여요. 이제 지도학습에 쓸 수 있어요.' },
  { code: '    못 찾았으면 → 건너뛴다 (남기기를 고르면 종을 빈칸으로 두고 추가)', note: '기본은 짝이 없는 행을 새 표에 넣지 않아요(두 표 모두에 있는 번호만 남겨요). "짝 없는 행도 남기기"를 고르면 측정값은 남기고 종 칸을 빈칸(NaN)으로 둬요.' },
];
export const MERGE_PYTHON = [
  '',
  '# merge가 번호로 짝을 지어 줘요',
  '',
  "df = pd.merge(measure, label, on='번호')",
  "# 짝 없는 행도 남기려면 how='left'를 더해요 (종은 NaN)",
];

/** how — 'inner'(기본: 짝 있는 행만) · 'left'(측정표의 행을 모두 남기고, 짝이 없으면 종을 NaN으로).
 *  두 방법의 장면 수가 같아서, 장면에서 방법을 바꿔도 보던 단계가 그대로 이어진다(미션 step:14 = 짝 없는 100번). */
export function mergeFrames({ how = 'inner' } = {}) {
  const keep = how === 'left';
  const left = MERGE_LEFT.rows.map((r, i) => ({ ...r, _k: `L${r.번호}`, _i: i }));
  const right = MERGE_RIGHT.rows.map((r, i) => ({ ...r, _k: `R${r.번호}`, _i: i }));
  const columns = ['번호', ...MERGE_LEFT.columns.slice(1), ...MERGE_RIGHT.columns.slice(1)];
  const result = [];
  const skipped = [];
  const frames = [];
  const snap = (extra) => frames.push({
    how, left, right, leftColumns: MERGE_LEFT.columns, rightColumns: MERGE_RIGHT.columns, columns,
    result: result.map((r) => ({ ...r })), skipped: [...skipped], focusL: null, focusR: null, matched: null, ...extra,
  });

  snap({ line: 1, icon: '📋', say: keep
    ? "🔁 만약에 측정값과 종이 다른 파일로 왔다면? 왼쪽 측정표에는 종 칸이 없고, 오른쪽 판정표에는 번호와 종만 있어요. 이번에는 짝 없는 행도 남겨 봐요."
    : "🔁 만약에 측정값과 종이 다른 파일로 왔다면? 왼쪽 측정표에는 종 칸이 없고, 오른쪽 판정표에는 번호와 종만 있어요. 둘 다 '번호' 열이 있어요." });
  for (const a of left) {
    snap({ line: 2, icon: '👉', focusL: a._k, say: `측정표의 펭귄 ${a.번호}번을 봐요.` });
    const b = right.find((r) => r.번호 === a.번호);
    if (b) {
      snap({ line: 3, icon: '🔗', focusL: a._k, focusR: b._k, matched: true, say: `판정표의 인덱스 ${b._i} 줄에서 번호 ${a.번호}의 짝을 찾았어요 — 종은 '${b.종}'.` });
      const row = { _k: `M${a.번호}` };
      for (const c of columns) row[c] = c in a ? a[c] : b[c];
      result.push(row);
      snap({ line: 4, icon: '➡️', focusL: a._k, focusR: b._k, matched: true, say: `한 줄로 이어 새 표에 넣었어요. 지금 ${result.length}줄.` });
    } else if (keep) {
      skipped.push(a._k);
      const row = { _k: `M${a.번호}`, _nan: true };
      for (const c of columns) row[c] = c in a ? a[c] : null;
      result.push(row);
      snap({ line: 5, icon: '🕳️', focusL: a._k, matched: false, say: `판정표에 ${a.번호}번이 없어요. 짝이 없어도 측정값은 남기고 종은 빈칸(NaN)으로 두고 새 표에 넣어요. 지금 ${result.length}줄.` });
    } else {
      skipped.push(a._k);
      snap({ line: 5, icon: '⏭️', focusL: a._k, matched: false, say: `판정표에 ${a.번호}번이 없어요. 짝이 없으니 새 표에 넣지 않고 건너뛰어요.` });
    }
  }
  const onlyLeft = left.filter((a) => skipped.includes(a._k)).map((a) => a.번호).join(', ');
  const onlyRight = right.filter((r) => !left.some((a) => a.번호 === r.번호)).map((r) => r.번호).join(', ');
  snap({ line: 5, icon: '🧾', done: true, say: keep
    ? `완성! 측정표의 ${result.length}줄이 모두 남았어요. 짝이 없던 ${onlyLeft}번은 종이 빈칸(NaN)이고, 판정표에만 있던 ${onlyRight}번은 들어오지 않았어요.`
    : `완성! ${result.length}줄이 남았어요. 측정표에만 있던 ${onlyLeft}번, 판정표에만 있던 ${onlyRight}번은 짝이 없어 빠졌어요.` });
  return frames;
}

/* ═════════════════ ③ 훈련/테스트 분할 — train_test_split ═════════════════ */

export const SPLIT_SEED = 7;
export const SPLIT_TEST_SIZE = 0.2;

export const SPLIT_PSEUDO = [
  { code: "X ← 입력 속성 열 (부리길이, 날개길이)", note: '모델이 보고 판단할 재료예요. 3-1에서 고른 4개 중 화면에는 2개만 보여 줘요(Colab은 4개). 대문자 X로 써요(여러 열이라서).' },
  { code: "y ← 정답 열 (종)", note: '모델이 맞혀야 할 답이에요. 소문자 y로 써요(한 열이라서).' },
  { code: '행들의 순서를 무작위로 섞는다', note: '표가 종별로 몰려 있으면, 섞지 않고 자를 때 테스트에 한 종만 남아요. 섞어서 고르게 나눠요.' },
  { code: '앞에서 80% → 훈련 데이터', note: '모델이 공부할 문제집이에요. 정답을 보며 배워요. 공부할 문제는 많을수록 좋아서 80%를 줘요.' },
  { code: '나머지 20% → 테스트 데이터', note: '시험 문제예요. 공부한 문제로 시험 보지 않기! 본 적 없는 펭귄으로 재야 실력을 알 수 있어요.' },
];
export const SPLIT_PYTHON = [
  "X = df[['부리길이', '날개길이']]",
  "y = df['종']",
  'from sklearn.model_selection import train_test_split',
  'X_train, X_test, y_train, y_test = train_test_split(',
  '    X, y, test_size=0.2, random_state=42)',
];

export function splitFrames() {
  const t = splitTable();
  const rows = t.rows.map((r, i) => ({ ...r, _k: `s${i}`, _i: i }));
  const order0 = rows.map((r) => r._k);
  const mixed = shuffle(order0, SPLIT_SEED);
  const nTest = Math.round(rows.length * SPLIT_TEST_SIZE);
  const nTrain = rows.length - nTest;
  const frames = [];
  const snap = (extra) => frames.push({ columns: t.columns, rows, order: order0, xy: false, part: {}, ...extra });

  snap({ line: 1, icon: '📋', say: `3단원의 깨끗한 341줄(4-2처럼 번호로 합친 표) 중 ${rows.length}마리예요. 위쪽은 아델리, 가운데는 젠투, 아래는 턱끈으로 몰려 있어요.` });
  snap({ line: 1, icon: '🟦', xy: 'x', say: "입력 속성을 X로 골랐어요. 3-1에서 고른 4개 중 화면에는 2개(부리길이, 날개길이)만 보여 줘요(Colab은 4개). '번호'는 이름표라 넣지 않아요." });
  snap({ line: 2, icon: '🟧', xy: 'xy', say: "정답 열 '종'을 y로 골랐어요." });
  snap({ line: 3, icon: '🔀', xy: 'xy', order: mixed, say: '행의 순서를 무작위로 섞었어요(씨앗 고정 — 다시 해도 같은 순서). 세 종이 골고루 흩어졌어요.' });
  const part = {};
  mixed.slice(0, nTrain).forEach((k) => { part[k] = 'train'; });
  const trainSp = new Set(mixed.slice(0, nTrain).map((k) => rows.find((r) => r._k === k).종));
  snap({ line: 4, icon: '📘', xy: 'xy', order: mixed, part: { ...part }, say: `앞의 ${nTrain}행(80%)을 훈련 데이터로 떼어 냈어요.${trainSp.size === 3 ? ' 세 종이 모두 들어 있어요.' : ''}` });
  mixed.slice(nTrain).forEach((k) => { part[k] = 'test'; });
  snap({ line: 5, icon: '📝', xy: 'xy', order: mixed, part: { ...part }, done: true, say: `남은 ${nTest}행(20%)은 테스트 데이터예요. 학습이 끝날 때까지 꺼내 보지 않아요!` });
  return frames;
}

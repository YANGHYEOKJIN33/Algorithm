/**
 * 모델 평가 — 테스트 데이터로 정확도를 잰다.
 * 훈련 데이터(18마리)로 배운 k-최근접 이웃(k=3)이 처음 보는 6마리를 얼마나 맞히나.
 * 🔧 고쳐 보고 다시 채점(improveScore) — 평가 결과(틀린 163번)를 보고 k·속성·크기 맞추기를 바꿔 같은 6마리를 다시 채점한다.
 */
import { knnTrain, knnTest, KNN_TRAIN_IDS, KNN_TEST_IDS } from '../data/sets.js';
import { pick } from '../data/practice.js';
import { josa, withJosa } from '../josa.js';
import { fmt } from '../stats.js';
import { predict, rankNeighbors, vote } from './knn.js';

export const K = 3;

export const PSEUDO = [
  { code: '맞힌수 ← 0', note: '맞힌 개수를 셀 칸이에요.' },
  { code: '반복: 테스트 데이터의 각 펭귄 t', note: '공부할 때 본 적 없는 펭귄으로만 시험을 봐요.' },
  { code: '    예측 ← 모델이 t의 종을 맞혀 본다 (정답은 가린 채)', note: '모델에게는 부리길이·부리깊이만 보여 줘요.' },
  { code: '    만약 예측 = t의 진짜 종이면 → 맞힌수 ← 맞힌수 + 1', note: '가려 둔 정답(y_test)과 견줘 채점해요.' },
  { code: '정확도 ← 맞힌수 ÷ 테스트 데이터 수', note: '분류 모델의 가장 기본 성적표예요. 1에 가까울수록 잘 맞혀요.' },
];

export const PYTHON = [
  'from sklearn.metrics import accuracy_score',
  '',
  'pred = model.predict(X_test)',
  '',
  'accuracy_score(y_test, pred)   # 맞힌수 ÷ 개수',
];

/** 틀린 까닭 — 가장 가까운 이웃과 다수결을 그대로 말한다(예: 163번) */
function whyWrong(train, t, k, pred) {
  const nb = rankNeighbors(train, t).slice(0, k);
  const first = train.find((p) => p.id === nb[0].id);
  const votes = nb.filter((n) => train.find((p) => p.id === n.id).label === pred).length;
  return first.label === t.label
    ? `가장 가까운 ${first.id}번은 '${first.label}'이지만, 이웃 ${k}마리 중 ${votes}마리가 '${pred}'라 다수결에서 졌어요.`
    : `가장 가까운 ${first.id}번부터 '${pred}'이고, 이웃 ${k}마리 중 ${votes}마리가 '${pred}'였어요.`;
}

export function evalFrames({ train = knnTrain(), test = knnTest(), k = K } = {}) {
  const frames = [];
  const rows = [];        // {id, truth, pred, ok}
  let correct = 0;
  const snap = (extra) => frames.push({ train, test, k, rows: rows.map((r) => ({ ...r })), correct, focus: null, neighbors: [], accuracy: null, ...extra });

  snap({ line: 1, icon: '📝', say: `훈련 데이터 ${train.length}마리로 배운 모델(k-최근접 이웃, k=${k})을 테스트 데이터 ${test.length}마리로 채점해요.` });
  for (const t of test) {
    const { pred } = predict(train, t, k);
    const nb = rankNeighbors(train, t).slice(0, k).map((n) => n.id);
    snap({ line: 3, icon: '🤔', focus: t.id, neighbors: nb, say: `${t.id}번 펭귄 — 가까운 이웃 ${k}마리의 다수결로 '${pred}'${josa(pred, '이라고/라고')} 예측했어요.` });
    const ok = pred === t.label;
    if (ok) correct += 1;
    rows.push({ id: t.id, truth: t.label, pred, ok });
    snap({ line: 4, icon: ok ? '⭕' : '❌', focus: t.id, neighbors: nb,
      say: ok ? `정답도 '${t.label}' → 맞혔어요! (맞힌수 ${correct})`
        : `정답은 '${t.label}' → 틀렸어요. ${whyWrong(train, t, k, pred)}` });
  }
  const accuracy = correct / test.length;
  snap({ line: 5, icon: '📊', accuracy, done: true,
    say: `정확도 = ${correct} ÷ ${test.length} = ${accuracy.toFixed(2)} (${Math.round(accuracy * 100)}%). 처음 보는 펭귄 6마리 중 ${correct}마리를 맞혔어요.` });
  return frames;
}

/* ═════════════ 🔧 고쳐 보고 다시 채점 ═════════════ */

export const IMPROVE_KS = [1, 3, 5];
export const BASE_FEATURES = ['부리길이', '부리깊이'];
export const WING = '날개길이';
/** 처음 모델이 틀린 펭귄 — 이 펭귄을 맞히는 것이 고치기의 목표 */
export const TARGET_ID = 163;

/**
 * 같은 훈련 18마리로 배우고 같은 테스트 6마리로 다시 채점한다.
 *   k      이웃 수(1·3·5)
 *   wing   날개길이도 입력에 넣을까
 *   scale  크기 맞추기(최소-최대 정규화) — 작은값·큰값은 훈련 데이터에서만 구한다.
 *          테스트 펭귄은 시험 문제라 미리 보면 안 되고, 테스트 값은 0~1을 조금 벗어날 수도 있다.
 */
export function improveScore({ k = K, wing = false, scale = false } = {}) {
  const features = [...BASE_FEATURES, ...(wing ? [WING] : [])];
  const cols = ['번호', ...features, '종'];
  const train = pick(KNN_TRAIN_IDS, cols).rows;
  const test = pick(KNN_TEST_IDS, cols).rows;
  const ranges = Object.fromEntries(features.map((c) => {
    const vals = train.map((r) => r[c]);
    return [c, { lo: Math.min(...vals), hi: Math.max(...vals) }];
  }));
  const vec = (r) => features.map((c) => (scale ? (r[c] - ranges[c].lo) / (ranges[c].hi - ranges[c].lo) : r[c]));
  const trainV = train.map((p) => ({ id: p.번호, label: p.종, v: vec(p) }));
  const rows = test.map((t) => {
    const tv = vec(t);
    const neighbors = trainV
      .map((p) => ({ id: p.id, label: p.label, d: Math.hypot(...tv.map((x, i) => x - p.v[i])) }))
      .sort((a, b) => a.d - b.d || a.id - b.id)
      .slice(0, k);
    const { pred } = vote(neighbors);
    return { id: t.번호, truth: t.종, pred, ok: pred === t.종, neighbors, values: Object.fromEntries(features.map((c) => [c, t[c]])) };
  });
  const correct = rows.filter((r) => r.ok).length;
  // 크기를 맞추지 않으면 훈련 데이터에서 폭(큰값 − 작은값)이 가장 넓은 열이 거리를 주로 정한다
  const span = (c) => ranges[c].hi - ranges[c].lo;
  const widest = features.reduce((m, c) => (span(c) > span(m) ? c : m));
  return { k, wing, scale, features, ranges, rows, correct, total: rows.length, accuracy: correct / rows.length, widest };
}

/** 처음 모델(k=3 · 부리 두 속성 · 크기 그대로)과 견줘 채점이 바뀐 펭귄 */
export function improveChanges(res, base = improveScore()) {
  return res.rows.flatMap((r) => {
    const b = base.rows.find((x) => x.id === r.id);
    return b.ok === r.ok ? [] : [{ id: r.id, truth: r.truth, from: b.pred, to: r.pred, fixed: r.ok }];
  });
}

/** 다시 채점한 결과를 한두 문장으로 — { kind: 'warn' | 'add' | 'info', text } */
export function improveNote(res, base = improveScore()) {
  const span = (c) => fmt(res.ranges[c].hi - res.ranges[c].lo, 1);
  const broke = improveChanges(res, base).filter((c) => !c.fixed);
  if (res.wing && !res.scale) {
    const others = res.features.filter((c) => c !== WING).map((c) => `${c} ${span(c)}mm`).join('·');
    const why = broke.map((c) => {
      const r = res.rows.find((x) => x.id === c.id);
      return ` 그래서 ${withJosa(`${c.truth} ${c.id}번`, '은/는')} 날개길이(${r.values[WING]}mm)가 ${withJosa(c.to, '과/와')} 비슷해 틀렸어요.`;
    }).join('');
    return { kind: 'warn', text: `⚠️ 날개길이는 훈련 펭귄끼리 폭이 ${span(WING)}mm로, 부리(${others})보다 숫자 폭이 훨씬 넓어 거리를 거의 혼자 정해요.${why}` };
  }
  if (res.scale) {
    return { kind: 'add', text: `📏 작은값·큰값은 훈련 ${KNN_TRAIN_IDS.length}마리에서만 구했어요(테스트는 시험 문제라 미리 보면 안 돼요). 열마다 0~1로 맞추니 어느 열도 거리를 혼자 정하지 못해요.` };
  }
  if (res.k === 1) return { kind: 'info', text: '👆 k = 1은 가장 가까운 한 마리만 믿어요. 이번엔 맞혀도, 그 한 마리가 잘못 적힌 값이면 바로 틀려요.' };
  if (res.k !== K) return { kind: 'info', text: `🗳️ k = ${res.k}는 이웃 ${res.k}마리의 다수결이에요. 멀리 있는 펭귄까지 투표에 끼어요.` };
  return { kind: 'info', text: `처음 모델 그대로예요. ${TARGET_ID}번을 틀려요 — k·속성·크기 맞추기를 바꿔 다시 채점해 봐요.` };
}

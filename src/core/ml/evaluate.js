/**
 * 모델 평가 — 테스트 데이터로 정확도를 잰다.
 * 훈련 데이터(18마리)로 배운 k-최근접 이웃(k=3)이 처음 보는 6마리를 얼마나 맞히나.
 */
import { knnTrain, knnTest } from '../data/sets.js';
import { predict, rankNeighbors } from './knn.js';

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

export function evalFrames({ train = knnTrain(), test = knnTest(), k = K } = {}) {
  const frames = [];
  const rows = [];        // {id, truth, pred, ok}
  let correct = 0;
  const snap = (extra) => frames.push({ train, test, k, rows: rows.map((r) => ({ ...r })), correct, focus: null, neighbors: [], accuracy: null, ...extra });

  snap({ line: 1, icon: '📝', say: `훈련 데이터 ${train.length}마리로 배운 모델(k-최근접 이웃, k=${k})을 테스트 데이터 ${test.length}마리로 채점해요.` });
  for (const t of test) {
    const { pred } = predict(train, t, k);
    const nb = rankNeighbors(train, t).slice(0, k).map((n) => n.id);
    snap({ line: 3, icon: '🤔', focus: t.id, neighbors: nb, say: `${t.id}번 펭귄 — 가까운 이웃 ${k}마리의 다수결로 '${pred}'(이)라고 예측했어요.` });
    const ok = pred === t.label;
    if (ok) correct += 1;
    rows.push({ id: t.id, truth: t.label, pred, ok });
    snap({ line: 4, icon: ok ? '⭕' : '❌', focus: t.id, neighbors: nb,
      say: ok ? `정답도 '${t.label}' → 맞혔어요! (맞힌수 ${correct})`
        : `정답은 '${t.label}' → 틀렸어요. ${t.label === '젠투' && pred === '아델리' ? '부리가 짧은 젠투라 아델리 이웃에 더 가까웠어요.' : `'${pred}' 이웃에 더 가까이 있었어요.`}` });
  }
  const accuracy = correct / test.length;
  snap({ line: 5, icon: '📊', accuracy, done: true,
    say: `정확도 = ${correct} ÷ ${test.length} = ${accuracy.toFixed(2)} (${Math.round(accuracy * 100)}%). 처음 보는 펭귄 6마리 중 ${correct}마리를 맞혔어요.` });
  return frames;
}

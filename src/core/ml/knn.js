/**
 * k-최근접 이웃 (k-Nearest Neighbors) — 분류 · 지도학습
 *
 * "가장 가까운 이웃 k마리에게 물어보고 다수결로 정한다."
 * 자료구조: 거리목록(리스트) → 정렬 → 앞 k개 → 세기표(사전) → 예측
 */
import { knnTrain, KNN_QUERY } from '../data/sets.js';
import { distance, round, fmt } from '../stats.js';
import { SPECIES } from '../data/practice.js';

export const PSEUDO = [
  { code: '거리목록 ← 빈 리스트', note: '새 펭귄과 훈련 데이터 펭귄들 사이의 거리를 모을 리스트예요.' },
  { code: '반복: 훈련 데이터의 각 펭귄 p', note: '훈련 데이터의 모든 펭귄과 하나씩 견줘요. (그래서 데이터가 많으면 느려요)' },
  { code: '    d ← 새 펭귄과 p 사이의 거리', note: '그래프 위 두 점 사이의 곧은 거리예요: √((가로 차)² + (세로 차)²)' },
  { code: '    거리목록에 (d, p의 종) 추가', note: '거리와 함께 그 펭귄의 정답(종)도 적어 둬요. 나중에 투표할 때 써요.' },
  { code: '거리목록을 거리가 짧은 순으로 정렬', note: '가까운 이웃이 맨 앞으로 오게 줄을 세워요.' },
  { code: '이웃 ← 거리목록의 앞에서 k개', note: 'k는 사람이 정하는 값이에요(하이퍼파라미터). 보통 홀수로 해 동점을 피해요.' },
  { code: '세기표 ← 이웃의 종마다 개수 세기', note: '이웃 k마리가 각각 자기 종에 한 표씩 던져요.' },
  { code: '예측 ← 세기표에서 개수가 가장 많은 종', note: '다수결! 가장 많은 표를 받은 종이 새 펭귄의 종이라고 예측해요.' },
];

export const PYTHON = [
  'dists = []',
  'for p in train:',
  '    d = ((new[0]-p[0])**2 + (new[1]-p[1])**2) ** 0.5',
  '    dists.append((d, p[2]))',
  'dists.sort()',
  'neighbors = dists[:k]',
  'votes = Counter(label for d, label in neighbors)',
  'pred = votes.most_common(1)[0][0]',
];

/** 거리를 재고 정렬한 결과 — 화면의 ① 탐험과 ② 단계가 함께 쓴다 */
export function rankNeighbors(train, q) {
  return train
    .map((p) => ({ id: p.id, label: p.label, x: p.x, y: p.y, d: distance([q.x, q.y], [p.x, p.y]) }))
    .sort((a, b) => a.d - b.d || a.id - b.id);
}

/** 이웃 목록 → 종별 표 수와 예측 (동점이면 더 가까운 이웃의 종) */
export function vote(neighbors) {
  const counts = Object.fromEntries(SPECIES.map((s) => [s, 0]));
  for (const n of neighbors) counts[n.label] += 1;
  const best = Math.max(...Object.values(counts));
  const tied = SPECIES.filter((s) => counts[s] === best);
  const pred = tied.length === 1 ? tied[0] : neighbors.find((n) => tied.includes(n.label)).label;
  return { counts, pred };
}

export function predict(train, q, k) {
  return vote(rankNeighbors(train, q).slice(0, k));
}

export function knnFrames({ k = 3, train = knnTrain(), query = KNN_QUERY } = {}) {
  const frames = [];
  const list = [];        // 거리목록 [{id, d, label}]
  let sorted = false;
  let neighbors = [];
  let counts = null;
  let pred = null;
  const snap = (extra) => frames.push({
    train, query, k, list: list.map((e) => ({ ...e })), sorted, neighbors: neighbors.map((n) => n.id),
    counts: counts ? { ...counts } : null, pred, focus: null, ...extra,
  });

  snap({ line: 1, icon: '📋', say: `새 펭귄(부리길이 ${query.x}, 부리깊이 ${query.y})의 종을 모른다고 해요. 거리목록을 비워 두고 시작해요.` });
  for (const p of train) {
    const d = distance([query.x, query.y], [p.x, p.y]);
    snap({ line: 3, icon: '📏', focus: p.id, calc: { p, d },
      say: `${p.id}번(${p.label}): √((${query.x}−${p.x})² + (${query.y}−${p.y})²) = ${fmt(d)}` });
    list.push({ id: p.id, d: round(d, 2), label: p.label });
    snap({ line: 4, icon: '📥', focus: p.id, say: `거리목록에 (${fmt(d)}, ${p.label}) 추가 — ${list.length}개째.` });
  }
  list.sort((a, b) => a.d - b.d || a.id - b.id);
  sorted = true;
  snap({ line: 5, icon: '📶', say: `거리가 짧은 순으로 정렬했어요. 가장 가까운 펭귄은 ${list[0].id}번(${list[0].label}, ${list[0].d})이에요.` });
  neighbors = list.slice(0, k);
  snap({ line: 6, icon: '🫂', say: `앞에서 ${k}개를 이웃으로 골랐어요: ${neighbors.map((n) => `${n.id}번(${n.label})`).join(', ')}` });
  counts = Object.fromEntries(SPECIES.map((s) => [s, 0]));
  for (const n of neighbors) {
    counts[n.label] += 1;
    snap({ line: 7, icon: '🗳️', focus: n.id, say: `${n.id}번이 '${n.label}'에 한 표 → ${SPECIES.map((s) => `${s} ${counts[s]}`).join(' · ')}` });
  }
  pred = vote(neighbors).pred;
  snap({ line: 8, icon: '🎯', done: true,
    say: `가장 많은 표: '${pred}' → 새 펭귄은 ${pred}펭귄이라고 예측해요.${query.label ? ` (실제 정답은 ${query.label} — ${pred === query.label ? '맞혔어요!' : '틀렸어요.'})` : ''}` });
  return frames;
}

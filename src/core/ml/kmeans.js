/**
 * k-평균 (k-Means) — 군집 · 비지도학습
 *
 * "정답 없이, 가까운 것끼리 k개 묶음으로 나눈다."
 * ① 배정: 점마다 가장 가까운 중심의 묶음으로 → ② 이동: 중심을 묶음의 평균 위치로 → 안 움직일 때까지.
 * 자료구조: 중심표(k행), 소속목록(점마다 묶음 번호)
 */
import { knnTrain, KMEANS_INIT_IDS } from '../data/sets.js';
import { distance, mean, round, fmt } from '../stats.js';

export const PSEUDO = [
  { code: '중심 k개 ← 데이터에서 아무 점 k개', note: '처음 중심은 아무렇게나 골라요. 어디서 시작하느냐에 따라 결과가 달라질 수 있어요.' },
  { code: '반복:', note: '중심이 자리를 잡을 때까지 두 단계를 되풀이해요.' },
  { code: '    각 점을 가장 가까운 중심의 묶음에 넣는다', note: '① 배정 — 점마다 k개 중심과의 거리를 재고 가장 가까운 쪽으로.' },
  { code: '    각 중심을 그 묶음 점들의 평균 위치로 옮긴다', note: '② 이동 — 묶음의 한가운데(평균)로 중심을 옮겨요.' },
  { code: '    만약 중심이 움직이지 않았으면 → 멈춘다', note: '배정도 중심도 더 바뀌지 않으면 끝! 묶음이 완성돼요.' },
];

export const PYTHON = [
  'from sklearn.cluster import KMeans',
  'model = KMeans(n_clusters=3, n_init=10, random_state=0)',
  '# fit() 안에서 배정 ↔ 이동을 되풀이해요',
  '',
  'model.fit(X)       # 정답 y 없이 X만!',
];

/** 정답을 지운 점들 */
export function kmeansPoints() {
  return knnTrain().map((p) => ({ id: p.id, x: p.x, y: p.y, label: p.label }));
}

const nearest = (p, centers) => {
  let best = 0;
  let bd = Infinity;
  centers.forEach((c, j) => {
    const d = distance([p.x, p.y], [c.x, c.y]);
    if (d < bd - 1e-12) { bd = d; best = j; }
  });
  return { j: best, d: bd };
};

/** 끝까지 돌린 결과만 — ① 탐험 쪽에서 처음 중심을 바꿔 볼 때 쓴다 */
export function runKMeans(points, initIds, maxIter = 20) {
  let centers = initIds.map((id) => { const p = points.find((q) => q.id === id); return { x: p.x, y: p.y }; });
  let assign = [];
  const history = [centers.map((c) => ({ ...c }))];
  for (let it = 0; it < maxIter; it += 1) {
    assign = points.map((p) => nearest(p, centers).j);
    const next = centers.map((c, j) => {
      const mine = points.filter((_, i) => assign[i] === j);
      return mine.length ? { x: mean(mine.map((p) => p.x)), y: mean(mine.map((p) => p.y)) } : c;
    });
    const moved = next.some((c, j) => Math.abs(c.x - centers[j].x) > 1e-9 || Math.abs(c.y - centers[j].y) > 1e-9);
    centers = next;
    history.push(centers.map((c) => ({ ...c })));
    if (!moved) return { centers, assign, iterations: it + 1, history };
  }
  return { centers, assign, iterations: maxIter, history };
}

export function kmeansFrames({ points = kmeansPoints(), initIds = KMEANS_INIT_IDS, k = initIds.length } = {}) {
  const frames = [];
  let centers = initIds.slice(0, k).map((id) => { const p = points.find((q) => q.id === id); return { x: p.x, y: p.y }; });
  let assign = points.map(() => null);
  const trail = centers.map((c) => [{ ...c }]);      // 중심이 지나온 자리
  const snap = (extra) => frames.push({
    points, k, centers: centers.map((c) => ({ x: round(c.x, 2), y: round(c.y, 2) })), assign: [...assign],
    trail: trail.map((t) => t.map((c) => ({ ...c }))), focus: null, iter: 0, changed: [], ...extra,
  });

  snap({ line: 1, icon: '🎲', say: `정답(종)을 지운 펭귄 ${points.length}마리예요. 처음 중심 ${k}개를 ${initIds.join('·')}번 펭귄 자리로 골랐어요.` });
  let iter = 0;
  for (;;) {
    iter += 1;
    snap({ line: 2, icon: '🔁', iter, say: `${iter}번째 되풀이를 시작해요.` });
    const changed = [];
    if (iter === 1) {
      // 첫 배정은 점 하나씩 천천히
      points.forEach((p, i) => {
        const { j, d } = nearest(p, centers);
        assign[i] = j;
        snap({ line: 3, icon: '📌', iter, focus: p.id,
          say: `${p.id}번 점 → 가장 가까운 중심은 묶음 ${j + 1} (거리 ${fmt(d)})` });
      });
    } else {
      points.forEach((p, i) => {
        const { j } = nearest(p, centers);
        if (assign[i] !== j) changed.push(p.id);
        assign[i] = j;
      });
      snap({ line: 3, icon: '📌', iter, changed,
        say: changed.length
          ? `모든 점을 다시 배정했어요. 묶음이 바뀐 점: ${changed.map((id) => `${id}번`).join(', ')}`
          : '모든 점을 다시 배정했어요. 묶음이 바뀐 점이 없어요.' });
    }
    const next = centers.map((c, j) => {
      const mine = points.filter((_, i) => assign[i] === j);
      return mine.length ? { x: mean(mine.map((p) => p.x)), y: mean(mine.map((p) => p.y)) } : { ...c };
    });
    const moved = next.some((c, j) => Math.abs(c.x - centers[j].x) > 1e-9 || Math.abs(c.y - centers[j].y) > 1e-9);
    centers = next;
    centers.forEach((c, j) => trail[j].push({ ...c }));
    const counts = centers.map((_, j) => assign.filter((a) => a === j).length);
    snap({ line: 4, icon: '🧲', iter, moved,
      say: `중심을 묶음의 평균 위치로 옮겼어요: ${centers.map((c, j) => `묶음 ${j + 1}(${counts[j]}마리) → (${fmt(c.x)}, ${fmt(c.y)})`).join(' · ')}` });
    if (!moved) {
      snap({ line: 5, icon: '🏁', iter, done: true,
        say: `중심이 더 이상 움직이지 않아요 → ${iter}번 만에 멈췄어요. 정답 없이도 펭귄이 세 묶음으로 나뉘었어요!` });
      break;
    }
    snap({ line: 5, icon: '↩️', iter, say: '중심이 움직였으니 한 번 더 되풀이해요.' });
    if (iter > 20) break;
  }
  return frames;
}

/**
 * 강화학습 맛보기 — 펭귄이 얼음길에서 물고기를 찾아가는 법을 "보상"으로 배운다.
 *
 * 칸: [🕳 구멍] [ ] [🐧 출발] [ ] [🐟 물고기]
 * 정답을 알려 주는 사람이 없다. 해 보고(행동) → 보상을 받고 → 점수표(Q)를 고친다.
 * 자료구조: 점수표 Q (칸 × 행동). 칸마다 "왼쪽/오른쪽으로 가면 얼마나 좋은가"를 적는다.
 */
import { createRandom } from '../random.js';
import { fmt } from '../stats.js';

export const CELLS = ['🕳️', '', '🏁', '', '🐟'];
export const START = 2;
export const HOLE = 0;
export const FISH = 4;
export const ACTIONS = ['←', '→'];
export const GAMMA = 0.9;
export const SEED = 7;
export const EPISODES = 4;

export const PSEUDO = [
  { code: '점수표 Q ← 모든 칸·행동에 0', note: '처음에는 어느 쪽이 좋은지 모르니 점수가 모두 0이에요.' },
  { code: '반복: 도전(에피소드) 1, 2, 3, …', note: '물고기나 구멍에 닿아 도전 한 번이 끝나면, 처음 자리에서 다시 시작해요.' },
  { code: '    위치 ← 출발 칸', note: '펭귄을 가운데 출발 칸에 세워요.' },
  { code: '    반복: 물고기나 구멍에 닿을 때까지', note: '한 걸음씩 움직여요.' },
  { code: '        행동 ← Q 점수가 더 큰 쪽 (같으면 아무 쪽이나)', note: '배운 만큼은 활용하고, 모르는 곳(점수가 같은 곳)은 새로 탐험해요.' },
  { code: '        움직이고 보상을 받는다 (물고기 +10, 구멍 −10, 한 걸음 −1)', note: '보상은 정답이 아니라 "결과가 좋았나, 나빴나"를 알려 주는 신호예요.' },
  { code: '        Q[위치, 행동] ← 보상 + 0.9 × (새 위치의 가장 큰 Q)', note: '지금 받은 보상에 다음 칸에서 기대할 수 있는 점수를 조금 깎아(0.9배) 더해요. 그러면 좋은 결과가 한 칸씩 거꾸로 전해져요.' },
  { code: '        위치 ← 새 위치', note: '한 칸 옮겨 가서 다시 방향을 골라요.' },
];

export const PYTHON = [
  'Q = {s: [0, 0] for s in range(5)}',
  'for episode in range(4):',
  '    s = 2',
  '    while s not in (0, 4):',
  '        a = best_or_random(Q[s])        # 0=←, 1=→',
  '        s2 = s - 1 if a == 0 else s + 1;  r = reward(s2)',
  '        Q[s][a] = r + 0.9 * (0 if s2 in (0, 4) else max(Q[s2]))',
  '        s = s2',
];

export const reward = (s) => (s === FISH ? 10 : s === HOLE ? -10 : -1);
const terminal = (s) => s === FISH || s === HOLE;

export function rlFrames({ seed = SEED, episodes = EPISODES } = {}) {
  const rand = createRandom(seed);
  const Q = CELLS.map(() => [0, 0]);
  const results = [];         // 도전마다 [걸음 수, 받은 보상 합, 끝난 곳]
  const frames = [];
  const snap = (extra) => frames.push({
    Q: Q.map((q) => [...q]), results: results.map((r) => ({ ...r })), pos: null, episode: 0,
    action: null, from: null, reward: null, updated: null, trail: [], ...extra,
  });

  snap({ line: 1, icon: '📋', say: '점수표를 모두 0으로 두고 시작해요. 펭귄은 어느 쪽에 물고기가 있는지 몰라요.' });
  for (let e = 1; e <= episodes; e += 1) {
    let s = START;
    let total = 0;
    const trail = [s];
    snap({ line: 3, icon: '🏁', episode: e, pos: s, trail: [...trail], say: `${e}번째 도전이에요. 펭귄이 출발 칸에 섰어요.` });
    while (!terminal(s)) {
      const q = Q[s];
      const tie = q[0] === q[1];
      const a = tie ? (rand() < 0.5 ? 0 : 1) : (q[0] > q[1] ? 0 : 1);
      const s2 = a === 0 ? s - 1 : s + 1;
      const r = reward(s2);
      total += r;
      trail.push(s2);
      snap({ line: 6, icon: s2 === FISH ? '🐟' : s2 === HOLE ? '🕳️' : '👣', episode: e, pos: s2, from: s, action: a, reward: r, trail: [...trail],
        say: `${tie ? '점수가 같아서 아무 쪽이나 골라' : '점수가 더 큰 쪽을 골라'} ${ACTIONS[a]}로 움직였어요. 보상 ${r > 0 ? '+' : ''}${r}${s2 === FISH ? ' (물고기!)' : s2 === HOLE ? ' (구멍에 빠졌어요!)' : ''}` });
      const future = terminal(s2) ? 0 : Math.max(...Q[s2]);
      const before = Q[s][a];
      Q[s][a] = Math.round((r + GAMMA * future) * 100) / 100;
      snap({ line: 7, icon: '✏️', episode: e, pos: s2, from: s, action: a, reward: r, trail: [...trail], updated: [s, a],
        say: `Q[${s}칸, ${ACTIONS[a]}] = ${r} + 0.9 × ${fmt(future)} = ${fmt(Q[s][a])}  (전에는 ${fmt(before)})` });
      s = s2;
    }
    results.push({ episode: e, steps: trail.length - 1, total, end: s === FISH ? 'fish' : 'hole' });
    snap({ line: 2, icon: s === FISH ? '🎉' : '💧', episode: e, pos: s, trail: [...trail],
      say: `${e}번째 도전이 끝났어요. ${s === FISH ? '물고기를 찾았어요' : '구멍에 빠졌어요'}(${trail.length - 1}걸음, 보상 합 ${total}).` });
  }
  snap({ line: 2, icon: '🧠', done: true,
    say: '점수표를 보세요. 출발 칸에서는 → 쪽 점수가 가장 커요. 아무도 정답을 알려 주지 않았는데, 펭귄은 보상만으로 길을 배웠어요.' });
  return frames;
}

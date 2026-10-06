/**
 * 의사결정 트리 (Decision Tree) — 분류 · 지도학습
 *
 * "예/아니오 질문을 이어 붙여 답을 좁혀 간다." (스무고개)
 * 좋은 질문 = 나눈 뒤 양쪽이 덜 섞이는 질문 → 지니 불순도가 작아지는 질문.
 * 자료구조: 할일 큐(아직 나누지 않은 노드) + 자라나는 트리
 */
import { treeData, TREE_FEATURES, TREE_QUERY } from '../data/sets.js';
import { SPECIES } from '../data/practice.js';
import { round, fmt } from '../stats.js';

export const MAX_DEPTH = 3;

export const PSEUDO = [
  { code: '할일 ← [모든 펭귄을 담은 뿌리 노드]', note: '아직 질문으로 나누지 않은 노드를 모아 두는 큐예요. 처음엔 뿌리 하나뿐이에요.' },
  { code: '반복: 할일이 비어 있지 않은 동안', note: '나눌 노드가 남아 있는 동안 되풀이해요.' },
  { code: '    노드 ← 할일의 맨 앞에서 꺼낸다', note: '먼저 들어온 노드부터 꺼내요(큐). 그래서 트리가 위층부터 자라요.' },
  { code: '    만약 노드의 펭귄이 모두 같은 종이면 → 잎(그 종)', note: '더 물어볼 필요가 없어요. 이 노드에 오면 그 종이라고 답해요.' },
  { code: '    아니면: 모든 질문 후보의 불순도를 잰다', note: '"날개길이 ≤ ?", "부리길이 ≤ ?" 처럼 값 사이마다 질문을 만들어 나눠 보고 얼마나 섞이는지 재요.' },
  { code: '        불순도가 가장 낮은 질문을 고른다', note: '나눈 뒤 양쪽이 가장 깔끔하게(한 종으로) 모이는 질문이 좋은 질문이에요.' },
  { code: '        질문으로 펭귄을 예(왼쪽)/아니오(오른쪽)로 나눈다', note: '조건에 맞으면 왼쪽 자식, 아니면 오른쪽 자식으로 보내요.' },
  { code: '        두 자식 노드를 할일에 넣는다', note: '자식도 아직 섞여 있을 수 있으니 나중에 다시 나눠요.' },
  { code: '예측: 새 펭귄을 뿌리부터 질문에 답하며 잎까지 내린다', note: '학습이 끝나면 트리는 질문 목록이 돼요. 답을 따라 내려가 잎의 종이 예측이에요.' },
];

export const PYTHON = [
  'from sklearn.tree import DecisionTreeClassifier',
  "model = DecisionTreeClassifier(criterion='gini', max_depth=3)",
  '# fit() 안에서 아래 일이 모두 일어나요',
  '#   - 같은 종만 남은 노드는 잎',
  '#   - 질문 후보마다 지니 불순도 계산',
  '#   - 가장 낮은 질문 선택',
  '#   - 데이터를 둘로 나눔',
  'model.fit(X_train, y_train)',
  'model.predict([[178, 46.1]])   # 날개길이, 부리길이',
];

/** 종별 개수 [아델리, 턱끈, 젠투] */
export function countsOf(items) {
  return SPECIES.map((s) => items.filter((it) => it.label === s).length);
}

/** 지니 불순도 = 1 − Σ(비율²). 한 종뿐이면 0, 고르게 섞일수록 커진다. */
export function gini(counts) {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  return 1 - counts.reduce((acc, c) => acc + (c / n) ** 2, 0);
}

/** 한 노드에서 가능한 모든 질문 — 속성마다 이웃한 두 값의 가운데를 기준으로 */
export function candidates(items) {
  const n = items.length;
  const out = [];
  for (const f of TREE_FEATURES) {
    const vals = [...new Set(items.map((it) => it[f]))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i += 1) {
      const t = round((vals[i] + vals[i + 1]) / 2, 2);
      const left = items.filter((it) => it[f] <= t);
      const right = items.filter((it) => it[f] > t);
      const lc = countsOf(left);
      const rc = countsOf(right);
      const score = (left.length / n) * gini(lc) + (right.length / n) * gini(rc);
      out.push({ feature: f, threshold: t, left: lc, right: rc, score: round(score, 4) });
    }
  }
  return out;
}

/** 가장 좋은 질문 — 불순도가 같으면 먼저 만든 질문(속성 순서 → 작은 기준값) */
export function bestSplit(items) {
  const cs = candidates(items);
  return cs.reduce((best, c) => (best === null || c.score < best.score ? c : best), null);
}

const majority = (counts) => SPECIES[counts.indexOf(Math.max(...counts))];

/**
 * 트리를 다 만든 결과 (프레임 없이) — ① 탐험 쪽과 테스트가 쓴다.
 * 노드 번호는 할일 큐에서 꺼내는 순서(너비 우선)로 매겨, 단계 실행 장면의 번호와 같다.
 */
export function buildTree(items = treeData(), maxDepth = MAX_DEPTH) {
  let nextId = 0;
  const make = (its, depth) => ({ id: nextId++, depth, ids: its.map((it) => it.id), counts: countsOf(its), gini: round(gini(countsOf(its)), 4), its });
  const root = make(items, 0);
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    const its = node.its;
    delete node.its;
    const pure = node.counts.filter((c) => c > 0).length <= 1;
    if (pure || node.depth >= maxDepth) { node.leaf = majority(node.counts); continue; }
    const sp = bestSplit(its);
    node.split = { feature: sp.feature, threshold: sp.threshold, score: sp.score };
    node.yes = make(its.filter((it) => it[sp.feature] <= sp.threshold), node.depth + 1);
    node.no = make(its.filter((it) => it[sp.feature] > sp.threshold), node.depth + 1);
    queue.push(node.yes, node.no);
  }
  return root;
}

/** 새 펭귄을 뿌리부터 내려보내 지나간 노드 목록과 예측을 돌려준다 */
export function walk(tree, q) {
  const path = [];
  let node = tree;
  while (node) {
    path.push(node);
    if (node.leaf) return { path, pred: node.leaf };
    node = q[node.split.feature] <= node.split.threshold ? node.yes : node.no;
  }
  return { path, pred: null };
}

/** 트리를 평평한 노드 목록으로 (화면 그리기용) */
export function flatten(tree) {
  const out = [];
  const visit = (n, parent, side) => {
    out.push({ ...n, parent, side, yes: undefined, no: undefined });
    if (n.yes) { visit(n.yes, n.id, 'yes'); visit(n.no, n.id, 'no'); }
  };
  visit(tree, null, null);
  return out;
}

export function treeFrames({ items = treeData(), query = TREE_QUERY, maxDepth = MAX_DEPTH } = {}) {
  const frames = [];
  const nodes = [];             // 지금까지 만든 노드(평평한 목록)
  const queue = [];             // 할일 큐: { nodeId, items }
  let nextId = 0;
  const regions = [];           // 산점도에 그을 나눔 선 { feature, threshold, nodeId }
  const snap = (extra) => frames.push({
    items, query, nodes: nodes.map((n) => ({ ...n })), queue: queue.map((q) => q.nodeId),
    regions: regions.map((r) => ({ ...r })), current: null, cands: null, best: null, path: null, pred: null, ...extra,
  });
  const addNode = (its, depth, parent, side) => {
    const node = { id: nextId++, depth, parent, side, ids: its.map((it) => it.id), counts: countsOf(its), gini: round(gini(countsOf(its)), 4) };
    nodes.push(node);
    return node;
  };

  const root = addNode(items, 0, null, null);
  queue.push({ nodeId: root.id, items });
  snap({ line: 1, icon: '🌱', say: `펭귄 ${items.length}마리를 모두 담은 뿌리 노드를 할일 큐에 넣었어요. (아델리·턱끈·젠투가 ${root.counts.join('·')}마리씩 섞여 있어요)` });

  while (queue.length) {
    const { nodeId, items: its } = queue.shift();
    const node = nodes.find((n) => n.id === nodeId);
    snap({ line: 3, icon: '📤', current: nodeId, say: `할일 큐 맨 앞에서 노드 ${nodeId}를 꺼냈어요 — 펭귄 ${its.length}마리, 불순도 ${fmt(node.gini, 3)}.` });

    const kinds = node.counts.filter((c) => c > 0).length;
    if (kinds <= 1 || node.depth >= maxDepth) {
      node.leaf = majority(node.counts);
      snap({ line: 4, icon: '🍃', current: nodeId,
        say: kinds <= 1 ? `모두 '${node.leaf}'예요(불순도 0) → 잎 노드로 정했어요.` : `깊이 제한(${maxDepth})에 닿아 가장 많은 '${node.leaf}'(으)로 정했어요.` });
      continue;
    }
    const cands = candidates(its);
    const best = bestSplit(its);
    snap({ line: 5, icon: '🧪', current: nodeId, cands, say: `질문 후보 ${cands.length}개를 모두 나눠 보고 섞인 정도(불순도)를 쟀어요.` });
    snap({ line: 6, icon: '🏆', current: nodeId, cands, best,
      say: `가장 깔끔한 질문: "${best.feature} ≤ ${best.threshold}?" — 불순도 ${fmt(best.score, 3)} (낮을수록 좋아요)` });
    node.split = { feature: best.feature, threshold: best.threshold, score: best.score };
    regions.push({ feature: best.feature, threshold: best.threshold, nodeId });
    const yesItems = its.filter((it) => it[best.feature] <= best.threshold);
    const noItems = its.filter((it) => it[best.feature] > best.threshold);
    const yes = addNode(yesItems, node.depth + 1, nodeId, 'yes');
    const no = addNode(noItems, node.depth + 1, nodeId, 'no');
    snap({ line: 7, icon: '✂️', current: nodeId, best,
      say: `예(${best.feature} ≤ ${best.threshold}) → ${yesItems.length}마리, 아니오 → ${noItems.length}마리로 나눴어요.` });
    queue.push({ nodeId: yes.id, items: yesItems }, { nodeId: no.id, items: noItems });
    snap({ line: 8, icon: '📥', current: nodeId, say: `두 자식 노드 ${yes.id}·${no.id}를 할일 큐 뒤에 넣었어요. 큐: [${queue.map((q) => q.nodeId).join(', ')}]` });
  }
  snap({ line: 2, icon: '✅', say: '할일 큐가 비었어요 → 트리 완성! 이제 질문 목록으로 새 펭귄을 분류할 수 있어요.' });

  // 예측: 새 펭귄을 내려보낸다
  const byId = (id) => nodes.find((n) => n.id === id);
  let cur = byId(0);
  const path = [];
  while (cur) {
    path.push(cur.id);
    if (cur.leaf) {
      snap({ line: 9, icon: '🎯', path: [...path], pred: cur.leaf, done: true,
        say: `잎에 닿았어요 → '${cur.leaf}'(으)로 예측! (실제 정답: ${query.label} — ${cur.leaf === query.label ? '맞혔어요' : '틀렸어요'})` });
      break;
    }
    const { feature, threshold } = cur.split;
    const yesSide = query[feature] <= threshold;
    snap({ line: 9, icon: '❓', path: [...path],
      say: `새 펭귄: ${feature} ${query[feature]} ≤ ${threshold}? → ${yesSide ? '예(왼쪽)' : '아니오(오른쪽)'}` });
    cur = nodes.find((n) => n.parent === cur.id && n.side === (yesSide ? 'yes' : 'no'));
  }
  return frames;
}

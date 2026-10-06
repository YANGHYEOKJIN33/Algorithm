/** 기계학습 — scikit-learn(1.9)과 같은 답을 내는지 (값은 미리 구함) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as KNN from '../src/core/ml/knn.js';
import * as TREE from '../src/core/ml/tree.js';
import * as LR from '../src/core/ml/linreg.js';
import * as KM from '../src/core/ml/kmeans.js';
import * as RL from '../src/core/ml/rl.js';
import * as EV from '../src/core/ml/evaluate.js';
import * as CR from '../src/core/crawl.js';
import { knnTrain, KNN_QUERY, linregData, treeData } from '../src/core/data/sets.js';

const last = (fs) => fs[fs.length - 1];

test('모든 알고리즘의 의사코드와 파이썬 줄 수가 같다', () => {
  for (const m of [KNN, TREE, LR, KM, RL, EV, CR]) assert.equal(m.PSEUDO.length, m.PYTHON.length);
});

test('장면은 모두 있는 의사코드 줄을 가리킨다', () => {
  const sets = [[KNN, KNN.knnFrames()], [TREE, TREE.treeFrames()], [LR, LR.linregFrames()], [KM, KM.kmeansFrames()], [RL, RL.rlFrames()], [EV, EV.evalFrames()], [CR, CR.crawlFrames()]];
  for (const [m, frames] of sets) {
    for (const f of frames) {
      assert.ok(f.line >= 1 && f.line <= m.PSEUDO.length, `줄 ${f.line}`);
      assert.ok(f.say && f.say.length > 0);
    }
  }
});

test('k-최근접 이웃 — 341번 펭귄: k=1 아델리, k=3·5 턱끈 (sklearn과 같다)', () => {
  const train = knnTrain();
  assert.equal(KNN.predict(train, KNN_QUERY, 1).pred, '아델리');
  assert.equal(KNN.predict(train, KNN_QUERY, 3).pred, '턱끈');
  assert.equal(KNN.predict(train, KNN_QUERY, 5).pred, '턱끈');
  const end = last(KNN.knnFrames({ k: 3 }));
  assert.equal(end.pred, '턱끈');
  assert.equal(end.list.length, 18);
  assert.ok(end.list.every((e, i, a) => i === 0 || a[i - 1].d <= e.d), '정렬되어 있다');
});

test('의사결정 트리 — sklearn과 같은 질문(날개길이 ≤ 203.5 → 부리길이 ≤ 42.35)', () => {
  const tree = TREE.buildTree(treeData());
  assert.equal(tree.split.feature, '날개길이');
  assert.equal(tree.split.threshold, 203.5);
  assert.equal(tree.yes.split.feature, '부리길이');
  assert.equal(tree.yes.split.threshold, 42.35);
  assert.equal(tree.no.leaf, '젠투');
  const end = last(TREE.treeFrames());
  assert.equal(end.pred, '턱끈');
  assert.equal(TREE.gini([5, 5, 0]), 0.5);
});

test('선형 회귀 — sklearn LinearRegression과 같은 w, b', () => {
  const { w, b } = LR.fitLine(linregData());
  assert.ok(Math.abs(w - 42.35059028126149) < 1e-9);
  assert.ok(Math.abs(b - -4240.920872211631) < 1e-6);
  const end = last(LR.linregFrames());
  assert.ok(Math.abs(end.pred.y - 4652.703086853282) < 1e-6);
});

test('경사 하강법은 오차를 줄이며 최소제곱 직선에 다가간다', () => {
  const pts = linregData();
  let w = 0; let b = 4000;
  let prev = LR.mse(pts, w, b);
  for (let i = 0; i < 60; i += 1) {
    ({ w, b } = LR.gradientStep(pts, w, b));
    const now = LR.mse(pts, w, b);
    assert.ok(now <= prev + 1e-6);
    prev = now;
  }
  const best = LR.fitLine(pts);
  assert.ok(Math.abs(w - best.w) < 0.5);
});

test('k-평균 — 3번 되풀이로 멈추고, 묶음이 세 종과 일치한다', () => {
  const end = last(KM.kmeansFrames());
  assert.equal(end.iter, 3);
  const pts = KM.kmeansPoints();
  for (let j = 0; j < 3; j += 1) {
    const labels = new Set(pts.filter((_, i) => end.assign[i] === j).map((p) => p.label));
    assert.equal(labels.size, 1, `묶음 ${j + 1}에 종이 섞였다`);
  }
});

test('k-평균 — 처음 중심에 따라 결과가 달라질 수 있다', () => {
  const pts = KM.kmeansPoints();
  const good = KM.runKMeans(pts, [21, 160, 282]);
  const bad = KM.runKMeans(pts, [1, 6, 14]);
  assert.notDeepEqual(good.assign, bad.assign);
});

test('강화학습 — 출발 칸에서 → 점수가 가장 크다', () => {
  const end = last(RL.rlFrames());
  assert.ok(end.Q[RL.START][1] > end.Q[RL.START][0]);
  assert.equal(end.results[0].end, 'hole', '첫 도전은 구멍에 빠진다(탐험)');
  assert.equal(end.results.at(-1).end, 'fish');
  assert.equal(end.results.at(-1).steps, 2);
});

test('모델 평가 — 6마리 중 5마리 (sklearn accuracy 0.8333)', () => {
  const end = last(EV.evalFrames());
  assert.equal(end.correct, 5);
  assert.ok(Math.abs(end.accuracy - 0.8333333333333334) < 1e-12);
});

test('크롤링 — 2쪽에서 6줄을 모아 CSV로', () => {
  const end = last(CR.crawlFrames());
  assert.equal(end.rows.length, 6);
  assert.equal(end.counters.requests, 2);
  assert.equal(end.csv.split('\n').length, 7);
});

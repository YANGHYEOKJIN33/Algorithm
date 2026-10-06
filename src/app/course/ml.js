/** 🤖 기계학습 — 개념 + 알고리즘 네 가지(하위 탭) */
import CONCEPT from './ml-concept.js';
import KNN from './ml-knn.js';
import TREE from './ml-tree.js';
import LINREG from './ml-linreg.js';
import KMEANS from './ml-kmeans.js';

export default {
  id: 'ml',
  label: '기계학습',
  icon: '🤖',
  verb: '',
  tip: '학습 방법·목적 · k-최근접 이웃 · 의사결정 트리 · 선형 회귀 · k-평균',
  unit: { no: 5 },
  sub: [CONCEPT, KNN, TREE, LINREG, KMEANS],
};

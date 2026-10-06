/**
 * 🏁 시작 1쪽 "완성품 미리 보기"에 쓰는 모델 — 수업 끝에 만들게 될 k-최근접 이웃 분류기.
 *
 *  · 데이터: 전처리를 마친 341마리 (src/core/data/clean.js — 03번 노트북과 같은 순서로 다듬는다)
 *  · 속성: 부리길이·부리깊이 (05번 노트북의 X = df[['부리길이', '부리깊이']])
 *  · k = 3 (KNeighborsClassifier(n_neighbors=3))
 */
import { cleanRecords } from '../../core/data/clean.js';
import { predict } from '../../core/ml/knn.js';

export const DEMO_K = 3;

let cache = null;

/** 전처리 끝난 펭귄 341마리 — data/penguins_clean.csv와 같은 것 */
export function cleanPenguins() {
  cache ??= cleanRecords();
  return cache;
}

/** 모델이 기억하는 점들 — { id, x: 부리길이, y: 부리깊이, label: 종 } */
export function demoTrain() {
  return cleanPenguins().map((r) => ({ id: r.번호, x: r.부리길이, y: r.부리깊이, label: r.종 }));
}

/** 새 펭귄 하나의 종 예측 — { counts, pred } */
export function demoPredict(train, q, k = DEMO_K) {
  return predict(train, q, k);
}

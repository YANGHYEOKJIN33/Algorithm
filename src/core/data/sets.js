/**
 * 수업마다 화면에 올리는 "작은 표" — 모두 연습 데이터(practice.js)에서 번호로 골랐다.
 *
 * 한 화면에서 행 하나하나의 움직임이 보여야 하므로 6~18줄로 작게 고른다.
 * 숫자를 지어내지 않고 실제 관측값만 쓴다(함정 세 가지는 practice.js에 공개).
 */
import { pick } from './practice.js';

/* ── 🕸 수집: 미니 관측소 2쪽 (쪽마다 3줄) ── */
export const CRAWL_COLUMNS = ['번호', '종', '섬', '몸무게'];
export const CRAWL_PAGES = [
  pick([1, 2, 3], CRAWL_COLUMNS),
  pick([153, 277, 278], CRAWL_COLUMNS),
];

/* ── 🔍 가공·🧹 전처리: 빈칸이 있는 10줄 ──
   4번은 측정값이 모두 빈 줄, 7번은 부리길이만 빈 줄, 9·179번은 성별이 빈 줄. */
export const MISSING_IDS = [1, 2, 4, 7, 9, 153, 154, 179, 277, 278];
export const MISSING_COLUMNS = ['번호', '종', '부리길이', '날개길이', '몸무게', '성별'];
export function missingTable() { return pick(MISSING_IDS, MISSING_COLUMNS); }

/* ── 🔍 이상치: 아델리펭귄 13마리의 몸무게 (13번은 3200g을 8200g으로 잘못 적은 값) ──
   13개면 사분위수 자리가 4·7·10번째로 딱 떨어져 손으로 따라가기 좋다. */
export const OUTLIER_IDS = [1, 2, 3, 5, 6, 7, 10, 11, 12, 13, 14, 16, 17];
export function outlierValues() {
  return pick(OUTLIER_IDS, ['번호', '몸무게']).rows.map((r) => ({ id: r.번호, value: r.몸무게 }));
}

/* ── 🧹 데이터 삭제: 겹친 행(50번 두 번)과 이상치(13번)가 들어 있는 7줄 ── */
export const DROP_COLUMNS = ['번호', '종', '섬', '부리길이', '몸무게', '연도'];
export function dropTable() {
  const t = pick([1, 2, 13, 50, 50, 153, 277], DROP_COLUMNS);
  return t;
}

/* ── 🧩 학습 준비 ── */
/** 세로로 합치기 — 크롤링 수업의 1쪽·2쪽 표를 그대로 다시 쓴다(수업이 이어지게) */
export const CONCAT_TABLES = CRAWL_PAGES;

/** 가로로 합치기 — 종 칸이 없는 측정표와 번호·종만 있는 판정표("만약 두 파일로 왔다면" 연습).
 *  100번은 판정표에 없고(종 판정이 아직 안 온 펭귄), 4번은 측정표에 없다(측정값이 모두 비어 3단원에서 지운 펭귄).
 *  두 마리 모두 5단원의 훈련·테스트 펭귄(KNN·TREE·LINREG·KMEANS)에 쓰이지 않는다. */
export const MERGE_LEFT = pick([1, 153, 2, 277, 100, 278], ['번호', '부리길이', '날개길이']);
export const MERGE_RIGHT = pick([278, 1, 4, 2, 153, 277], ['번호', '종']);

/** 훈련/테스트 분할 — 빈칸 없는 10줄 */
export const SPLIT_COLUMNS = ['번호', '부리길이', '날개길이', '종'];
export function splitTable() { return pick([1, 2, 3, 5, 6, 153, 154, 158, 277, 278], SPLIT_COLUMNS); }

/* ── 🤖 기계학습 ── */
/** k-최근접 이웃·k-평균이 함께 쓰는 18마리 (종마다 6마리) — 부리길이·부리깊이 */
export const KNN_TRAIN_IDS = [1, 6, 14, 21, 31, 38, 277, 278, 280, 282, 285, 288, 153, 154, 158, 160, 161, 164];
export function knnTrain() {
  return pick(KNN_TRAIN_IDS, ['번호', '부리길이', '부리깊이', '종']).rows
    .map((r) => ({ id: r.번호, x: r.부리길이, y: r.부리깊이, label: r.종 }));
}
/** 새로 관측한 펭귄 — 실제 341번(턱끈). 화면에서는 종을 감추고 맞혀 본다. */
export const KNN_QUERY = (() => {
  const r = pick([341], ['번호', '부리길이', '부리깊이', '종']).rows[0];
  return { id: r.번호, x: r.부리길이, y: r.부리깊이, label: r.종 };
})();
/** 모델 평가용 테스트 데이터 6마리 (훈련 18마리와 겹치지 않는다) */
export const KNN_TEST_IDS = [2, 40, 279, 283, 155, 163];
export function knnTest() {
  return pick(KNN_TEST_IDS, ['번호', '부리길이', '부리깊이', '종']).rows
    .map((r) => ({ id: r.번호, x: r.부리길이, y: r.부리깊이, label: r.종 }));
}

/** 의사결정 트리 — 아델리 5 · 턱끈 5 · 젠투 6 = 16마리, 날개길이·부리길이 */
export const TREE_IDS = [1, 6, 14, 21, 31, 277, 278, 280, 282, 285, 153, 154, 158, 160, 161, 164];
export const TREE_FEATURES = ['날개길이', '부리길이'];
export function treeData() {
  return pick(TREE_IDS, ['번호', ...TREE_FEATURES, '종']).rows
    .map((r) => ({ id: r.번호, 날개길이: r.날개길이, 부리길이: r.부리길이, label: r.종 }));
}
/** 트리로 맞혀 볼 새 펭귄 — 실제 283번(턱끈). 날개는 아델리처럼 짧지만 부리가 길다. */
export const TREE_QUERY = (() => {
  const r = pick([283], ['번호', ...TREE_FEATURES, '종']).rows[0];
  return { id: r.번호, 날개길이: r.날개길이, 부리길이: r.부리길이, label: r.종 };
})();

/** 선형 회귀 — 날개길이(x)로 몸무게(y) 예측, 10마리 */
export const LINREG_IDS = [21, 31, 1, 280, 6, 278, 282, 161, 160, 154];
export function linregData() {
  return pick(LINREG_IDS, ['번호', '날개길이', '몸무게', '종']).rows
    .map((r) => ({ id: r.번호, x: r.날개길이, y: r.몸무게, label: r.종 }));
}
export const LINREG_QUERY_X = 210;

/** k-평균 — k-최근접 이웃과 같은 18마리에서 정답(종)을 지운 것. 처음 중심은 21·160·282번. */
export const KMEANS_INIT_IDS = [21, 160, 282];

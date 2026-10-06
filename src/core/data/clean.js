/**
 * 전처리 끝난 데이터(341마리) — 03번 노트북과 같은 순서로 다듬는다.
 *  겹친 행 지우기 → 몸무게 이상치(위 울타리 밖) 지우기 → 측정값이 모두 빈 행 지우기
 *  → 숫자 빈칸은 평균(소수 둘째 자리)으로 → 성별 빈칸은 최빈값으로
 * scripts/build.mjs(data/penguins_clean.csv)와 시작 단원의 완성품 미리 보기가 함께 쓴다.
 */
import { COLUMNS, NUMERIC, practiceRecords } from './practice.js';
import { isMissing, mean, mode, quartiles, round } from '../stats.js';

export function cleanRecords() {
  const seen = new Set();
  let rows = practiceRecords().filter((r) => {
    const key = COLUMNS.map((c) => r[c]).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const q = quartiles(rows.map((r) => r.몸무게));
  rows = rows.filter((r) => isMissing(r.몸무게) || r.몸무게 <= q.upper);
  rows = rows.filter((r) => !NUMERIC.every((c) => isMissing(r[c])));
  for (const c of NUMERIC) {
    const m = round(mean(rows.map((r) => r[c])), 2);
    rows = rows.map((r) => (isMissing(r[c]) ? { ...r, [c]: m } : r));
  }
  const sexMode = mode(rows.map((r) => r.성별));
  rows = rows.map((r) => (isMissing(r.성별) ? { ...r, 성별: sexMode } : r));
  return rows;
}

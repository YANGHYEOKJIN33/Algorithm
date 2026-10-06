/**
 * 통계 도우미 — 판다스(pandas)가 내는 값과 똑같이 맞춘다.
 * (Colab에서 학생이 직접 계산한 값과 사이트의 값이 달라 혼란스럽지 않게)
 */

/** 빈칸(결측치)인가 — 판다스의 NaN·None에 해당 */
export function isMissing(v) {
  return v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));
}

/** 빈칸을 뺀 값들 */
export function present(values) {
  return values.filter((v) => !isMissing(v));
}

export function sum(values) {
  return present(values).reduce((a, b) => a + b, 0);
}

/** 평균 — 빈칸은 세지 않는다 (df.mean()과 같다) */
export function mean(values) {
  const xs = present(values);
  if (xs.length === 0) return null;
  return sum(xs) / xs.length;
}

/** 값마다 몇 번 나왔는지 — 처음 나온 순서를 지킨 [값, 개수] 목록 */
export function tally(values) {
  const counts = new Map();
  for (const v of present(values)) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()];
}

/**
 * 최빈값 — 가장 많이 나온 값. 개수가 같으면 정렬했을 때 앞선 값
 * (판다스 df.mode()[0]이 고르는 값과 같다)
 */
export function mode(values) {
  const entries = tally(values);
  if (entries.length === 0) return null;
  const best = Math.max(...entries.map(([, n]) => n));
  return entries.filter(([, n]) => n === best).map(([v]) => v).sort(compare)[0];
}

function compare(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

/** 작은 것부터 정렬한 새 배열 */
export function sorted(values) {
  return [...present(values)].sort((a, b) => a - b);
}

/**
 * 분위수 — 판다스 기본값(선형 보간)과 같다.
 * 자리 = (개수 − 1) × q  (0부터 센 자리). 사이에 걸리면 두 값을 비율대로 섞는다.
 */
export function quantile(values, q) {
  const xs = sorted(values);
  if (xs.length === 0) return null;
  const pos = (xs.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return xs[lo] + (xs[hi] - xs[lo]) * (pos - lo);
}

/** 사분위수와 울타리 한 묶음 (상자그림·이상치 판단에 쓴다) */
export function quartiles(values) {
  const q1 = quantile(values, 0.25);
  const q2 = quantile(values, 0.5);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const xs = sorted(values);
  const inside = xs.filter((v) => v >= lower && v <= upper);
  return {
    q1, q2, q3, iqr, lower, upper,
    whiskerLow: inside[0], whiskerHigh: inside[inside.length - 1],
    outliers: xs.filter((v) => v < lower || v > upper),
  };
}

/** 두 점 사이의 거리 (유클리드 거리) */
export function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** 화면 표시용 반올림 — 0.1+0.2 같은 부동소수 꼬리를 없앤다 */
export function round(v, digits = 2) {
  if (isMissing(v)) return v;
  const f = 10 ** digits;
  return Math.round((v + Number.EPSILON) * f) / f;
}

/** 화면에 쓸 숫자 글자 — 정수는 그대로, 소수는 digits자리까지(끝의 0은 지운다) */
export function fmt(v, digits = 2) {
  if (isMissing(v)) return 'NaN';
  if (typeof v !== 'number') return String(v);
  return String(round(v, digits));
}

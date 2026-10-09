/**
 * 선형 회귀 (Linear Regression) — 회귀(숫자 예측) · 지도학습
 *
 * "점들 사이를 가장 잘 지나는 직선 y = w·x + b 를 찾는다."
 * 가장 잘 = 오차(점과 직선의 세로 거리)를 제곱해 더한 값이 가장 작게 → 최소제곱법.
 * 자료구조: 계산표(행마다 dx, dy, dx·dy, dx²)가 한 줄씩 채워진다.
 * scikit-learn의 LinearRegression과 같은 w, b를 낸다.
 */
import { linregData, LINREG_QUERY_X } from '../data/sets.js';
import { mean, fmt } from '../stats.js';

export const PSEUDO = [
  { code: 'x̄ ← 날개길이의 평균,  ȳ ← 몸무게의 평균', note: '먼저 가운데(평균) 점을 찾아요. 가장 좋은 직선은 반드시 이 점을 지나요.' },
  { code: '반복: 각 펭귄 i', note: '펭귄마다 평균에서 얼마나 떨어져 있는지 재요.' },
  { code: '    dx ← xᵢ − x̄,   dy ← yᵢ − ȳ', note: '가로(날개)로 얼마나, 세로(몸무게)로 얼마나 벗어났나. 같은 방향이면 dx·dy가 양수예요.' },
  { code: '    위합 ← 위합 + dx×dy,   아래합 ← 아래합 + dx×dx', note: '날개가 길수록 무거운 경향이 강하면 위합이 크게 쌓여요.' },
  { code: '기울기 w ← 위합 ÷ 아래합', note: '날개가 1mm 길어질 때 몸무게가 평균 몇 g 늘어나는지예요.' },
  { code: '절편 b ← ȳ − w × x̄', note: '직선이 평균 점(x̄, ȳ)을 지나도록 높이를 맞춰요.' },
  { code: '예측: 몸무게 = w × 날개길이 + b', note: '학습 끝! 이제 날개길이만 재면 몸무게를 어림할 수 있어요.' },
];

export const PYTHON = [
  'from sklearn.linear_model import LinearRegression',
  'model = LinearRegression()',
  '# fit() 안에서 평균·편차·합을 계산해요',
  '',
  'model.fit(X_train, y_train)',
  'w, b = model.coef_[0], model.intercept_',
  "model.predict([[210]])   # 날개길이 210mm면?",
];

/** 최소제곱 직선 */
export function fitLine(points) {
  const xb = mean(points.map((p) => p.x));
  const yb = mean(points.map((p) => p.y));
  let num = 0;
  let den = 0;
  for (const p of points) { num += (p.x - xb) * (p.y - yb); den += (p.x - xb) ** 2; }
  const w = num / den;
  return { w, b: yb - w * xb, xb, yb };
}

/** 평균 제곱 오차(MSE) — 오차를 제곱해 평균 낸 값. 작을수록 직선이 점에 잘 맞는다. */
export function mse(points, w, b) {
  return points.reduce((acc, p) => acc + (p.y - (w * p.x + b)) ** 2, 0) / points.length;
}

/**
 * 경사 하강법 한 걸음 — ① 탐험 쪽의 "조금씩 고치기" 애니메이션에 쓴다.
 * x를 표준화한 공간에서 움직여야 w·b가 고르게 줄어든다(학생에게는 결과 직선만 보인다).
 */
export function gradientStep(points, w, b, rate = 0.25) {
  const xs = points.map((p) => p.x);
  const xb = mean(xs);
  const sx = Math.sqrt(mean(xs.map((x) => (x - xb) ** 2)));
  // 표준화 공간의 매개변수: y = a·z + c, z = (x − x̄)/sx  ⇔  w = a/sx, b = c − a·x̄/sx
  let a = w * sx;
  let c = b + w * xb;
  let ga = 0;
  let gc = 0;
  for (const p of points) {
    const z = (p.x - xb) / sx;
    const err = a * z + c - p.y;
    ga += (2 / points.length) * err * z;
    gc += (2 / points.length) * err;
  }
  a -= rate * ga;
  c -= rate * gc;
  return { w: a / sx, b: c - (a * xb) / sx };
}

export function linregFrames({ points = linregData(), qx = LINREG_QUERY_X } = {}) {
  const frames = [];
  const xb = mean(points.map((p) => p.x));
  const yb = mean(points.map((p) => p.y));
  const rows = [];        // 계산표
  let num = 0;
  let den = 0;
  let w = null;
  let b = null;
  const snap = (extra) => frames.push({
    points, rows: rows.map((r) => ({ ...r })), num, den, w, b, xb: null, yb: null, focus: null, line: null, pred: null, ...extra,
  });

  snap({ line: 1, icon: '📍', say: `펭귄 ${points.length}마리의 날개길이(가로)와 몸무게(세로)예요. 오른쪽 위로 갈수록 무거워 보여요.`, xb: null });
  snap({ line: 1, icon: '➕', xb, yb, say: `평균 점을 찾았어요: x̄ = ${fmt(xb)}mm, ȳ = ${fmt(yb)}g. 십자선이 만나는 곳이에요.` });
  for (const p of points) {
    const dx = p.x - xb;
    const dy = p.y - yb;
    snap({ line: 3, icon: '↔️', xb, yb, focus: p.id, cur: { dx, dy },
      say: `${p.id}번: dx = ${p.x} − ${fmt(xb)} = ${fmt(dx)},  dy = ${p.y} − ${fmt(yb)} = ${fmt(dy)}` });
    num += dx * dy;
    den += dx * dx;
    rows.push({ id: p.id, x: p.x, y: p.y, dx, dy, dxdy: dx * dy, dx2: dx * dx });
    snap({ line: 4, icon: '🧮', xb, yb, focus: p.id,
      say: `dx×dy = ${fmt(dx * dy)} ${dx * dy >= 0 ? '(같은 방향 → 양수)' : '(반대 방향 → 음수)'} — 위합 ${fmt(num)}, 아래합 ${fmt(den)}` });
  }
  w = num / den;
  snap({ line: 5, icon: '📐', xb, yb, say: `기울기 w = ${fmt(num)} ÷ ${fmt(den)} = ${fmt(w)} → 날개가 1mm 길면 몸무게가 약 ${fmt(w, 1)}g 늘어요.` });
  b = yb - w * xb;
  snap({ line: 6, icon: '📏', xb, yb, say: `절편 b = ${fmt(yb)} − ${fmt(w)} × ${fmt(xb)} = ${fmt(b)}. 직선이 평균 점을 지나요.` });
  const pred = w * qx + b;
  snap({ line: 7, icon: '🎯', xb, yb, pred: { x: qx, y: pred }, done: true,
    say: `완성: 몸무게 = ${fmt(w)} × 날개길이 ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}. 날개길이 ${qx}mm인 펭귄은 약 ${Math.round(pred)}g으로 예측해요.` });
  return frames;
}

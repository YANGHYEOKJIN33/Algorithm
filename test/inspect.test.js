/** 가공 — 판다스(isnull·sum·quantile)와 같은 값을 내는지 (값은 pandas 3.0으로 미리 구함) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskFrames, countFrames, whereFrames, quartileFrames, boxFrames, MASK_PSEUDO, MASK_PYTHON, COUNT_PSEUDO, COUNT_PYTHON, WHERE_PSEUDO, WHERE_PYTHON, QUART_PSEUDO, QUART_PYTHON, BOX_PSEUDO, BOX_PYTHON } from '../src/core/inspect.js';
import { quantile, quartiles, mean, mode } from '../src/core/stats.js';
import { outlierValues } from '../src/core/data/sets.js';

const last = (fs) => fs[fs.length - 1];

test('의사코드와 파이썬은 줄 수가 같다(나란히 보기)', () => {
  for (const [ps, py] of [[MASK_PSEUDO, MASK_PYTHON], [COUNT_PSEUDO, COUNT_PYTHON], [WHERE_PSEUDO, WHERE_PYTHON], [QUART_PSEUDO, QUART_PYTHON], [BOX_PSEUDO, BOX_PYTHON]]) {
    assert.equal(ps.length, py.length);
  }
});

test('isnull().sum() — 부리길이 2 · 날개길이 1 · 몸무게 1 · 성별 3', () => {
  const end = last(countFrames());
  assert.deepEqual(end.counts, [0, 0, 2, 1, 1, 3]);
  assert.equal(end.total, 7);
});

test('결측치 위치 — 인덱스 [2, 3, 4, 7]', () => {
  assert.deepEqual(last(whereFrames()).list, [2, 3, 4, 7]);
});

test('여부 표 — 빈칸이 처음 나오는 열은 칸마다, 나머지 열은 한 장면에 한 열씩', () => {
  const fs = maskFrames();
  // 준비 1 + 묶음 5열 + 부리길이(열 시작 1 + 칸 10) + 완성 1
  assert.equal(fs.length, 1 + 5 + 1 + 10 + 1);
  assert.deepEqual(last(fs).done, [0, 1, 2, 3, 4, 5]);
  const cells = fs.filter((f) => f.cell !== null);
  assert.deepEqual(cells.map((f) => f.line), [5, 5, 4, 4, 5, 5, 5, 5, 5, 5]);   // 부리길이: 인덱스 2·3이 빈칸
  // 의사코드의 모든 줄(1~6)이 한 번은 켜진다
  assert.deepEqual([...new Set(fs.map((f) => f.line))].sort(), [1, 2, 3, 4, 5, 6]);
});

test('개수·위치 — 의사코드의 모든 줄이 한 번은 켜진다', () => {
  assert.deepEqual([...new Set(countFrames().map((f) => f.line))].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual([...new Set(whereFrames().map((f) => f.line))].sort(), [1, 2, 3, 4, 5]);
});

test('분위수는 판다스 선형 보간과 같다', () => {
  assert.equal(quantile([1, 2, 3, 4], 0.25), 1.75);
  const s = quartiles(outlierValues().map((o) => o.value));
  assert.deepEqual([s.q1, s.q2, s.q3, s.iqr, s.lower, s.upper], [3450, 3700, 3800, 350, 2925, 4325]);
  assert.deepEqual(s.outliers, [8200]);
  assert.equal(s.whiskerHigh, 4250);
});

test('사분위수 장면 — 이상치는 13번(8200g) 하나', () => {
  const end = last(quartileFrames());
  const outs = Object.entries(end.flags).filter(([, f]) => f === 'out').map(([id]) => Number(id));
  assert.deepEqual(outs, [13]);
  assert.equal(end.marks.q1, 3);
  assert.equal(end.marks.q3, 9);
});

test('상자그림 장면은 상자 → 선 → 수염 → 점 순서로 켜진다', () => {
  const fs = boxFrames();
  const order = ['box', 'median', 'whiskers', 'outliers'];
  order.forEach((key, i) => assert.equal(fs[i + 1].show[key], true));
  assert.equal(fs[1].show.median, false);
});

test('평균·최빈값 도우미', () => {
  assert.equal(mean([1, null, 3]), 2);
  assert.equal(mode(['암컷', '수컷', '암컷', null]), '암컷');
  assert.equal(mode(['b', 'a']), 'a', '동점이면 정렬해서 앞선 값(판다스 mode()[0])');
});

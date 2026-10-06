/** 전처리·학습 준비 — 표가 판다스와 같은 모양으로 바뀌는지 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as PP from '../src/core/preprocess.js';
import * as PR from '../src/core/prepare.js';
import { isMissing } from '../src/core/stats.js';

const last = (fs) => fs[fs.length - 1];

test('의사코드와 파이썬은 줄 수가 같다', () => {
  for (const m of [PP, PR]) {
    for (const key of Object.keys(m).filter((k) => k.endsWith('_PSEUDO'))) {
      const py = m[key.replace('_PSEUDO', '_PYTHON')];
      assert.ok(py, `${key}에 짝 파이썬이 없다`);
      assert.equal(m[key].length, py.length, key);
    }
  }
});

test('핵심 속성 — 몸 특징 4개만 남는다', () => {
  const end = last(PP.featureFrames());
  assert.deepEqual(end.kept, ['부리길이', '부리깊이', '날개길이', '몸무게']);
});

test('데이터 삭제 — 연도 열·겹친 행·이상치 행이 사라져 5행', () => {
  const end = last(PP.dropFrames());
  assert.ok(!end.table.columns.includes('연도'));
  assert.equal(end.table.rows.length, 5);
  assert.deepEqual(end.table.rows.map((r) => r._i), [0, 1, 3, 5, 6]);
});

test('dropna — 10행 중 6행이 남는다', () => {
  const end = last(PP.dropnaFrames());
  assert.equal(end.table.rows.length, 6);
});

test('평균 대체 — 판다스 mean()과 같은 값으로 채운다', () => {
  const end = last(PP.fillMeanFrames());
  assert.ok(Math.abs(end.means.부리길이 - 43.725) < 1e-9);
  assert.ok(Math.abs(end.means.날개길이 - 198.44444444444446) < 1e-9);
  assert.ok(Math.abs(end.means.몸무게 - 4038.8888888888887) < 1e-9);
  for (const c of PP.FILL_COLUMNS) assert.ok(end.table.rows.every((r) => !isMissing(r[c])));
});

test('최빈값 대체 — 암컷(4번)으로 3칸', () => {
  const end = last(PP.fillModeFrames());
  assert.equal(end.mode, '암컷');
  assert.equal(Object.keys(end.filled).length, 3);
  assert.ok(end.table.rows.every((r) => !isMissing(r.성별)));
});

test('텍스트 값 대체 — 모든 칸이 숫자', () => {
  const end = last(PP.replaceFrames());
  for (const r of end.table.rows) {
    for (const c of end.table.columns) assert.equal(typeof r[c], 'number', `${c}=${r[c]}`);
  }
});

test('concat — 6행, 인덱스 0~5', () => {
  const end = last(PR.concatFrames());
  assert.equal(end.result.length, 6);
  assert.deepEqual(end.result.map((r) => r._i), [0, 1, 2, 3, 4, 5]);
});

test('merge — 두 표 모두에 있는 5마리만', () => {
  const end = last(PR.mergeFrames());
  assert.deepEqual(end.result.map((r) => r.번호), [1, 153, 2, 277, 278]);
  assert.deepEqual(end.columns, ['번호', '부리길이', '날개길이', '종']);
});

test('분할 — 8 : 2, 섞어도 빠지거나 겹치는 행이 없다', () => {
  const end = last(PR.splitFrames());
  const parts = Object.values(end.part);
  assert.equal(parts.filter((p) => p === 'train').length, 8);
  assert.equal(parts.filter((p) => p === 'test').length, 2);
  assert.equal(new Set(end.order).size, 10);
});

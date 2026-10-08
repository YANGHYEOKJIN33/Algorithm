/** 전처리·학습 준비 — 표가 판다스와 같은 모양으로 바뀌는지 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as PP from '../src/core/preprocess.js';
import * as PR from '../src/core/prepare.js';
import { isMissing } from '../src/core/stats.js';
import * as SETS from '../src/core/data/sets.js';
import { cleanRecords } from '../src/core/data/clean.js';

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

test('merge — 기본(짝 있는 행만): 두 표 모두에 있는 5마리만 (판다스 inner와 같다)', () => {
  const end = last(PR.mergeFrames());
  assert.deepEqual(end.result.map((r) => r.번호), [1, 153, 2, 277, 278]);
  assert.deepEqual(end.columns, ['번호', '부리길이', '날개길이', '종']);
  assert.match(end.say, /5줄/);
});

test("merge — 짝 없는 행도 남기기: 측정표 6마리, 100번은 종이 빈칸 (판다스 how='left'와 같다)", () => {
  const end = last(PR.mergeFrames({ how: 'left' }));
  assert.deepEqual(end.result.map((r) => r.번호), [1, 153, 2, 277, 100, 278]);
  assert.ok(isMissing(end.result.find((r) => r.번호 === 100).종));
  assert.ok(!end.result.some((r) => r.번호 === 4));
  assert.match(end.say, /6줄/);
});

test('merge — 두 방법의 장면 수가 같고(미션 step:14), 14번 장면이 짝 없는 100번이며 말이 방법을 따른다', () => {
  const inner = PR.mergeFrames();
  const left = PR.mergeFrames({ how: 'left' });
  assert.equal(inner.length, left.length);
  for (const fs of [inner, left]) {
    assert.equal(fs[14].matched, false);
    assert.equal(fs[14].focusL, 'L100');
  }
  assert.match(inner[14].say, /건너뛰어요/);
  assert.match(left[14].say, /빈칸\(NaN\)/);
  assert.equal(left[14].result.length, 5);   // 100번이 종 빈칸으로 들어간 뒤
  assert.equal(inner[14].result.length, 4);
});

test('merge 예시의 짝 없는 펭귄 — 100번(판정 없음)·4번(3단원에서 지움)은 5단원 학습 데이터에 쓰이지 않는다', () => {
  const ml = new Set([...SETS.KNN_TRAIN_IDS, ...SETS.KNN_TEST_IDS, ...SETS.TREE_IDS, ...SETS.LINREG_IDS, ...SETS.KMEANS_INIT_IDS]);
  assert.ok(!ml.has(100) && !ml.has(4));
  const clean = new Set(cleanRecords().map((r) => r.번호));
  assert.ok(clean.has(100), '100번의 측정값은 깨끗한 데이터의 실제 값');
  assert.ok(!clean.has(4), '4번은 측정값이 모두 비어 3단원에서 지웠다');
  const m100 = SETS.MERGE_LEFT.rows.find((r) => r.번호 === 100);
  const c100 = cleanRecords().find((r) => r.번호 === 100);
  assert.equal(m100.부리길이, c100.부리길이);
  assert.equal(m100.날개길이, c100.날개길이);
});

test('분할 — 8 : 2, 섞어도 빠지거나 겹치는 행이 없다', () => {
  const end = last(PR.splitFrames());
  const parts = Object.values(end.part);
  assert.equal(parts.filter((p) => p === 'train').length, 8);
  assert.equal(parts.filter((p) => p === 'test').length, 2);
  assert.equal(new Set(end.order).size, 10);
});

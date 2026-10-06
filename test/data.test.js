/** 데이터 — 원본을 지키고, 수업용 함정은 공개한 것만 들어 있는지 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ORIGINAL, COLUMNS } from '../src/core/data/penguins.js';
import { practiceRecords, practicePages, CHANGES, DUPLICATE_ID, PAGE_SIZE, originalRecords } from '../src/core/data/practice.js';
import { isMissing } from '../src/core/stats.js';

test('원본은 344마리, 9개 열', () => {
  assert.equal(ORIGINAL.length, 344);
  assert.equal(COLUMNS.length, 9);
  for (const row of ORIGINAL) assert.equal(row.length, 9);
});

test('원본 결측치는 palmerpenguins와 같다 (측정값 2 · 성별 11)', () => {
  const recs = originalRecords();
  const count = (c) => recs.filter((r) => isMissing(r[c])).length;
  assert.equal(count('부리길이'), 2);
  assert.equal(count('몸무게'), 2);
  assert.equal(count('성별'), 11);
});

test('연습 데이터 = 원본 + 공개한 함정뿐', () => {
  const recs = practiceRecords();
  assert.equal(recs.length, 345, '겹친 행 하나가 더해진다');
  const orig = originalRecords();
  let diffs = 0;
  const seen = new Set();
  for (const r of recs) {
    if (seen.has(r.번호)) { assert.equal(r.번호, DUPLICATE_ID); continue; }
    seen.add(r.번호);
    const o = orig.find((x) => x.번호 === r.번호);
    for (const c of COLUMNS) {
      if (r[c] !== o[c]) {
        diffs += 1;
        assert.ok(CHANGES.some((ch) => ch.번호 === r.번호 && ch.열 === c), `${r.번호}번 ${c} 값이 몰래 바뀌었다`);
      }
    }
  }
  assert.equal(diffs, CHANGES.length);
});

test('쪽 나누기 — 2쪽은 겹친 50번으로 시작한다', () => {
  const pages = practicePages();
  assert.equal(pages.length, 7);
  assert.equal(pages[0].length, PAGE_SIZE);
  assert.equal(pages[0][PAGE_SIZE - 1].번호, DUPLICATE_ID);
  assert.equal(pages[1][0].번호, DUPLICATE_ID);
  assert.equal(pages.flat().length, 345);
});

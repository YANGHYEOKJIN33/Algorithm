/** 크기 맞추기(정규화) — 3-7 전처리 장면과 6-1 🔧 고쳐 보고 다시 채점 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as PP from '../src/core/preprocess.js';
import * as EV from '../src/core/ml/evaluate.js';
import { KNN_TEST_IDS } from '../src/core/data/sets.js';

const last = (fs) => fs[fs.length - 1];
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('정규화 — 의사코드와 파이썬 줄 수가 같고, 장면은 있는 줄만 가리킨다', () => {
  assert.equal(PP.SCALE_PSEUDO.length, PP.SCALE_PYTHON.length);
  for (const f of PP.scaleFrames()) {
    assert.ok(f.line >= 1 && f.line <= PP.SCALE_PSEUDO.length, `줄 ${f.line}`);
    assert.ok(f.say.length > 0);
  }
});

test('정규화 — 열마다 작은값 0·큰값 1, 나머지는 (값 − 작은값) ÷ (큰값 − 작은값)', () => {
  const frames = PP.scaleFrames();
  const end = last(frames);
  const raw = PP.afterAllFill();
  for (const col of PP.SCALE_COLUMNS) {
    const vals = raw.rows.map((r) => r[col]);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    assert.deepEqual(end.ranges[col], { lo, hi });
    end.table.rows.forEach((r, i) => near(r[col], (vals[i] - lo) / (hi - lo)));
    assert.equal(Math.min(...end.table.rows.map((r) => r[col])), 0);
    assert.equal(Math.max(...end.table.rows.map((r) => r[col])), 1);
  }
  assert.deepEqual(end.ranges.부리길이, { lo: 34.1, hi: 50 });
  assert.deepEqual(end.ranges.몸무게, { lo: 3475, hi: 5700 });
  // 번호·종·성별은 그대로
  end.table.rows.forEach((r, i) => assert.equal(r.번호, raw.rows[i].번호));
  // 부리길이가 처음 0~1로 바뀌는 장면 = 3-7 미션 step:2
  assert.ok(frames[2].scaled.부리길이 && !frames[1].scaled.부리길이);
});

test('정규화 — 1번·153번의 거리: 전에는 몸무게가 99% 넘게, 뒤에는 세 열이 모두 힘을 보탠다', () => {
  const frames = PP.scaleFrames();
  const before = frames[0].gap;
  const after = last(frames).gap;
  near(before.dist, Math.sqrt(7 ** 2 + 30 ** 2 + 750 ** 2), 1e-6);
  assert.ok(before.parts.find((p) => p.col === '몸무게').share > 0.99);
  near(after.dist, Math.sqrt((7 / 15.9) ** 2 + (30 / 49) ** 2 + (750 / 2225) ** 2), 1e-9);
  for (const p of after.parts) assert.ok(p.share > 0.1, `${p.col} ${p.share}`);
});

test('🔧 다시 채점 — 처음 모델은 6-1 채점(5/6, 163번 틀림)과 같다', () => {
  const base = EV.improveScore();
  const end = last(EV.evalFrames());
  assert.equal(base.correct, end.correct);
  assert.deepEqual(base.rows.map((r) => [r.id, r.pred]), end.rows.map((r) => [r.id, r.pred]));
  assert.deepEqual(base.rows.filter((r) => !r.ok).map((r) => r.id), [EV.TARGET_ID]);
  assert.deepEqual(base.rows.map((r) => r.id), KNN_TEST_IDS);
});

test('🔧 다시 채점 — 날개길이를 그대로 넣으면 163번은 고치지만 283번이 새로 틀린다', () => {
  const res = EV.improveScore({ k: 3, wing: true, scale: false });
  assert.equal(res.correct, 5);
  assert.deepEqual(res.rows.filter((r) => !r.ok).map((r) => r.id), [283]);
  assert.equal(res.widest, '날개길이');
  const ch = EV.improveChanges(res);
  assert.deepEqual(ch.map((c) => [c.id, c.fixed]).sort(), [[163, true], [283, false]]);
  const note = EV.improveNote(res);
  assert.equal(note.kind, 'warn');
  assert.match(note.text, /283번/);
});

test('🔧 다시 채점 — 크기를 맞추면(k=3) 6/6, k=1은 그대로도 6/6, k=5는 163번이 여전히 틀린다', () => {
  assert.equal(EV.improveScore({ k: 3, wing: false, scale: true }).correct, 6);
  assert.equal(EV.improveScore({ k: 3, wing: true, scale: true }).correct, 6);
  assert.equal(EV.improveScore({ k: 1, wing: false, scale: false }).correct, 6);
  const k5 = EV.improveScore({ k: 5, wing: false, scale: false });
  assert.deepEqual(k5.rows.filter((r) => !r.ok).map((r) => r.id), [163]);
});

test('🔧 다시 채점 — 정규화의 작은값·큰값은 훈련 18마리에서만 구한다', () => {
  const res = EV.improveScore({ scale: true, wing: true });
  assert.deepEqual(res.ranges.부리길이, { lo: 37.8, hi: 51.7 });
  assert.deepEqual(res.ranges.부리깊이, { lo: 13.2, hi: 21.2 });
  assert.deepEqual(res.ranges.날개길이, { lo: 174, hi: 230 });
  assert.match(EV.improveNote(res).text, /훈련 18마리에서만/);
});

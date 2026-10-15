/** 진도 저장 형식 2판 — 0-2·6-1 맨 앞에 미션이 하나 늘어서 저장된 미션 번호를 한 칸씩 민다 (FINAL_SPEC §4.2) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProgress, migrate, VERSION } from '../src/app/progress.js';
import { recordText } from '../src/app/record.js';
import { pageDone } from '../src/app/missions.js';
import { TABS } from '../src/app/lessons.js';

const KEY = 'ai-data-lab:progress';

function useStorage(init = {}) {
  const m = new Map(Object.entries(init));
  const storage = {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  return storage;
}

/** 1판(v 없음) 진도 — 0-2(act:stages · ask)와 6-1(wrong-look · improve · ask)을 모두 마쳤고 0-2 생각 열기를 골랐다 */
const V1 = () => ({
  pages: {
    'start:goal': { visited: true, missions: { 0: true, 1: true, 2: true } },
    'start:pipeline': { visited: true, missions: { 0: true, 1: true } },
    'inspect:mask': { visited: true, missions: { 0: true, 2: true } },
    'project:eval': { visited: true, missions: { 0: true, 1: true, 2: true } },
  },
  quizzes: { 'ask:start:pipeline': { 0: 0 }, 'unit:inspect': { 0: 1, 1: 2 } },
  firsts: { 'ask:start:pipeline': { 0: 0 }, 'ask:project:eval': { 0: 2 }, 'unit:inspect': { 0: 0, 1: 0 } },
  hooks: { start: 1, inspect: 0 },
  self: { inspect: { 0: 'yes', 1: 'no' } },
  last: { tab: 'project', sub: null, page: 'eval' },
});

test('migrate 1 → 2 — 0-2·6-1의 미션 번호를 한 칸 뒤로, 0-2는 생각 열기를 골랐으면 새 0번도 ✅', () => {
  const v1 = V1();
  const before = JSON.stringify(v1);
  const v2 = migrate(v1);
  assert.equal(JSON.stringify(v1), before, '넘겨받은 객체는 고치지 않는다');
  assert.equal(v2.v, VERSION);
  assert.deepEqual(v2.pages['start:pipeline'], { visited: true, missions: { 0: true, 1: true, 2: true } });
  assert.deepEqual(v2.pages['project:eval'], { visited: true, missions: { 1: true, 2: true, 3: true } });
  // 다른 쪽과 firsts·quizzes·hooks·self·last는 그대로
  assert.deepEqual(v2.pages['start:goal'], v1.pages['start:goal']);
  assert.deepEqual(v2.pages['inspect:mask'], v1.pages['inspect:mask']);
  for (const k of ['quizzes', 'firsts', 'hooks', 'self', 'last']) assert.deepEqual(v2[k], v1[k], k);
  // 두 번 해도 더 밀리지 않는다
  assert.deepEqual(migrate(v2), v2);
});

test('migrate — 생각 열기를 안 골랐으면 0-2의 새 0번은 ☐, 진도가 없던 쪽은 만들지 않는다', () => {
  const v2 = migrate({ pages: { 'start:pipeline': { visited: true, missions: { 0: true } } }, hooks: {} });
  assert.deepEqual(v2.pages['start:pipeline'].missions, { 1: true });
  assert.equal(v2.pages['project:eval'], undefined);
  // 0-2에 와 본 적은 없어도 생각 열기를 골랐다면(예전 표지 흐름) 새 0번은 ✅
  assert.deepEqual(migrate({ pages: {}, hooks: { start: 0 } }).pages['start:pipeline'].missions, { 0: true });
  // 빈 진도·이미 2판인 진도
  assert.equal(migrate({}).v, VERSION);
  const cur = { v: 2, pages: { 'project:eval': { visited: true, missions: { 0: true } } } };
  assert.deepEqual(migrate(cur).pages['project:eval'].missions, { 0: true });
});

test('불러올 때 한 번만 고치고 2판으로 다시 적는다', () => {
  const storage = useStorage({ [KEY]: JSON.stringify(V1()) });
  const p = createProgress();
  assert.deepEqual(p.missionsDone('project:eval'), { 1: true, 2: true, 3: true });
  assert.deepEqual(p.missionsDone('start:pipeline'), { 0: true, 1: true, 2: true });
  const saved = JSON.parse(storage.getItem(KEY));
  assert.equal(saved.v, VERSION);
  // 다시 열어도 그대로
  const again = createProgress();
  assert.deepEqual(again.missionsDone('project:eval'), { 1: true, 2: true, 3: true });
  // 처음 쓰는 브라우저는 처음부터 2판
  useStorage();
  const fresh = createProgress();
  assert.equal(fresh.get().v, VERSION);
  fresh.complete('start:goal', 0);
  assert.equal(JSON.parse(localStorage.getItem(KEY)).v, VERSION);
  fresh.reset();
  assert.equal(fresh.get().v, VERSION);
});

test('📋 학습 기록 — 고친 진도도 0단원·6단원 줄 말고는 글자 하나 다르지 않다', () => {
  const when = new Date(2026, 9, 15, 9, 30);
  // 고치지 않은 채(이미 2판이라고 적어 둔 것) 읽은 기록과 고쳐서 읽은 기록
  useStorage({ [KEY]: JSON.stringify({ ...V1(), v: VERSION }) });
  const raw = recordText(createProgress(), when).split('\n');
  useStorage({ [KEY]: JSON.stringify(V1()) });
  const p = createProgress();
  const fixed = recordText(p, when).split('\n');
  assert.equal(fixed.length, raw.length);
  const touched = (line) => /^(0|6)단원 |^전체 쪽 /.test(line);
  raw.forEach((line, i) => { if (!touched(line)) assert.equal(fixed[i], line); });
  assert.ok(raw.some((l) => l.startsWith('2단원 ') && l.includes('단원❓ 1/3')), '고치지 않는 단원 줄도 비교했다');

  // 내용 파일에 새 미션이 들어온 뒤(WP5): 0-2는 그대로 ✅, 6-1은 새 ⏩ 끝까지만 ☐
  const start = TABS.find((t) => t.id === 'start');
  const pipeline = start.pages.find((pg) => pg.id === 'pipeline');
  if (pipeline.missions[0].check === 'act:hook') assert.equal(pageDone(p, start, null, pipeline), true, '0-2');
  const project = TABS.find((t) => t.id === 'project');
  const evalPage = project.pages.find((pg) => pg.id === 'eval');
  if (evalPage.missions[0].check === 'end') {
    assert.equal(pageDone(p, project, null, evalPage), false, '6-1은 새 미션이 남는다');
    assert.deepEqual(evalPage.missions.map((_, i) => Boolean(p.missionsDone('project:eval')[i])), evalPage.missions.map((_, i) => i > 0));
  }
});

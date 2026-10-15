/** 학습 흐름 — [계속]/[이전]·이어서 보기·저절로 넘김·건너뛰기·표지 출발 (FINAL_SPEC §1.5~§1.10, §5.4) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/app/state.js';
import { createProgress } from '../src/app/progress.js';
import { createMissions } from '../src/app/missions.js';
import { TABS, goPatch } from '../src/app/lessons.js';
import { createFlow, AUTO_ADVANCE_MS } from '../src/app/flow.js';
import { nextPlace, prevPlace, beatKey, visitPatch, placeOf } from '../src/app/nav.js';
import { pageBeats, sameView } from '../src/app/beats.js';

/** 브라우저 저장소 흉내 — 시험마다 새로 */
function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    clear: () => m.clear(),
  };
}

/** 손으로 돌리는 시계 */
function fakeClock() {
  let id = 0;
  const timers = new Map();
  return {
    set: (fn, ms) => { id += 1; timers.set(id, { fn, ms }); return id; },
    clear: (i) => { timers.delete(i); },
    get size() { return timers.size; },
    delays: () => [...timers.values()].map((t) => t.ms),
    run() { const list = [...timers.values()]; timers.clear(); for (const t of list) t.fn(); },
  };
}

/** 저장소·진도·미션·흐름 — sceneHost 대신 쪽이 바뀌면 missions.enter를 부른다 */
function setup(state = {}, prefs = null) {
  const storage = memoryStorage(prefs ? { 'ai-data-lab:prefs': JSON.stringify(prefs) } : {});
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
  const store = createStore();
  store.set(state);
  const progress = createProgress();
  const missions = createMissions(progress);
  let entered = null;
  store.subscribe((s) => {
    const p = placeOf(s);
    if (p.key !== entered) { entered = p.key; missions.enter(p.tab, p.sub, p.page); }
  });
  const clock = fakeClock();
  const flow = createFlow({ store, progress, missions, setTimeout: clock.set, clearTimeout: clock.clear });
  const seen = [];
  flow.subscribe((v) => seen.push(v));
  return { store, progress, missions, flow, clock, storage, seen };
}

const tab = (id) => TABS.find((t) => t.id === id);
/** ⏭로 장면 i까지 간 것처럼 */
const stepTo = (missions, index, total = 40) => missions.emit({ type: 'player', index, total, atEnd: index === total - 1 });
const COUNT = { tab: 'inspect', 'step:inspect': 2 };   // 2-2: 도입 · 읽기 · 장면 10까지 · 뒤로 보기 · 확인 · 정리

test('nav — nextPlace/prevPlace는 lessonBar와 같은 patch, visitPatch는 장 번호를 더한다', () => {
  assert.deepEqual(nextPlace({ tab: 'inspect', 'step:inspect': 2 }), { 'step:inspect': 3 });
  assert.deepEqual(prevPlace({ tab: 'inspect', 'step:inspect': 0 }), { tab: 'collect', 'step:collect': tab('collect').pages.length - 1 });
  assert.deepEqual(nextPlace({ tab: 'ready', 'step:ready': tab('ready').pages.length - 1 }), { tab: 'ml', mlTab: 'concept', 'step:ml:concept': 0 });
  const knnLast = tab('ml').sub.find((s) => s.id === 'knn').pages.length - 1;
  assert.deepEqual(nextPlace({ tab: 'ml', mlTab: 'knn', 'step:ml:knn': knnLast }), { mlTab: 'tree', 'step:ml:tree': 0 });
  assert.deepEqual(prevPlace({ tab: 'ml', mlTab: 'tree', 'step:ml:tree': 0 }), { mlTab: 'knn', 'step:ml:knn': knnLast });
  assert.equal(prevPlace({ tab: 'start', 'step:start': 0 }), null);
  assert.equal(nextPlace({ tab: 'project', 'step:project': tab('project').pages.length - 1 }), null);
  assert.equal(beatKey('inspect:count'), 'beat:inspect:count');

  assert.deepEqual(visitPatch('inspect', 'count', null, 'work'), { tab: 'inspect', 'step:inspect': 2, 'beat:inspect:count': 2 });
  assert.deepEqual(visitPatch('inspect', 'count', null, 'start'), { tab: 'inspect', 'step:inspect': 2, 'beat:inspect:count': 0 });
  assert.deepEqual(visitPatch('inspect', 'count', null, 'last'), { tab: 'inspect', 'step:inspect': 2, 'beat:inspect:count': 5 });
  assert.deepEqual(visitPatch('inspect', 'count', null, 99), { tab: 'inspect', 'step:inspect': 2, 'beat:inspect:count': 5 });
  assert.deepEqual(visitPatch('inspect', 'count'), goPatch('inspect', 'count'), 'at이 없으면 기억해 둔 장');
  assert.deepEqual(visitPatch('ml', 'idea', 'knn', 'start'), { tab: 'ml', mlTab: 'knn', 'step:ml:knn': 0, 'beat:ml:knn:idea': 0 });
  assert.deepEqual(visitPatch('ml', 'step', 'knn', 'work'), { tab: 'ml', mlTab: 'knn', 'step:ml:knn': 1, 'beat:ml:knn:step': 2 });
});

test('[계속]/[이전] — 쪽 안에서는 장, 마지막 장에서는 다음 쪽(기억해 둔 장), 첫 장에서는 이전 쪽의 마지막 장', () => {
  const { store, flow } = setup(COUNT);
  let v = flow.get();
  assert.equal(v.key, 'inspect:count');
  assert.equal(v.index, 0);
  assert.equal(v.beat.kind, 'intro');
  assert.equal(v.isFirst, true);
  assert.equal(v.prevLabel, '← 2-1');
  assert.equal(v.nextLabel, '시작하기 →');

  flow.forward();
  v = flow.get();
  assert.equal(v.index, 1);
  assert.equal(v.prevLabel, '← 도입');
  assert.equal(v.nextLabel, '계속 → 실행해 보기');
  assert.equal(store.get()['beat:inspect:count'], 1);

  flow.forward();
  v = flow.get();
  assert.equal(v.beat.id, 'step:9');
  assert.equal(v.prevLabel, '← 읽기');
  assert.deepEqual(v.open && [v.open.i, v.open.check], [0, 'step:9']);
  assert.equal(v.skip, true);
  assert.equal(v.nextLabel, '건너뛰기 ↷');

  flow.go(4);
  v = flow.get();
  assert.equal(v.beat.kind, 'check');
  assert.equal(v.nextLabel, '건너뛰기 ↷', '❓ 아직 안 맞힘');
  flow.go(5);
  v = flow.get();
  assert.equal(v.isLast, true);
  assert.equal(v.prevLabel, '← 확인');
  assert.equal(v.nextLabel, '다음 쪽: 2-3 위치 →');

  // 다음 쪽 — 처음이면 0번 장
  flow.forward();
  v = flow.get();
  assert.equal(v.key, 'inspect:where');
  assert.equal(v.index, 0);
  assert.equal(store.get()['step:inspect'], 3);
  // 다음 쪽 — 기억해 둔 장이 있으면 그 장
  store.set({ 'beat:inspect:quartile': 3 });
  flow.go(99);
  assert.equal(flow.get().index, flow.get().beats.length - 1, 'go는 범위 안으로');
  flow.forward();
  v = flow.get();
  assert.equal(v.key, 'inspect:quartile');
  assert.equal(v.index, 3);

  // 이전 쪽 — 그 쪽의 마지막 장
  flow.go(0);
  flow.back();
  v = flow.get();
  assert.equal(v.key, 'inspect:where');
  assert.equal(v.index, v.beats.length - 1);
  assert.equal(store.get()['beat:inspect:where'], v.beats.length - 1);
});

test('단원·하위 탭·수업 끝의 글자와 이동', () => {
  // 단원의 처음 → 앞 단원 정리
  let { flow, store } = setup({ tab: 'inspect', 'step:inspect': 0 });
  assert.equal(flow.get().prevLabel, '← 1단원 정리');
  flow.back();
  assert.equal(flow.get().key, 'collect:review');
  assert.equal(flow.get().beat.id, 'end');
  assert.equal(flow.get().nextLabel, `다음: 2단원 ${tab('inspect').icon} ${tab('inspect').label} →`);
  // 2-1의 첫 장 → 표지
  store.set({ tab: 'inspect', 'step:inspect': 1 });
  assert.equal(flow.get().key, 'inspect:mask');
  assert.equal(flow.get().prevLabel, '← 2단원 표지');

  // 단원의 끝 → 다음 단원 표지
  ({ flow, store } = setup({ tab: 'inspect', 'step:inspect': tab('inspect').pages.length - 1 }));
  flow.go(99);
  const prep = tab('prep');
  assert.equal(flow.get().nextLabel, `다음: 3단원 ${prep.icon} ${prep.label} →`);
  flow.forward();
  assert.equal(flow.get().key, 'prep:cover');

  // 하위 탭의 끝 → 다음 하위 탭
  const subs = tab('ml').sub;
  const knn = subs.find((s) => s.id === 'knn');
  const tree = subs.find((s) => s.id === 'tree');
  ({ flow, store } = setup({ tab: 'ml', mlTab: 'knn', 'step:ml:knn': knn.pages.length - 1 }));
  flow.go(99);
  assert.equal(flow.get().nextLabel, `다음: ${tree.icon ? `${tree.icon} ` : ''}${tree.name} →`);
  flow.forward();
  assert.equal(flow.get().key, 'ml:tree:idea');
  assert.equal(store.get().mlTab, 'tree');
  assert.equal(flow.get().prevLabel, `← ${'5-6'}`);
  // 마지막 알고리즘의 끝 → 단원 정리 쪽
  ({ flow } = setup({ tab: 'ml', mlTab: 'kmeans', 'step:ml:kmeans': 99 }));
  flow.go(99);
  assert.equal(flow.get().nextLabel, '다음 쪽: 5단원 정리 →');

  // 수업의 마지막 쪽(6단원 정리) → 6-4 내 프로젝트
  ({ flow, store } = setup({ tab: 'project', 'step:project': tab('project').pages.length - 1 }));
  flow.go(99);
  assert.equal(flow.get().nextLabel, '🚀 6-4 내 프로젝트로 →');
  flow.forward();
  assert.equal(flow.get().key, 'project:guide');

  // 수업의 첫 장 — 더 갈 곳이 없다
  ({ flow } = setup({ tab: 'start', 'step:start': 0 }));
  assert.equal(flow.get().prevLabel, null);
  flow.back();
  assert.equal(flow.get().key, 'start:goal');
  assert.equal(flow.get().index, 0);
});

test('이어서 보기 — beat:<쪽열쇠>를 새로 고쳐도 기억하고, 덱보다 크면 줄인다', () => {
  let { flow, storage } = setup({}, { tab: 'inspect', 'step:inspect': 2, 'beat:inspect:count': 3 });
  assert.equal(flow.get().key, 'inspect:count');
  assert.equal(flow.get().index, 3);
  assert.equal(flow.get().beat.id, 'back');
  flow.go(4);
  const saved = JSON.parse(storage.getItem('ai-data-lab:prefs'));
  assert.equal(saved['beat:inspect:count'], 4, 'beat: 열쇠도 저장한다');
  assert.equal('lessonFold' in saved, false);

  ({ flow } = setup({}, { tab: 'inspect', 'step:inspect': 2, 'beat:inspect:count': 99 }));
  assert.equal(flow.get().index, 5);
});

test('저절로 넘김 — 같은 화면의 할 일 장으로만 1.2초 뒤에', () => {
  const { flow, missions, clock, seen } = setup({ ...COUNT, 'beat:inspect:count': 2 });
  stepTo(missions, 5);
  assert.equal(flow.get().pending, false, '아직 장면 10까지 못 감');
  stepTo(missions, 9);
  let v = flow.get();
  assert.equal(v.beatDone, true);
  assert.equal(v.pending, true);
  assert.equal(v.index, 2, '바로 넘기지 않는다');
  assert.deepEqual(clock.delays(), [AUTO_ADVANCE_MS]);
  assert.ok(seen.at(-1).pending, '구독자에게 알린다');
  clock.run();
  v = flow.get();
  assert.equal(v.index, 3);
  assert.equal(v.beat.id, 'back');
  assert.equal(v.pending, false);
  assert.equal(seen.at(-1).index, 3);

  // 다음 장이 ❓ 확인(슬라이드)이면 넘기지 않고 [계속 →]
  missions.emit({ type: 'back' });
  v = flow.get();
  assert.equal(v.beatDone, true);
  assert.equal(v.pending, false);
  assert.equal(clock.size, 0);
  assert.equal(v.nextLabel, '계속 →');
  assert.equal(v.skip, false);
});

test('저절로 넘김 — 다른 화면(표지의 생각 열기 → 데이터 변화)이면 넘기지 않는다', () => {
  const { flow, missions, clock } = setup({ tab: 'inspect', 'step:inspect': 0 });
  assert.equal(flow.get().beat.id, 'hook');
  assert.equal(flow.get().nextLabel, '건너뛰기 ↷');
  missions.act('hook');
  assert.equal(flow.get().pending, false);
  assert.equal(clock.size, 0);
  assert.equal(flow.get().nextLabel, '계속 →');
});

/** 살펴보기 쪽에서 page.beats가 있는 이웃한 할 일 장 두 개 — same이면 같은 화면, 아니면 다른 화면 */
function viewPair(same) {
  for (const t of TABS) {
    const groups = t.sub ? t.sub.map((s) => [s, s.pages]) : [[null, t.pages]];
    for (const [sub, pages] of groups) {
      for (const page of pages) {
        if (!page.beats?.length) continue;
        const beats = pageBeats(t, sub, page);
        for (let i = 0; i + 1 < beats.length; i += 1) {
          const [a, b] = [beats[i], beats[i + 1]];
          if (a.kind === 'work' && b.kind === 'work' && sameView(a, b) === same && a.checks.length === 1) {
            return { patch: { ...goPatch(t.id, page.id, sub?.id), [beatKey(placeOf(goPatch(t.id, page.id, sub?.id)).key)]: i }, act: a.checks[0].slice(4), i, at: `${t.id}:${page.id}` };
          }
        }
      }
    }
  }
  return null;
}

test('저절로 넘김 — 살펴보기 쪽에서 보이는 덩어리가 바뀌면 넘기지 않고 [계속 →]', (t) => {
  const pair = viewPair(false);
  if (!pair) { t.skip('page.beats가 있는 살펴보기 쪽이 아직 없다(WP5)'); return; }
  const { flow, missions, clock } = setup(pair.patch);
  assert.equal(flow.get().index, pair.i, pair.at);
  missions.act(pair.act);
  assert.equal(flow.get().beatDone, true, pair.at);
  assert.equal(flow.get().pending, false, pair.at);
  assert.equal(clock.size, 0);
  assert.equal(flow.get().skip, false, '[계속 →]이 파랗게');
  assert.equal(flow.get().index, pair.i, '화면이 그대로');
});

test('저절로 넘김 — 살펴보기 쪽도 같은 화면(show가 같음)이면 넘긴다', (t) => {
  const pair = viewPair(true);
  if (!pair) { t.skip('show가 같은 이웃 할 일 장이 아직 없다(WP5 — 예: 5-7)'); return; }
  const { flow, missions, clock } = setup(pair.patch);
  missions.act(pair.act);
  assert.equal(flow.get().pending, true, pair.at);
  clock.run();
  assert.equal(flow.get().index, pair.i + 1, pair.at);
});

test('저절로 넘김 — 기다리는 사이 학생이 움직이면 취소', () => {
  // [← 이전]
  let s = setup({ ...COUNT, 'beat:inspect:count': 2 });
  stepTo(s.missions, 9);
  assert.equal(s.flow.get().pending, true);
  s.flow.back();
  assert.equal(s.flow.get().index, 1);
  assert.equal(s.flow.get().pending, false);
  assert.equal(s.clock.size, 0);
  s.clock.run();
  assert.equal(s.flow.get().index, 1, '취소된 넘김은 움직이지 않는다');

  // 장 칩·목차처럼 store를 바로 고쳐도
  s = setup({ ...COUNT, 'beat:inspect:count': 2 });
  stepTo(s.missions, 9);
  s.store.set({ 'beat:inspect:count': 5 });
  assert.equal(s.flow.get().pending, false);
  assert.equal(s.clock.size, 0);
  assert.equal(s.seen.at(-1).index, 5);

  // 지금 장 칩을 다시 눌러도 취소되고, 구독자가 안다
  s = setup({ ...COUNT, 'beat:inspect:count': 2 });
  stepTo(s.missions, 9);
  assert.equal(s.seen.at(-1).pending, true);
  s.flow.go(2);
  assert.equal(s.flow.get().pending, false);
  assert.equal(s.seen.at(-1).pending, false);
  assert.equal(s.clock.size, 0);
  assert.equal(s.flow.get().index, 2);
});

test('저절로 넘김 — 기다리는 사이 다음 장까지 마치면 그 장을 건너뛴다(1-2 ⏭ 여러 번)', () => {
  const { flow, missions, clock } = setup({ tab: 'collect', 'step:collect': 2, 'beat:collect:crawl': 2 });
  assert.deepEqual(flow.get().beats.map((b) => b.id), ['intro', 'code', 'step:8', 'step:15', 'end', 'check', 'wrap']);
  stepTo(missions, 15);   // step:8 · step:15 함께
  assert.equal(flow.get().pending, true);
  clock.run();
  assert.equal(flow.get().beat.id, 'end');
});

test('건너뛰기 — 미션은 ☐ 그대로 남고, 정리를 지나 다음 쪽으로 간다', () => {
  const { flow, progress } = setup({ ...COUNT, 'beat:inspect:count': 2 });
  for (const id of ['step:9', 'back', 'check']) {
    assert.equal(flow.get().beat.id, id);
    assert.equal(flow.get().skip, true, `${id}: 건너뛰기`);
    flow.forward();
  }
  assert.equal(flow.get().beat.kind, 'wrap');
  assert.equal(flow.get().pageDone, false);
  flow.forward();
  assert.equal(flow.get().key, 'inspect:where');
  assert.deepEqual(progress.missionsDone('inspect:count'), {});
});

test('표지를 떠나면 act:begin — 처음이면 다음 쪽, 마친 쪽이 있으면 아직 안 끝난 첫 쪽', () => {
  let { flow, progress, store } = setup({ tab: 'inspect', 'step:inspect': 0 });
  flow.go(99);
  let v = flow.get();
  assert.equal(v.beat.id, 'goals');
  assert.equal(v.open?.check, 'act:begin');
  assert.equal(v.skip, false, '[시작하기 →]가 곧 할 일');
  assert.equal(v.nextLabel, '시작하기 →');
  flow.forward();
  assert.equal(progress.missionsDone('inspect:cover')[1], true);
  assert.equal(flow.get().key, 'inspect:mask');

  // 2-1을 마쳤으면 [이어서 하기 →] — 2-2로
  ({ flow, progress, store } = setup({ tab: 'inspect', 'step:inspect': 0 }));
  tab('inspect').pages[1].missions.forEach((_, i) => progress.complete('inspect:mask', i));
  flow.go(99);
  assert.equal(flow.get().nextLabel, '이어서 하기 →');
  flow.forward();
  assert.equal(flow.get().key, 'inspect:count');

  // 다른 길(leave)로 떠나도
  ({ flow, progress, store } = setup({ tab: 'prep', 'step:prep': 0 }));
  flow.leave(goPatch('prep', 'drop'));
  assert.equal(progress.missionsDone('prep:cover')[1], true);
  assert.equal(flow.get().key, 'prep:drop');
  // 표지가 아닌 쪽을 떠날 때는 아무 미션도 이루지 않는다
  flow.leave(goPatch('prep', 'dropna'));
  assert.deepEqual(progress.missionsDone('prep:drop'), {});
  assert.equal(store.get()['step:prep'], 3);
});

test('미션을 차례와 다르게 해도 — 그 장이 끝났는지는 미션이 ✅인지로만', () => {
  const { flow, missions, clock } = setup({ ...COUNT, 'beat:inspect:count': 2 });
  missions.emit({ type: 'back' });          // 장면 10까지 가기 전에 ⏮
  let v = flow.get();
  assert.equal(v.index, 2);
  assert.equal(v.pending, false);
  assert.equal(v.open.check, 'step:9');
  assert.equal(v.beatDone, false);
  stepTo(missions, 9);
  v = flow.get();
  assert.equal(v.beatDone, true);
  assert.equal(v.pending, false, '다음 장(뒤로 보기)은 이미 끝났다');
  assert.equal(clock.size, 0);
  assert.equal(v.nextLabel, '계속 →');
  flow.forward();
  assert.equal(flow.get().beat.id, 'back');
  assert.equal(flow.get().beatDone, true);
  assert.deepEqual(flow.get().todo.map((t) => [t.i, t.check, t.done]), [[1, 'back', true]]);
});

test('정리·❓ 장의 할 일 — todo/open은 이 장의 미션만, 미션 순서대로', () => {
  const { flow, missions, progress } = setup({ ...COUNT, 'beat:inspect:count': 4 });
  let v = flow.get();
  assert.deepEqual(v.todo.map((t) => t.check), ['ask']);
  assert.equal(v.open.check, 'ask');
  missions.emit({ type: 'ask', right: true });
  v = flow.get();
  assert.equal(v.beatDone, true);
  assert.equal(v.nextLabel, '계속 → 정리');
  flow.forward();
  v = flow.get();
  assert.deepEqual(v.todo, []);
  assert.equal(v.open, null);
  assert.equal(v.beatDone, true);
  assert.equal(progress.missionsDone('inspect:count')[2], true);
});

/** 장(beat) 차례 — 모든 쪽이 "한 장에 한 가지" 차례를 갖고, 미션이 빠짐없이 한 장에만 들어간다 (FINAL_SPEC §1.3·§5.4) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TABS, unitPages } from '../src/app/lessons.js';
import { getScene } from '../src/scenes/index.js';
import {
  pageBeats, sameView, firstWorkBeat, beatOfCheck, deckKind, defaultChip, STEP_SCENES,
} from '../src/app/beats.js';

const KINDS = new Set(['intro', 'code', 'read', 'work', 'check', 'wrap']);
const OVERLAY = new Set(['intro', 'code', 'check', 'wrap']);

const all = TABS.flatMap((tab) => unitPages(tab).map((it) => ({
  ...it,
  at: `${it.label} ${tab.id}${it.sub ? `:${it.sub.id}` : ''}:${it.page.id}`,
  beats: pageBeats(tab, it.sub, it.page),
  kind: deckKind(it.page),
})));

/** 단계 실행 장면의 그림 수 — check-course와 같은 방법 */
function frameCount(page) {
  try { return getScene(page.scene).frames({ store: { get: () => ({}) } }).length; } catch { return 0; }
}

test('쪽 59개 — 단계 실행 23 · 살펴보기 15 · Colab 8 · 표지 6 · 정리 7', () => {
  const count = (k) => all.filter((x) => x.kind === k).length;
  assert.equal(all.length, 59);
  assert.deepEqual([count('step'), count('view'), count('colab'), count('cover'), count('review')], [23, 15, 8, 6, 7]);
});

test('단계 실행 장면 이름표가 장면 정의의 kind와 같다', () => {
  for (const x of all) {
    if (x.kind === 'colab' || x.kind === 'cover' || x.kind === 'review') continue;
    assert.equal(STEP_SCENES.has(x.page.scene), getScene(x.page.scene).kind === 'step', `${x.at} (${x.page.scene})`);
  }
});

test('모든 쪽 — 장 3~8개, 모양이 맞고, 처음·끝 장이 정해진 종류다', () => {
  for (const x of all) {
    const { beats, at } = x;
    assert.ok(beats.length >= 3 && beats.length <= 8, `${at}: 장 ${beats.length}개`);
    assert.equal(new Set(beats.map((b) => b.id)).size, beats.length, `${at}: 장 id가 겹친다`);
    for (const b of beats) {
      assert.ok(KINDS.has(b.kind), `${at}: kind ${b.kind}`);
      assert.ok(typeof b.id === 'string' && b.id, `${at}: id`);
      assert.ok(typeof b.chip === 'string' && b.chip.length > 0, `${at}: chip`);
      assert.ok(Array.isArray(b.checks), `${at}: checks`);
      assert.ok(b.show === null || (Array.isArray(b.show) && b.show.length > 0), `${at}/${b.id}: show`);
      assert.equal(b.overlay, OVERLAY.has(b.kind), `${at}/${b.id}: overlay`);
      if (b.kind === 'work') assert.ok(b.checks.length >= 1, `${at}/${b.id}: 할 일 장에 미션이 없다`);
      if (b.kind === 'read' || (OVERLAY.has(b.kind) && b.kind !== 'check')) assert.deepEqual(b.checks, [], `${at}/${b.id}: 읽기 장은 미션을 맡지 않는다`);
    }
    assert.ok(beats.filter((b) => b.kind === 'read').length <= 4, `${at}: 읽기 장은 4개까지`);
    const first = beats[0];
    const last = beats.at(-1);
    if (x.kind === 'cover') {
      assert.deepEqual([first.kind, first.id], ['work', 'hook'], at);
      assert.equal(last.id, 'goals', at);
    } else if (x.kind === 'review') {
      assert.deepEqual([first.kind, first.id], ['read', 'summary'], at);
      assert.deepEqual([last.kind, last.id], ['read', 'end'], at);
    } else {
      assert.equal(first.kind, 'intro', at);
      assert.equal(last.kind, 'wrap', at);
    }
    if (x.kind === 'step') {
      assert.equal(beats[1].kind, 'code', `${at}: 둘째 장은 의사코드 읽기`);
      assert.ok(beats.some((b) => b.kind === 'work'), `${at}: 할 일 장이 없다`);
    } else {
      assert.ok(!beats.some((b) => b.kind === 'code'), `${at}: 읽기(의사코드) 장은 단계 실행 쪽에만`);
    }
  }
});

test('확인 장은 ask가 있는 쪽에만, 정리 바로 앞에 하나', () => {
  for (const { page, beats, at, kind } of all) {
    const ask = (page.missions ?? []).some((m) => m.check === 'ask');
    const checks = beats.filter((b) => b.kind === 'check');
    assert.equal(checks.length, ask ? 1 : 0, at);
    if (ask) {
      assert.deepEqual(checks[0].checks, ['ask'], at);
      assert.equal(beats.at(-2).kind, 'check', `${at}: 확인 장은 정리 바로 앞`);
    }
    if (kind === 'cover' || kind === 'review') assert.equal(ask, false, `${at}: 표지·정리에는 ask가 없다`);
  }
});

test('ask가 아닌 미션은 모두 꼭 한 장에만, 장 안에서는 미션 순서대로', () => {
  for (const { page, beats, at } of all) {
    const order = (page.missions ?? []).map((m) => m.check);
    for (const c of order.filter((c) => c !== 'ask')) {
      const owners = beats.filter((b) => b.checks.includes(c));
      assert.equal(owners.length, 1, `${at}: '${c}'를 맡은 장 ${owners.length}개`);
    }
    for (const b of beats) {
      for (const c of b.checks) assert.ok(order.includes(c), `${at}/${b.id}: 쪽에 없는 미션 '${c}'`);
      const idx = b.checks.map((c) => order.indexOf(c));
      assert.deepEqual(idx, [...idx].sort((p, q) => p - q), `${at}/${b.id}: 미션 순서`);
    }
  }
});

test('단계 실행 쪽 — 도입 · 읽기 · 미션마다 할 일 장 · 확인 · 정리, step:N은 장면 수 안에서', () => {
  for (const { page, beats, at, kind } of all.filter((x) => x.kind === 'step')) {
    assert.equal(kind, 'step');
    const ms = (page.missions ?? []).filter((m) => m.check !== 'ask');
    const work = beats.filter((b) => b.kind === 'work');
    assert.deepEqual(work.map((b) => b.checks), ms.map((m) => [m.check]), `${at}: 미션 하나에 할 일 장 하나`);
    work.forEach((b, i) => {
      assert.equal(b.show, null, `${at}: 단계 실행 할 일 장은 작업 화면 전체`);
      assert.equal(b.chip, ms[i].chip || defaultChip(ms[i].check), `${at}: 칩 이름`);
    });
    const frames = frameCount(page);
    assert.ok(frames > 1, `${at}: 장면 수를 셀 수 없다`);
    for (const b of work) {
      for (const c of b.checks.filter((c) => c.startsWith('step:'))) {
        assert.ok(Number(c.slice(5)) < frames, `${at}: '${c}' — 장면은 ${frames}장`);
      }
    }
  }
});

test('예: 2-2는 도입 · 읽기 · 장면 10까지 · 뒤로 보기 · 확인 · 정리', () => {
  const x = all.find((it) => it.tab.id === 'inspect' && it.page.id === 'count');
  assert.deepEqual(x.beats.map((b) => b.chip), ['도입', '읽기', '장면 10까지', '뒤로 보기', '확인', '정리']);
  assert.deepEqual(x.beats.map((b) => b.kind), ['intro', 'code', 'work', 'work', 'check', 'wrap']);
});

test('기본 칩 이름 (§1.3 표)', () => {
  assert.equal(defaultChip('step:9'), '장면 10까지');
  assert.equal(defaultChip('end'), '끝까지');
  assert.equal(defaultChip('back'), '뒤로 보기');
  assert.equal(defaultChip('python'), '파이썬 짝');
  assert.equal(defaultChip('colab'), 'Colab 열기');
  assert.equal(defaultChip('quiz'), '문제 풀기');
  assert.equal(defaultChip('right:3'), '3개 맞히기');
});

test('Colab·표지·정리 — 코드에 고정된 장 차례(§4.3)', () => {
  for (const { beats, at, kind, tab } of all) {
    const ids = beats.map((b) => b.id);
    if (kind === 'colab') {
      assert.deepEqual(ids.filter((id) => id !== 'check'), ['intro', 'open', 'follow', 'result', 'wrap'], at);
      assert.deepEqual(beats.find((b) => b.id === 'open'), { id: 'open', kind: 'work', chip: '열기', title: '📒 Colab에서 노트북 열기', checks: ['colab'], show: ['nb-open'], overlay: false });
      assert.deepEqual(beats.find((b) => b.id === 'follow').show, ['nb-follow'], at);
      assert.equal(beats.find((b) => b.id === 'follow').kind, 'read', at);
      assert.deepEqual(beats.find((b) => b.id === 'result').checks, ['act:nb-done'], at);
    }
    if (kind === 'cover') {
      assert.deepEqual(ids, tab.unit.before || tab.unit.after ? ['hook', 'flow', 'goals'] : ['hook', 'goals'], at);
      assert.deepEqual(beats.map((b) => b.show[0]), ids.map((id) => `cv-${id}`), at);
      assert.deepEqual(beats.map((b) => b.checks), ids.map((id) => ({ hook: ['act:hook'], flow: [], goals: ['act:begin'] })[id]), at);
      assert.equal(beats[0].title, `🤔 ${tab.unit.question}`, at);
      assert.equal(beats[0].lead, tab.unit.bigIdea, at);
    }
    if (kind === 'review') {
      assert.deepEqual(ids, ['summary', 'reveal', 'quiz', 'self', 'end'], at);
      assert.deepEqual(beats.map((b) => b.show[0]), ['rv-summary', 'rv-reveal', 'rv-quiz', 'rv-self', 'rv-end'], at);
      assert.deepEqual(beats.map((b) => b.kind), ['read', 'read', 'work', 'work', 'read'], at);
      assert.deepEqual(beats[2].checks, [`right:${tab.unit.quiz.length}`], at);
      assert.deepEqual(beats[3].checks, ['act:selfcheck'], at);
      assert.equal(beats[4].title, `🎉 ${tab.unit.no}단원 끝`, at);
    }
  }
});

test('살펴보기 쪽 — page.beats를 그대로 따르고, 없으면 장면 전체 할 일 장 하나', () => {
  for (const { page, beats, at } of all.filter((x) => x.kind === 'view')) {
    const middle = beats.filter((b) => b.kind === 'work' || b.kind === 'read');
    if (Array.isArray(page.beats) && page.beats.length) {
      assert.deepEqual(middle.map((b) => b.id), page.beats.map((b) => b.id), at);
      for (const b of middle) {
        const src = page.beats.find((s) => s.id === b.id);
        assert.equal(b.chip, src.chip, at);
        assert.deepEqual(b.show, src.show ?? null, at);
        assert.equal(b.kind, src.checks?.length ? 'work' : 'read', `${at}/${b.id}`);
        assert.ok(b.checks.length <= 2, `${at}/${b.id}: 한 장에 미션 2개까지`);
      }
    } else {
      assert.equal(middle.length, 1, at);
      assert.equal(middle[0].show, null, at);
    }
  }
  // 임시 차례(page.beats 없음)
  const page = { id: 'x', scene: 'someExplore', missions: [{ check: 'act:a' }, { check: 'act:b' }, { check: 'ask' }] };
  assert.deepEqual(pageBeats(null, null, page).map((b) => [b.kind, b.show, b.checks]),
    [['intro', null, []], ['work', null, ['act:a', 'act:b']], ['check', null, ['ask']], ['wrap', null, []]]);
  // page.beats — 미션 순서로 맞추고, ask는 빼고, 빠진 미션은 장면 전체 할 일 장으로 모은다
  const withBeats = {
    ...page,
    missions: [{ check: 'act:a' }, { check: 'act:b' }, { check: 'act:c' }, { check: 'ask' }],
    beats: [
      { id: 'one', chip: '하나', title: '첫 장', show: ['blk-1'], checks: [] },
      { id: 'two', chip: '둘', title: '둘째 장', lead: '이끄는 말', show: ['blk-1', 'blk-2'], checks: ['act:b', 'act:a', 'ask'] },
    ],
  };
  const got = pageBeats(null, null, withBeats);
  assert.deepEqual(got.map((b) => b.id), ['intro', 'one', 'two', 'rest', 'check', 'wrap']);
  assert.deepEqual(got[1], { id: 'one', kind: 'read', chip: '하나', title: '첫 장', checks: [], show: ['blk-1'], overlay: false });
  assert.deepEqual(got[2], { id: 'two', kind: 'work', chip: '둘', title: '둘째 장', lead: '이끄는 말', checks: ['act:a', 'act:b'], show: ['blk-1', 'blk-2'], overlay: false });
  assert.deepEqual(got[3].checks, ['act:c']);
});

test('sameView — 슬라이드가 아니고 보이는 덩어리가 같을 때만', () => {
  const b = (kind, show, overlay = false) => ({ id: 'x', kind, chip: 'x', checks: [], show, overlay });
  assert.equal(sameView(b('work', null), b('work', null)), true, '단계 실행 할 일 장끼리');
  assert.equal(sameView(b('work', ['a', 'b']), b('work', ['b', 'a'])), true, '순서는 상관없다');
  assert.equal(sameView(b('work', ['a']), b('work', ['a', 'b'])), false, '덩어리가 늘면 다른 화면');
  assert.equal(sameView(b('work', null), b('work', ['a'])), false);
  assert.equal(sameView(b('work', null), b('check', null, true)), false, '슬라이드는 늘 다른 화면');
  assert.equal(sameView(b('intro', null, true), b('intro', null, true)), false);
  const deck = all.find((it) => it.tab.id === 'inspect' && it.page.id === 'count').beats;
  assert.equal(sameView(deck[2], deck[3]), true, '2-2 장면 10까지 → 뒤로 보기');
});

test('firstWorkBeat · beatOfCheck', () => {
  const deck = all.find((it) => it.tab.id === 'inspect' && it.page.id === 'count').beats;
  assert.equal(firstWorkBeat(deck), 2);
  assert.equal(beatOfCheck(deck, 'back'), 3);
  assert.equal(beatOfCheck(deck, 'ask'), 4);
  assert.equal(beatOfCheck(deck, 'end'), -1);
  const review = all.find((it) => it.tab.id === 'inspect' && it.page.auto === 'review').beats;
  assert.equal(firstWorkBeat(review), 2);
  assert.equal(firstWorkBeat([{ kind: 'intro', overlay: true }, { kind: 'read', overlay: false }]), 1);
  assert.equal(firstWorkBeat([{ kind: 'intro', overlay: true }]), 0);
  for (const { beats, at } of all) assert.equal(beats[firstWorkBeat(beats)].kind, 'work', at);
});

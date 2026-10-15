/**
 * 학습 흐름 — 지금 쪽의 몇 번째 장에 있고, 지금 할 일이 무엇이며, [계속]/[이전]이 어디로 가는지.
 * 화면(DOM)을 모르는 제어기다. 위쪽 줄(장 칩)·지금 할 일 줄·무대가 모두 이것을 구독해 그린다.
 *
 *   const flow = createFlow({ store, progress, missions })
 *   flow.get()      → { tab, sub, page, key, beats, index, beat, todo, open, beatDone, pageDone,
 *                       isFirst, isLast, prevLabel, nextLabel, skip, pending }
 *   flow.subscribe(fn)   쪽·장이 바뀔 때, 진도가 바뀔 때, 저절로 넘김이 걸리거나 풀릴 때. 부르자마자 한 번 그린다
 *   flow.go(i)           이 쪽의 i번째 장으로(장 칩)
 *   flow.forward()       [계속 →] — 다음 장, 마지막 장이면 다음 쪽(그 쪽에 기억해 둔 장)
 *   flow.back()          [← 이전] — 앞 장, 첫 장이면 이전 쪽의 마지막 장
 *   flow.leave(patch)    다른 쪽으로 — 단원 표지를 떠나면 표지의 act:begin을 이룬다
 *
 * 지금 장은 쪽마다 store의 'beat:<쪽열쇠>'에 남는다(새로 고쳐도 그 자리로, §1.10).
 * 문제 넘기기(pager)는 지금 할 일 줄이 먼저 처리하고, 여기의 forward/back은 §1.5의 2·3단계만 맡는다.
 *
 * 저절로 넘김(§1.8): 지금 장의 미션을 다 하면, 다음 장이 같은 화면의 할 일 장일 때만 1.2초 뒤 넘어간다.
 * 그 사이에 학생이 어디로든 움직이면 취소한다. 시간 함수는 시험에서 바꿔 끼울 수 있다.
 */
import { TABS, unitPages, pageLabel, goPatch } from './lessons.js';
import { pageDone } from './missions.js';
import { pageBeats, sameView } from './beats.js';
import { nextPlace, prevPlace, beatKey, placeOf } from './nav.js';

/** 저절로 넘김까지 기다리는 시간(ms) */
export const AUTO_ADVANCE_MS = 1200;

/** 장 칩·단추에 쓰는 글자 */
export const LABELS = {
  start: '시작하기 →',
  resume: '이어서 하기 →',
  read: '계속 → 실행해 보기',
  next: '계속 →',
  skip: '건너뛰기 ↷',
};

const clamp = (i, len) => Math.max(0, Math.min(len - 1, Number(i) | 0));

/** 쪽 이름표 — '2-1', 표지·정리는 '2단원 표지'·'1단원 정리' */
function placeName({ tab, sub, page }) {
  const label = pageLabel(tab, sub, page);
  return page.auto ? `${tab.unit.no}단원 ${label}` : label;
}

/** 수업의 마지막 쪽(마지막 단원 정리) 다음 — 6-4 내 프로젝트 */
function finale() {
  const it = unitPages(TABS.at(-1)).filter((x) => !x.page.auto).at(-1);
  return it ? { it, patch: goPatch(it.tab.id, it.page.id, it.sub?.id) } : null;
}

export function createFlow({
  store, progress, missions,
  setTimeout: setT = (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: clearT = (id) => globalThis.clearTimeout(id),
  delay = AUTO_ADVANCE_MS,
} = {}) {
  const listeners = new Set();
  const deckCache = new Map();
  let timer = null;
  let pending = false;
  let lastSig = '';

  /* ── 지금 자리 ── */

  const beatsOf = (p) => {
    let beats = deckCache.get(p.key);
    if (!beats) { beats = pageBeats(p.tab, p.sub, p.page); deckCache.set(p.key, beats); }
    return beats;
  };
  const indexOf = (state, p, beats) => clamp(state[beatKey(p.key)] ?? 0, beats.length);
  const here = (state = store.get()) => {
    const p = placeOf(state);
    const beats = beatsOf(p);
    return { state, p, beats, index: indexOf(state, p, beats) };
  };
  const sigOf = (h) => `${h.p.key}#${h.index}`;

  /** 장 하나의 미션 — 미션 순서대로 { i, check, text, look, done } */
  function todoOf(p, b) {
    const done = progress.missionsDone(p.key);
    const out = [];
    (p.page.missions ?? []).forEach((m, i) => {
      if (b.checks.includes(m.check)) out.push({ i, check: m.check, text: m.text, look: m.look ?? null, done: Boolean(done[i]) });
    });
    return out;
  }
  const isDone = (p, b) => todoOf(p, b).every((t) => t.done);

  /** 단원 표지의 출발 — 마친 쪽이 있으면 아직 안 끝난 첫 쪽으로(이어서 하기), 아니면 다음 쪽으로 (unit.js begin과 같다) */
  function resumeTarget(p) {
    const list = unitPages(p.tab).filter((it) => it.page.auto !== 'cover');
    if (!list.some((it) => pageDone(progress, it.tab, it.sub, it.page))) return null;
    return list.find((it) => !pageDone(progress, it.tab, it.sub, it.page)) ?? null;
  }
  function beginPatch(state, p) {
    const todo = resumeTarget(p);
    return todo ? goPatch(p.tab.id, todo.page.id, todo.sub?.id) : nextPlace(state);
  }

  /* ── 글자 ── */

  function prevLabelOf(h) {
    if (h.index > 0) return `← ${h.beats[h.index - 1].chip}`;
    const patch = prevPlace(h.state);
    return patch ? `← ${placeName(placeOf({ ...h.state, ...patch }))}` : null;
  }

  function nextPageLabel(h) {
    const patch = nextPlace(h.state);
    if (!patch) { const f = finale(); return f && f.it.page !== h.p.page ? `🚀 ${f.it.label} 내 프로젝트로 →` : null; }
    const t = placeOf({ ...h.state, ...patch });
    if (t.tab.id !== h.p.tab.id) return `다음: ${t.tab.unit.no}단원 ${t.tab.icon} ${t.tab.label} →`;
    if (t.sub && t.sub.id !== h.p.sub?.id && t.sub.id !== 'review') return `다음: ${t.sub.icon ? `${t.sub.icon} ` : ''}${t.sub.name} →`;
    if (t.page.auto) return `다음 쪽: ${placeName(t)} →`;
    return `다음 쪽: ${[placeName(t), t.page.short].filter(Boolean).join(' ')} →`;
  }

  function nextLabelOf(h, beat, skip) {
    const last = h.index === h.beats.length - 1;
    if (h.p.page.auto === 'cover' && last) return resumeTarget(h.p) ? LABELS.resume : LABELS.start;
    if (skip) return LABELS.skip;
    if (!last) {
      if (beat.kind === 'intro') return LABELS.start;
      if (beat.kind === 'code') return LABELS.read;
      if (beat.kind === 'check') return `계속 → ${h.beats[h.index + 1].chip}`;
      return LABELS.next;
    }
    return nextPageLabel(h);
  }

  /* ── 읽기 ── */

  function get() {
    const h = here();
    const { p, beats, index } = h;
    const beat = beats[index];
    const todo = todoOf(p, beat);
    const first = todo.find((t) => !t.done);
    const open = first ? { i: first.i, check: first.check, text: first.text, look: first.look } : null;
    const beatDone = !open;
    const last = index === beats.length - 1;
    // 건너뛰기: 아직 안 끝난 할 일 장·확인 장. 표지의 act:begin은 [시작하기 →]를 누르는 것이 곧 할 일이다
    const skip = !beatDone && (beat.kind === 'work' || beat.kind === 'check') && !(p.page.auto === 'cover' && last);
    return {
      tab: p.tab, sub: p.sub, page: p.page, key: p.key,
      beats, index, beat, todo, open, beatDone,
      pageDone: pageDone(progress, p.tab, p.sub, p.page),
      isFirst: index === 0, isLast: last,
      prevLabel: prevLabelOf(h),
      nextLabel: nextLabelOf(h, beat, skip),
      skip, pending,
    };
  }

  function emit() {
    if (!listeners.size) return;
    const v = get();
    for (const fn of listeners) fn(v);
  }

  /* ── 저절로 넘김 ── */

  /** 걸려 있던 넘김을 푼다. 풀린 것이 있으면 true */
  function cancel() {
    if (timer !== null) { clearT(timer); timer = null; }
    if (!pending) return false;
    pending = false;
    return true;
  }

  /** from 장 뒤로 이어지는 같은 화면의 할 일 장 가운데 아직 안 끝난 첫 장(없으면 -1) */
  function nextSameView(h, from) {
    const beat = h.beats[from];
    for (let k = from + 1; k < h.beats.length; k += 1) {
      const b = h.beats[k];
      if (b.kind !== 'work' || !sameView(beat, b)) break;
      if (!isDone(h.p, b)) return k;
    }
    return -1;
  }

  /** 넘길 곳은 시간이 다 됐을 때 다시 찾는다 — 그사이 한꺼번에 이룬 미션(⏭ 여러 번)이 있으면 그 장을 건너뛴다 */
  function schedule(key, from) {
    cancel();
    pending = true;
    timer = setT(() => {
      timer = null;
      pending = false;
      const h = here();
      const to = h.p.key === key && h.index === from ? nextSameView(h, from) : -1;
      if (to >= 0) store.set({ [beatKey(key)]: to });
      else emit();
    }, delay);
    emit();
  }

  /** 지금 장의 미션을 마쳤을 때 — 장이 끝났고 다음이 같은 화면의 할 일 장이면 넘김을 건다 */
  function onComplete(ev) {
    const h = here();
    if (ev?.key !== h.p.key) return;
    const beat = h.beats[h.index];
    if (!beat.checks.includes(ev.mission?.check) || !isDone(h.p, beat)) return;
    if (nextSameView(h, h.index) >= 0) schedule(h.p.key, h.index);
  }

  /* ── 움직이기 ── */

  /** store를 고치고, 자리는 그대로인데 넘김만 풀렸으면 따로 알린다 */
  function apply(patch) {
    const was = cancel();
    const before = lastSig;
    if (patch) store.set(patch);
    if (was && lastSig === before) emit();
  }

  function go(i) {
    const h = here();
    apply({ [beatKey(h.p.key)]: clamp(i, h.beats.length) });
  }

  function leave(patch) {
    if (!patch) { apply(null); return; }
    const state = store.get();
    const cur = placeOf(state);
    const to = placeOf({ ...state, ...patch });
    if (cur.page.auto === 'cover' && to.key !== cur.key) missions?.act('begin');
    apply(patch);
  }

  function forward() {
    const h = here();
    if (h.index < h.beats.length - 1) { go(h.index + 1); return; }
    if (h.p.page.auto === 'cover') { leave(beginPatch(h.state, h.p)); return; }
    const patch = nextPlace(h.state);
    if (patch) { leave(patch); return; }
    const f = finale();
    if (f && f.it.page !== h.p.page) leave(f.patch);
  }

  function back() {
    const h = here();
    if (h.index > 0) { go(h.index - 1); return; }
    const patch = prevPlace(h.state);
    if (!patch) return;
    const t = placeOf({ ...h.state, ...patch });
    leave({ ...patch, [beatKey(t.key)]: beatsOf(t).length - 1 });
  }

  /* ── 구독 ── */

  const offs = [
    store.subscribe((state) => {
      const sig = sigOf(here(state));
      if (sig === lastSig) return;
      lastSig = sig;
      cancel();
      emit();
    }),
    progress.subscribe(() => emit()),
    missions?.onComplete(onComplete),
  ];

  return {
    get,
    subscribe(fn) { listeners.add(fn); fn(get()); return () => listeners.delete(fn); },
    go, forward, back, leave,
    /** 구독을 모두 푼다(시험·다시 붙이기용) */
    destroy() { cancel(); listeners.clear(); for (const off of offs) if (typeof off === 'function') off(); },
  };
}

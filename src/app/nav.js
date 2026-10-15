/**
 * 쪽 사이 이동 — 상태 조각(store.set에 넘길 patch)만 만든다. 화면(DOM)을 모른다.
 *
 *   nextPlace(state) / prevPlace(state)   다음·이전 쪽(하위 탭·단원을 넘어가며). 더 갈 곳이 없으면 null
 *   beatKey(pageKey)                      쪽마다 지금 장을 기억하는 store 열쇠 — 'beat:inspect:count'
 *   visitPatch(tabId, pageId, subId, at)  그 쪽의 어느 장으로 — 'work'(첫 할 일 장) · 'start' · 'last' · 번호.
 *                                         at을 주지 않으면 그 쪽에 기억해 둔 장(처음이면 0)
 */
import { TABS, currentLesson, goPatch } from './lessons.js';
import { pageKey } from './progress.js';
import { pageBeats, firstWorkBeat } from './beats.js';

export const beatKey = (key) => `beat:${key}`;

/** 다음 쪽 — 하위 탭의 끝이면 다음 하위 탭, 단원의 끝이면 다음 단원 */
export function nextPlace(state) {
  const { tab, sub, index, steps, key } = currentLesson(state);
  if (index < steps.length - 1) return { [key]: index + 1 };
  if (sub) {
    const subs = tab.sub;
    const si = subs.findIndex((x) => x.id === sub.id);
    if (si < subs.length - 1) return { mlTab: subs[si + 1].id, [`step:${tab.id}:${subs[si + 1].id}`]: 0 };
  }
  const ti = TABS.findIndex((t) => t.id === tab.id);
  if (ti < TABS.length - 1) {
    const nt = TABS[ti + 1];
    return nt.sub ? { tab: nt.id, mlTab: nt.sub[0].id, [`step:${nt.id}:${nt.sub[0].id}`]: 0 } : { tab: nt.id, [`step:${nt.id}`]: 0 };
  }
  return null;
}

/** 이전 쪽 — 하위 탭·단원의 처음이면 앞 하위 탭·앞 단원의 마지막 쪽 */
export function prevPlace(state) {
  const { tab, sub, index, key } = currentLesson(state);
  if (index > 0) return { [key]: index - 1 };
  if (sub) {
    const si = tab.sub.findIndex((x) => x.id === sub.id);
    if (si > 0) { const ps = tab.sub[si - 1]; return { mlTab: ps.id, [`step:${tab.id}:${ps.id}`]: ps.pages.length - 1 }; }
  }
  const ti = TABS.findIndex((t) => t.id === tab.id);
  if (ti > 0) {
    const pt = TABS[ti - 1];
    if (pt.sub) { const ls = pt.sub.at(-1); return { tab: pt.id, mlTab: ls.id, [`step:${pt.id}:${ls.id}`]: ls.pages.length - 1 }; }
    return { tab: pt.id, [`step:${pt.id}`]: pt.pages.length - 1 };
  }
  return null;
}

/** 상태(또는 patch를 더한 상태)가 가리키는 쪽 — { tab, sub, page, key } */
export function placeOf(state) {
  const { tab, sub, steps, index } = currentLesson(state);
  const page = steps[index];
  return { tab, sub, page, key: pageKey(tab.id, sub?.id, page.id) };
}

/**
 * 그 쪽으로 가는 patch — goPatch에 장 번호를 더한다.
 * "📖 그 쪽 다시 보기"·"다시 보기 →"·할 수 있어요 쪽 칩은 at = 'work'(그 쪽의 첫 할 일 장).
 */
export function visitPatch(tabId, pageId = null, subId = null, at = undefined) {
  const patch = goPatch(tabId, pageId, subId);
  if (at === undefined || at === null || !TABS.some((t) => t.id === tabId)) return patch;
  const { tab, sub, page, key } = placeOf(patch);
  const beats = pageBeats(tab, sub, page);
  let i;
  if (at === 'work') i = firstWorkBeat(beats);
  else if (at === 'start') i = 0;
  else if (at === 'last') i = beats.length - 1;
  else i = Math.max(0, Math.min(beats.length - 1, Number(at) | 0));
  patch[beatKey(key)] = i;
  return patch;
}

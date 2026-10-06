/**
 * 학습 진도 — 쪽마다 "미션을 했는지", 단원마다 "확인 문제를 몇 개 맞혔는지"를 브라우저에 저장한다.
 * (서버 없음. 같은 컴퓨터·같은 브라우저에서 이어서 볼 수 있다)
 *
 *   pages[쪽열쇠] = { visited: true, missions: { 0: true, 2: true } }
 *   quizzes[열쇠] = { [문제번호]: 고른 보기 }          — 쪽·단원 확인 문제
 *   hooks[탭]     = 고른 보기 번호                       — 단원 표지의 "생각 열기" 첫 생각
 *   last          = { tab, sub, page }                   — 이어서 하기
 */
const KEY = 'ai-data-lab:progress';

const empty = () => ({ pages: {}, quizzes: {}, hooks: {}, last: null });

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

/** 쪽 열쇠 — 'inspect:mask', 'ml:knn:step' */
export function pageKey(tabId, subId, pageId) {
  return subId ? `${tabId}:${subId}:${pageId}` : `${tabId}:${pageId}`;
}

export function createProgress() {
  let data = load();
  const listeners = new Set();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 저장하지 못해도 학습에는 지장이 없다 */ }
    for (const fn of listeners) fn(data);
  };
  const page = (key) => (data.pages[key] ??= { visited: false, missions: {} });

  return {
    get: () => data,
    subscribe(fn) { listeners.add(fn); fn(data); return () => listeners.delete(fn); },

    visit(key, where) {
      const p = page(key);
      const changed = !p.visited || JSON.stringify(data.last) !== JSON.stringify(where);
      p.visited = true;
      data.last = where;
      if (changed) save();
    },
    /** 미션 i를 마쳤다고 적는다. 처음 마친 것이면 true */
    complete(key, i) {
      const p = page(key);
      if (p.missions[i]) return false;
      p.missions[i] = true;
      save();
      return true;
    },
    missionsDone(key) { return data.pages[key]?.missions ?? {}; },
    visited(key) { return Boolean(data.pages[key]?.visited); },

    answer(quizKey, qi, choice) {
      (data.quizzes[quizKey] ??= {})[qi] = choice;
      save();
    },
    answers(quizKey) { return data.quizzes[quizKey] ?? {}; },

    setHook(tabId, choice) { data.hooks[tabId] = choice; save(); },
    hook(tabId) { return data.hooks[tabId] ?? null; },

    reset() { data = empty(); save(); },
  };
}

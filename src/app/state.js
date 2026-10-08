/**
 * 앱 상태 저장소 — 화면 부품은 상태를 직접 고치지 않고 set()만 부르며, 그리기는 구독으로 한다.
 * (알고리즘 로직과 화면을 나누는 규칙: 8-퍼즐 사이트와 같은 방식)
 */

const STORAGE_KEY = 'ai-data-lab:prefs';

/** 새로 고쳐도 남길 값 — "어디까지 봤나"와 보기 설정 */
const PERSIST_PREFIX = ['step:'];
/* codeView는 일부러 저장하지 않는다 — 새로 열면 늘 의사코드만(파이썬을 모르는 학생이 기본) */
const PERSISTED = ['tab', 'mlTab', 'speedId', 'theme', 'scale', 'lessonFold'];

const initial = {
  tab: 'start',          // 큰 탭: start · collect · inspect · prep · ready · ml · project
  mlTab: 'concept',      // 기계학습 하위 탭: concept · knn · tree · linreg · kmeans
  codeView: 'pseudo',    // 코드 패널: pseudo(의사코드만) | python(파이썬 나란히)
  speedId: 'normal',
  theme: 'auto',
  scale: 1,
  lessonFold: false,     // 레슨 막대의 목표·할 일을 접었나(좁은 화면에서 그림을 넓게)
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw);
    const out = {};
    for (const [key, value] of Object.entries(saved)) {
      if (PERSISTED.includes(key) || PERSIST_PREFIX.some((p) => key.startsWith(p))) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function savePrefs(state) {
  try {
    const out = {};
    for (const [key, value] of Object.entries(state)) {
      if (PERSISTED.includes(key) || PERSIST_PREFIX.some((p) => key.startsWith(p))) out[key] = value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* 저장하지 못해도 학습에는 지장이 없다 */
  }
}

export function createStore() {
  let state = { ...initial, ...loadPrefs() };
  const listeners = new Set();
  return {
    get() { return state; },
    set(patch) {
      let changed = false;
      for (const [key, value] of Object.entries(patch)) {
        if (state[key] !== value) { changed = true; break; }
      }
      if (!changed) return state;
      const prev = state;
      state = { ...state, ...patch };
      savePrefs(state);
      for (const fn of listeners) fn(state, prev);
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(state, state);
      return () => listeners.delete(fn);
    },
  };
}

export const SPEEDS = [
  { id: 'slow', name: '느리게', ms: 1600 },
  { id: 'normal', name: '보통', ms: 950 },
  { id: 'fast', name: '빠르게', ms: 420 },
];

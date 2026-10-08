/**
 * 수업 구성 — 상단 큰 탭 = 단원. 단원마다 쪽 묶음이 있고, 기계학습 단원은 하위 탭(알고리즘)으로 한 번 더 나뉜다.
 * 단원의 내용은 course/ 폴더에 단원 하나당 파일 하나로 적고, 이 파일은 그것을 모아 표지·정리 쪽을 붙인다.
 *
 * 원칙 (교과서의 "학습 목표 · 학습 요소 · 생각 열기 · 1분 요약"과 같은 틀)
 *  - 목표와 설명을 나눈다. 🎯 objective는 "~할 수 있다"로 끝나는 한 문장, 설명은 장면 속이나 💡 more에.
 *  - ✋ missions는 손으로 할 일 1~3개. 학생이 실제로 하면 스스로 ✅가 된다(missions.js). 막지는 않는다.
 *  - 단원마다 맨 앞에 표지(무엇을 할 수 있게 되나·쪽 목록·생각 열기), 맨 뒤에 정리(1분 요약·확인 문제)가 붙는다.
 *  - 단계 실행 쪽은 의사코드가 중심이고, 파이썬은 "같이 보기"와 Colab 실습 쪽에서만 꺼낸다.
 *
 * ── 단원(탭) ─────────────────────────────────────────────
 *  id, label, icon, verb('문제 찾기' — 탭과 표지에 붙는 동사), tip
 *  unit: {
 *    no,                 단원 번호(시작 = 0, 수집 = 1 … 프로젝트 = 6). 시작 화면의 6단계 흐름 번호와 같다.
 *    question,           생각 열기 — 단원 전체를 이끄는 질문 하나
 *    bigIdea,            이 단원의 핵심 아이디어 한 문장
 *    hook: { q, options, answer, reveal }   표지에서 내 생각을 먼저 골라 보는 질문(정답은 정리에서 확인)
 *    canDo: [{ text, pages: [쪽 id] }]       이 단원을 마치면 할 수 있는 것("~할 수 있다"). 쪽을 다 하면 ✓
 *                                          (기계학습은 'knn:idea'처럼 '하위탭:쪽id')
 *    before, after,      들어올 때 / 나갈 때 데이터의 모습(한 줄씩)
 *    note,               표지에 강조할 한마디(선택)
 *    minutes,            단원 전체 예상 시간(분)
 *    standards: [{ code, text }]           2022 개정 교육과정 성취기준
 *    summary: [문장 3~4개]                 1분 요약
 *    cheats: [{ idea, code }]              🐍 파이썬 한 줄 정리(프로젝트 때 다시 찾아보는 용도)
 *    quiz: [{ q, options, answer, why, page }]   단원 확인 문제 3개 — 틀리면 page로 다시 보러 간다
 *    cover: false / review: false          표지·정리를 붙이지 않을 때
 *  }
 *  pages: [쪽] 또는 sub: [{ id, name, tag('분류 · 지도학습'), question, pages }]
 *
 * ── 쪽 ───────────────────────────────────────────────────
 *  id, scene(장면 이름 — scenes/index.js, 'python:<노트북>'은 파이썬 실습), title
 *  short      단계 표시 줄에 쓰는 짧은 이름(6자 안팎)
 *  objective  🎯 이 쪽의 목표 — "~할 수 있다." 한 문장
 *  why        💡 왜 배우나 — 한 문장
 *  terms      학습 요소 — glossary.js의 term 그대로(0~3개)
 *  missions   ✋ [{ text, check }] — check 낱말은 missions.js 참고
 *  ask        ❓ { q, options, answer, why } — 확인 문제 1개(선택). 미션 끝에 저절로 붙는다
 *  more       자세한 설명(💡 안에 접혀 있다)
 *  minutes    예상 시간(분)
 *  level      'challenge'(🔥 도전) | 'optional'(➕ 더 알아보기) — 선택
 */
import START from './course/start.js';
import COLLECT from './course/collect.js';
import INSPECT from './course/inspect.js';
import PREP from './course/prep.js';
import READY from './course/ready.js';
import ML from './course/ml.js';
import PROJECT from './course/project.js';

const UNITS = [START, COLLECT, INSPECT, PREP, READY, ML, PROJECT];

/* ── 저절로 붙는 쪽: 표지 · 정리 · 확인 문제 미션 ── */

function coverPage(tab) {
  return {
    id: 'cover', scene: 'unitCover', auto: 'cover',
    title: `${tab.unit.no}단원 들어가기 — ${tab.label}: ${tab.verb}`,
    short: '표지',
    objective: '이 단원에서 무엇을 배우고, 끝나면 무엇을 할 수 있게 되는지 말할 수 있다.',
    why: '어디로 가는지 알고 출발하면, 쪽마다 무엇을 봐야 하는지 보여요.',
    terms: [],
    missions: [
      { text: '🤔 생각 열기 — 질문에 내 생각을 하나 골라 보기', check: 'act:hook' },
      { text: '📋 할 수 있어요 목록을 읽고 [시작하기 →]나 [다음 →]', check: 'act:begin' },
    ],
    minutes: 2,
  };
}

function reviewPage(tab) {
  return {
    id: 'review', scene: 'unitReview', auto: 'review',
    title: `${tab.unit.no}단원 정리 — ${tab.label}에서 배운 것`,
    short: '정리',
    objective: '이 단원의 목표를 스스로 점검하고, 확인 문제로 이해했는지 확인할 수 있다.',
    why: '배운 것을 내 말로 정리하고 문제로 확인해야 오래 기억에 남아요.',
    terms: [],
    missions: [
      { text: '✅ 할 수 있어요 점검표에 모두 표시하기', check: 'act:selfcheck' },
      { text: '❓ 단원 확인 문제 모두 풀기', check: 'quiz' },
    ],
    minutes: 5,
  };
}

function withAsk(page) {
  if (!page.ask || page.missions?.some((m) => m.check === 'ask')) return page;
  return { ...page, missions: [...(page.missions ?? []), { text: '❓ 확인 문제 맞히기', check: 'ask' }] };
}

function build(raw) {
  const tab = { ...raw };
  const cover = raw.unit.cover !== false;
  const review = raw.unit.review !== false;
  if (raw.sub) {
    const subs = raw.sub.map((s) => ({ ...s, pages: s.pages.map(withAsk) }));
    if (cover) subs[0] = { ...subs[0], pages: [coverPage(raw), ...subs[0].pages] };
    if (review) subs.push({ id: 'review', name: '단원 정리', tag: '', pages: [reviewPage(raw)] });
    tab.sub = subs;
  } else {
    tab.pages = [...(cover ? [coverPage(raw)] : []), ...raw.pages.map(withAsk), ...(review ? [reviewPage(raw)] : [])];
  }
  return tab;
}

/** 상단 탭(단원) 목록 */
export const TABS = UNITS.map(build);
export const ML_SUBTABS = TABS.find((t) => t.id === 'ml').sub;

function clamp(i, len) { return Math.max(0, Math.min(len - 1, i | 0)); }

/** 지금 탭에서 쓸 쪽 묶음 · 위치 · 저장 열쇠 */
export function currentLesson(state) {
  const tab = TABS.find((t) => t.id === state.tab) ?? TABS[0];
  if (tab.sub) {
    const sub = tab.sub.find((s) => s.id === state.mlTab) ?? tab.sub[0];
    const key = `step:${tab.id}:${sub.id}`;
    return { tab, sub, steps: sub.pages, index: clamp(state[key] ?? 0, sub.pages.length), key };
  }
  const key = `step:${tab.id}`;
  return { tab, sub: null, steps: tab.pages, index: clamp(state[key] ?? 0, tab.pages.length), key };
}

export function currentPage(state) {
  const { steps, index } = currentLesson(state);
  return steps[index];
}

/** 다른 곳으로 가는 상태 조각 — 정리 표·알고리즘 지도·목차에서 "그 쪽으로 가기"에 쓴다 */
export function goPatch(tabId, pageId = null, subId = null) {
  const patch = { tab: tabId };
  const tab = TABS.find((t) => t.id === tabId);
  if (!tab) return patch;
  if (tab.sub) {
    let sub = tab.sub.find((s) => s.id === subId);
    if (!sub && pageId) sub = tab.sub.find((s) => s.pages.some((p) => p.id === pageId));
    sub ??= tab.sub[0];
    patch.mlTab = sub.id;
    patch[`step:${tab.id}:${sub.id}`] = pageId ? Math.max(0, sub.pages.findIndex((p) => p.id === pageId)) : 0;
  } else {
    patch[`step:${tab.id}`] = pageId ? Math.max(0, tab.pages.findIndex((p) => p.id === pageId)) : 0;
  }
  return patch;
}

/** 단원 하나의 쪽을 차례대로 — [{ tab, sub, page, label }] */
export function unitPages(tab) {
  const list = tab.sub
    ? tab.sub.flatMap((s) => s.pages.map((page) => ({ tab, sub: s, page })))
    : tab.pages.map((page) => ({ tab, sub: null, page }));
  let n = 0;
  for (const it of list) {
    if (it.page.auto === 'cover') it.label = '표지';
    else if (it.page.auto === 'review') it.label = '정리';
    else { n += 1; it.label = `${tab.unit.no}-${n}`; }
  }
  return list;
}

/**
 * 단원 안의 쪽 찾기 — ref는 '쪽id' 또는 '하위탭:쪽id'(기계학습처럼 하위 탭마다 같은 id가 있을 때)
 * canDo.pages · quiz.page가 이 형식을 쓴다.
 */
export function findPage(tab, ref) {
  const [a, b] = ref.includes(':') ? ref.split(':') : [null, ref];
  return unitPages(tab).find((it) => it.page.id === b && (a === null || it.sub?.id === a)) ?? null;
}
export function refPatch(tab, ref) {
  const it = findPage(tab, ref);
  return it ? goPatch(tab.id, it.page.id, it.sub?.id) : goPatch(tab.id);
}

/** 쪽 번호표 — '2-3', '표지', '정리' */
export function pageLabel(tab, sub, page) {
  return unitPages(tab).find((it) => it.page === page || (it.page.id === page.id && (it.sub?.id ?? null) === (sub?.id ?? null)))?.label ?? '';
}

/** 목록에서 쪽 제목 앞에 붙이는 하위 탭 이름 — 제목이 이미 그 이름으로 시작하면('k-최근접 이웃 ① …') 붙이지 않는다 */
export function subPrefix(it, sep) {
  const sub = it.sub;
  if (!sub || sub.id === 'review' || it.page.auto || it.page.title.startsWith(sub.name)) return '';
  return sep === ' · ' ? `${sub.name}${sep}` : `[${sub.name}] `;
}

/** 쪽의 종류 — 단계 표시 줄의 배지 */
export function pageKind(page) {
  if (page.auto === 'cover') return { icon: '🧭', name: '단원 표지' };
  if (page.auto === 'review') return { icon: '📝', name: '단원 정리' };
  if (page.scene.startsWith('python:')) return { icon: '🐍', name: 'Colab 실습' };
  return null; // 단계 실행/탐험은 장면이 알려 준다(sceneHost)
}

/** 모든 쪽을 평평하게 (테스트·화면 점검용) */
export function allPages() {
  const out = [];
  for (const t of TABS) {
    if (t.sub) for (const s of t.sub) for (const p of s.pages) out.push({ tab: t.id, sub: s.id, ...p });
    else for (const p of t.pages) out.push({ tab: t.id, sub: null, ...p });
  }
  return out;
}

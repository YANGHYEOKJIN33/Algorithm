/**
 * 수업 구성 — 단원(맨 위 줄의 단원 번호 0~6)마다 쪽 묶음이 있고, 기계학습 단원은 하위 탭(알고리즘)으로 한 번 더 나뉜다.
 * 단원의 내용은 course/ 폴더에 단원 하나당 파일 하나로 적고, 이 파일은 그것을 모아 표지·정리 쪽을 붙인다.
 * 쪽은 다시 "장"으로 나뉘어 한 장에 한 가지만 보인다 — 장 차례는 beats.js가 만든다(FINAL_SPEC §1.3).
 *
 * 원칙 (교과서의 "학습 목표 · 학습 요소 · 생각 열기 · 1분 요약"과 같은 틀)
 *  - 목표와 설명을 나눈다. 🎯 objective는 "~할 수 있다"로 끝나는 한 문장, 설명은 장면 속이나 💡 more에.
 *  - ✋ missions는 손으로 할 일 1~3개. 학생이 실제로 하면 스스로 ✅가 된다(missions.js). 막지는 않는다.
 *    지금 할 일 줄에는 늘 미션 하나의 text만 나온다 — text는 단추 이모지로 시작하는 명령문으로 적는다.
 *  - 단원마다 맨 앞에 표지(생각 열기·데이터 변화·목표와 길), 맨 뒤에 정리(1분 요약·확인 문제)가 붙는다.
 *  - 단계 실행 쪽은 의사코드가 중심이고, 파이썬은 "같이 보기"와 Colab 실습 쪽에서만 꺼낸다.
 *
 * ── 단원 ─────────────────────────────────────────────────
 *  id, label, icon, verb('문제 찾기' — 단원 이름과 표지에 붙는 동사), tip
 *  unit: {
 *    no,                 단원 번호(시작 = 0, 수집 = 1 … 프로젝트 = 6). 시작 화면의 6단계 흐름 번호와 같다.
 *    question,           생각 열기 — 단원 전체를 이끄는 질문 하나
 *    bigIdea,            이 단원의 핵심 아이디어 한 문장
 *    hook: { q, options, answer, reveal }   표지에서 내 생각을 먼저 골라 보는 질문(정답은 정리에서 확인)
 *    canDo: [{ text, pages: [쪽 id] }]       이 단원을 마치면 할 수 있는 것("~할 수 있다"). 쪽을 다 하면 ✓
 *                                          (기계학습은 'knn:idea'처럼 '하위탭:쪽id')
 *    before, after,      들어올 때 / 나갈 때 데이터의 모습(한 줄씩). 둘 다 없으면 표지의 "데이터 변화" 장을 뺀다
 *    note,               표지에 강조할 한마디(선택)
 *    minutes             단원 전체 예상 시간(분) — 적지 않는다. 표지·정리를 포함한 쪽 시간의 합으로 저절로 채운다
 *    standards: [{ code, text }]           2022 개정 교육과정 성취기준(📚 목차 › 선생님용)
 *    summary: [문장 3~4개]                 1분 요약
 *    cheats: [{ idea, code }]              🐍 파이썬 한 줄 정리(프로젝트 때 다시 찾아보는 용도)
 *    quiz: [{ q, options, answer, why, page }]   단원 확인 문제 3~6개 — 틀리면 page로 다시 보러 간다
 *    cover: false / review: false          표지·정리를 붙이지 않을 때
 *  }
 *  pages: [쪽] 또는 sub: [{ id, name, icon?, tag('분류 · 지도학습'), question, pages }]
 *    sub.icon은 선택 — 있으면 하위 탭 끝의 [다음: 🌳 의사결정 트리 →]처럼 이름 앞에 붙는다
 *
 * ── 쪽 ───────────────────────────────────────────────────
 *  id, scene(장면 이름 — scenes/index.js, 'python:<노트북>'은 파이썬 실습), title
 *  short      쪽 이름표·목록·[다음 쪽: 2-3 위치 →]에 쓰는 짧은 이름(6자 안팎)
 *  objective  🎯 이 쪽의 목표 — "~할 수 있다." 한 문장
 *  why        💡 왜 배우나 — 한 문장
 *  takeaway   핵심 한 줄 — 정리 장에 크게 나오는 이 쪽의 핵심 메시지. 10~60자, 한 문장, "."으로 끝
 *             (표지·정리처럼 저절로 붙는 쪽 말고 모든 쪽)
 *  setup      📦 이 쪽에서 쓰는 데이터 — 단계 실행 쪽의 읽기 장에 나온다. 한 문장, 60자까지
 *             (예: '아델리펭귄 13마리의 몸무게만 골라 계산해요.')
 *  terms      학습 요소 — glossary.js의 term 그대로(0~3개)
 *  missions   ✋ [{ text, check, look?, chip? }] — check 낱말은 missions.js 참고
 *               look  👀 볼 곳 — 'step:N'·'end' 미션에는 꼭. 어디를 보면 되는지 명사구로 24자까지
 *                     (예: "개수표의 '부리길이' 줄")
 *               chip  장 칩 이름(8자까지) — 단계 실행 쪽의 'act:*' 미션에는 꼭(예: '실제 비율').
 *                     없으면 check로 정한다: step:N → '장면 N+1까지' · end → '끝까지' · back → '뒤로 보기'
 *                     · python → '파이썬 짝' · colab → 'Colab 열기' · quiz → '문제 풀기' · right:N → 'N개 맞히기'
 *  beats      살펴보기 쪽의 장 차례 — 살펴보기(view) 쪽에는 꼭. 도입·확인·정리는 저절로 붙으니 적지 않는다
 *             [{ id, chip(8자까지), title(28자까지), lead?(50자까지), show: [data-beat id] | null, checks: [check 낱말] }]
 *               show    이 장에서 보일 장면 덩어리(data-beat). null이면 장면 전체. 한 장에 3개까지
 *               checks  이 장이 맡는 미션 check(1~2개; 둘은 quiz+right:N, act:flow-open+act:flow-all 짝만).
 *                       비우면 읽기 장. ask가 아닌 미션은 모두 꼭 한 장에만 넣는다. 읽기 장은 4개까지
 *  ask        ❓ { q, options, answer, why } — 확인 문제 1개(선택). 미션 끝에 저절로 붙고, 정리 바로 앞의 확인 장이 된다
 *  more       자세한 설명(정리 장의 "💡 더 알아보기" 안에 접혀 있다)
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
    objective: '이 단원에서 무엇을 배우는지, 마치고 나면 무엇을 할 수 있는지 말할 수 있다.',
    why: '어디로 가는지 알고 출발해야 쪽마다 무엇을 눈여겨볼지 알 수 있어요.',
    terms: [],
    missions: [
      { text: '🤔 생각 열기 질문에 내 생각을 하나 골라 보기', check: 'act:hook' },
      { text: '🚀 [시작하기 →]를 눌러 첫 쪽으로 가기', check: 'act:begin' },
    ],
    minutes: 2,
  };
}

function reviewPage(tab) {
  return {
    id: 'review', scene: 'unitReview', auto: 'review',
    title: `${tab.unit.no}단원 정리 — ${tab.label}에서 배운 것`,
    short: '정리',
    objective: '이 단원의 목표를 스스로 점검하고, 확인 문제로 제대로 이해했는지 알아볼 수 있다.',
    why: '배운 것을 내 말로 정리하고 문제로 확인해 봐야 오래 기억에 남아요.',
    terms: [],
    missions: [
      { text: '✅ 할 수 있어요 점검표에 모두 표시하기', check: 'act:selfcheck' },
      { text: '❓ 단원 확인 문제 모두 맞히기 (틀리면 다시 보고 와요)', check: `right:${tab.unit.quiz?.length ?? 3}` },
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
    if (review) subs.push({ id: 'review', icon: '📝', name: '단원 정리', tag: '', pages: [reviewPage(raw)] });
    tab.sub = subs;
  } else {
    tab.pages = [...(cover ? [coverPage(raw)] : []), ...raw.pages.map(withAsk), ...(review ? [reviewPage(raw)] : [])];
  }
  const pages = tab.sub ? tab.sub.flatMap((s) => s.pages) : tab.pages;
  tab.unit = { ...raw.unit, minutes: pages.reduce((sum, p) => sum + (p.minutes ?? 0), 0) };
  return tab;
}

/** 단원 목록 */
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

/** 쪽의 수준 꼬리표 — 목록에서 미리 보이게 */
export function levelTag(page) {
  if (page.level === 'challenge') return '🔥 도전';
  if (page.level === 'optional') return '➕ 선택';
  return '';
}

/** 쪽의 종류 — 쪽 이름표·목록의 배지 */
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

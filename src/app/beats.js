/**
 * 장(beat) — 쪽 하나를 "한 장에 한 가지"로 나눈 차례. 단원 → 쪽 → 장 → 장면(재생기의 그림 한 장).
 * 화면(DOM)을 모르는 순수 함수만 둔다. 흐름 제어는 flow.js, 쪽 사이 이동은 nav.js.
 *
 *   Beat = { id, kind, chip, title?, lead?, checks, show, overlay }
 *     kind     'intro' 도입 · 'code' 읽기(의사코드) · 'read' 읽기 장 · 'work' 할 일 장 · 'check' ❓ 확인 · 'wrap' 정리
 *     chip     장 칩에 쓰는 짧은 이름(8자 안팎)
 *     checks   이 장이 맡은 미션 check 낱말(미션 순서). 'ask'는 check 장만 맡는다
 *     show     이 장에서 보이는 장면 덩어리(data-beat id). null이면 장면 전체
 *     overlay  도입·읽기·확인·정리처럼 slideCard가 장면 위에 그리는 장이면 true
 *
 * 쪽 종류별 차례(FINAL_SPEC §1.3)
 *   단계 실행  도입 → 읽기 → 미션마다 할 일 장(미션 순서) → 확인(ask가 있으면) → 정리
 *   살펴보기   도입 → page.beats(course 파일) → 확인 → 정리   (page.beats가 아직 없으면 할 일 장 하나로)
 *   Colab      도입 → 열기(colab) → 따라 하기(read) → 결과 확인(act:nb-done) → 확인 → 정리
 *   단원 표지  생각 열기(act:hook) → 데이터 변화(read, before/after가 없으면 뺀다) → 목표와 길(act:begin)
 *   단원 정리  요약 → 정답 공개 → 확인 문제(right:N) → 스스로 점검(act:selfcheck) → 단원 끝
 *
 * 장면 정의(scenes/index.js)는 화면 코드를 불러오므로 여기서 쓰지 않는다. 단계 실행 장면은 아래 이름표로 가린다
 * (test/beats.test.js가 장면 정의의 kind와 이 이름표가 같은지 확인한다).
 */

/** 단계 실행(kind: 'step') 장면 이름 — 새 단계 실행 장면을 만들면 여기에도 더한다 */
export const STEP_SCENES = new Set([
  'pseudoIntro', 'crawl', 'mask', 'count', 'where', 'quartile', 'box',
  'features', 'drop', 'dropna', 'fillmean', 'fillmode', 'replace', 'scale',
  'concat', 'merge', 'split', 'rl', 'knn', 'tree', 'linreg', 'kmeans', 'evaluate',
]);

const OVERLAY = new Set(['intro', 'code', 'check', 'wrap']);

/** 쪽의 차례 종류 — 'step' | 'view' | 'colab' | 'cover' | 'review' */
export function deckKind(page) {
  if (page.auto === 'cover' || page.scene === 'unitCover') return 'cover';
  if (page.auto === 'review' || page.scene === 'unitReview') return 'review';
  if (page.scene?.startsWith('python:')) return 'colab';
  return STEP_SCENES.has(page.scene) ? 'step' : 'view';
}

/** 단계 실행 할 일 장의 기본 칩 이름(미션의 chip이 있으면 그것을 쓴다) */
export function defaultChip(check) {
  if (check.startsWith('step:')) return `장면 ${Number(check.slice(5)) + 1}까지`;
  if (check.startsWith('right:')) return `${check.slice(6)}개 맞히기`;
  return { end: '끝까지', back: '뒤로 보기', python: '파이썬 짝', colab: 'Colab 열기', quiz: '문제 풀기' }[check] ?? '해 보기';
}

/* ── 장 만들기 ── */

function beat(id, kind, chip, { title, lead, checks = [], show = null } = {}) {
  const b = { id, kind, chip };
  if (title) b.title = title;
  if (lead) b.lead = lead;
  b.checks = [...checks];
  b.show = show ? [...show] : null;
  b.overlay = OVERLAY.has(kind);
  return b;
}

const introBeat = (page) => beat('intro', 'intro', '도입', { title: page.title });
const codeBeat = () => beat('code', 'code', '읽기', { title: '📝 이번에 따라갈 의사코드' });
const checkBeat = () => beat('check', 'check', '확인', { title: '❓ 확인 문제', checks: ['ask'] });
const wrapBeat = () => beat('wrap', 'wrap', '정리', { title: '✅ 정리' });

const missionsOf = (page) => page.missions ?? [];
const hasAsk = (page) => missionsOf(page).some((m) => m.check === 'ask');
/** 할 일 장이 맡을 check 낱말 — 미션 순서, ask 빼고, 겹치면 한 번만 */
const workChecks = (page) => [...new Set(missionsOf(page).map((m) => m.check).filter((c) => c && c !== 'ask'))];

/**
 * 어느 장에도 들지 못한 check를 장면 전체(show: null) 할 일 장 하나에 모은다.
 * 내용 파일이 덜 채워졌을 때도 미션이 빠지지 않게 하는 안전장치(check-course가 따로 알려 준다).
 */
function sweep(list, page, at = list.length) {
  const claimed = new Set(list.flatMap((b) => b.checks));
  const left = workChecks(page).filter((c) => !claimed.has(c));
  if (!left.length) return list;
  const out = [...list];
  out.splice(at, 0, beat('rest', 'work', '해 보기', { checks: left }));
  return out;
}

/**
 * 코드에 고정된 장 묶음(표지·정리·Colab) — owns(check)로 그 쪽 미션에서 맡을 낱말을 고른다.
 * 맡은 미션이 하나도 없으면 읽기 장이 된다.
 */
function fixedBeats(defs, page) {
  const claimed = new Set();
  return defs.map((d) => {
    const checks = workChecks(page).filter((c) => d.owns?.(c) && !claimed.has(c));
    checks.forEach((c) => claimed.add(c));
    return beat(d.id, checks.length ? 'work' : 'read', d.chip, { title: d.title, lead: d.lead, show: d.show, checks });
  });
}

/* ── 쪽 종류별 차례 ── */

function stepDeck(page) {
  const seen = new Map();
  const work = [];
  for (const m of missionsOf(page)) {
    if (!m.check || m.check === 'ask' || seen.has(m.check)) continue;
    seen.set(m.check, true);
    work.push(beat(m.check, 'work', m.chip || defaultChip(m.check), { checks: [m.check] }));
  }
  return [introBeat(page), codeBeat(), ...work, ...(hasAsk(page) ? [checkBeat()] : []), wrapBeat()];
}

function viewDeck(page) {
  const own = workChecks(page);
  let middle;
  if (Array.isArray(page.beats) && page.beats.length) {
    const claimed = new Set();
    middle = page.beats.map((b, i) => {
      const listed = new Set(b.checks ?? []);
      const checks = own.filter((c) => listed.has(c) && !claimed.has(c));
      checks.forEach((c) => claimed.add(c));
      return beat(b.id ?? `b${i}`, checks.length ? 'work' : 'read', b.chip ?? String(i + 1),
        { title: b.title, lead: b.lead, show: Array.isArray(b.show) ? b.show : null, checks });
    });
    middle = sweep(middle, page);
  } else {
    // page.beats를 쓰기 전의 임시 차례 — 장면 전체를 한 할 일 장에
    middle = own.length ? [beat('work', 'work', '해 보기', { checks: own })] : [];
  }
  return [introBeat(page), ...middle, ...(hasAsk(page) ? [checkBeat()] : []), wrapBeat()];
}

const COLAB = [
  { id: 'open', chip: '열기', title: '📒 Colab에서 노트북 열기', show: ['nb-open'], owns: (c) => c === 'colab' },
  { id: 'follow', chip: '따라 하기', title: '▶ 셀을 차례로 실행하며 따라 하기', show: ['nb-follow'] },
  { id: 'result', chip: '결과 확인', title: '🔍 내 결과 확인하기', show: ['nb-result'], owns: (c) => c === 'act:nb-done' },
];

function colabDeck(page) {
  const middle = sweep(fixedBeats(COLAB, page), page);
  return [introBeat(page), ...middle, ...(hasAsk(page) ? [checkBeat()] : []), wrapBeat()];
}

function coverDeck(tab, page) {
  const u = tab?.unit ?? {};
  const defs = [
    { id: 'hook', chip: '생각 열기', title: `🤔 ${u.question ?? tab?.label ?? page.title}`, lead: u.bigIdea, show: ['cv-hook'], owns: (c) => c === 'act:hook' },
    ...(u.before || u.after ? [{ id: 'flow', chip: '데이터 변화', title: '📦 데이터는 이렇게 바뀌어요', show: ['cv-flow'] }] : []),
    { id: 'goals', chip: '목표와 길', title: '🎯 이 단원을 마치면 할 수 있어요', show: ['cv-goals'], owns: (c) => c === 'act:begin' },
  ];
  const list = fixedBeats(defs, page);
  return sweep(list, page, list.length - 1);   // 목표와 길(act:begin)은 늘 맨 끝
}

function reviewDeck(tab, page) {
  const no = tab?.unit?.no;
  const defs = [
    { id: 'summary', chip: '요약', title: '⏱ 1분 요약', show: ['rv-summary'] },
    { id: 'reveal', chip: '정답 공개', title: '🤔 생각 열기 — 정답 공개', show: ['rv-reveal'] },
    { id: 'quiz', chip: '확인 문제', title: '❓ 단원 확인 문제', show: ['rv-quiz'], owns: (c) => c.startsWith('right:') || c === 'quiz' },
    { id: 'self', chip: '스스로 점검', title: '✅ 할 수 있어요? — 스스로 점검', show: ['rv-self'], owns: (c) => c === 'act:selfcheck' },
    { id: 'end', chip: '단원 끝', title: `🎉 ${no ?? ''}단원 끝`, show: ['rv-end'] },
  ];
  const list = fixedBeats(defs, page);
  return sweep(list, page, list.length - 1);   // 단원 끝은 늘 맨 끝
}

/* ── 밖에서 쓰는 함수 ── */

/** 쪽 하나의 장 차례(FINAL_SPEC §1.3·§4.3). 부를 때마다 새 배열을 돌려준다 */
export function pageBeats(tab, sub, page) {
  switch (deckKind(page)) {
    case 'cover': return coverDeck(tab, page);
    case 'review': return reviewDeck(tab, page);
    case 'colab': return colabDeck(page);
    case 'step': return stepDeck(page);
    default: return viewDeck(page);
  }
}

/**
 * 두 장이 같은 화면인가 — 둘 다 장면 위 슬라이드가 아니고, 보이는 덩어리가 같을 때
 * (단계 실행의 할 일 장끼리, 또는 show 목록이 같은 살펴보기 장끼리). 저절로 넘김(§1.8)에 쓴다.
 */
export function sameView(a, b) {
  if (!a || !b || a.overlay || b.overlay) return false;
  if (a.show === null || b.show === null) return a.show === b.show;
  const ids = new Set(a.show);
  return ids.size === new Set(b.show).size && b.show.every((id) => ids.has(id));
}

/** 첫 할 일 장 — "그 쪽 다시 보기"가 여는 곳. 할 일 장이 없으면 첫 슬라이드가 아닌 장, 그것도 없으면 0 */
export function firstWorkBeat(beats) {
  const w = beats.findIndex((b) => b.kind === 'work');
  if (w >= 0) return w;
  const r = beats.findIndex((b) => !b.overlay);
  return r >= 0 ? r : 0;
}

/** check 낱말을 맡은 장의 번호(없으면 -1) — 정리 슬라이드의 [다시 하기 →] */
export function beatOfCheck(beats, check) {
  return beats.findIndex((b) => b.checks.includes(check));
}

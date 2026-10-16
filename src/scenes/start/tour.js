/**
 * 🏁 0-3 화면 사용법 — "한 장에 한 가지" 화면을 장 네 개로 알려 준다(FINAL_SPEC §4.4·§4.5).
 *
 *   tour-top   맨 위 줄 — 지금 어디에 있나        모형 한 줄 + 부분마다 한 줄 풀이. 장에 들어오면 진짜 맨 위 줄이 반짝인다
 *   tour-now   맨 아래 지금 할 일 줄 — 할 일과 파란 단추   모형 + 풀이. 진짜 지금 할 일 줄이 반짝인다
 *   tour-run   실행 화면 읽는 법 — 번호 1~5        단계 실행 작업대 모형에 번호 다섯 개
 *                ① 의사코드 지금 줄 ② 방금 자막 ③ 그림 ④ 자료구조 ⑤ ⏭ 한 단계와 🚩
 *              번호를 누르면 풀이가 나온다. 아직 안 본 첫 번호에 data-act="tour-all"(보라 고리)
 *   tour-help  막히면 여기를 눌러요                📚 목차 · 📖 용어 · ⋯ 더 보기 · 🎯. 진짜 단추들이 반짝인다
 *
 * 모형은 그림 파일이 아니라 HTML 상자로 줄여 그린 것이다. 글은 실제 쪽(2-2 개수 세기 · 0-5 의사코드)에서 가져온다.
 * 반짝이기는 장면 손잡이의 onBeat(장이 바뀔 때 sceneHost가 부른다)에서 한다 — 새 무대 없이 붙여도 장면은 그대로 쓸 수 있다.
 *
 * 미션 신호: hooks.allSeen() — 번호 1~5를 모두 열어 봤다(미션 낱말은 start.js에 모아 둔다)
 */
import { el, fill } from '../../ui/dom.js';
import { TABS, unitPages } from '../../app/lessons.js';
import { pageBeats } from '../../app/beats.js';
import * as BASICS from '../../core/basics.js';
import { ensureStartStyle } from './style.js';

/** 실행 화면 모형의 번호 다섯 — 이름 · 풀이 */
export const SPOTS = [
  { name: '의사코드의 지금 줄',
    text: '지금 실행하는 줄이 파랗게 바뀌고 ▶가 붙어요. 그 줄의 설명도 펼쳐져요. 📝|🐍 단추를 누르면 같은 일을 하는 파이썬 코드도 함께 볼 수 있어요.' },
  { name: '방금 자막',
    text: '방금 무슨 일이 일어났는지 한 줄로 알려 줘요. 이건 할 일이 아니라 "방금 한 일"이에요. 할 일은 맨 아래 지금 할 일 줄에만 나와요.' },
  { name: '그림',
    text: '의사코드를 한 줄 실행할 때마다 표나 그래프가 어떻게 바뀌는지 보여 줘요. 파란 테두리가 지금 보고 있는 곳이에요.' },
  { name: '자료구조',
    text: '변수·리스트·사전 같은 상자에 지금 어떤 값이 들어 있는지 보여 줘요. ←로 새 값을 넣으면 상자 속 값이 바뀌어요.' },
  { name: '⏭ 한 단계와 🚩',
    text: '⏭ 한 단계를 누를 때마다 의사코드가 한 줄씩 실행돼요(되풀이하는 곳은 한 묶음씩). 🚩 눈금은 할 일까지 몇 번 더 누르면 되는지 알려 줘요. ⏮ 뒤로는 앞 장면, ▶ 재생은 저절로 넘기기, ⏩ 끝까지는 마지막 장면이에요.' },
];

/** 장에 들어오면 반짝일 진짜 화면 부분 — 장 id → 선택자(보이는 것만) */
export const FLASH = {
  top: ['#topnav .tn-where', '#topnav .tn-beatsbox'],
  now: ['#nowbar .nowbar__main', '#nowbar .nowbar__fwd'],
  help: ['#topnav .tn-course', '#topnav .tn-gloss', '#topnav .tn-more'],
};

const FLASH_MS = 1600;
const visible = (node) => Boolean(node && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');

/** 모형에 쓸 실제 쪽 — 단계 실행 쪽 2-2(개수 세기). 없으면 첫 단계 실행 쪽 */
function samplePlace() {
  const tab = TABS.find((t) => t.id === 'inspect') ?? TABS[1];
  const list = unitPages(tab);
  const it = list.find((x) => x.page.id === 'count') ?? list.find((x) => !x.page.auto) ?? list[0];
  return { tab, it, beats: pageBeats(tab, it.sub, it.page) };
}

const ICON = { intro: '🎯', code: '📝', read: '📖', check: '❓', wrap: '✅', work: '⏭' };

/** 풀이 한 줄 — [모형 조각] 설명 */
const row = (part, ...text) => el('li.tour-legend__row', {}, el('span.tour-legend__part', {}, part), el('span.tour-legend__text', {}, ...text));

/* ── ① 맨 위 줄 ── */

function topBlock({ tab, it, beats }, reflash) {
  const cur = beats.findIndex((b) => b.kind === 'work');
  const dots = TABS.map((t) => el(`span.tm-dot${t.unit.no < tab.unit.no ? '.is-done' : t === tab ? '.is-on' : ''}`, { 'aria-hidden': 'true' }));
  const chips = beats.map((b, i) => el(`span.tm-bchip${i < cur ? '.is-done' : i === cur ? '.is-on' : ''}`, {},
    i < cur ? '✓' : i === cur ? `${ICON[b.kind] ?? ''} ${b.chip}` : b.kind === 'check' ? '?' : String(i + 1)));
  const bar = el('div.tm-bar.tm-bar--top', { role: 'img', 'aria-label': '맨 위 줄 모형' },
    el('span.tm-chip', {}, '📚 목차'),
    el('span.tm-chip.tm-chip--pill', {}, el('span.tm-dots', {}, dots), ` ${tab.unit.no}단원 ${tab.icon} ${tab.label} ▾`),
    el('span.tm-muted', {}, '›'),
    el('span.tm-chip.tm-chip--pill', {}, el('b', {}, it.label), ` ${it.page.short ?? it.page.title} ▾`),
    el('span.tm-chip', {}, '🎯'),
    el('span.tm-bchips', {}, chips),
    el('span.tm-chip', {}, '📖 용어'),
    el('span.tm-chip', {}, '⋯'));
  return el('section.tour-part', { 'data-beat': 'tour-top' },
    el('p.tour-part__cap', {}, `예: ${it.label} 쪽의 셋째 장에 있을 때`),
    bar,
    el('ul.tour-legend', {},
      row(el('span.tm-chip.tm-chip--pill', {}, el('span.tm-dots', {}, dots.slice(0, 4).map((d) => d.cloneNode())), ' 단원 ▾'),
        '지금 몇 단원인지 알려 줘요. 점 7개는 0~6단원이고, 고리가 있는 점이 지금 단원이에요. ▾를 누르면 다른 단원으로 가요.'),
      row(el('span.tm-chip.tm-chip--pill', {}, el('b', {}, it.label), ' 쪽 ▾'),
        '지금 쪽의 번호와 제목이에요. ▾를 누르면 같은 단원의 다른 쪽으로 가요.'),
      row(el('span.tm-chip', {}, '🎯'), '이 쪽의 목표와 자세한 설명을 언제든 다시 볼 수 있어요.'),
      row(el('span.tm-bchips', {}, el('span.tm-bchip.is-done', {}, '✓'), el('span.tm-bchip.is-on', {}, '⏭ 장'), el('span.tm-bchip', {}, '?')),
        el('b', {}, '장 칩'), '이에요. 한 쪽은 도입·할 일·확인 문제·정리 같은 여러 장으로 나뉘고, 무대에는 한 번에 한 장만 나와요. ✓는 끝낸 장, 파란 칩은 지금 장, ?는 확인 문제예요. 칩을 누르면 그 장으로 가요.')),
    el('p.tour-part__flash', {}, '✨ 지금 화면의 진짜 맨 위 줄이 잠깐 반짝였어요. ',
      el('button.pill.pill--sm', { type: 'button', onclick: () => reflash('top') }, '다시 반짝이기')));
}

/* ── ② 맨 아래 지금 할 일 줄 ── */

function nowBlock({ it }, reflash) {
  const m = (it.page.missions ?? []).find((x) => x.check?.startsWith('step:')) ?? { text: '⏭ 한 단계씩 눌러 보기' };
  const total = (it.page.missions ?? []).length;
  const bar = el('div.tm-bar.tm-bar--now', { role: 'img', 'aria-label': '지금 할 일 줄 모형' },
    el('span.tm-chip', {}, '← 읽기'),
    el('div.tm-now', {},
      el('div.tm-now__line1', {},
        el('span.tm-now__label', {}, `✋ 지금 할 일 1/${total || 1}`),
        el('span.tm-muted', {}, ' 🚩 3번 더'),
        m.look ? el('span.tm-muted', {}, ` · 👀 ${m.look}`) : null),
      el('div.tm-now__say', {}, m.text)),
    el('span.tm-chip.tm-chip--ghost', {}, '건너뛰기 ↷'),
    el('span.tm-chip.tm-chip--blue.tm-chip--ring', {}, '계속 →'));
  return el('section.tour-part', { 'data-beat': 'tour-now' },
    el('p.tour-part__cap', {}, '예: 단계 실행 쪽의 할 일 장'),
    bar,
    el('ul.tour-legend', {},
      row(el('span.tm-now__label', {}, '✋ 지금 할 일'),
        '지금 할 일은 ', el('b', {}, '맨 아래 지금 할 일 줄'), '에만 한 번에 하나씩 나와요. 다른 곳은 읽기만 하면 돼요.'),
      row(el('span.tm-chip.tm-chip--ring', {}, '보라 고리'),
        el('b', {}, '보라 고리'), '가 둘러싼 곳이 지금 누를 곳이에요. 그림 안이면 "👆 여기를 눌러요" 꼬리표가 붙어요.'),
      row(el('span.tm-chip.tm-chip--blue', {}, '계속 →'),
        el('b', {}, '파란 단추'), '는 언제나 하나뿐이에요. 할 일을 해내면 "✅ 잘했어요!"가 나오고 [계속 →]이 파랗게 바뀌어요.'),
      row(el('span.tm-chip.tm-chip--ghost', {}, '건너뛰기 ↷'),
        '어려우면 넘어가도 괜찮아요. 못 한 할 일은 ☐로 남고, 정리 장의 [다시 하기 →]로 언제든 돌아올 수 있어요.'),
      row(el('span.tm-chip', {}, '← 이전'), '앞 장으로 돌아가요. 첫 장에서는 앞 쪽으로 가요.')),
    el('p.tour-part__flash', {}, '✨ 지금 화면의 진짜 지금 할 일 줄이 잠깐 반짝였어요. ',
      el('button.pill.pill--sm', { type: 'button', onclick: () => reflash('now') }, '다시 반짝이기')));
}

/* ── ③ 실행 화면 — 번호 1~5 ── */

function runBlock(hooks) {
  const seen = new Set();
  let pick = -1;
  const regions = [];
  const badges = [];
  const explain = el('div.tour__explain', { 'aria-live': 'polite' });
  const count = el('p.tour__count');

  const frames = BASICS.maxFrames();
  const frame = frames[5];          // '최고'가 처음 바뀐 장면
  const cur = frame.items.find((x) => x.id === frame.focus);

  function region(i, cls, ...children) {
    const badge = el('button.tm-badge', { type: 'button', title: `${i + 1}번 ${SPOTS[i].name}`, 'aria-label': `${i + 1}번 ${SPOTS[i].name} 풀이 보기`, onclick: () => open(i) }, String(i + 1));
    badges[i] = badge;
    const node = el(`div.tm-r${cls ? `.${cls}` : ''}`, { onclick: (e) => { if (e.target === node) open(i); } }, badge, ...children);
    regions[i] = node;
    return node;
  }

  const mock = el('div.tm.tm--run', { role: 'img', 'aria-label': '단계 실행 쪽의 화면 모형' },
    el('span.tm-cap', {}, '단계 실행 쪽 (0-5 의사코드 읽는 법)'),
    el('div.tm-work', {},
      region(0, 'tm-code',
        el('div.tm-panelhead', {}, '의사코드 ', el('span.tm-chip.tm-chip--soft', {}, '📝|🐍')),
        BASICS.PSEUDO.map((p, i) => el(`div.tm-code__line${i + 1 === frame.line ? '.is-on' : ''}`, {}, `${i + 1 === frame.line ? '▶' : ' '}${i + 1} ${p.code}`))),
      region(1, 'tm-say', el('span.tm-say__tag', {}, '방금'), el('span.tm-say__text', {}, `${frame.icon ?? ''} ${frame.say}`)),
      region(2, 'tm-stage',
        el('div.tm-panelhead', {}, '그림 ', el('span.tm-muted', {}, '— 펭귄 줄')),
        el('div.tm-pengs', {}, frame.items.map((p) => el(`div.tm-peng${p.id === frame.focus ? '.is-on' : ''}${p.id === frame.bestId ? '.is-best' : ''}`, {},
          p.id === frame.bestId ? el('span.tm-peng__crown', {}, '👑') : null, '🐧', el('div', {}, `${p.w}g`))))),
      region(3, 'tm-data',
        el('div.tm-panelhead', {}, '자료구조 ', el('span.tm-muted', {}, '— 변수(상자)')),
        el('div.tm-vars', {},
          el('span.tm-var.is-hot', {}, '최고 ', el('b', {}, `${frame.best}g`)),
          el('span.tm-var', {}, 'p ', el('b', {}, cur ? `${cur.w}g` : '—'))))),
    region(4, 'tm-player',
      el('span.tm-muted', {}, '✋ 지금 할 일 1/4 '),
      el('span.tm-meter', {}, '🚩 2번 더 ', el('span.tm-meter__track', {}, el('span'))),
      el('span.tm-player__btns', {},
        ['⏹', '⏮ 뒤로', '▶ 재생', '⏩ 끝까지'].map((b) => el('span.tm-btn', {}, b)),
        el('span.tm-muted', {}, ` 6 / ${frames.length} `),
        el('span.tm-btn.tm-btn--main', {}, '⏭ 한 단계'))));

  function open(i) {
    pick = i;
    const before = seen.size;
    seen.add(i);
    draw();
    if (window.matchMedia?.('(max-width: 900px)').matches) explain.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (seen.size === SPOTS.length && before < SPOTS.length) hooks.allSeen?.();
  }

  function draw() {
    const next = SPOTS.findIndex((_, i) => !seen.has(i));
    regions.forEach((r, i) => r.classList.toggle('is-pick', i === pick));
    badges.forEach((b, i) => {
      b.setAttribute('data-seen', seen.has(i) ? 'true' : 'false');
      b.setAttribute('aria-pressed', String(i === pick));
      // 보라 고리 — 아직 안 본 첫 번호(다 보면 없다)
      if (i === next) b.setAttribute('data-act', 'tour-all'); else b.removeAttribute('data-act');
    });
    if (pick < 0) {
      fill(explain,
        el('h3', {}, '번호 1~5'),
        el('p', {}, '단계 실행 쪽을 줄여 그린 모형이에요. 번호마다 화면의 한 부분이 무슨 일을 하는지 풀이가 나와요.'));
    } else {
      const sp = SPOTS[pick];
      fill(explain,
        el('h3', {}, el('span.tour__num', {}, String(pick + 1)), sp.name),
        el('p', {}, sp.text));
    }
    count.textContent = seen.size === SPOTS.length ? `🎉 ${SPOTS.length}곳을 모두 살펴봤어요!` : `살펴본 곳 ${seen.size} / ${SPOTS.length}`;
    count.dataset.all = String(seen.size === SPOTS.length);
  }

  draw();
  return el('section.tour-run', { 'data-beat': 'tour-run' }, mock, el('aside.tour__side', {}, explain, count));
}

/* ── ④ 막히면 ── */

function helpBlock(reflash) {
  const card = (icon, title, ...text) => el('div.tour-help__card', {}, el('span.tour-help__icon', { 'aria-hidden': 'true' }, icon), el('div', {}, el('h4', {}, title), el('p', {}, ...text)));
  return el('section.tour-part', { 'data-beat': 'tour-help' },
    el('div.tour-help', {},
      card('📚', '목차 (맨 위 줄 왼쪽)', '모든 단원과 쪽, 내 진도가 나와요. [▶ 이어서 하기]를 누르면 하던 곳으로 바로 가요.'),
      card('📖', '용어 (맨 위 줄 오른쪽)', '모르는 낱말이 나오면 용어 사전에서 찾아봐요. 글 속의 점선 낱말을 눌러도 뜻이 나와요.'),
      card('⋯', '더 보기', '가−·가＋ 글자 크기, 🌗 밝은/어두운 화면, ⏱ 재생 속도, ⌨ 단축키, ❔ 화면 사용법(이 쪽), 📋 내 학습 기록 복사가 들어 있어요.'),
      card('🎯', '이 쪽의 목표', '무엇을 하는 쪽인지 헷갈리면 🎯을 눌러 목표와 자세한 설명을 다시 봐요.'),
      card('⌨️', '키보드', 'Enter는 파란 단추, PageDown은 다음 장, PageUp은 앞 장이에요. 단계 실행 쪽에서는 →가 ⏭ 한 단계, ←가 ⏮ 뒤로, Space가 ▶ 재생이에요.'),
      card('🙋', '그래도 막히면', '[건너뛰기 ↷]로 넘어가고 정리 장의 [다시 하기 →]로 돌아와도 돼요. 선생님께 묻는 것도 좋아요.')),
    el('p.tour-part__flash', {}, '✨ 지금 화면의 진짜 📚 · 📖 · ⋯ 단추가 잠깐 반짝였어요. ',
      el('button.pill.pill--sm', { type: 'button', onclick: () => reflash('help') }, '다시 반짝이기')));
}

export function screenTour(root, ctx, hooks = {}) {
  ensureStartStyle();
  const timers = new Set();
  const flashed = new Set();

  /** 진짜 화면 부분 반짝이기 — 보라색 테두리 약 1.6초 */
  function flash(id) {
    const nodes = (FLASH[id] ?? []).flatMap((sel) => [...document.querySelectorAll(sel)]).filter(visible);
    for (const n of nodes) {
      n.classList.remove('tour-flash');
      void n.offsetWidth;          // 같은 곳을 다시 반짝여도 처음부터
      n.classList.add('tour-flash');
      flashed.add(n);
      const t = setTimeout(() => { n.classList.remove('tour-flash'); timers.delete(t); }, FLASH_MS);
      timers.add(t);
    }
    return nodes.length > 0;
  }

  const place = samplePlace();
  fill(root, el('div.read.tour', {},
    topBlock(place, flash),
    nowBlock(place, flash),
    runBlock(hooks),
    helpBlock(flash)));

  return {
    onBeat(beat) {
      if (!FLASH[beat?.id]) return;
      // 장의 덩어리가 보인 다음 반짝이게 — 한 틀 기다린다
      const t = setTimeout(() => { timers.delete(t); flash(beat.id); }, 250);
      timers.add(t);
    },
    destroy() {
      for (const t of timers) clearTimeout(t);
      for (const n of flashed) n.classList.remove('tour-flash');
    },
  };
}

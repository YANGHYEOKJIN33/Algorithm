/**
 * 🏁 0-3 화면 사용법 — 단계 실행 쪽 하나를 HTML 상자로 줄여 그린 모형(그림 파일 아님)에 ①~⑩ 번호를 붙인다.
 *   번호를 누르면: 모형의 그 부분이 주황 테두리로 강조 · 오른쪽에 1~2문장 설명
 *                  · 지금 화면에 진짜 그 부분이 있으면(맨 위 탭·레슨 막대·할 일 …) 약 1.5초 반짝인다.
 *   모형의 글은 실제 0-5 쪽(의사코드 읽는 법)의 목표·할 일·의사코드를 그대로 가져와 쓴다.
 *
 * 미션 신호: hooks.allSeen() — ①~⑩을 모두 열어 봤다 (미션 낱말은 start.js에 모아 둔다)
 */
import { el, fill } from '../../ui/dom.js';
import { TABS } from '../../app/lessons.js';
import * as BASICS from '../../core/basics.js';
import { ensureStartStyle } from './style.js';

const NUM = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

/** 번호마다: 이름 · 설명 · 진짜 화면에서 반짝일 곳 */
const SPOTS = [
  { name: '단원 탭', real: ['#topbar .modetabs'],
    text: '맨 위 탭이 수업 순서예요. 번호(0~6)·단원 이름·할 일(동사)이 적혀 있고, 아래 초록 막대가 그 단원의 진도예요.' },
  { name: '단원 칩 · 쪽 단계 표시 줄', real: ['#lessonbar .unitchip', '#lessonbar .stepper'],
    text: '지금 단원과 그 단원의 쪽들이에요. 마친 쪽은 번호가 ✓로 바뀌고, 누르면 그 쪽으로 가요. 오른쪽 [다음 →]으로 넘겨요.' },
  { name: '🎯 목표 · 학습 요소 · 💡 왜', real: ['#lessonbar .lesson__main'],
    text: '🎯 목표는 이 쪽을 마치면 할 수 있는 것이에요. 학습 요소를 누르면 용어 뜻이, 💡 왜 배울까?를 누르면 자세한 설명이 나와요.' },
  { name: '✋ 할 일', real: ['#lessonbar .missions'],
    text: '이 쪽에서 직접 해 볼 일이에요. 하면 저절로 ✅가 되고, 모두 하면 [다음 →]이 반짝여요.' },
  { name: '❓ 확인 문제', real: ['#lessonbar .askbtn'],
    text: '할 일 맨 아래의 주황 단추예요. 눌러서 문제를 풀고, 맞히면 ✅가 돼요. 틀려도 다시 고를 수 있어요.' },
  { name: '실행 제어', real: ['#controlbar'],
    text: '⏭ 한 단계가 주인공 단추예요. 누를 때마다 의사코드가 한 줄씩(같은 일이 많이 되풀이되는 곳은 한 묶음씩) 실행되고, 아래 초록 띠가 방금 한 일을 말해 줘요. ⏮ 뒤로는 되돌아보기, ▶ 재생은 저절로 넘기기예요.' },
  { name: '의사코드', real: ['#panel-code'],
    text: '지금 실행 중인 줄이 파랗게 바뀌고 그 줄의 설명이 펼쳐져요. 🐍 파이썬 같이 보기는 같은 일을 하는 파이썬을, 📒 Colab은 실습 노트북을 열어요. (좁은 화면에서는 그림·자료구조 아래에 있어요)' },
  { name: '그림', real: ['#panel-stage'],
    text: '의사코드가 한 줄 실행될 때마다 표·그래프가 바뀌는 모습이에요. 파란 테두리가 지금 보고 있는 곳이에요.' },
  { name: '자료구조', real: ['#panel-data'],
    text: '변수·리스트·사전 같은 상자에 지금 어떤 값이 들어 있는지 보여 줘요. ←로 새 값을 넣으면 상자 속 값이 바뀌어요.' },
  { name: '📚 목차 · 📖 용어 · 가＋/가− · 🌗', real: ['#topbar .topbar__tools'],
    text: '📚 목차는 모든 단원의 목표와 내 진도, 📖 용어는 용어 사전이에요. 가＋/가−로 글자 크기를, 🌗로 밝은·어두운 화면을 바꿔요.' },
];

const visible = (node) => Boolean(node && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden');

/** 모형에 쓸 실제 쪽 — 시작 단원의 0-5 의사코드 읽는 법 */
function samplePage() {
  const tab = TABS.find((t) => t.id === 'start');
  const pages = tab.pages.filter((p) => !p.auto);
  const i = pages.findIndex((p) => p.id === 'pseudo');
  return { tab, page: pages[i], no: i + 1, pages };
}

export function screenTour(root, ctx, hooks = {}) {
  ensureStartStyle();
  const seen = new Set();
  let pick = -1;
  const timers = new Set();
  const flashed = new Set();
  const regions = [];
  const badges = [];

  const explain = el('div.tour__explain', { 'aria-live': 'polite' });
  const list = el('ol.tour__list');
  const count = el('p.tour__count');

  function region(i, cls, ...children) {
    const badge = el('button.tm-badge', { type: 'button', title: `${NUM[i]} ${SPOTS[i].name}`, 'aria-label': `${i + 1}번 ${SPOTS[i].name} 설명 보기`, onclick: () => open(i) }, String(i + 1));
    badges[i] = badge;
    const node = el(`div.tm-r${cls ? `.${cls}` : ''}`, {}, badge, ...children);
    regions[i] = node;
    return node;
  }

  /* ── 모형 ── */
  const { tab, page, no, pages } = samplePage();
  const units = TABS;
  const frames = BASICS.maxFrames();
  const frame = frames[5];          // '최고'가 처음 바뀐 장면
  const tabs = el('div.tm-tabs', {}, units.map((t, i) => el(`span.tm-tab${t.id === 'start' ? '.is-on' : ''}`, { style: `--p:${[1, 0.6, 0.3, 0, 0, 0, 0][i] ?? 0}` },
    `${t.unit.no} ${t.icon} ${t.label}`, el('small', {}, t.verb || ' '))));
  const mock = el('div.tm', { role: 'img', 'aria-label': '단계 실행 쪽의 화면 모형' },
    el('span.tm-cap', {}, '단계 실행 쪽의 모습 (0-5 의사코드 읽는 법)'),
    el('div.tm-row', {},
      region(0, 'tm-grow', tabs),
      region(9, '', el('div.tm-tools', {}, ['📚 목차', '📖 용어', '가−', '가＋', '🌗'].map((x) => el('span.tm-chip', {}, x))))),
    region(1, '', el('div.tm-head', {},
      el('span.tm-chip.tm-chip--soft', {}, `시작 ${tab.icon} ${tab.label} — ${tab.verb}`),
      el('span.tm-steps', {}, pages.map((p, i) => el(`span.tm-chip${i + 1 === no ? '.tm-chip--blue' : i + 1 < no ? '.tm-chip--done' : ''}`, {},
        i + 1 < no ? '✓' : `0-${i + 1}`, i + 1 === no ? ` ${p.short}` : ''))),
      el('span.tm-chip', {}, '← 이전'), el('span.tm-chip.tm-chip--blue', {}, '다음 →'))),
    el('div.tm-lesson', {},
      region(2, '',
        el('div.tm-line.tm-title', {}, `0-${no} ${page.title}`),
        el('div.tm-line.tm-goal', {}, el('b', {}, '🎯 목표 '), page.objective),
        el('div.tm-line', {}, el('span.tm-muted', {}, '학습 요소 '), (page.terms ?? []).map((t) => [el('span.tm-chip.tm-chip--term', {}, `📖 ${t}`), ' ']),
          el('span.tm-chip', {}, '💡 왜 배울까?'))),
      region(3, 'tm-miss',
        el('div.tm-line', {}, el('b', {}, '✋ 할 일'), el('span.tm-muted', {}, ` 1/${page.missions.length}`)),
        page.missions.filter((m) => m.check !== 'ask').slice(0, 2).map((m, i) => el('div.tm-line', {}, i === 0 ? '✅ ' : '☐ ', m.text)),
        region(4, '', el('div.tm-line', {}, '☐ ', el('span.tm-chip.tm-chip--ask', {}, '❓ 확인 문제 맞히기'))))),
    region(5, 'tm-ctrl',
      ['⏹ 처음으로', '⏮ 뒤로'].map((b) => el('span.tm-btn', {}, b)),
      el('span.tm-btn.tm-btn--main', {}, '⏭ 한 단계'),
      ['▶ 재생', '⏩ 끝까지'].map((b) => el('span.tm-btn', {}, b)),
      el('span.tm-muted', {}, ` 6 / ${frames.length}`),
      el('div.tm-say.tm-line', {}, `${frame.icon} ${frame.say}`)),
    el('div.tm-work', {},
      region(6, 'tm-code',
        el('div.tm-panelhead', {}, '의사코드 ', el('span.tm-chip.tm-chip--blue', {}, '📝 의사코드'), el('span.tm-chip', {}, '🐍 파이썬 같이 보기'), el('span.tm-chip.tm-chip--ask', {}, '📒 Colab')),
        BASICS.PSEUDO.map((p, i) => el(`div.tm-code__line${i + 1 === frame.line ? '.is-on' : ''}`, {}, `${i + 1} ${p.code}`))),
      region(7, '',
        el('div.tm-panelhead', {}, '그림 ', el('span.tm-muted', {}, '— 펭귄 줄')),
        el('div.tm-pengs', {}, frame.items.map((p) => el(`div.tm-peng${p.id === frame.focus ? '.is-on' : ''}${p.id === frame.bestId ? '.is-best' : ''}`, {},
          p.id === frame.bestId ? el('span.tm-peng__crown', {}, '👑') : null, '🐧', el('div', {}, `${p.w}g`))))),
      region(8, '',
        el('div.tm-panelhead', {}, '자료구조 ', el('span.tm-muted', {}, '— 변수(상자)')),
        el('div.tm-vars', {},
          el('span.tm-var.is-hot', {}, '최고 ', el('b', {}, `${frame.best}g`)),
          el('span.tm-var', {}, 'p ', el('b', {}, `${frame.items.find((x) => x.id === frame.focus).w}g`))))));

  /* ── 진짜 화면 반짝이기 ── */
  function flash(i) {
    const nodes = SPOTS[i].real.flatMap((sel) => [...document.querySelectorAll(sel)]).filter(visible);
    for (const n of nodes) {
      n.classList.remove('tour-flash');
      void n.offsetWidth;          // 같은 곳을 다시 눌러도 처음부터 반짝이게
      n.classList.add('tour-flash');
      flashed.add(n);
      const t = setTimeout(() => { n.classList.remove('tour-flash'); timers.delete(t); }, 1500);
      timers.add(t);
    }
    return nodes.length > 0;
  }

  function open(i) {
    pick = i;
    const before = seen.size;
    seen.add(i);
    const shown = flash(i);
    draw();
    // 좁은 화면(세로 1열)에서는 설명 칸이 아래에 있어 눌러도 안 보인다 → 설명 칸까지 내려 준다
    if (window.matchMedia('(max-width: 900px)').matches) explain.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (seen.size === SPOTS.length && before < SPOTS.length) hooks.allSeen?.();
    return shown;
  }

  function draw() {
    regions.forEach((r, i) => r.classList.toggle('is-pick', i === pick));
    badges.forEach((b, i) => b.setAttribute('data-seen', seen.has(i) ? 'true' : 'false'));
    if (pick < 0) {
      fill(explain,
        el('h3', {}, '👆 번호를 눌러 보세요'),
        el('p', {}, '이 그림은 단계 실행 쪽을 줄여 그린 모형이에요. 1번부터 차례로 누르면 각 부분이 무슨 일을 하는지 알려 줘요.'),
        el('p.tour__flash', {}, '✨ 지금 화면에도 있는 부분(맨 위 탭·목표·할 일 …)은 진짜 화면에서 잠깐 반짝여요.'));
    } else {
      const sp = SPOTS[pick];
      const real = SPOTS[pick].real.some((sel) => [...document.querySelectorAll(sel)].some(visible));
      fill(explain,
        el('h3', {}, el('span.tour__num', {}, String(pick + 1)), sp.name),
        el('p', {}, sp.text),
        el('p.tour__flash', {}, real
          ? '✨ 지금 화면에서 진짜 그 부분이 주황 테두리로 반짝였어요.'
          : ['👣 이 부분은 단계 실행 쪽에서만 보여요. ', el('button.pill.pill--sm', { type: 'button', onclick: () => ctx.go('start', 'pseudo') }, '0-5 의사코드 쪽에서 보기 →')]));
    }
    fill(list, SPOTS.map((sp, i) => el('li', {}, el('button.tour__item', {
      type: 'button', 'aria-pressed': String(i === pick), 'data-seen': seen.has(i) ? 'true' : null, onclick: () => open(i),
    }, el('span.tour__num', {}, seen.has(i) ? '✓' : String(i + 1)), el('span', {}, sp.name)))));
    count.textContent = seen.size === SPOTS.length ? `🎉 ${SPOTS.length}곳을 모두 살펴봤어요!` : `살펴본 곳 ${seen.size} / ${SPOTS.length}`;
    count.dataset.all = String(seen.size === SPOTS.length);
  }

  fill(root, el('div.tour', {},
    mock,
    el('aside.tour__side', {}, explain, list, count)));
  draw();
  return {
    destroy() {
      for (const t of timers) clearTimeout(t);
      for (const n of flashed) n.classList.remove('tour-flash');
    },
  };
}

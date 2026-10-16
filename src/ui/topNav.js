/**
 * 맨 위 줄(48px) — "지금 어디에 있나"만 보여 주는 한 줄(FINAL_SPEC §3.1).
 *
 *   [📚 목차] [●●◉○○○○ 2단원 🔍 가공 ▾] › [2-2 결측치 ② 몇 개인지 세기 ▾] [🎯]   ✓─✓─[⏭ 장면 10까지]─4─?─6   [📖 용어] [⋯]
 *
 *  · 단원 알약: 0~6단원 여정 점 7개(장식, 다 한 단원은 채움 · 지금 단원은 고리) + 지금 단원. ▾ = 단원 고르기(진도 막대)
 *  · 쪽 알약: 쪽 번호와 제목(360px까지, 넘치면 …). ▾ = 이 단원의 쪽(기계학습은 하위 탭마다 묶음)
 *  · 🎯: 이 쪽의 목표 · 💡 왜 · 학습 요소 · 💡 더 알아보기
 *  · 장 칩: 장마다 하나. 한 장 ✓(초록) · 지금 장(파랑, 아이콘 + 이름) · 남은 장(번호, 확인 장은 ?). 누르면 그 장으로
 *  · ⋯: 가− 가＋ · 🌗 테마 · ⏱ 재생 속도(단계 실행 쪽) · ⌨ 단축키 · ❔ 화면 사용법(0-3) · 📋 학습 기록 복사 · ℹ 정보
 *  · 휴대폰(700px 이하): [📚] [2-2 ▾] [장 3/6 ▾] [⋯] — 📖 용어와 🎯 목표는 ⋯ 안으로
 *
 * 무엇도 잠그지 않는다 — 장 칩·▾·📚은 언제나 눌린다(교사가 학급을 이끌 수 있게, §1.6).
 * 쪽을 옮길 때는 flow.leave(patch)를 쓴다(단원 표지를 떠나면 표지의 출발 미션을 이룬다).
 */
import { el, fill } from './dom.js';
import { TABS, unitPages, goPatch, levelTag, pageLabel } from '../app/lessons.js';
import { pageDone, unitProgress } from '../app/missions.js';
import { deckKind, pageBeats } from '../app/beats.js';
import { visitPatch } from '../app/nav.js';
import { SPEEDS } from '../app/state.js';
import { PRACTICE_URL, REPO_URL, BRANCH } from '../app/links.js';
import { recordButton } from './recordCopy.js';

const KIND = {
  step: { icon: '👣', name: '단계 실행' },
  view: { icon: '🔎', name: '살펴보기' },
  colab: { icon: '🐍', name: 'Colab 실습' },
  cover: { icon: '🧭', name: '단원 표지' },
  review: { icon: '📝', name: '단원 정리' },
};
export const kindOf = (page) => KIND[deckKind(page)];

/** 장 칩의 아이콘 */
export function beatIcon(b) {
  if (b.kind === 'intro') return '🎯';
  if (b.kind === 'code') return '📝';
  if (b.kind === 'check') return '❓';
  if (b.kind === 'wrap') return '✅';
  if (b.kind === 'read') return '📖';
  const c = b.checks[0] ?? '';
  if (c.startsWith('step:')) return '⏭';
  if (c.startsWith('right:') || c === 'quiz') return '✏️';
  return {
    end: '⏩', back: '⏮', python: '🐍', colab: '📒',
    'act:hook': '🤔', 'act:begin': '🚀', 'act:selfcheck': '✅', 'act:nb-done': '🔍',
  }[c] ?? '✋';
}

const SCALE_MIN = 0.85;
const SCALE_MAX = 1.6;
const THEMES = ['auto', 'light', 'dark'];
const THEME_NAME = { auto: '🌗 테마: 자동', light: '☀ 테마: 밝게', dark: '🌙 테마: 어둡게' };

const KEYS = [
  ['PageDown / PageUp', '다음 / 이전 (발표용 리모컨도 돼요)'],
  ['Enter', '파란 단추 누르기'],
  ['→ / ←', '계속 / 이전 — 단계 실행에서는 ⏭ 한 단계 / ⏮ 뒤로'],
  ['Space', '▶ 재생 / ⏸ 멈춤 (단계 실행)'],
  ['Home / End', '⏹ 처음으로 / ⏩ 끝까지 (단계 실행)'],
  ['Esc', '열린 창 닫기'],
];

export function mountTopNav(root, { store, flow, progress, glossary, course } = {}) {
  const leave = (patch) => (flow ? flow.leave(patch) : store.set(patch));

  /* ── 펼침 창(▾ 메뉴·🎯·⋯) — 한 번에 하나만 ── */
  let openPop = null;

  function makePop(button, { label, build, align = 'left', cls = '' }) {
    const pop = el(`div.tn-pop${cls ? `.${cls}` : ''}`, { role: 'dialog', 'aria-label': label, hidden: true });
    document.body.append(pop);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    const me = {
      pop, button,
      open(anchor = button) {
        closePop();
        fill(pop, build());
        pop.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        openPop = me;
        position(anchor);
        const first = pop.querySelector('[aria-current="true"], [aria-current="page"], [aria-current="step"]')
          ?? pop.querySelector('button:not(:disabled), a[href], summary, input');
        first?.focus({ preventScroll: true });
        first?.scrollIntoView?.({ block: 'nearest' });
      },
      close(focusBack = false) {
        if (pop.hidden) return;
        pop.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        if (openPop === me) openPop = null;
        if (focusBack) button.focus();
      },
      refresh() { if (!pop.hidden) { fill(pop, build()); } },
    };
    function position(anchor) {
      const r = anchor.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      pop.style.top = `${Math.round(r.bottom + 6)}px`;
      pop.style.maxHeight = `${Math.max(160, window.innerHeight - r.bottom - 18)}px`;
      const w = pop.offsetWidth;
      let left = align === 'right' ? r.right - w : r.left;
      left = Math.max(8, Math.min(vw - w - 8, left));
      pop.style.left = `${Math.round(left)}px`;
    }
    button.addEventListener('click', () => (pop.hidden ? me.open() : me.close()));
    pop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); me.close(true); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (e.target.matches?.('input, select, textarea')) return;
      const items = [...pop.querySelectorAll('button:not(:disabled), a[href], summary')].filter((n) => n.getClientRects().length);
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? items[(i + 1) % items.length] : items[(i - 1 + items.length) % items.length];
      next.focus();
    });
    return me;
  }
  function closePop(focusBack = false) { openPop?.close(focusBack); }
  document.addEventListener('pointerdown', (e) => {
    if (!openPop) return;
    if (openPop.pop.contains(e.target) || openPop.button.contains(e.target)) return;
    closePop();
  }, true);
  window.addEventListener('resize', () => closePop());
  /** 창 안에서 다른 쪽·장으로 갈 때 */
  const pick = (fn) => () => { closePop(); fn(); };

  /* ── 📚 목차 ── */
  const courseBtn = el('button.tn-btn.tn-course', { type: 'button', title: '📚 목차 — 모든 단원의 쪽과 내 진도', 'aria-label': '📚 목차', onclick: () => { closePop(); course?.open(); } },
    el('span.tn-ico', { 'aria-hidden': 'true' }, '📚'), el('span.tn-txt', {}, ' 목차'));

  /* ── 단원 알약 ── */
  const dots = el('span.tn-track', { 'aria-hidden': 'true' }, TABS.map(() => el('span.tn-dot')));
  const unitText = el('span.tn-unit__text');
  const unitBtn = el('button.tn-pill.tn-unit', { type: 'button' }, dots, unitText, el('span.tn-caret', { 'aria-hidden': 'true' }, '▾'));
  const unitPop = makePop(unitBtn, {
    label: '단원 고르기',
    cls: 'tn-pop--units',
    build: () => {
      const v = flow.get();
      return [
        el('p.tn-pop__title', {}, '단원 고르기'),
        el('ul.tn-list', {}, TABS.map((t) => {
          const pr = unitProgress(progress, t);
          const here = t.id === v.tab.id;
          return el('li', {}, el(`button.tn-item.tn-unitrow${here ? '.is-here' : ''}`, {
            type: 'button', 'aria-current': here ? 'true' : null,
            'data-done': pr.total && pr.done === pr.total ? 'true' : null,
            onclick: pick(() => leave({ tab: t.id })),
          },
          el('span.tn-unitrow__no', {}, String(t.unit.no)),
          el('span.tn-unitrow__name', {}, `${t.icon} ${t.label}`, t.verb ? el('small', {}, ` — ${t.verb}`) : null),
          el('span.tn-meter', { style: `--p:${pr.total ? pr.done / pr.total : 0}`, 'aria-hidden': 'true' }, el('span')),
          el('span.tn-unitrow__cnt', {}, `${pr.done}/${pr.total}`)));
        })),
        el('p.tn-pop__note', {}, '단원을 고르면 그 단원에서 보던 쪽이 열려요.'),
      ];
    },
  });

  /* ── 쪽 알약 ── */
  const pageNo = el('span.tn-page__no');
  const pageTitle = el('span.tn-page__title');
  const pageBtn = el('button.tn-pill.tn-page', { type: 'button' }, pageNo, pageTitle, el('span.tn-caret', { 'aria-hidden': 'true' }, '▾'));
  function pageRow(it, v) {
    const ok = pageDone(progress, it.tab, it.sub, it.page);
    const here = it.page === v.page;
    const k = kindOf(it.page);
    const lv = levelTag(it.page);
    return el('li', {}, el(`button.tn-item.tn-pagerow${here ? '.is-here' : ''}`, {
      type: 'button', 'aria-current': here ? 'page' : null, 'data-done': ok ? 'true' : null,
      title: `${it.label} ${it.page.title}${ok ? ' ✓' : ''}`,
      onclick: pick(() => leave(goPatch(it.tab.id, it.page.id, it.sub?.id))),
    },
    el('span.tn-pagerow__no', {}, it.label),
    el('span.tn-pagerow__name', {},
      el('strong', {}, it.page.short || it.page.title),
      it.page.short && !it.page.auto ? el('small', {}, it.page.title) : null),
    el('span.tn-pagerow__meta', {}, lv ? `${lv} ` : '', el('span', { title: k.name }, k.icon), ok ? el('span.tn-ok', { 'aria-label': '다 했어요' }, ' ✓') : null)));
  }
  const pagePop = makePop(pageBtn, {
    label: '이 단원의 쪽',
    cls: 'tn-pop--pages',
    build: () => {
      const v = flow.get();
      const list = unitPages(v.tab);
      const head = el('p.tn-pop__title', {}, `${v.tab.unit.no}단원 ${v.tab.icon} ${v.tab.label} — 쪽 고르기`);
      if (!v.tab.sub) return [head, el('ul.tn-list', {}, list.map((it) => pageRow(it, v)))];
      // 기계학습: 하위 탭마다 묶음
      return [head, v.tab.sub.map((s) => {
        const items = list.filter((it) => it.sub?.id === s.id);
        const pr = unitProgress(progress, v.tab, s.id);
        return el('section.tn-group', {},
          el('h3.tn-group__title', {}, `${s.icon ? `${s.icon} ` : ''}${s.name}`, el('small', {}, ` ${pr.done}/${pr.total}`)),
          el('ul.tn-list', {}, items.map((it) => pageRow(it, v))));
      })];
    },
  });

  /* ── 🎯 이 쪽의 목표 ── */
  const goalBtn = el('button.tn-btn.tn-goal', { type: 'button', title: '🎯 이 쪽의 목표 · 왜 배우나 · 학습 요소', 'aria-label': '🎯 이 쪽의 목표' }, '🎯');
  function goalContent() {
    const v = flow.get();
    const page = v.page;
    const k = kindOf(page);
    const label = pageLabel(v.tab, v.sub, page);
    const lv = levelTag(page);
    return [
      el('p.tn-goal__kicker', {}, `${v.tab.unit.no}단원 ${v.tab.icon} ${v.tab.label} · ${label} · ${k.icon} ${k.name}`,
        page.minutes ? ` · 약 ${page.minutes}분` : '', lv ? ` · ${lv}` : ''),
      el('h3.tn-goal__title', {}, page.title),
      page.objective ? el('p.tn-goal__obj', {}, el('strong', {}, '🎯 이 쪽을 마치면: '), page.objective) : null,
      page.why ? el('p.tn-goal__why', {}, `💡 ${page.why}`) : null,
      page.terms?.length ? el('div.tn-goal__terms', {}, el('span.tn-goal__label', {}, '학습 요소'),
        page.terms.map((t) => el('button.tn-term', { type: 'button', title: `📖 용어 사전에서 '${t}' 보기`, onclick: () => { closePop(); glossary?.open(t); } }, `📖 ${t}`))) : null,
      page.more ? el('details.tn-goal__more', {}, el('summary', {}, '💡 더 알아보기'), el('p', {}, page.more)) : null,
    ];
  }
  const goalPop = makePop(goalBtn, { label: '이 쪽의 목표', cls: 'tn-pop--goal', build: goalContent });

  /* ── 장 칩 ── */
  const beatList = el('ol.tn-beats', { 'aria-label': '이 쪽의 장' });
  const beatsMenuBtn = el('button.tn-pill.tn-beatsbtn', { type: 'button' });
  const beatsPop = makePop(beatsMenuBtn, {
    label: '이 쪽의 장',
    cls: 'tn-pop--beats',
    build: () => {
      const v = flow.get();
      return [
        el('p.tn-pop__title', {}, '이 쪽의 장'),
        el('ul.tn-list', {}, v.beats.map((b, i) => {
          const st = beatState(v, i);
          return el('li', {}, el(`button.tn-item.tn-beatrow${st === 'current' ? '.is-here' : ''}`, {
            type: 'button', 'aria-current': st === 'current' ? 'step' : null, 'data-state': st,
            onclick: pick(() => flow.go(i)),
          }, el('span.tn-beatrow__no', {}, st === 'done' ? '✓' : String(i + 1)), `${beatIcon(b)} ${b.chip}`));
        })),
      ];
    },
  });

  /** 장의 상태 — 'current' | 'done' | 'todo'. 할 일·확인 장은 미션이 다 ✅이면, 나머지 장은 지나온 장이면 ✓ */
  function beatState(v, i) {
    if (i === v.index) return 'current';
    const b = v.beats[i];
    if (b.checks.length) {
      const done = progress.missionsDone(v.key);
      const ms = v.page.missions ?? [];
      const mine = ms.map((m, mi) => [m, mi]).filter(([m]) => b.checks.includes(m.check));
      return mine.length && mine.every(([, mi]) => done[mi]) ? 'done' : 'todo';
    }
    return i < v.index ? 'done' : 'todo';
  }

  function drawBeats(v) {
    fill(beatList, v.beats.map((b, i) => {
      const st = beatState(v, i);
      const isCheck = b.kind === 'check';
      let face;
      if (st === 'current') face = [el('span.tn-chip__ico', { 'aria-hidden': 'true' }, beatIcon(b)), el('span.tn-chip__name', {}, b.chip)];
      else if (st === 'done') face = '✓';
      else face = isCheck ? '?' : String(i + 1);
      const state = st === 'done' ? ' (했어요)' : st === 'current' ? ' (지금)' : '';
      return el('li', {}, el('button.tn-chip', {
        type: 'button', 'data-state': st, 'data-kind': b.kind,
        'aria-current': st === 'current' ? 'step' : null,
        'aria-label': `${i + 1}번째 장: ${b.chip}${state}`,
        title: `${i + 1}. ${beatIcon(b)} ${b.chip}${state}`,
        onclick: () => { closePop(); flow.go(i); },
      }, face));
    }));
    beatsMenuBtn.textContent = `장 ${v.index + 1}/${v.beats.length} ▾`;
    beatsMenuBtn.setAttribute('aria-label', `장 ${v.index + 1} / ${v.beats.length}: ${v.beat.chip} — 장 고르기`);
  }

  /* ── 📖 용어 ── */
  const glossBtn = el('button.tn-btn.tn-gloss', { type: 'button', title: '📖 용어 사전', 'aria-label': '📖 용어 사전', onclick: () => { closePop(); glossary?.open(); } },
    el('span.tn-ico', { 'aria-hidden': 'true' }, '📖'), el('span.tn-txt', {}, ' 용어'));

  /* ── ⋯ 더 보기 ── */
  const moreBtn = el('button.tn-btn.tn-more', { type: 'button', title: '더 보기 — 글자 크기·테마·재생 속도·단축키·화면 사용법·학습 기록·정보', 'aria-label': '⋯ 더 보기' }, '⋯');
  function tourPatch() {
    // 0-3 화면 사용법의 첫 내용 장(도입 슬라이드 다음)
    const tab = TABS.find((t) => t.id === 'start');
    const it = tab && unitPages(tab).find((x) => x.page.id === 'tour');
    if (!it) return goPatch('start');
    const beats = pageBeats(it.tab, it.sub, it.page);
    const i = beats.findIndex((b) => !b.overlay);
    return visitPatch('start', 'tour', null, i < 0 ? 0 : i);
  }
  function moreContent() {
    const state = store.get();
    const v = flow.get();
    const step = deckKind(v.page) === 'step';
    const setScale = (d) => store.set({ scale: Math.max(SCALE_MIN, Math.min(SCALE_MAX, +(store.get().scale + d).toFixed(2))) });
    const refresh = () => morePop.refresh();
    return [
      el('div.tn-more__row.tn-only-phone', {},
        el('button.tn-item', { type: 'button', onclick: () => { closePop(); glossary?.open(); } }, '📖 용어 사전'),
        el('button.tn-item', { type: 'button', onclick: () => { goalPop.open(moreBtn); } }, '🎯 이 쪽의 목표')),
      el('div.tn-more__row', { role: 'group', 'aria-label': '글자 크기' },
        el('span.tn-more__label', {}, '글자 크기'),
        el('button.tn-item.tn-item--sm', { type: 'button', 'aria-label': '글자 작게', disabled: state.scale <= SCALE_MIN ? true : null, onclick: () => { setScale(-0.15); refresh(); } }, '가−'),
        el('span.tn-more__val', {}, `${Math.round(state.scale * 100)}%`),
        el('button.tn-item.tn-item--sm', { type: 'button', 'aria-label': '글자 크게', disabled: state.scale >= SCALE_MAX ? true : null, onclick: () => { setScale(0.15); refresh(); } }, '가＋')),
      el('button.tn-item', {
        type: 'button', title: '자동(컴퓨터 설정) → 밝게 → 어둡게',
        onclick: () => { store.set({ theme: THEMES[(THEMES.indexOf(store.get().theme) + 1) % THEMES.length] }); refresh(); },
      }, THEME_NAME[state.theme] ?? THEME_NAME.auto),
      step ? el('div.tn-more__row', { role: 'group', 'aria-label': '재생 속도' },
        el('span.tn-more__label', {}, '⏱ 재생 속도'),
        SPEEDS.map((sp) => el('button.tn-item.tn-item--sm', {
          type: 'button', 'aria-pressed': String(state.speedId === sp.id),
          onclick: () => { store.set({ speedId: sp.id }); refresh(); },
        }, sp.name))) : null,
      el('details.tn-more__details', {},
        el('summary', {}, '⌨️ 단축키'),
        el('dl.tn-keys', {}, KEYS.map(([k, d]) => [el('dt', {}, el('kbd', {}, k)), el('dd', {}, d)]))),
      el('button.tn-item', { type: 'button', onclick: pick(() => leave(tourPatch())) }, '❔ 화면 사용법 (0-3)'),
      el('div.tn-more__record', {}, recordButton(progress)),
      el('details.tn-more__details', {},
        el('summary', {}, 'ℹ️ 정보'),
        el('div.tn-info', {},
          el('p', {}, el('strong', {}, '🐧 펭귄 데이터로 배우는 인공지능')),
          el('p', {}, '수집 → 가공 → 전처리 → 학습 준비 → 기계학습 → 평가'),
          el('p', {}, '데이터: palmerpenguins (CC0, Palmer Station LTER)'),
          el('p', {}, el('a', { href: './practice/', target: '_blank', rel: 'noopener', title: PRACTICE_URL }, '🕸 크롤링 연습 사이트'), ' · ',
            el('a', { href: `${REPO_URL}/blob/${BRANCH}/REQUIREMENTS.md`, target: '_blank', rel: 'noopener' }, '요구사항 정의서')))),
    ];
  }
  const morePop = makePop(moreBtn, { label: '더 보기', cls: 'tn-pop--more', align: 'right', build: moreContent });

  /* ── 붙이기 ── */
  fill(root,
    courseBtn,
    el('nav.tn-where', { 'aria-label': '지금 위치' }, unitBtn, el('span.tn-sep', { 'aria-hidden': 'true' }, '›'), pageBtn, goalBtn),
    el('div.tn-beatsbox', {}, beatList, beatsMenuBtn),
    el('div.tn-tools', {}, glossBtn, moreBtn));

  /* ── 그리기 ── */
  function draw(v) {
    // 여정 점
    TABS.forEach((t, i) => {
      const pr = unitProgress(progress, t);
      const dot = dots.children[i];
      dot.dataset.state = t.id === v.tab.id ? 'current' : pr.total && pr.done === pr.total ? 'done' : '';
    });
    unitText.textContent = `${v.tab.unit.no}단원 ${v.tab.icon} ${v.tab.label}`;
    unitBtn.title = `${v.tab.unit.no}단원 ${v.tab.label}${v.tab.verb ? ` — ${v.tab.verb}` : ''} · 단원 고르기`;
    unitBtn.setAttribute('aria-label', `${v.tab.unit.no}단원 ${v.tab.label} — 단원 고르기`);

    const label = pageLabel(v.tab, v.sub, v.page);
    pageNo.textContent = label;
    pageTitle.textContent = v.page.title;
    pageBtn.title = `${label} ${v.page.title} · 쪽 고르기`;
    pageBtn.setAttribute('aria-label', `${label} ${v.page.title} — 쪽 고르기`);
    pageBtn.dataset.done = v.pageDone ? 'true' : '';
    goalBtn.hidden = !v.page.objective && !v.page.why;

    drawBeats(v);
  }

  let lastSig = '';
  flow.subscribe((v) => {
    const sig = `${v.key}#${v.index}`;
    if (sig !== lastSig) { lastSig = sig; closePop(); }
    draw(v);
  });

  return { close: closePop, unitPop, pagePop, goalPop, beatsPop, morePop };
}

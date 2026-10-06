/**
 * 상단 막대 — 2단계 내비게이션 (8-퍼즐 사이트와 같은 방식)
 *   1줄: 큰 탭 = 단원 순서  🏁시작 → 1 🕸수집 → 2 🔍가공 → 3 🧹전처리 → 4 🧩학습 준비 → 5 🤖기계학습 → 6 🚀프로젝트
 *        탭마다 동사(문제 찾기·문제 고치기 …)와 진도 막대가 붙는다.
 *   2줄: 기계학습 탭의 하위 탭 [개념] [k-최근접 이웃] [의사결정 트리] [선형 회귀] [k-평균] [단원 정리]
 */
import { el, fill } from './dom.js';
import { TABS, ML_SUBTABS } from '../app/lessons.js';
import { unitProgress } from '../app/missions.js';

export function mountTopbar(root, store, { progress, onHelp, onGlossary, onCourse }) {
  const tabParts = TABS.map((t) => {
    const bar = el('span.modetab__bar', { 'aria-hidden': 'true' });
    const btn = el('button.pill.modetab', {
      type: 'button', role: 'tab',
      onclick: () => store.set({ tab: t.id }),
    },
    el('span.modetab__top', {},
      el('span.modetab__no', {}, t.unit.no === 0 ? '0' : String(t.unit.no)),
      `${t.icon} ${t.label}`),
    t.verb ? el('span.modetab__verb', {}, t.verb) : null,
    bar);
    return { t, btn, bar };
  });

  const subParts = ML_SUBTABS.map((s) => {
    const count = el('span.subtab__count');
    const btn = el('button.pill.subtab', {
      type: 'button', role: 'tab', onclick: () => store.set({ tab: 'ml', mlTab: s.id }),
    }, s.id === 'review' ? `✅ ${s.name}` : s.name, count);
    return { s, btn, count };
  });
  const subtabs = el('div.subtabs', { role: 'tablist', 'aria-label': '기계학습 하위 탭' },
    el('span.subtabs__label', {}, '5단원 기계학습:'), subParts.map((p) => p.btn));

  const themeBtn = el('button.pill', {
    type: 'button', title: '밝은 화면 / 어두운 화면',
    onclick: () => {
      const order = ['auto', 'light', 'dark'];
      store.set({ theme: order[(order.indexOf(store.get().theme) + 1) % order.length] });
    },
  });

  fill(root,
    el('div.topbar__row', {},
      el('h1.topbar__title', {}, '🐧 펭귄 데이터로 배우는 인공지능',
        el('small', {}, '수집 → 가공 → 전처리 → 학습 준비 → 기계학습 → 평가')),
      el('div.modetabs', { role: 'tablist', 'aria-label': '단원 순서' }, tabParts.map((p) => p.btn)),
      el('span.topbar__spacer'),
      el('div.topbar__tools', {},
        el('button.pill', { type: 'button', title: '모든 단원의 목표와 쪽, 내 진도', onclick: onCourse }, '📚 목차'),
        el('button.pill', { type: 'button', title: '사용 안내 다시 보기', onclick: onHelp }, '? 도움말'),
        el('button.pill', { type: 'button', title: '용어 사전', onclick: onGlossary }, '📖 용어'),
        el('button.pill', { type: 'button', title: '글자 작게', 'aria-label': '글자 작게', onclick: () => store.set({ scale: Math.max(0.85, +(store.get().scale - 0.15).toFixed(2)) }) }, '가−'),
        el('button.pill', { type: 'button', title: '글자 크게 (교실 뒷자리)', 'aria-label': '글자 크게', onclick: () => store.set({ scale: Math.min(1.6, +(store.get().scale + 0.15).toFixed(2)) }) }, '가＋'),
        themeBtn),
    ),
    subtabs,
  );

  function drawProgress() {
    for (const { t, btn, bar } of tabParts) {
      const { done, total } = unitProgress(progress, t);
      bar.style.setProperty('--p', String(total ? done / total : 0));
      btn.dataset.complete = done === total && total > 0 ? 'true' : 'false';
      btn.title = `${t.unit.no === 0 ? '시작' : `${t.unit.no}단원`} ${t.label}${t.verb ? ` — ${t.verb}` : ''} · ${t.tip}\n진도: ${done} / ${total}쪽 완료`;
    }
    const ml = TABS.find((t) => t.id === 'ml');
    for (const { s, count } of subParts) {
      const { done, total } = unitProgress(progress, ml, s.id);
      count.textContent = done === total ? ' ✓' : ` ${done}/${total}`;
    }
  }

  store.subscribe((state) => {
    tabParts.forEach(({ t, btn }) => btn.setAttribute('aria-selected', String(t.id === state.tab)));
    subtabs.hidden = state.tab !== 'ml';
    subParts.forEach(({ s, btn }) => btn.setAttribute('aria-selected', String(state.tab === 'ml' && s.id === state.mlTab)));
    themeBtn.textContent = state.theme === 'auto' ? '🌗 자동' : state.theme === 'light' ? '☀ 밝게' : '🌙 어둡게';
  });
  progress.subscribe(drawProgress);
}

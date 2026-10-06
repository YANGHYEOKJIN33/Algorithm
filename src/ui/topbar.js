/**
 * 상단 막대 — 2단계 내비게이션 (8-퍼즐 사이트와 같은 방식)
 *   1줄: 큰 탭 = 수업 순서  🏁시작 → 🕸수집 → 🔍가공 → 🧹전처리 → 🧩학습 준비 → 🤖기계학습 → 🚀프로젝트
 *   2줄: 기계학습 탭의 하위 탭 [개념] [k-최근접 이웃] [의사결정 트리] [선형 회귀] [k-평균]
 */
import { el, fill } from './dom.js';
import { TABS, ML_SUBTABS } from '../app/lessons.js';

export function mountTopbar(root, store, { onHelp, onGlossary }) {
  const tabButtons = TABS.map((t, i) => el('button.pill.modetab', {
    type: 'button', role: 'tab', title: t.tip,
    onclick: () => store.set({ tab: t.id }),
  }, el('span.modetab__no', {}, `${i + 1}`), `${t.icon} ${t.label}`));

  const subButtons = ML_SUBTABS.map((s) => el('button.pill.subtab', {
    type: 'button', role: 'tab', onclick: () => store.set({ tab: 'ml', mlTab: s.id }),
  }, s.name));
  const subtabs = el('div.subtabs', { role: 'tablist', 'aria-label': '기계학습 하위 탭' },
    el('span.subtabs__label', {}, '기계학습:'), subButtons);

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
        el('small', {}, '수집 → 가공 → 전처리 → 학습 준비 → 기계학습')),
      el('div.modetabs', { role: 'tablist', 'aria-label': '수업 순서' }, tabButtons),
      el('span.topbar__spacer'),
      el('div.topbar__tools', {},
        el('button.pill', { type: 'button', title: '사용 안내 다시 보기', onclick: onHelp }, '? 도움말'),
        el('button.pill', { type: 'button', title: '용어 사전', onclick: onGlossary }, '📖 용어'),
        el('button.pill', { type: 'button', title: '글자 작게', onclick: () => store.set({ scale: Math.max(0.85, +(store.get().scale - 0.15).toFixed(2)) }) }, '가−'),
        el('button.pill', { type: 'button', title: '글자 크게 (교실 뒷자리)', onclick: () => store.set({ scale: Math.min(1.6, +(store.get().scale + 0.15).toFixed(2)) }) }, '가＋'),
        themeBtn),
    ),
    subtabs,
  );

  store.subscribe((state) => {
    tabButtons.forEach((b, i) => b.setAttribute('aria-selected', String(TABS[i].id === state.tab)));
    subtabs.hidden = state.tab !== 'ml';
    subButtons.forEach((b, i) => b.setAttribute('aria-selected', String(state.tab === 'ml' && ML_SUBTABS[i].id === state.mlTab)));
    themeBtn.textContent = state.theme === 'auto' ? '🌗 자동' : state.theme === 'light' ? '☀ 밝게' : '🌙 어둡게';
  });
}

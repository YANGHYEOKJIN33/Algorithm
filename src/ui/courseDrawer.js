/**
 * 📚 목차 — 모든 단원의 목표·쪽·내 진도를 한 장에. 쪽을 누르면 그 쪽으로 간다.
 * (Khan Academy의 단원 목록·Learn Git Branching의 레벨 고르기처럼 "어디까지 했나"가 보이게)
 */
import { el, fill } from './dom.js';
import { TABS, unitPages, goPatch, subPrefix } from '../app/lessons.js';
import { pageDone, pageCount, unitProgress, canDoDone } from '../app/missions.js';

export function createCourseDrawer(store, progress) {
  const list = el('div.course');
  const summary = el('span.panel__hint');
  const dialog = el('div.modal.modal--wide', { role: 'dialog', 'aria-modal': 'true', 'aria-label': '목차와 진도' });
  const backdrop = el('div.modal__backdrop', { hidden: true }, dialog);
  let lastFocus = null;
  const closeBtn = el('button.pill', { type: 'button', onclick: () => close() }, '닫기 ✕');

  function go(patch) { store.set(patch); close(); }

  function render() {
    const state = store.get();
    let done = 0;
    let total = 0;
    fill(list, TABS.map((tab) => {
      const pr = unitProgress(progress, tab);
      done += pr.done;
      total += pr.total;
      const here = state.tab === tab.id;
      return el(`section.course__unit${here ? '.is-here' : ''}`, {},
        el('header.course__head', {},
          el('span.course__no', {}, tab.unit.no === 0 ? '시작' : `${tab.unit.no}단원`),
          el('h3', {}, `${tab.icon} ${tab.label}`, tab.verb ? el('small', {}, ` — ${tab.verb}`) : null),
          el('span.course__meter', { style: `--p:${pr.total ? pr.done / pr.total : 0}`, 'aria-label': `${pr.done} / ${pr.total}쪽 완료` }, el('span'), `${pr.done}/${pr.total}`)),
        tab.unit.question ? el('p.course__q', {}, `🤔 ${tab.unit.question}`) : null,
        tab.unit.canDo?.length ? el('ul.course__cando', {}, tab.unit.canDo.map((c) => el('li', { 'data-done': canDoDone(progress, tab, c) ? 'true' : null }, c.text))) : null,
        el('ol.course__pages', {}, unitPages(tab).map((it) => {
          const ok = pageDone(progress, tab, it.sub, it.page);
          const cnt = pageCount(progress, tab, it.sub, it.page);
          return el('li', {}, el('button.course__page', {
            type: 'button', 'data-done': ok ? 'true' : null,
            onclick: () => go(goPatch(tab.id, it.page.id, it.sub?.id)),
          },
          el('span.course__label', {}, ok ? '✓' : it.label),
          el('span.course__title', {}, subPrefix(it, '[]'), it.page.title),
          el('span.course__obj', {}, it.page.objective ?? ''),
          el('span.course__cnt', {}, cnt.total ? `✋ ${cnt.done}/${cnt.total}` : '')));
        })));
    }));
    summary.textContent = `전체 ${done} / ${total}쪽 완료`;
  }

  function close() { backdrop.hidden = true; lastFocus?.focus?.(); }
  function open() {
    lastFocus = document.activeElement;
    render();
    backdrop.hidden = false;
    const here = dialog.querySelector('.is-here');
    const scroller = dialog.querySelector('.modal__scroll');
    if (scroller) scroller.scrollTop = 0;
    if (here && scroller) scroller.scrollTop = here.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 8;
    closeBtn.focus();
  }

  fill(dialog,
    el('div.modal__head', {}, el('span.panel__title', {}, '📚 목차와 내 진도'), summary, el('span.topbar__spacer'),
      el('button.pill.pill--sm', {
        type: 'button', title: '이 브라우저에 저장된 진도(✅)를 모두 지워요',
        onclick: () => { if (confirm('진도(✅ 표시와 문제 답)를 모두 지울까요? 되돌릴 수 없어요.')) { progress.reset(); render(); } },
      }, '↺ 진도 초기화'),
      closeBtn),
    el('div.modal__scroll', {}, list),
    el('p.modal__note', {}, '진도는 이 컴퓨터의 이 브라우저에만 저장돼요. ✋ 할 일을 모두 하면 그 쪽에 ✓가 붙어요.'));
  document.body.append(backdrop);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => { if (!backdrop.hidden && e.key === 'Escape') close(); });
  return { open, close };
}

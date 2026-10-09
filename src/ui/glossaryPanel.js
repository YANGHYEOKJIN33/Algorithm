/** 용어 사전 대화상자 — 수업 중 "이 말이 무슨 뜻이에요?"를 바로 해결한다 */
import { el, fill } from './dom.js';
import { searchGlossary, GLOSSARY } from '../app/glossary.js';

export function createGlossaryPanel() {
  const list = el('div.gloss__list');
  const count = el('span.panel__hint');
  const input = el('input.gloss__search', {
    type: 'search', placeholder: '용어 찾기 (예: 결측치, IQR, 지도학습)', 'aria-label': '용어 찾기',
    oninput: () => render(input.value),
  });
  const dialog = el('div.modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': '용어 사전' });
  const backdrop = el('div.modal__backdrop', { hidden: true }, dialog);
  let lastFocus = null;

  const entry = (it) => [
    el('dt.gloss__term', {}, el('strong', {}, it.term), el('span.gloss__en', {}, it.en)),
    el('dd.gloss__def', {}, it.plain, el('span.gloss__where', {}, `📍 ${it.where}`)),
  ];

  function render(q = '') {
    // 학습 요소 칩에서 연 용어는 그 용어 하나를 맨 위에, 나머지 찾은 것은 "함께 보기"로
    const exact = GLOSSARY.flatMap((g) => g.items).find((it) => it.term === q.trim()) ?? null;
    const groups = searchGlossary(q)
      .map((g) => ({ ...g, items: g.items.filter((it) => it !== exact) }))
      .filter((g) => g.items.length);
    count.textContent = `${groups.reduce((n, g) => n + g.items.length, 0) + (exact ? 1 : 0)}개`;
    if (!groups.length && !exact) { fill(list, el('div.placeholder', {}, '찾는 용어가 없어요. 다른 낱말로 찾아보세요.')); return; }
    fill(list,
      exact ? el('section.gloss__exact', {}, el('dl.gloss__items', {}, entry(exact))) : null,
      exact && groups.length ? el('h3.gloss__group-title', {}, '함께 보기') : null,
      groups.map((g) => el('section', {},
        el('h3.gloss__group-title', {}, g.group),
        el('dl.gloss__items', {}, g.items.flatMap(entry)))));
  }

  function close() { backdrop.hidden = true; lastFocus?.focus?.(); }
  function open(q = '') {
    lastFocus = document.activeElement;
    input.value = q;
    render(q);
    backdrop.hidden = false;
    input.focus();
  }

  fill(dialog,
    el('div.modal__head', {}, el('span.panel__title', {}, '📖 용어 사전'), count, el('span.topbar__spacer'),
      el('button.pill', { type: 'button', onclick: close }, '닫기 ✕')),
    el('div.gloss__searchbar', {}, input),
    el('div.modal__scroll', {}, list),
    el('p.modal__note', {}, '화면에는 교과서와 같은 정확한 용어를 써요. 뜻이 막히면 여기서 찾아보세요.'));
  document.body.append(backdrop);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => { if (!backdrop.hidden && e.key === 'Escape') close(); });
  return { open, close };
}

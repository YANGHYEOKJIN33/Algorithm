/**
 * 레슨 막대 — 몇 번째 쪽인지, 📘 배울 것(왜 배우는지까지), ✋ 해 볼 것을 보여 주고 앞뒤로 넘긴다.
 * 마지막 쪽의 [다음 →]은 다음 탭으로 이어 준다(수업이 끊기지 않게).
 */
import { el, fill } from './dom.js';
import { currentLesson, TABS } from '../app/lessons.js';

export function mountLessonBar(root, store) {
  const dots = el('div.lesson__dots', { role: 'tablist', 'aria-label': '쪽' });
  const count = el('span.lesson__count');
  const title = el('h2.lesson__title');
  const goal = el('p.lesson__goal');
  const todo = el('p.lesson__todo');

  function nextPlace() {
    const state = store.get();
    const { tab, sub, index, steps, key } = currentLesson(state);
    if (index < steps.length - 1) return { [key]: index + 1 };
    if (sub) {
      const subs = tab.sub;
      const si = subs.findIndex((x) => x.id === sub.id);
      if (si < subs.length - 1) return { mlTab: subs[si + 1].id, [`step:${tab.id}:${subs[si + 1].id}`]: 0 };
    }
    const ti = TABS.findIndex((t) => t.id === tab.id);
    if (ti < TABS.length - 1) {
      const nt = TABS[ti + 1];
      return nt.sub ? { tab: nt.id, mlTab: nt.sub[0].id, [`step:${nt.id}:${nt.sub[0].id}`]: 0 } : { tab: nt.id, [`step:${nt.id}`]: 0 };
    }
    return null;
  }
  function prevPlace() {
    const { index, key } = currentLesson(store.get());
    return index > 0 ? { [key]: index - 1 } : null;
  }

  const prev = el('button.pill.lesson__nav', { type: 'button', onclick: () => { const p = prevPlace(); if (p) store.set(p); } }, '← 이전');
  const next = el('button.pill.ctrl--primary.lesson__nav', { type: 'button', onclick: () => { const p = nextPlace(); if (p) store.set(p); } }, '다음 →');

  fill(root,
    el('div.lesson__top', {}, dots, count),
    el('div.lesson__text', {}, title, goal, todo),
    el('div.lesson__navs', {}, prev, next),
  );

  let builtFor = null;
  let buttons = [];
  store.subscribe((state) => {
    const { steps, index, key, tab, sub } = currentLesson(state);
    if (builtFor !== steps) {
      builtFor = steps;
      buttons = steps.map((p, i) => el('button.lesson__dot', {
        type: 'button', role: 'tab', title: `${i + 1}. ${p.title}`, 'aria-label': `${i + 1}쪽: ${p.title}`,
        onclick: () => store.set({ [key]: i }),
      }, String(i + 1)));
      fill(dots, buttons);
    }
    const page = steps[index];
    title.textContent = `${index + 1}. ${page.title}`;
    goal.textContent = `📘 배울 것 — ${page.goal}`;
    todo.textContent = `✋ 해 볼 것 — ${page.todo}`;
    count.textContent = `${index + 1} / ${steps.length}`;
    prev.disabled = index === 0;
    const np = nextPlace();
    next.disabled = !np;
    if (index < steps.length - 1) next.textContent = '다음 →';
    else if (sub && tab.sub.findIndex((x) => x.id === sub.id) < tab.sub.length - 1) next.textContent = `${tab.sub[tab.sub.findIndex((x) => x.id === sub.id) + 1].name} →`;
    else if (np) { const nt = TABS[TABS.findIndex((t) => t.id === tab.id) + 1]; next.textContent = `${nt.icon} ${nt.label} →`; }
    else next.textContent = '끝!';
    buttons.forEach((d, k) => {
      d.setAttribute('aria-selected', String(k === index));
      d.classList.toggle('lesson__dot--done', k < index);
    });
  });
}

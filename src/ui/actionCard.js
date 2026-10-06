/** 동작 카드 — 지금 장면에서 일어난 일을 그림 하나 + 한 문장으로 */
import { el, fill } from './dom.js';

export function mountActionCard(root, player) {
  let lastKey = '';
  player.subscribe((v) => {
    if (v.empty) { fill(root); lastKey = ''; return; }
    const f = v.frame;
    const key = `${v.index}|${f.say}`;
    if (key === lastKey) return;
    lastKey = key;
    fill(root, el('div.action-card', { 'data-tone': f.done ? 'done' : null },
      el('span.action-card__icon', { 'aria-hidden': 'true' }, f.icon ?? '👉'),
      el('span.action-card__say', {}, f.say),
      el('span.action-card__step', {}, `${v.index + 1} / ${v.total}`)));
  });
}

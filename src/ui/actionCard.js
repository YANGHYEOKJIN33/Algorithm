/**
 * 방금 자막 — 단계 실행에서 "방금 무슨 일이 일어났나"를 그림 하나 + 한 문장으로(#caption, 그림 바로 위).
 *   [방금] 🧮 True는 1, False는 0으로 보고 더해요
 * 할 일(무엇을 하라)은 여기에 쓰지 않는다 — 그것은 지금 할 일 줄에만(FINAL_SPEC §1.4 N6).
 * 장면 번호(k/n)도 재생 단추 묶음이 보여 주므로 여기에는 없다.
 */
import { el, fill } from './dom.js';

export function mountActionCard(root, player) {
  let lastKey = '';
  player.subscribe((v) => {
    if (v.empty) { fill(root); lastKey = ''; root.removeAttribute('data-tone'); return; }
    const f = v.frame;
    const key = `${v.index}|${f.say}`;
    if (key === lastKey) return;
    lastKey = key;
    const done = Boolean(f.done) || v.atEnd;
    if (done) root.dataset.tone = 'done'; else root.removeAttribute('data-tone');
    fill(root, el('div.caption__card', { 'data-tone': done ? 'done' : null },
      el('span.caption__tag', {}, '방금'),
      el('span.caption__icon', { 'aria-hidden': 'true' }, f.icon ?? '👉'),
      el('span.caption__say', {}, f.say)));
  });
}

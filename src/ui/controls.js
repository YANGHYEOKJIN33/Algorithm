/**
 * 재생 단추 묶음 — 지금 할 일 줄 오른쪽(.nowbar__player)에 붙는다. 단계 실행 쪽의 할 일 장에서만 보인다(nowBar가 숨긴다).
 *   [⏹] [⏮ 뒤로] [▶ 재생] [⏩ 끝까지]  7 / 20  [⏭ 한 단계]
 * 파란 단추는 따로 정하지 않는다 — 지금 할 미션의 단추에 보라 고리(.is-now)가 붙으면 그것만 파랗게 칠한다(spotlight.js·shell.css).
 * 재생 속도는 맨 위 줄의 ⋯ 메뉴에서 고른다.
 *
 * 키(단계 실행의 할 일 장에서만, body.is-run): Space 재생/멈춤 · → 한 단계 · ← 뒤로 · Home 처음 · End 끝
 * 다른 장의 →·←·PageUp·PageDown·Enter는 지금 할 일 줄(nowBar.js)이 맡는다.
 */
import { el, fill } from './dom.js';

export const BUTTONS = [
  { id: 'reset', label: '⏹\uFE0F', name: '처음으로', key: 'Home' },
  { id: 'back', label: '⏮ 뒤로', name: '뒤로', key: '←' },
  { id: 'play', label: '▶ 재생', name: '재생', key: 'Space' },
  { id: 'end', label: '⏩ 끝까지', name: '끝까지', key: 'End' },
  { id: 'step', label: '⏭ 한 단계', name: '한 단계', key: '→' },
];

/** 키 → 단추 */
export const KEYMAP = { ' ': 'play', ArrowRight: 'step', ArrowLeft: 'back', Home: 'reset', End: 'end' };

const TYPING = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="slider"]';

export function mountControls(root, store, player) {
  const handlers = {
    reset: () => player.reset(),
    back: () => player.step(-1),
    play: () => player.toggle(),
    step: () => player.step(1),
    end: () => player.toEnd(),
  };
  const buttons = new Map(BUTTONS.map((b) => [b.id, el('button.ctrl', {
    type: 'button', title: `${b.name} (${b.key === 'Space' ? 'Space' : b.key})`, 'aria-label': b.id === 'reset' ? '⏹ 처음으로' : null,
    'data-action': b.id, onclick: handlers[b.id],
  }, b.label)]));
  const progress = el('span.progress', { 'aria-live': 'off' });

  fill(root, buttons.get('reset'), buttons.get('back'), buttons.get('play'), buttons.get('end'), progress, buttons.get('step'));

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!document.body.classList.contains('is-run')) return;
    const t = e.target;
    if (t?.closest?.(TYPING) || t?.isContentEditable) return;
    if (document.querySelector('.modal__backdrop:not([hidden]), .tn-pop:not([hidden])')) return;
    // 단추·링크에 초점이 있으면 Space는 그 단추를 누르는 일 — 재생 단축키로 가로채지 않는다.
    // 단, 지금 할 일 줄의 단추([계속]·[건너뛰기]·[← 이전])에 초점이 남아 있을 때는 재생(누르자마자 장을 건너뛰지 않게)
    if (e.key === ' ' && t?.closest?.('button, a, [role="button"], summary, label') && !t.closest('#nowbar')) return;
    const btn = buttons.get(KEYMAP[e.key]);
    if (!btn) return;
    e.preventDefault();
    if (!btn.disabled) btn.click();
  });

  player.subscribe((v) => {
    buttons.get('reset').disabled = v.empty || v.atStart;
    buttons.get('back').disabled = v.empty || v.atStart;
    buttons.get('step').disabled = v.empty || v.atEnd;
    buttons.get('end').disabled = v.empty || v.atEnd;
    buttons.get('play').textContent = v.playing ? '⏸ 멈춤' : (!v.empty && v.atEnd ? '↻ 다시 재생' : '▶ 재생');
    progress.textContent = v.empty ? '' : `${v.index + 1} / ${v.total}`;
  });

  return { buttons };
}

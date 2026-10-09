/**
 * 실행 제어 — 단계 실행 쪽에서만 보인다. 되감기 필수. 키보드만으로도 조작된다.
 *   Space 재생/멈춤 · → 한 단계 · ← 뒤로 · Home 처음 · End 끝
 */
import { el, fill } from './dom.js';
import { SPEEDS } from '../app/state.js';

const BUTTONS = [
  { id: 'reset', label: '⏹ 처음으로', key: 'Home' },
  { id: 'back', label: '⏮ 뒤로', key: '←' },
  { id: 'step', label: '⏭ 한 단계', key: '→', primary: true },
  { id: 'play', label: '▶ 재생', key: 'Space' },
  { id: 'end', label: '⏩ 끝까지', key: 'End' },
];

export function mountControls(root, store, player) {
  const handlers = {
    reset: () => player.reset(),
    back: () => player.step(-1),
    play: () => player.toggle(),
    step: () => player.step(1),
    end: () => player.toEnd(),
  };
  const buttons = new Map(BUTTONS.map((b) => [b.id, el(`button.ctrl${b.primary ? '.ctrl--primary' : ''}`, {
    type: 'button', title: `${b.label} (${b.key})`, 'data-action': b.id, onclick: handlers[b.id],
  }, b.label)]));
  const speed = el('select', { id: 'speed', 'aria-label': '재생 속도', onchange: (e) => store.set({ speedId: e.target.value }) },
    SPEEDS.map((sp) => el('option', { value: sp.id }, sp.name)));
  const progress = el('span.progress');

  fill(root, ...buttons.values(),
    el('label.speed', { for: 'speed' }, '속도', speed),
    progress,
    el('span.topbar__spacer'),
    el('span.panel__hint', {}, '단축키 ', el('kbd', {}, 'Space'), ' 재생 · ', el('kbd', {}, '→'), ' 한 단계 · ', el('kbd', {}, '←'), ' 뒤로'));

  document.addEventListener('keydown', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
    if (!document.body.classList.contains('is-step')) return;
    if (document.querySelector('.modal__backdrop:not([hidden])')) return;
    // 단추·링크에 초점이 있으면 Space는 그 단추를 누르는 일 — 재생 단축키로 가로채지 않는다
    if (e.key === ' ' && e.target?.closest?.('button, a, [role="button"], summary, label') && !e.target.closest('#controlbar')) return;
    const map = { ' ': 'play', ArrowRight: 'step', ArrowLeft: 'back', Home: 'reset', End: 'end' };
    const btn = buttons.get(map[e.key]);
    if (!btn || btn.disabled) return;
    e.preventDefault();
    btn.click();
  });

  store.subscribe((state) => { speed.value = state.speedId; });
  player.subscribe((v) => {
    buttons.get('reset').disabled = v.empty || v.atStart;
    buttons.get('back').disabled = v.empty || v.atStart;
    buttons.get('step').disabled = v.empty || v.atEnd;
    buttons.get('end').disabled = v.empty || v.atEnd;
    buttons.get('play').textContent = v.playing ? '⏸ 멈춤' : (!v.empty && v.atEnd ? '↻ 처음부터 재생' : '▶ 재생');
    progress.textContent = v.empty ? '' : `${v.index + 1} / ${v.total}`;
  });
}

/**
 * 재생기 — 장면(frame) 목록을 한 장씩 넘겨 보는 장치. 되감기는 필수(놓친 장면을 다시 본다).
 * 장면이 모두 미리 만들어져 있으므로 앞뒤 이동은 번호 하나를 바꾸는 일이다.
 */
import { SPEEDS } from './state.js';

export function createPlayer(store) {
  let frames = [];
  let index = 0;
  let timer = null;
  const listeners = new Set();

  const view = () => (frames.length === 0
    ? { empty: true, playing: false, frame: null, index: 0, total: 0, atStart: true, atEnd: true }
    : {
      empty: false,
      frame: frames[index],
      prev: index > 0 ? frames[index - 1] : null,
      index,
      total: frames.length,
      atStart: index === 0,
      atEnd: index === frames.length - 1,
      playing: timer !== null,
    });

  const emit = () => { const v = view(); for (const fn of listeners) fn(v); };

  function pause() {
    if (timer === null) return;
    clearInterval(timer);
    timer = null;
    emit();
  }

  function play() {
    if (frames.length === 0 || timer !== null) return;
    if (index >= frames.length - 1) index = 0;
    const speed = SPEEDS.find((s) => s.id === store.get().speedId) ?? SPEEDS[1];
    timer = setInterval(() => {
      if (index >= frames.length - 1) { pause(); return; }
      index += 1;
      emit();
    }, speed.ms);
    emit();
  }

  function goTo(i) {
    if (frames.length === 0) return;
    index = Math.max(0, Math.min(frames.length - 1, i));
    emit();
  }

  return {
    load(list, start = 0) { pause(); frames = list ?? []; index = Math.max(0, Math.min(frames.length - 1, start)); emit(); },
    clear() { pause(); frames = []; index = 0; emit(); },
    step(dir) { pause(); goTo(index + (dir < 0 ? -1 : 1)); },
    reset() { pause(); goTo(0); },
    toEnd() { pause(); goTo(frames.length - 1); },
    goTo(i) { pause(); goTo(i); },
    play,
    pause,
    toggle() { if (timer !== null) pause(); else play(); },
    view,
    subscribe(fn) { listeners.add(fn); fn(view()); return () => listeners.delete(fn); },
  };
}

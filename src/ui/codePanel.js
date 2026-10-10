/**
 * 코드 패널 — 의사코드가 중심. 실행 중인 줄을 강조하고 그 줄의 설명을 펼친다.
 * "🐍 파이썬 같이 보기"를 켜면 줄마다 같은 일을 하는 파이썬을 아래에 붙인다(나란히 대응).
 * 파이썬을 몰라도 수업을 따라올 수 있게, 기본은 의사코드만 보인다.
 */
import { el, fill } from './dom.js';
import { colabUrl } from '../app/links.js';

export function createCodePanel(root, store) {
  const body = el('div.panel__body');
  const seg = el('div.seg', { role: 'group', 'aria-label': '코드 보기' },
    el('button', { type: 'button', 'data-v': 'pseudo', onclick: () => store.set({ codeView: 'pseudo' }) }, '📝 의사코드'),
    el('button', { type: 'button', 'data-v': 'python', onclick: () => store.set({ codeView: 'python' }) }, '🐍 파이썬 같이 보기'));
  const colab = el('a.pill.pill--sm.pill--colab', { target: '_blank', rel: 'noopener', title: '이 내용을 Colab에서 파이썬으로 실습해요' }, '📒 Colab');
  fill(root,
    el('div.panel__head', {}, el('span.panel__title', {}, '의사코드'), el('div.panel__tools', {}, seg, colab)),
    body);

  let scene = null;
  let lines = [];
  let activeLine = 0;

  function build() {
    const view = store.get().codeView;
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === view)));
    if (!scene) { fill(body); return; }
    const showPy = view === 'python';
    lines = scene.pseudo.map((p, i) => el('li.code-line', {},
      el('span.code-line__no', {}, String(i + 1)),
      el('code.code-line__code', {}, p.code),
      showPy ? el('code.code-line__py', {}, scene.python?.[i] ?? '') : null,
      el('span.code-line__note', {}, p.note)));
    fill(body,
      el('ol.code-list', {}, lines),
      el('div.code-legend', {},
        el('span', {}, '← 넣기 · 반복 · 만약 · 들여쓰기 = 그 안에서'),
        showPy ? el('span.code-legend__py', {}, '주황 줄 = 같은 일을 하는 파이썬') : null));
    highlight(activeLine);
  }

  function highlight(line) {
    activeLine = line;
    lines.forEach((li, i) => li.classList.toggle('is-active', i + 1 === line));
    const cur = lines[line - 1];
    if (cur) {
      // 패널 안에서만 스크롤 — 페이지 전체가 움직이지 않게
      const top = cur.offsetTop - body.offsetTop;
      if (top < body.scrollTop || top + cur.offsetHeight > body.scrollTop + body.clientHeight) {
        body.scrollTo({ top: Math.max(0, top - body.clientHeight / 3), behavior: 'smooth' });
      }
    }
  }

  store.subscribe((state, prev) => { if (state.codeView !== prev.codeView || !lines.length) build(); });

  return {
    setScene(def) {
      scene = def;
      activeLine = 0;
      colab.hidden = !def?.notebook;
      if (def?.notebook) colab.href = colabUrl(def.notebook);
      build();
    },
    setLine(line) { highlight(line); },
  };
}

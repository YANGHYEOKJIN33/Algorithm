/**
 * 장면 무대 — 쪽이 바뀌면 그 쪽의 장면을 붙이고(mount), 떠날 때 뗀다(destroy).
 *   step 장면: 의사코드 | 그림(무대) / 자료구조  + 실행 제어. 장면 목록을 재생기에 싣는다.
 *   view 장면: 한 판을 통째로 쓴다(탐험·읽기·파이썬 실습·퀴즈).
 */
import { el, fill, qs } from './dom.js';
import { currentLesson, currentPage, goPatch } from '../app/lessons.js';
import { getScene } from '../scenes/index.js';

function panel(root, cls) {
  const title = el('span.panel__title');
  const hint = el('span.panel__hint');
  const tools = el('div.panel__tools');
  const body = el('div.panel__body');
  fill(root, el('div.panel__head', {}, title, hint, tools), body);
  return { root, title, hint, tools, body, cls };
}

export function mountSceneHost(store, player, codePanel, extra = {}) {
  const workspace = qs('#workspace');
  const stage = panel(qs('#panel-stage'));
  const data = panel(qs('#panel-data'));
  const view = qs('#panel-view');

  let current = null;     // { sig, def, handle, unsub }

  const ctx = {
    store,
    player,
    go: (tabId, pageId, subId) => store.set(goPatch(tabId, pageId, subId)),
    glossary: extra.glossary,
    reload: null,
  };

  function teardown() {
    if (!current) return;
    current.unsub?.();
    current.handle?.destroy?.();
    current = null;
    player.clear();
  }

  function mount(state) {
    const page = currentPage(state);
    const def = getScene(page.scene);
    const step = def.kind === 'step';
    document.body.classList.toggle('is-step', step);
    workspace.dataset.layout = step ? 'step' : 'view';
    workspace.toggleAttribute('data-nodata', Boolean(def.nodata));
    workspace.style.setProperty('--stage-row', def.rows?.[0] ?? '1.25fr');
    workspace.style.setProperty('--data-row', def.rows?.[1] ?? '1fr');

    if (step) {
      stage.title.textContent = def.stageTitle ?? '그림';
      stage.hint.textContent = def.stageHint ?? '';
      data.title.textContent = def.dataTitle ?? '자료구조';
      data.hint.textContent = def.dataHint ?? '';
      fill(stage.tools); fill(stage.body); fill(data.tools); fill(data.body);
      // 앞 장면이 붙인 배치 클래스(fit 등)를 지운다 — 장면마다 깨끗한 칸에서 시작
      stage.body.className = 'panel__body';
      data.body.className = 'panel__body';
      stage.body.scrollTop = 0;
      data.body.scrollTop = 0;
      codePanel.setScene(def);
      const handle = def.mount({ stage: stage.body, data: data.body, stageTools: stage.tools, dataTools: data.tools }, ctx);
      const load = (keepIndex = false) => {
        const at = keepIndex ? player.view().index : 0;
        player.load(def.frames(ctx), at);
      };
      ctx.reload = () => load(false);
      const unsub = player.subscribe((v) => {
        if (v.empty) return;
        codePanel.setLine(v.frame.line);
        handle.render(v);
      });
      current = { def, handle, unsub };
      load();
    } else {
      const body = el('div.panel__body.view__body');
      fill(view, body);
      codePanel.setScene(null);
      const handle = def.mount(body, ctx);
      current = { def, handle };
    }
  }

  let lastSig = '';
  store.subscribe((state) => {
    const { tab, sub, index } = currentLesson(state);
    const sig = `${tab.id}|${sub?.id ?? ''}|${index}`;
    if (sig === lastSig) return;
    lastSig = sig;
    teardown();
    mount(state);
  });
}

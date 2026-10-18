/**
 * 장면 무대 — 학습 흐름(flow)을 따라 지금 쪽의 장면을 붙이고(mount), 지금 장(beat)만 보이게 한다.
 *
 *   쪽이 바뀌면   앞 장면을 떼고(destroy) 새 장면을 한 번 붙인다. 장이 바뀌어도 다시 붙이지 않는다
 *                (★ 위치·k·입력·재생 위치가 장 사이에서 그대로 남는다).
 *   장이 바뀌면   · 슬라이드 장(도입·읽기·확인·정리)은 #slidecard에 그리고(slideCard.js) #workspace[data-overlay]를 단다.
 *                  장면은 붙은 채로 visibility:hidden + inert(크기·측정은 그대로, 절대 display:none이 아니다).
 *                · 살펴보기·표지·정리·Colab 쪽의 장은 그 장의 show 목록에 있는 [data-beat] 덩어리만 보인다
 *                  (#panel-view[data-beats], 보이는 덩어리에 [data-beat-on]). 맨 위에 장 제목 .beat-head(h2 + 한 줄).
 *                · 장면의 handle.onBeat(beat)를 부르고 document에 'scene:render'를 보낸다(보라 고리가 다시 찾는다).
 *   단계 실행     의사코드 | 방금 자막 · 그림(무대) / 자료구조. 장면 목록을 재생기에 싣는다.
 *                재생기가 그릴 때마다 handle.render(view) 다음 'scene:render'.
 *
 * 미션 자동 체크에 필요한 사건도 여기서 모아 missions로 보낸다.
 *   재생기 이동(player·back) · 문제 상자(quiz:answer 사건) · Colab 링크 누르기 · 장면의 ctx.check(이름)
 *   단원 표지를 어느 길로든 떠나면 표지의 act:begin(flow.leave도 같은 일을 한다 — 두 번 불러도 한 번만 적힌다)
 *
 * 장면이 받는 ctx
 *   store · player · glossary · progress · missions · flow
 *   go(탭, 쪽, 하위탭, at?)   다른 쪽으로 가기(at: 'work' 첫 할 일 장 · 'start' · 'last' · 번호. 없으면 그 쪽에 기억해 둔 장)
 *   visit(탭, 쪽, 하위탭)     그 쪽의 첫 할 일 장으로 — "📖 그 쪽 다시 보기" · "다시 보기 →"
 *   next()                   다음 쪽으로
 *   check('이름')             미션 'act:이름'을 이루었다고 알린다(칸 누르기, k 바꾸기 …)
 *   lesson                   { tab, sub, page, index, steps } — 지금 쪽
 *   beat                     지금 장 { id, kind, chip, title, lead, show, checks, overlay }
 *   reload()                 (step 장면) 장면 목록을 다시 만든다
 */
import { el, fill, qs } from './dom.js';
import { currentLesson, goPatch, unitPages } from '../app/lessons.js';
import { nextPlace, visitPatch } from '../app/nav.js';
import { deckKind } from '../app/beats.js';
import { getScene } from '../scenes/index.js';
import { mountSlideCard, lookBackBeat, aimOf } from './slideCard.js';

function panel(root) {
  const title = el('span.panel__title');
  const hint = el('span.panel__hint');
  const tools = el('div.panel__tools');
  const body = el('div.panel__body');
  fill(root, el('div.panel__head', {}, title, hint, tools), body);
  return { root, title, hint, tools, body };
}

const cssString = (s) => `"${String(s).replace(/["\\]/g, '\\$&')}"`;

/** 장 덩어리 거르개 — show 목록에 없는 [data-beat]를 숨기는 CSS 한 줄(다시 그린 덩어리도 바로 맞게) */
export function beatFilterCss(show) {
  if (!Array.isArray(show)) return '';
  const not = show.map((id) => `:not([data-beat=${cssString(id)}])`).join('');
  return `#panel-view[data-beats] [data-beat]${not} { display: none !important; }`;
}

/** 표지 첫 장(생각 열기)의 머리 줄 — "2단원 · 🔍 가공 — 문제 찾기 · 약 49분 · 8쪽" */
function coverKicker(tab) {
  const n = unitPages(tab).length;
  return `${tab.unit.no}단원 · ${tab.icon} ${tab.label}${tab.verb ? ` — ${tab.verb}` : ''}${tab.unit.minutes ? ` · 약 ${tab.unit.minutes}분` : ''} · ${n}쪽`;
}

export function mountSceneHost(store, player, codePanel, extra = {}) {
  const { missions, progress, flow, glossary } = extra;
  if (!flow) throw new Error('mountSceneHost: 학습 흐름(flow)이 필요합니다');
  const workspace = qs('#workspace');
  const caption = document.getElementById('caption');
  const codeRoot = qs('#panel-code');
  const stage = panel(qs('#panel-stage'));
  const data = panel(qs('#panel-data'));
  const view = qs('#panel-view');
  let slideRoot = document.getElementById('slidecard');
  if (!slideRoot) { slideRoot = el('section.slidecard', { id: 'slidecard', 'aria-label': '장' }); workspace.append(slideRoot); }
  const slides = mountSlideCard(slideRoot, { flow, progress, missions, glossary, codePanel, player });
  let filterStyle = document.getElementById('beat-filter');
  if (!filterStyle) { filterStyle = document.createElement('style'); filterStyle.id = 'beat-filter'; document.head.append(filterStyle); }

  let current = null;     // { key, page, def, handle, unsub, step, head, body }
  let lastIndex = -1;     // ⏮ 뒤로를 알아채려고 — 장면 목록을 새로 실으면 -1
  let beatSig = '';       // 지금 그려 둔 장 — 'key#index'
  let showNow = null;     // 지금 거르는 show 목록(JSON)

  const leave = (patch) => { if (patch) flow.leave(patch); };
  const ctx = {
    store,
    player,
    flow,
    go: (tabId, pageId, subId, at) => leave(at === undefined ? goPatch(tabId, pageId, subId) : visitPatch(tabId, pageId, subId, at)),
    visit: (tabId, pageId, subId, at = 'work') => leave(visitPatch(tabId, pageId, subId, at)),
    next: () => leave(nextPlace(store.get())),
    check: (name) => missions?.act(name),
    glossary,
    progress,
    missions,
    lesson: null,
    beat: null,
    reload: null,
  };

  const rendered = () => document.dispatchEvent(new CustomEvent('scene:render'));

  // 재생기 → 미션 (한 단계·끝까지·뒤로)
  player.subscribe((v) => {
    if (v.empty) { lastIndex = -1; return; }
    if (lastIndex >= 0 && v.index < lastIndex) missions?.emit({ type: 'back' });
    lastIndex = v.index;
    missions?.emit({ type: 'player', index: v.index, total: v.total, atEnd: v.atEnd });
  });
  // 문제 상자 → 미션
  document.addEventListener('quiz:answer', (e) => missions?.emit({ type: 'quiz', ...e.detail }));
  // Colab 링크 → 미션
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('a[href*="colab.research.google.com"]')) missions?.emit({ type: 'colab' });
  });

  /* ── 장 덩어리 표시 ── */

  /** 보이는 덩어리에 [data-beat-on] — 장면이 덩어리를 다시 그려도 맞게(MutationObserver) */
  function markBeats() {
    if (!current || current.step) return;
    const show = showNow ? JSON.parse(showNow) : null;
    for (const node of view.querySelectorAll('[data-beat]')) {
      node.toggleAttribute('data-beat-on', show === null || show.includes(node.getAttribute('data-beat')));
    }
  }
  new MutationObserver(markBeats).observe(view, { childList: true, subtree: true });

  function setFilter(show) {
    const key = Array.isArray(show) ? JSON.stringify(show) : null;
    if (key === showNow) return;
    showNow = key;
    if (key === null) {
      view.removeAttribute('data-beats');
      filterStyle.textContent = '';
    } else {
      view.setAttribute('data-beats', show.join(' '));
      filterStyle.textContent = beatFilterCss(show);
    }
    markBeats();
  }

  /** 장 제목 — h2 + 한 줄(lead). 표지 첫 장에는 단원 머리 줄 */
  function drawHead(v, b = v.beat, look = false) {
    if (!current?.head) return;
    // 알고리즘을 처음 만나는 쪽(5단원 ① 아이디어)은 할 일 장마다 맨 위에 그 알고리즘의 목표를 한 줄로
    const a = b.kind === 'work' ? aimOf(v.sub, v.page) : null;
    const kicker = look ? [el('span.ask__look-wide', {}, '👀 바로 앞 장의 화면이에요 — 이 화면을 보며 오른쪽 문제를 풀어요'),
      el('span.ask__look-narrow', {}, '👀 바로 앞 장의 화면이에요 — 이 화면을 보며 위 문제를 풀어요')]
      : v.page.auto === 'cover' && v.index === 0 ? coverKicker(v.tab)
        : a?.full ? `🧭 목표: ${a.aim.goal}` : null;
    if (!b.title && !b.lead && !kicker) { fill(current.head); current.head.hidden = true; return; }
    fill(current.head,
      kicker ? el('p.beat-head__kicker', {}, kicker) : null,
      b.title ? el('h2.beat-head__title', { tabindex: '-1' }, b.title) : null,
      b.lead && !look ? el('p.beat-head__lead', {}, b.lead) : null);
    current.head.hidden = false;
  }

  /* ── 붙이기·떼기 ── */

  function teardown() {
    if (!current) return;
    current.unsub?.();
    try { current.handle?.destroy?.(); } catch (err) { console.error(err); }
    current = null;
    player.clear();
  }

  function mount(v) {
    const lesson = currentLesson(store.get());
    const page = v.page;
    const def = getScene(page.scene);
    ctx.lesson = { tab: v.tab, sub: v.sub, page, index: lesson.index, steps: lesson.steps };
    ctx.beat = v.beat;
    missions?.enter(v.tab, v.sub, page);
    const step = def.kind === 'step';
    const deck = deckKind(page);
    document.body.classList.toggle('is-step', step);
    workspace.dataset.layout = step ? 'step' : 'view';
    workspace.dataset.deck = deck;
    workspace.toggleAttribute('data-nodata', Boolean(def.nodata));
    workspace.style.setProperty('--stage-row', def.rows?.[0] ?? '1.25fr');
    workspace.style.setProperty('--data-row', def.rows?.[1] ?? '1fr');
    showNow = undefined;   // 새 쪽 — 거르개를 처음부터
    setFilter(null);

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
      fill(view);
      codePanel.setScene(def);
      current = { key: v.key, page, def, step: true, handle: null };
      const handle = def.mount({ stage: stage.body, data: data.body, stageTools: stage.tools, dataTools: data.tools }, ctx);
      current.handle = handle;
      const load = (keepIndex = false) => {
        const at = keepIndex ? player.view().index : 0;
        lastIndex = -1;
        player.load(def.frames(ctx), at);
      };
      ctx.reload = () => load(false);
      current.unsub = player.subscribe((pv) => {
        if (pv.empty) return;
        codePanel.setLine(pv.frame.line);
        handle?.render?.(pv);
        rendered();
      });
      load();
      if (store.get().codeView === 'python') missions?.emit({ type: 'python' });
    } else {
      const head = el('header.beat-head', { hidden: true });
      const sceneRoot = el('div.view__scene');
      const body = el('div.panel__body.view__body', {}, head, sceneRoot);
      view.dataset.deck = deck;
      fill(view, body);
      codePanel.setScene(null);
      ctx.reload = null;
      current = { key: v.key, page, def, step: false, handle: null, head, body };
      current.handle = def.mount(sceneRoot, ctx) ?? {};
    }
  }

  /* ── 장 맞추기 ── */

  function applyBeat(v) {
    if (!current) return;
    const b = v.beat;
    ctx.beat = b;
    const sig = `${v.key}#${v.index}`;
    const moved = sig !== beatSig;
    beatSig = sig;
    const overlay = b.overlay ? b.kind : null;
    // ❓ 확인 장은 덮지 않고 나란히 — 왼쪽에 앞 장의 그림(장면)을 그대로 두고 오른쪽에 문제(§ 확인 문제 좌우 비교)
    const split = overlay === 'check' && Boolean(v.page.ask);
    const look = split ? v.beats[lookBackBeat(v.beats, v.index)] ?? null : null;

    if (overlay) workspace.dataset.overlay = overlay; else workspace.removeAttribute('data-overlay');
    workspace.toggleAttribute('data-split', split);
    workspace.dataset.beatKind = b.kind;
    // 슬라이드가 덮는 동안 장면은 붙은 채로 손댈 수 없게(초점·클릭·화면 읽기에서 빠진다). 나란히 보는 ❓ 장은 그대로 만질 수 있다
    for (const p of [caption, codeRoot, stage.root, data.root, view]) if (p) p.inert = Boolean(overlay) && !split;
    slideRoot.inert = !overlay;

    if (overlay) slides.show(v, current.def);
    else slides.hide();

    if (!current.step) {
      view.dataset.beatKind = look ? look.kind : b.kind;
      if (!overlay) {
        setFilter(b.show);
        if (moved) drawHead(v);
      } else if (split) {
        setFilter(look ? look.show : null);
        if (moved) drawHead(v, look ?? b, true);
      }
    }

    if (!moved) return;
    if (!overlay && !current.step && current.body) {
      current.body.scrollTop = 0;
      // 장이 바뀌면 초점을 장 제목으로(다른 입력칸에 초점이 있으면 그대로)
      const h = current.head?.querySelector('h2');
      const active = document.activeElement;
      const free = !active || active === document.body || active.closest?.('#nowbar, #topnav, #slidecard');
      if (h && free) h.focus({ preventScroll: true });
    }
    try { current.handle?.onBeat?.(b); } catch (err) { console.error(err); }
    rendered();
  }

  /* ── 흐름을 따라가기 ── */

  let busy = false;
  let again = false;
  function sync() {
    // 붙이는 도중(미션 visit·재생기 첫 장면 → 진도 → 흐름)에 다시 불리면 끝난 뒤 한 번 더
    if (busy) { again = true; return; }
    busy = true;
    try {
      do {
        again = false;
        const v = flow.get();
        if (!current || current.key !== v.key) {
          // 단원 표지를 떠나면(어느 길로든) 표지의 "출발" 미션을 이룬다 — missions가 아직 표지를 보고 있을 때
          if (current?.page?.auto === 'cover') missions?.act('begin');
          const hadPage = Boolean(current);
          teardown();
          beatSig = '';
          mount(v);
          // 좁은 화면은 페이지 전체가 스크롤된다 — 새 쪽은 맨 위부터 보이게
          if (hadPage && window.scrollY > 0) window.scrollTo({ top: 0 });
        }
        applyBeat(flow.get());
      } while (again);
    } finally {
      busy = false;
    }
  }

  flow.subscribe(() => sync());

  return {
    /** 지금 쪽을 다시 붙인다 — 진도 초기화 뒤 장면이 기억하던 답을 버리려고 */
    remount() {
      teardown();
      beatSig = '';
      sync();
    },
  };
}

/**
 * 보라 고리(지금 할 곳) — 화면에서 "지금 여기를 하면 돼요"인 곳 딱 하나에 .is-now를 붙인다(FINAL_SPEC §1.4).
 *
 *   N2 한 곳     .is-now는 언제나 하나. 3px 보라 고리 + 두 번 퍼지는 빛(움직임 줄이기 설정이면 고리만)
 *   N3 파란 단추  파란 단추는 지금 할 일 줄에만, 그리고 그것이 곧 .is-now
 *   N4 꼬리표     무대 안의 곳이면 그 위에 .now-tag("👆 여기를 눌러요" …)를 붙인다. body에 붙여 장면이 다시 그려져도 남는다
 *   N5 겨루는 파란 단추 없애기  무대 안의 파란 단추(.ctrl--primary 등, 계산된 바탕색이 --current)는 .is-now가 아니면 .is-demoted
 *
 * 지금 장의 첫 미션(flow.get().open)에서 곳을 찾는다. open이 없으면 지금 할 일 줄의 [계속 →].
 *   step:N → ⏭ · end → ⏩ · back → ⏮ · python → 🐍 · colab → Colab 링크 · quiz/right:N → 지금 문제의 보기 묶음
 *   ask → ❓ 슬라이드의 보기 · act:begin → [시작하기 →] · act:이름 → 무대의 [data-act~="이름"]
 *   (단계 실행 쪽에서 그 곳이 아직 없으면 ⏭ — 그림에 고를 칸이 나올 때까지)
 * 곳은 언제나 선택자로 다시 찾는다(노드를 붙잡아 두지 않는다). 다시 찾는 때: 장이 바뀔 때·진도가 바뀔 때·
 * scene:render·문제 넘기기(pager)·창 크기·무대의 DOM이 바뀔 때(rAF로 묶어서)·지금 할 일 줄을 다시 그렸을 때.
 *
 * 찾은 결과는 document의 'spotlight:change' 사건({ fallback })으로 알린다 — 지금 할 일 줄이 "(그림에 … ⏭)"를 붙인다.
 * findPager·isVisible은 지금 할 일 줄(nowBar)도 같이 쓴다.
 */
import { deckKind } from '../app/beats.js';

const TAGS = {
  press: '👆 여기를 눌러요',
  pick: '👆 하나 골라요',
  write: '✏️ 여기에 적어요',
  slide: '↔ 움직여 보세요',
  chart: '👆 그래프를 눌러요',
  check: '☑ 하나씩 체크해요',
};

const narrow = () => window.matchMedia('(max-width: 700px)').matches;

/** 화면에 보이는가 — 크기가 있고, visibility·display로 숨지 않았고, inert 안이 아니다 */
export function isVisible(node) {
  if (!node || !node.isConnected) return false;
  if (node.closest('[inert]')) return false;
  if (typeof node.checkVisibility === 'function') {
    if (!node.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true })) return false;
  } else if (getComputedStyle(node).visibility === 'hidden') return false;
  return node.getClientRects().length > 0;
}

/** 지금 장에서 보이는 첫 문제 넘기기(pager) — 슬라이드가 겹쳐 있으면 슬라이드 안에서만 찾는다 */
export function findPager() {
  const ws = document.getElementById('workspace');
  if (!ws) return null;
  const scope = ws.hasAttribute('data-overlay') ? document.getElementById('slidecard') : ws;
  if (!scope) return null;
  for (const node of scope.querySelectorAll('[data-pager]')) {
    if (node.pager && isVisible(node)) return node;
  }
  return null;
}

/** 넘기기가 다음으로 갈 수 있나(속성이 없거나 오류가 나면 아니다) */
export function pagerCan(node, dir = 'next') {
  try { return Boolean(node?.pager?.[dir === 'next' ? 'canNext' : 'canPrev']?.()); } catch { return false; }
}

function firstVisible(selector, root = document) {
  for (const node of root.querySelectorAll(selector)) if (isVisible(node)) return node;
  return null;
}

const cssEscape = (s) => (globalThis.CSS?.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'));

/** 지금 문제의 보기 묶음 — 한 문제씩 보기(pager)면 그 안에서, 아니면 아직 못 맞힌 첫 문제 */
function quizTarget(pagerEl) {
  const root = pagerEl ?? document.getElementById('workspace');
  if (!root) return null;
  const tagged = firstVisible('[data-act~="quiz"]', root);
  if (tagged) return tagged;
  for (const q of root.querySelectorAll('.quiz__q')) {
    if (q.dataset.state === 'right' || !isVisible(q)) continue;
    return q.querySelector('.quiz__opts') ?? q;
  }
  return firstVisible('.quiz__opts', root);
}

/**
 * 지금 할 곳 찾기 — { node, where: 'bar'|'stage', fallback: null|'step'|'forward' }
 * node가 null이면(지금 할 일 줄이 아직 없을 때) 아무것도 고리를 받지 않는다.
 */
export function resolveTarget(v) {
  const bar = document.getElementById('nowbar');
  const ws = document.getElementById('workspace');
  const forward = bar?.querySelector('[data-now="forward"]') ?? null;
  const inBar = (sel) => bar?.querySelector(sel) ?? null;
  const fwd = (fallback = null) => ({ node: forward, where: 'bar', fallback });

  const pagerEl = findPager();
  if (pagerEl && pagerCan(pagerEl, 'next')) return fwd();
  const open = v?.open;
  if (!open || !ws) return fwd();

  const check = open.check;
  if (check.startsWith('step:')) return { node: inBar('[data-action="step"]'), where: 'bar', fallback: null };
  if (check === 'end') return { node: inBar('[data-action="end"]'), where: 'bar', fallback: null };
  if (check === 'back') return { node: inBar('[data-action="back"]'), where: 'bar', fallback: null };
  if (check === 'python') {
    const node = firstVisible('[data-target="python"]', ws) ?? firstVisible('#panel-code [data-v="python"]', ws);
    return node ? { node, where: 'stage', fallback: null } : fwd('forward');
  }
  if (check === 'colab') {
    const node = firstVisible('a[href*="colab.research.google.com"]', ws);
    return node ? { node, where: 'stage', fallback: null } : fwd('forward');
  }
  if (check === 'quiz' || check.startsWith('right:')) {
    const node = quizTarget(pagerEl);
    return node ? { node, where: 'stage', fallback: null } : fwd('forward');
  }
  if (check === 'ask') {
    const node = firstVisible('[data-act~="ask"]', ws);
    return node ? { node, where: 'stage', fallback: null } : fwd('forward');
  }
  if (check === 'act:begin') return fwd();
  if (check.startsWith('act:')) {
    const name = check.slice(4);
    const node = firstVisible(`[data-act~="${cssEscape(name)}"]`, ws);
    if (node) return { node, where: 'stage', fallback: null };
    if (v.page && deckKind(v.page) === 'step') {
      return { node: inBar('[data-action="step"]'), where: 'bar', fallback: 'step' };
    }
    console.warn(`[spotlight] '${check}'의 [data-act~="${name}"]를 찾지 못해 [계속 →]에 고리를 둡니다 (${v.key} · ${v.beat?.id})`);
    return fwd('forward');
  }
  return fwd('forward');
}

/** 꼬리표 글 — data-act-tag가 있으면 그것 */
export function tagText(node) {
  const own = node.closest('[data-act-tag]')?.getAttribute('data-act-tag');
  if (own) return own;
  const tag = node.tagName.toLowerCase();
  const type = (node.getAttribute('type') || '').toLowerCase();
  if (tag === 'input' && type === 'range') return TAGS.slide;
  if (tag === 'input' && (type === 'checkbox' || type === 'radio')) return TAGS.check;
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return TAGS.write;
  if (tag === 'button' || tag === 'a' || node.getAttribute('role') === 'button') return TAGS.press;
  if (tag === 'svg' || tag === 'canvas') return TAGS.chart;
  if (node.querySelector('input[type="range"]')) return TAGS.slide;
  if (node.querySelector('input[type="checkbox"]')) return TAGS.check;
  if (node.querySelectorAll('button, [role="button"], [role="radio"]').length >= 2) return TAGS.pick;
  if (node.querySelector('svg, canvas')) return TAGS.chart;
  if (node.querySelector('input:not([type]), input[type="text"], input[type="search"], textarea')) return TAGS.write;
  return TAGS.press;
}

export function mountSpotlight({ flow, store } = {}) {
  const tag = document.createElement('div');
  tag.className = 'now-tag';
  tag.setAttribute('aria-hidden', 'true');
  tag.hidden = true;
  document.body.append(tag);

  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;background:var(--current);pointer-events:none';
  probe.setAttribute('aria-hidden', 'true');
  document.body.append(probe);

  let current = null;           // 지금 고리를 단 노드
  let lastIdentity = '';
  let lastFallback = undefined;
  let lastSig = '';             // 장이 바뀌었나(휴대폰 scrollIntoView)
  let scrollUntil = 0;
  let raf = 0;
  let pagerEl = null;
  const watched = new WeakSet();

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; apply(); });
  }

  /** N5 — 무대 안의 파란 바탕 단추를 .is-now가 아니면 한 단계 낮춘다(계산된 바탕색으로 가린다) */
  function demote(ws) {
    const blue = getComputedStyle(probe).backgroundColor;
    if (!blue || blue === 'transparent' || blue === 'rgba(0, 0, 0, 0)') return;   // 색 토큰을 아직 못 읽었다
    const list = ws.querySelectorAll('button, a[href], [role="button"]');
    // 바탕색 전환(transition) 중간값을 읽지 않게, 재는 동안만 전환을 끈다
    ws.classList.add('is-measuring');
    for (const b of list) b.classList.remove('is-demoted');
    for (const b of list) {
      if (b.classList.contains('is-now')) continue;
      if (getComputedStyle(b).backgroundColor === blue) b.classList.add('is-demoted');
    }
    ws.classList.remove('is-measuring');
  }

  /** 고리가 화면(그리고 그것을 품은 스크롤 칸) 안에 보이나 — 맨 위 줄·지금 할 일 줄에 가리면 아니다 */
  function inView(node) {
    const r = node.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;
    if (node.closest('#nowbar, #topnav')) return true;
    const top = document.getElementById('topnav')?.getBoundingClientRect().bottom ?? 0;
    const bottom = Math.min(window.innerHeight, document.getElementById('nowbar')?.getBoundingClientRect().top ?? window.innerHeight);
    if (r.bottom < top + 4 || r.top > bottom - 4) return false;
    for (let p = node.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowY === 'visible' && cs.overflowX === 'visible') continue;
      const pr = p.getBoundingClientRect();
      if (r.bottom < pr.top + 4 || r.top > pr.bottom - 4) return false;
    }
    return true;
  }

  function place() {
    if (!current || tag.hidden) return;
    const r = current.getBoundingClientRect();
    // 고리가 스크롤 칸 밖으로 나가 보이지 않으면 꼬리표도 숨긴다
    tag.style.visibility = inView(current) ? 'visible' : 'hidden';
    const tw = tag.offsetWidth;
    const th = tag.offsetHeight;
    const gap = 10;   // 고리(3px 띄움 + 3px)보다 바깥
    const ws = document.getElementById('workspace')?.getBoundingClientRect();
    const maxRight = (ws ? ws.right : window.innerWidth) - 8;
    const minTop = (document.getElementById('topnav')?.getBoundingClientRect().bottom ?? 0) + 2;
    const maxBottom = Math.min(window.innerHeight, document.getElementById('nowbar')?.getBoundingClientRect().top ?? window.innerHeight) - 2;
    const clampX = (x) => Math.max(8, Math.min(maxRight - tw, x));
    // 놓을 자리 후보 — 좁은 곳(k 고르기 같은)은 오른쪽 옆부터, 그다음 위 오른쪽 끝·아래 오른쪽 끝·위 왼쪽 끝
    const spots = [];
    if (r.height < 120) spots.push({ side: 'right', top: r.top + r.height / 2 - th / 2, left: r.right + gap, strict: true });
    spots.push({ side: 'above', top: r.top - th - gap, left: clampX(r.right - tw) });
    spots.push({ side: 'below', top: r.bottom + gap, left: clampX(r.right - tw) });
    spots.push({ side: 'above', top: r.top - th - gap, left: clampX(r.left) });
    const fits = (sp) => sp.top >= minTop && sp.top + th <= maxBottom && sp.left >= 8 && sp.left + tw <= maxRight;
    // 그 자리에 단추·글·그림이 있으면(고리 안쪽 말고) 가린다고 본다
    // 가리는 정도 — 꼬리표 자리의 점 9개 가운데 단추·글·그림 위에 놓이는 점의 수(0이면 아무것도 가리지 않는다)
    const covers = (sp) => {
      const pts = [];
      for (const fx of [0.02, 0.5, 0.98]) for (const fy of [0.15, 0.5, 0.85]) pts.push([sp.left + tw * fx, sp.top + th * fy]);
      return pts.filter(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        if (!hit || hit === document.body || current.contains(hit) || hit.contains(current)) return false;
        return Boolean(hit.closest('button, a, input, select, textarea, label, svg, canvas, table, h1, h2, h3, h4, p, li, dt, dd, code, pre, strong, span'));
      }).length;
    };
    // 가리지 않는 자리가 없으면 가장 덜 가리는 자리(같으면 앞 후보)
    spots.push({ side: 'below', top: r.bottom + gap, left: clampX(r.left) });
    const scored = spots.filter(fits).map((sp, i) => ({ sp, i, c: covers(sp) }));
    const pick = scored.find((x) => x.c === 0)?.sp
      ?? scored.filter((x) => !x.sp.strict).sort((a, b) => a.c - b.c || a.i - b.i)[0]?.sp
      ?? spots[spots.length > 1 ? 1 : 0];
    tag.style.top = `${Math.round(pick.top)}px`;
    tag.style.left = `${Math.round(pick.left)}px`;
    tag.dataset.side = pick.side;
  }

  function watchPager(node) {
    pagerEl = node;
    if (!node || watched.has(node)) return;
    watched.add(node);
    try { node.pager.onChange?.(() => { if (node === pagerEl) schedule(); }); } catch { /* 없는 넘기기 */ }
  }

  function apply() {
    const ws = document.getElementById('workspace');
    if (!ws || !flow) return;
    const v = flow.get();
    watchPager(findPager());
    const { node, where, fallback } = resolveTarget(v);

    if (node !== current) {
      // 같은 할 일의 곳을 장면이 다시 그린 것뿐이면 빛을 다시 퍼뜨리지 않는다(두 번만 퍼진다)
      const identity = `${v.key}#${v.index}|${v.open?.check ?? ''}|${where}|${node?.dataset?.now ?? node?.dataset?.action ?? ''}`;
      const same = identity === lastIdentity;
      lastIdentity = identity;
      for (const old of document.querySelectorAll('.is-now')) if (old !== node) old.classList.remove('is-now', 'is-now-quiet');
      node?.classList.toggle('is-now-quiet', same);
      node?.classList.add('is-now');
      current = node ?? null;
    }
    demote(ws);

    const showTag = Boolean(current) && where === 'stage';
    if (showTag) {
      const text = tagText(current);
      if (tag.textContent !== text) tag.textContent = text;
    }
    tag.hidden = !showTag;
    place();

    if (fallback !== lastFallback) {
      lastFallback = fallback;
      document.dispatchEvent(new CustomEvent('spotlight:change', { detail: { fallback } }));
    }

    // 장이 바뀌면(바뀐 뒤 장면이 늦게 그려져 곳이 바뀌어도 잠깐 동안은) 고리가 화면·스크롤 칸 밖일 때 보이게 —
    // 휴대폰은 페이지째 가운데로, 큰 화면은 그 칸 안에서만(무대는 넘치지 않으니 페이지는 움직이지 않는다)
    const sig = `${v.key}#${v.index}`;
    if (sig !== lastSig) { lastSig = sig; scrollUntil = Date.now() + 1500; }
    if (current && where === 'stage' && Date.now() < scrollUntil && !inView(current)) {
      current.scrollIntoView({ block: narrow() ? 'center' : 'nearest' });
      place();
    }
  }

  flow?.subscribe(() => schedule());
  store?.subscribe(() => schedule());
  document.addEventListener('scene:render', schedule);
  document.addEventListener('nowbar:render', schedule);
  window.addEventListener('resize', schedule);
  // 스크롤 칸이 움직이면 꼬리표만 다시 놓는다
  document.addEventListener('scroll', () => { if (!tag.hidden) requestAnimationFrame(place); }, { capture: true, passive: true });
  // 누르기만으로 aria-pressed가 바뀌는 단추(DOM은 그대로)도 다시 보게
  document.addEventListener('click', () => schedule(), true);
  const ws = document.getElementById('workspace');
  if (ws) new MutationObserver(schedule).observe(ws, { childList: true, subtree: true });
  schedule();

  return {
    /** 지금 곳을 바로 다시 찾는다(시험·다른 부품용) */
    refresh: apply,
    get target() { return current; },
  };
}

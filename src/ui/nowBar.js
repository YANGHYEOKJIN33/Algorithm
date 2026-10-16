/**
 * 지금 할 일 줄 — 맨 아래 한 줄에 "지금 할 일" 한 문장과 단추 하나(FINAL_SPEC §1.4·§1.5·§1.8·§3.2).
 *
 *   [← 도입]  ✋ 지금 할 일 1/3  🚩 3번 더 ▓▓▓░  👀 개수표의 '부리길이' 줄      [⏹][⏮ 뒤로][▶ 재생][⏩ 끝까지] 7/20 [⏭ 한 단계]  [건너뛰기 ↷]
 *            ⏭ 한 단계씩 '부리길이' 열의 True를 더해 적는 모습 보기
 *
 *  · 1줄(13px): 보라 꼬리표(✋ 지금 할 일 k/n · 📖 읽기 · 🎯 이 쪽 소개 · ❓ 확인 문제 · ✅ 정리 · 🎉 단원 끝) + 눈금 + 👀 볼 곳
 *  · 2줄(16px 굵게, 두 줄까지): 할 일 한 문장. 미션을 마치면 1초 동안 "✅ 잘했어요!"(초록)
 *  · 오른쪽: 단계 실행의 할 일 장이면 재생 단추 묶음(.nowbar__player, controls.js가 채운다) + [계속]/[건너뛰기]
 *            아니면 [계속]/[건너뛰기]만. 파란 단추는 이 줄에만 있고, 그것이 곧 보라 고리(.is-now — spotlight.js)
 *
 * [계속 →](forward) 차례 — ① 보이는 문제 넘기기(pager)가 다음으로 갈 수 있으면 다음 문제·섹션
 *                         ② 아니면 flow.forward()(다음 장, 마지막 장이면 다음 쪽)
 * [← 이전](back)       — ① pager.canPrev()면 앞 문제 ② 아니면 flow.back()
 *
 * 키(§1.5) — 글 입력칸·고르기 상자·밀대·편집 칸에 초점이 있으면 아무 키도 가로채지 않는다
 *   PageDown 계속(건너뛰기 포함, 발표용 리모컨) · PageUp 이전
 *   → 파란 단추일 때만 계속(건너뛰지 않는다) · ← 이전 — 단, 단계 실행의 할 일 장에서는 →·←·Space·Home·End가 재생기 키(controls.js)
 *   Enter 초점이 문서나 슬라이드 제목에 있을 때 파란 [계속]을 누른다
 *
 * 휴대폰(700px 이하)에서는 화면 아래에 붙는다. 실제 높이를 --bar-h에 적어 본문이 가려지지 않게 하고,
 * 글 입력칸에 초점이 있거나 화면 키보드가 열리면 붙지 않는다(body.is-typing · body.is-kb).
 */
import { el, fill } from './dom.js';
import { deckKind } from '../app/beats.js';
import { josa } from '../core/josa.js';
import { findPager, pagerCan } from './spotlight.js';

/** "✅ 잘했어요!"를 보이는 시간(ms) */
export const FLASH_MS = 1000;

/** 🖱(U+1F5B1)는 이모지 표시(U+FE0F)가 없으면 작은 글자로 보인다 */
const emoji = (t) => String(t ?? '').replace(/\u{1F5B1}(?!️)/gu, '\u{1F5B1}️');

/** '[계속 →]을' — 단추 글자에 맞는 조사(화살표는 빼고 읽는다) */
function br(label, pair = '을/를') {
  const word = String(label).replace(/[\s→↷←]+$/u, '').replace(/^[\s→↷←]+/u, '');
  return `[${label}]${josa(word || label, pair)}`;
}

const TYPING = 'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, select, [contenteditable=""], [contenteditable="true"]';
/** 키를 가로채지 않는 곳 — 글 입력칸·고르기 상자·밀대·편집 칸·화살표를 스스로 쓰는 위젯 */
const KEEP_KEYS = `${TYPING}, input[type="range"], [role="slider"], [role="radiogroup"], [role="tablist"], [role="listbox"], [role="menu"], [role="spinbutton"]`;

function isPagerSection(pagerEl) {
  return /섹션/.test(pagerEl?.pager?.label ?? '');
}

export function mountNowBar(root, { store, flow, player, missions, progress } = {}) {
  const playerSlot = root.querySelector('.nowbar__player') ?? el('div.nowbar__player', { role: 'group', 'aria-label': '실행 제어' });

  const backArrow = el('span.nowbar__arrow', { 'aria-hidden': 'true' }, '←');
  const backText = el('span.nowbar__backtext');
  const back = el('button.btn.nowbar__back', { type: 'button', 'data-now': 'back', onclick: () => goBack() }, backArrow, backText);

  const label = el('span.nowbar__label');
  const meter = el('span.nowbar__meter');
  const look = el('span.nowbar__look');
  const hint = el('span.nowbar__hint', { hidden: true }, '(그림에 고를 칸이 나올 때까지 ⏭)');
  const line1 = el('div.nowbar__line1', {}, label, meter, look, hint);
  const say = el('p.nowbar__say', { 'aria-live': 'polite' });
  const main = el('div.nowbar__main', {}, line1, say);

  const fwd = el('button.btn.nowbar__fwd', { type: 'button', 'data-now': 'forward', onclick: () => goForward() });
  const right = el('div.nowbar__right', {}, playerSlot, fwd);

  fill(root, back, main, right);
  if (!root.hasAttribute('role')) root.setAttribute('role', 'region');
  if (!root.hasAttribute('aria-label')) root.setAttribute('aria-label', '지금 할 일');

  let pv = player?.view?.() ?? { empty: true };
  let quiz = { key: null, detail: null };      // 이 쪽 문제 상자의 마지막 'quiz:answer' { answered, right, total }
  let fallback = null;                          // spotlight: 'step'이면 "(그림에 … ⏭)"
  let flashUntil = 0;
  let flashTimer = null;
  let lastSig = '';
  let pagerEl = null;
  const watched = new WeakSet();

  /* ── 앞뒤 ── */

  function goForward() {
    const p = findPager();
    if (p && pagerCan(p, 'next')) { p.pager.next(); render(); return; }
    flow.forward();
  }
  function goBack() {
    const p = findPager();
    if (p && pagerCan(p, 'prev')) { p.pager.prev(); render(); return; }
    flow.back();
  }

  function watchPager(node) {
    pagerEl = node;
    if (!node || watched.has(node)) return;
    watched.add(node);
    try { node.pager.onChange?.(() => { if (node === pagerEl) render(); }); } catch { /* 없는 넘기기 */ }
  }

  /* ── 글 ── */

  function forwardLabel(v, p) {
    if (p && pagerCan(p, 'next')) return p.pager.nextLabel ?? (isPagerSection(p) ? '다음 섹션 →' : '다음 문제 →');
    // 섹션 넘기기가 있는 읽기 장의 끝 — [계속 → 결과 확인]
    if (p && v.beat.kind === 'read' && !v.isLast && !v.skip) return `계속 → ${v.beats[v.index + 1].chip}`;
    return v.nextLabel ?? '계속 →';
  }

  function backLabel(v, p) {
    if (p && pagerCan(p, 'prev')) return isPagerSection(p) ? '이전 섹션' : '이전 문제';
    return (v.prevLabel ?? '← 이전').replace(/^←\s*/u, '');
  }

  /** 쪽 전체에서 아직 못 한 할 일 수(❓ 포함) */
  function undoneCount(v) {
    const ms = v.page.missions ?? [];
    if (!progress) return v.pageDone ? 0 : ms.length;
    const done = progress.missionsDone(v.key);
    return ms.filter((_, i) => !done[i]).length;
  }

  /** 눈금 — step:N 🚩 · end 🏁 · 문제 상자 맞힘 */
  function meterOf(v, open, p) {
    if (!open) return null;
    const c = open.check;
    if ((c.startsWith('step:') || c === 'end') && !pv.empty && pv.total > 1) {
      const last = pv.total - 1;
      const goal = c === 'end' ? last : Math.min(last, Number(c.slice(5)));
      const left = goal - pv.index;
      if (left <= 0) return null;
      const text = c === 'end' ? `🏁 ${left}장 남음` : `🚩 ${left}번 더`;
      const track = el('span.meter__track', { 'aria-hidden': 'true', style: `--p:${pv.index / last};--flag:${goal / last}` },
        el('span.meter__fill'), el('span.meter__flag', {}, c === 'end' ? '🏁' : '🚩'));
      return [el('span.meter__text', {}, text), track];
    }
    if (c === 'quiz' || c.startsWith('right:')) {
      const st = p?.pager?.stats ?? (quiz.key === v.key ? quiz.detail : null);
      const total = st?.total ?? p?.pager?.total;
      if (!total) return null;
      if (c === 'quiz') return el('span.meter__text', {}, `푼 문제 ${st?.answered ?? 0}/${total}${st ? ` · 맞힘 ${st.right ?? 0}` : ''}`);
      return el('span.meter__text', {}, `맞힘 ${st?.right ?? 0}/${Number(c.slice(6)) || total}`);
    }
    return null;
  }

  /** { label, text, meter, look } — 지금 장에 맞는 두 줄 */
  function linesOf(v, p, fwdText) {
    const kind = v.beat.kind;
    const n = (v.page.missions ?? []).length;
    const open = v.open;
    if (kind === 'intro') return { label: '🎯 이 쪽 소개', text: `목표를 읽고 ${br(fwdText)} 눌러요` };
    if (kind === 'code') return { label: '📖 읽기', text: '의사코드를 한 줄씩 읽고 [계속 →]을 눌러요' };
    if (kind === 'wrap') {
      const left = undoneCount(v);
      return { label: '✅ 정리', text: left ? `아직 못 한 할 일 ${left}개 — [다시 하기]를 눌러도 돼요` : '다 했어요! [다음 쪽 →]으로 넘어가요' };
    }
    if (kind === 'check') {
      return open
        ? { label: '❓ 확인 문제', text: '답을 하나 골라요. 처음 고른 답이 기록에 남아요.' }
        : { label: '❓ 확인 문제', text: `⭕ 맞았어요! ${br(fwdText)} 눌러요` };
    }
    if (kind === 'read') {
      if (v.page.auto === 'review' && v.isLast) return { label: '🎉 단원 끝', text: `수고했어요! ${br(fwdText)} 눌러요` };
      return { label: '📖 읽기', text: `읽고 ${br(fwdText)} 눌러요` };
    }
    // work
    if (!open) {
      return {
        label: '✋ 지금 할 일 ✅',
        text: v.pending ? '잘했어요! 다음 장으로 넘어가요' : `다 했어요! ${br(fwdText)} 눌러요`,
      };
    }
    let text = emoji(open.text);
    // 표지의 출발 — 마친 쪽이 있으면 단추가 [이어서 하기 →]
    if (open.check === 'act:begin' && fwdText !== '시작하기 →' && /\[시작하기 →\]/.test(text)) {
      text = text.replace(/\[시작하기 →\]를/, br(fwdText)).replace('첫 쪽으로', '못 한 쪽으로');
    }
    return { label: `✋ 지금 할 일 ${open.i + 1}/${n}`, text, meter: meterOf(v, open, p), look: open.look };
  }

  /* ── 그리기 ── */

  function render() {
    const v = flow.get();
    const p = findPager();
    watchPager(p);
    const sig = `${v.key}#${v.index}`;
    if (sig !== lastSig) {
      lastSig = sig;
      if (flashUntil) { flashUntil = 0; clearTimeout(flashTimer); }
    }

    const step = deckKind(v.page) === 'step';
    const run = step && v.beat.kind === 'work';
    document.body.classList.toggle('is-run', run);
    document.body.dataset.beatKind = v.beat.kind;
    root.dataset.kind = v.beat.kind;
    playerSlot.hidden = !run;

    // 앞으로
    const pagerNext = Boolean(p && pagerCan(p, 'next'));
    const blue = pagerNext || !v.skip;
    const fwdText = forwardLabel(v, p);
    if (fwd.textContent !== fwdText) fwd.textContent = fwdText;
    fwd.classList.toggle('btn--primary', blue);
    fwd.classList.toggle('btn--ghost', !blue);
    fwd.disabled = !v.nextLabel && !pagerNext;
    fwd.title = blue ? `${fwdText} (Enter · PageDown)` : '이 장을 건너뛰어요. 할 일은 ☐로 남아요 (PageDown)';

    // 뒤로
    const bt = backLabel(v, p);
    if (backText.textContent !== bt) backText.textContent = bt;
    back.disabled = !v.prevLabel && !(p && pagerCan(p, 'prev'));
    back.title = `← ${bt} (PageUp)`;
    back.setAttribute('aria-label', `이전: ${bt}`);

    // 두 줄
    const lines = linesOf(v, p, fwdText);
    if (label.textContent !== lines.label) label.textContent = lines.label;
    fill(meter, lines.meter ?? null);
    meter.hidden = !lines.meter;
    look.textContent = lines.look ? `👀 ${lines.look}` : '';
    look.hidden = !lines.look;
    hint.hidden = !(fallback === 'step' && v.open?.check?.startsWith('act:'));

    const flashing = flashUntil > Date.now();
    const text = flashing ? '✅ 잘했어요!' : lines.text;
    if (say.textContent !== text) say.textContent = text;
    say.classList.toggle('is-flash', flashing);

    document.dispatchEvent(new CustomEvent('nowbar:render'));
  }

  // 같은 틀(rAF) 안의 여러 부름은 한 번만
  let raf = 0;
  const soon = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };

  flow.subscribe(() => render());
  player?.subscribe((view) => {
    pv = view;
    if (flow.get().open) soon();
  });
  missions?.onComplete((ev) => {
    const v = flow.get();
    if (ev?.key !== v.key || !v.beat.checks.includes(ev.mission?.check)) return;
    flashUntil = Date.now() + FLASH_MS;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { flashUntil = 0; render(); }, FLASH_MS);
    render();
  });
  document.addEventListener('quiz:answer', (e) => {
    quiz = { key: flow.get().key, detail: e.detail ?? null };
    soon();
  });
  document.addEventListener('scene:render', soon);
  document.addEventListener('spotlight:change', (e) => { fallback = e.detail?.fallback ?? null; soon(); });
  document.getElementById('workspace')?.addEventListener('click', soon);
  store?.subscribe((s, prev) => { if (s.scale !== prev.scale) soon(); });

  /* ── 키 ── */

  const onHeading = (node) => !node || node === document.body || node === document.documentElement
    || Boolean(node.matches?.('#slidecard h1, #slidecard h2, #slidecard h3, .beat-head, .beat-head h2, [data-slide-heading]'));

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t?.closest?.(KEEP_KEYS) || t?.isContentEditable) return;
    if (document.querySelector('.modal__backdrop:not([hidden]), .tn-pop:not([hidden])')) return;
    const run = document.body.classList.contains('is-run');
    const blue = fwd.classList.contains('btn--primary') && !fwd.disabled;
    switch (e.key) {
      case 'PageDown':
        e.preventDefault(); goForward(); break;
      case 'PageUp':
        e.preventDefault(); goBack(); break;
      case 'ArrowRight':
        if (run) return;
        if (blue) { e.preventDefault(); goForward(); }
        break;
      case 'ArrowLeft':
        if (run || back.disabled) return;
        e.preventDefault(); goBack(); break;
      case 'Enter':
        if (!onHeading(t)) return;
        if (blue && fwd.classList.contains('is-now')) { e.preventDefault(); fwd.click(); }
        break;
      default:
    }
  });

  /* ── 휴대폰: 아래에 붙는 줄 ── */

  const setBarH = () => document.documentElement.style.setProperty('--bar-h', `${Math.round(root.getBoundingClientRect().height)}px`);
  if (typeof ResizeObserver === 'function') new ResizeObserver(setBarH).observe(root);
  const typing = (node) => Boolean(node?.matches?.(TYPING));
  document.addEventListener('focusin', (e) => document.body.classList.toggle('is-typing', typing(e.target)));
  document.addEventListener('focusout', () => setTimeout(() => document.body.classList.toggle('is-typing', typing(document.activeElement)), 0));
  const vv = globalThis.visualViewport;
  vv?.addEventListener('resize', () => document.body.classList.toggle('is-kb', window.innerHeight - vv.height > 120));

  render();
  return { render, forward: goForward, back: goBack };
}

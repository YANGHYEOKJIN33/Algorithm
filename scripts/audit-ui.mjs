/**
 * 화면 점검기 — "한 장에 한 가지"(FINAL_SPEC §6.1)를 진짜 브라우저로 모든 쪽 × 모든 장에서 확인한다.
 * npm test에는 들어 있지 않다(Playwright와 켜 둔 로컬 서버가 있어야 한다).
 *
 *   python3 -m http.server 8822 &                    # 저장소 뿌리에서 서버 켜기
 *   node scripts/audit-ui.mjs                        # 모든 쪽 × 모든 장 점검(실패가 있으면 종료 코드 1)
 *   node scripts/audit-ui.mjs --only 2-2,5-4         # 몇 쪽만('2-표지', '2-정리'처럼 표지·정리도)
 *   node scripts/audit-ui.mjs --shots <폴더>          # §6.2 스크린숏 묶음만 찍기
 *   node scripts/audit-ui.mjs --base http://localhost:8000/ --no-phone --no-600 --verbose   (--verbose: C8에 조작 요소 목록)
 *
 * Playwright는 import('playwright') → PLAYWRIGHT_PATH → /opt/node22/lib/node_modules/playwright 차례로 찾는다.
 *
 * 기준(§6.1의 번호)
 *   C1  .is-now가 딱 하나, 보이고 화면 안에 있다
 *   C2  파란 바탕(--current) 단추·링크는 1개까지, 있으면 #nowbar 안의 .is-now
 *   C3  지금 할 일(open.text)은 #nowbar에만 보인다(정리 장의 "이 쪽에서 한 일"·단원 정리 스스로 점검 장 빼고).
 *       할 일 장에서는 그 글이 #nowbar에 꼭 있어야 한다(❓ 확인 장은 §2.7의 따로 정한 안내 글)
 *   C4  없어진 화면 틀 선택자가 하나도 없다
 *   C5  #topnav 48±2px, #nowbar 72±4px
 *   C6  슬라이드·표지·정리·Colab·읽기 장은 스크롤이 없다(1280×720과 1280×600)
 *   C7  장면 덩어리 장: 보이는 [data-beat]가 3개까지이고 그 장의 show와 같다(5-4 영역 색칠 장은 고정 표대로 4개)
 *   C8  보이는 조작 요소 — 슬라이드·읽기 장 18개까지, 할 일 장 26개까지(장 칩·1-1 HTML 글자 칸은 빼고 센다)
 *   C9  콘솔 오류 없음 · 390×844에서 가로 스크롤 없음 · 휴대폰에서 장을 바꾸면 .is-now가 화면 안에
 *   C10 어두운 테마·움직임 줄이기(§6.2 표본): C1·C2, 고리 대비 3:1 이상, 움직임 없음
 *   C11 동작: 2-2 → 아홉 번이면 뒤로 보기 장 · 5-4 ★ 옮기면 파란 [계속] · 새로 고쳐도 같은 장 · PageDown은 ☐로 남기고 넘김
 */
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TABS, unitPages } from '../src/app/lessons.js';
import { pageBeats, deckKind } from '../src/app/beats.js';

/* ── 인자 ── */
const argv = process.argv.slice(2);
const opt = (name, dflt = null) => { const i = argv.indexOf(name); return i >= 0 ? (argv[i + 1] ?? dflt) : dflt; };
const flag = (name) => argv.includes(name);
const BASE = opt('--base', 'http://localhost:8822/');
const ONLY = opt('--only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;
const VERBOSE = flag('--verbose');
const SHOTS = flag('--shots') ? (opt('--shots') && !opt('--shots').startsWith('--') ? opt('--shots') : join(tmpdir(), 'redesign', 'after')) : null;

/** 허용된 예외 — 고정 표(FINAL_SPEC §4.4)가 덩어리 4개로 정한 장 */
const SHOW_LIMIT_EXCEPT = new Set(['ml:knn:idea#region']);
const REMOVED = '#topbar, #lessonbar, #controlbar, #actionbar, .missions, .askpop, .lesson__toast, .modetabs, .subtabs, .sitefoot, .ustrip';

async function loadPlaywright() {
  const tries = ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/node22/lib/node_modules/playwright/index.mjs'].filter(Boolean);
  for (const t of tries) {
    try { return await import(t); } catch { /* 다음 */ }
  }
  console.error('Playwright를 찾지 못했어요. npm i -D playwright 하거나 PLAYWRIGHT_PATH를 알려 주세요.');
  process.exit(2);
}

/* ── 점검할 쪽·장 목록(Node에서 수업 내용으로 만든다) ── */
function allStates() {
  const out = [];
  for (const tab of TABS) {
    for (const it of unitPages(tab)) {
      const label = it.page.auto ? `${tab.unit.no}-${it.label}` : it.label;
      const beats = pageBeats(tab, it.sub, it.page);
      const deck = deckKind(it.page);
      const key = `${tab.id}${it.sub ? `:${it.sub.id}` : ''}:${it.page.id}`;
      beats.forEach((b, i) => out.push({
        label, key, deck, tab: tab.id, sub: it.sub?.id ?? null, pageId: it.page.id, ask: it.page.ask ?? null,
        i, beat: { id: b.id, kind: b.kind, chip: b.chip, show: b.show, overlay: b.overlay, checks: b.checks },
      }));
    }
  }
  return out;
}
const STATES = allStates();
const pick = (label, i) => STATES.find((s) => s.label === label && s.i === i);
const beatsOfLabel = (label) => STATES.filter((s) => s.label === label);
const name = (s) => `${s.label.padEnd(5)} #${s.i} ${s.beat.chip} (${s.beat.kind})`;

/* ── 브라우저 안에서 쓰는 함수 ── */

/** 쪽·장으로 가서 화면이 가라앉을 때까지 기다린다 */
async function goto(page, s, wait = 260) {
  await page.evaluate(async ({ tab, pageId, sub, i }) => {
    const nav = await import('/src/app/nav.js');
    globalThis.__lab.store.set(nav.visitPatch(tab, pageId, sub, i));
  }, { tab: s.tab, pageId: s.pageId, sub: s.sub, i: s.i });
  await settle(page, wait);
  const at = await page.evaluate(() => { const v = globalThis.__lab.flow.get(); return { key: v.key, index: v.index }; });
  return at.key === s.key && at.index === s.i ? null : `이동 실패: ${at.key}#${at.index}`;
}

function settle(page, ms = 260) {
  return page.evaluate((t) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, t)))), ms);
}

/** 한 상태의 측정값 — 기준 판정은 Node에서 */
function measure() {
  const vis = (n) => {
    if (!n || !n.isConnected || n.closest('[inert]')) return false;
    if (typeof n.checkVisibility === 'function' && !n.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true })) return false;
    return n.getClientRects().length > 0;
  };
  const W = innerWidth;
  const H = innerHeight;
  const inViewport = (n) => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= -1 && r.left >= -1 && r.bottom <= H + 1 && r.right <= W + 1; };
  /** 맨 위 줄과 지금 할 일 줄 사이(가리지 않는 띠)에 보이는가 — 띠보다 큰 곳은 띠의 절반 이상이 보이면 된다 */
  const inBand = (n) => {
    const r = n.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;
    if (n.closest('#nowbar, #topnav')) return inViewport(n);
    const t = Math.max(0, document.getElementById('topnav')?.getBoundingClientRect().bottom ?? 0);
    const b = Math.min(H, document.getElementById('nowbar')?.getBoundingClientRect().top ?? H);
    const seen = Math.min(r.bottom, b) - Math.max(r.top, t);
    return seen >= Math.min(r.height - 2, (b - t) * 0.5);
  };
  const desc = (n) => `${n.tagName.toLowerCase()}${n.id ? `#${n.id}` : ''}${n.className && typeof n.className === 'string' ? `.${n.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''} "${(n.innerText ?? n.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 24)}"`;

  const v = globalThis.__lab.flow.get();
  const ws = document.getElementById('workspace');
  const bar = document.getElementById('nowbar');
  const top = document.getElementById('topnav');

  // C1
  const nows = [...document.querySelectorAll('.is-now')];
  const now = nows[0] ?? null;

  // C2 — --current 색과 같은 바탕의 보이는 단추·링크
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;width:1px;height:1px;background:var(--current)';
  document.body.append(probe);
  const blueColor = getComputedStyle(probe).backgroundColor;
  probe.remove();
  const blues = [...document.querySelectorAll('button, a')].filter((n) => vis(n) && getComputedStyle(n).backgroundColor === blueColor)
    .map((n) => ({ desc: desc(n), inBar: Boolean(n.closest('#nowbar')), isNow: n.classList.contains('is-now') }));

  // C3
  const norm = (t) => String(t ?? '').replace(/\uFE0F/g, '').replace(/\s+/g, ' ');
  const count = (hay, needle) => (needle ? hay.split(needle).length - 1 : 0);
  const openText = v.open?.text ?? null;
  const bodyText = norm(document.body.innerText);
  const barText = norm(bar?.innerText);
  const outside = openText ? count(bodyText, norm(openText)) - count(barText, norm(openText)) : 0;
  const inBar = openText ? count(barText, norm(openText)) : 0;

  // C4
  const removed = [...document.querySelectorAll(REMOVED_SEL)].map(desc);

  // C5
  const topH = top?.getBoundingClientRect().height ?? 0;
  const barH = bar?.getBoundingClientRect().height ?? 0;

  // C6
  const sc = (n) => (n && vis(n) ? { h: n.scrollHeight, c: n.clientHeight } : null);
  const se = document.scrollingElement;
  const scroll = {
    doc: { h: se.scrollHeight, c: se.clientHeight },
    slide: ws?.hasAttribute('data-overlay') ? sc(document.getElementById('slidecard')) : null,
    view: ws?.hasAttribute('data-overlay') ? null : sc(document.getElementById('panel-view')),
    body: ws?.hasAttribute('data-overlay') ? null : sc(document.querySelector('#panel-view .view__body')),
  };

  // C7
  const beatsVisible = ws?.hasAttribute('data-overlay') ? [] : [...new Set([...document.querySelectorAll('#panel-view [data-beat]')].filter(vis).map((n) => n.getAttribute('data-beat')))];

  // C8
  const ctrls = [...document.querySelectorAll('button, a[href], input, select, [tabindex="0"]')]
    // 장 칩(맨 위 줄의 진도 표시 겸 바로 가기)과 1-1의 HTML 글자 칸(탐험 대상 자체)은 겨루는 조작이 아니라 빼고 센다
    .filter((n) => vis(n) && n.tagName !== 'TD' && !n.closest('svg') && !n.classList.contains('quiz__opt')
      && !n.classList.contains('tn-chip') && !n.classList.contains('html__cell'));

  // C9
  const hscroll = se.scrollWidth > se.clientWidth + 1;

  // C10 — 고리 색과 고리 바깥 바탕색, 움직임
  let ring = null;
  if (now) {
    const cs = getComputedStyle(now);
    let bg = 'rgba(0, 0, 0, 0)';
    for (let p = now.parentElement; p; p = p.parentElement) {
      const b = getComputedStyle(p).backgroundColor;
      if (b && b !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(b)) { bg = b; break; }
    }
    if (bg === 'rgba(0, 0, 0, 0)') bg = getComputedStyle(document.body).backgroundColor;
    ring = { color: cs.outlineColor, width: cs.outlineWidth, bg, anim: cs.animationName };
  }
  const running = document.getAnimations().filter((a) => a.playState === 'running' && (a.effect?.getComputedTiming?.().duration ?? 0) > 5)
    .map((a) => a.animationName ?? a.constructor.name);

  return {
    key: v.key, index: v.index, open: v.open?.check ?? null, skip: v.skip,
    nowCount: nows.length, nowDesc: nows.map(desc), nowVisible: now ? vis(now) : false, nowInViewport: now ? inViewport(now) || inBand(now) : false, nowInBand: now ? inBand(now) : false,
    blues, openText, outside, inBar, removed, topH, barH, scroll, beatsVisible,
    ctrlCount: ctrls.length, ctrlSample: ctrls.slice(0, 40).map(desc), hscroll, ring, running,
    overlay: ws?.getAttribute('data-overlay') ?? null,
  };
}

/* ── 판정 ── */

function parseColor(c) {
  let m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  m = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(c);
  if (m) return [Number(m[1]) * 255, Number(m[2]) * 255, Number(m[3]) * 255];
  return null;
}
function contrast(a, b) {
  const L = (rgb) => {
    const [r, g, bl] = rgb.map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const SCROLL_DECKS = new Set(['cover', 'review', 'colab']);
const noScrollBeat = (s) => s.beat.overlay || s.beat.kind === 'read' || SCROLL_DECKS.has(s.deck);

/** 한 상태의 실패 목록 [{ c, msg }] — vp는 '1280×720' 같은 이름 */
function judge(s, m, vp, { full = true } = {}) {
  const f = [];
  const bad = (c, msg) => f.push({ c, msg });
  // C1
  if (m.nowCount !== 1) bad('C1', `.is-now ${m.nowCount}개 ${m.nowDesc.join(' / ')}`);
  else if (!m.nowVisible || !m.nowInViewport) bad('C1', `.is-now가 ${m.nowVisible ? '화면 밖' : '보이지 않음'}: ${m.nowDesc[0]}`);
  // C2
  if (m.blues.length > 1) bad('C2', `파란 단추 ${m.blues.length}개: ${m.blues.map((b) => b.desc).join(' / ')}`);
  else if (m.blues.length === 1 && !(m.blues[0].inBar && m.blues[0].isNow)) bad('C2', `파란 단추가 ${m.blues[0].inBar ? '.is-now가 아님' : `#nowbar 밖(${m.blues[0].isNow ? '.is-now인 무대 단추' : '.is-now 아님 — 낮추지 않음'})`}: ${m.blues[0].desc}`);
  if (!full) return f;
  // C3
  const exempt = s.beat.kind === 'wrap' || (s.deck === 'review' && s.beat.id === 'self');
  if (m.openText && !exempt && m.outside > 0) bad('C3', `할 일 글이 #nowbar 밖에도 보인다: "${m.openText}"`);
  if (m.openText && s.beat.kind === 'work' && m.inBar < 1) bad('C3', `할 일 글이 #nowbar에 없다: "${m.openText}"`);
  // C4
  if (m.removed.length) bad('C4', `없어진 틀: ${m.removed.join(', ')}`);
  // C5
  if (vp === '1280×720') {
    if (Math.abs(m.topH - 48) > 2) bad('C5', `#topnav 높이 ${m.topH.toFixed(1)}px`);
    if (Math.abs(m.barH - 72) > 4) bad('C5', `#nowbar 높이 ${m.barH.toFixed(1)}px`);
  }
  // C6
  if (noScrollBeat(s)) {
    for (const [k, x] of Object.entries(m.scroll)) {
      if (x && x.h > x.c + 1) bad('C6', `${k === 'doc' ? '문서' : k === 'slide' ? '#slidecard' : k === 'view' ? '#panel-view' : '.view__body'} 스크롤 ${x.h}>${x.c} (+${x.h - x.c}px)`);
    }
  }
  // C7
  if (!s.beat.overlay && Array.isArray(s.beat.show)) {
    const want = [...s.beat.show].sort();
    const got = [...m.beatsVisible].sort();
    const limit = SHOW_LIMIT_EXCEPT.has(`${s.key}#${s.beat.id}`) ? 4 : 3;
    if (got.length > limit) bad('C7', `보이는 덩어리 ${got.length}개(${limit}개까지): ${got.join(', ')}`);
    if (want.join() !== got.join()) bad('C7', `보이는 덩어리 [${got.join(', ')}] ≠ show [${want.join(', ')}]`);
  }
  // C8
  const cap = s.beat.overlay || s.beat.kind === 'read' ? 18 : 26;
  if (m.ctrlCount > cap) bad('C8', `조작 요소 ${m.ctrlCount}개(${cap}개까지)${VERBOSE ? `: ${m.ctrlSample.join(' | ')}` : ''}`);
  return f;
}

/* ── 실행 ── */

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const failures = [];   // { where, c, msg }
const report = (where, list) => list.forEach((x) => failures.push({ where, ...x }));
let consoleWhere = 'start';

async function openPage({ width, height, colorScheme = 'light', reducedMotion = 'no-preference', errors = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript((sel) => { globalThis.REMOVED_SEL = sel; }, REMOVED);
  if (errors) {
    page.on('console', (msg) => { if (msg.type() === 'error') failures.push({ where: `${consoleWhere} @${width}×${height}`, c: 'C9', msg: `콘솔 오류: ${msg.text().slice(0, 160)}` }); });
    page.on('pageerror', (e) => failures.push({ where: `${consoleWhere} @${width}×${height}`, c: 'C9', msg: `페이지 오류: ${String(e).slice(0, 160)}` }));
  }
  await page.goto(BASE);
  await page.waitForFunction(() => globalThis.__lab?.flow);
  await settle(page, 300);
  return { ctx, page };
}

const wanted = (s) => !ONLY || ONLY.includes(s.label);

async function pass({ width, height, filter = () => true, full = true, extra = null, wait = 260 }) {
  const vp = `${width}×${height}`;
  const { ctx, page } = await openPage({ width, height });
  let n = 0;
  for (const s of STATES.filter((x) => wanted(x) && filter(x))) {
    consoleWhere = name(s);
    const miss = await goto(page, s, wait);
    if (miss) { report(`${name(s)} @${vp}`, [{ c: 'NAV', msg: miss }]); continue; }
    const m = await page.evaluate(measure);
    const list = extra ? extra(s, m) : judge(s, m, vp, { full });
    report(`${name(s)} @${vp}`, list);
    n += 1;
  }
  await ctx.close();
  return n;
}

async function audit() {
  const t0 = Date.now();
  const counts = {};
  counts['1280×720'] = await pass({ width: 1280, height: 720 });
  if (!flag('--no-600')) {
    counts['1280×600 (C6)'] = await pass({
      width: 1280, height: 600, filter: noScrollBeat,
      extra: (s, m) => judge(s, m, '1280×600').filter((x) => x.c === 'C6'),
    });
  }
  if (!flag('--no-phone')) {
    counts['390×844 (C9)'] = await pass({
      width: 390, height: 844, wait: 450,
      extra: (s, m) => {
        const f = [];
        if (m.hscroll) f.push({ c: 'C9', msg: '가로 스크롤이 생긴다' });
        if (m.nowCount !== 1) f.push({ c: 'C9', msg: `휴대폰 .is-now ${m.nowCount}개` });
        else if (!m.nowInBand) f.push({ c: 'C9', msg: `휴대폰에서 .is-now가 화면 밖(또는 맨 위 줄·지금 할 일 줄에 가림): ${m.nowDesc[0]}` });
        return f;
      },
    });
  }
  counts['dark·reduced (C10)'] = await themePass();
  if (!ONLY) await behaviour();
  return { counts, secs: Math.round((Date.now() - t0) / 1000) };
}

/** §6.2 표본에서 어두운 테마·움직임 줄이기 */
const SAMPLE = [['0-1', 0], ['0-1', 1], ['0-2', 1], ['0-3', 3], ['0-5', 1], ['2-표지', 0], ['2-표지', 1], ['2-표지', 2],
  ['2-2', 0], ['2-2', 1], ['2-2', 2], ['2-2', 3], ['2-2', 4], ['2-2', 5], ['2-6', 1], ['2-6', 2], ['2-6', 3],
  ['5-4', 1], ['5-4', 2], ['5-4', 3], ['2-정리', 2], ['2-정리', 3], ['6-4', 1], ['6-4', 4]];

async function themePass() {
  let n = 0;
  for (const mode of [{ colorScheme: 'dark', reducedMotion: 'no-preference', tag: 'dark' }, { colorScheme: 'light', reducedMotion: 'reduce', tag: 'reduced' }, { colorScheme: 'dark', reducedMotion: 'reduce', tag: 'dark+reduced' }]) {
    const { ctx, page } = await openPage({ width: 1280, height: 720, ...mode });
    for (const [label, i] of SAMPLE) {
      const s = pick(label, i);
      if (!s || !wanted(s)) continue;
      consoleWhere = name(s);
      const where = `${name(s)} @${mode.tag}`;
      const miss = await goto(page, s, mode.reducedMotion === 'reduce' ? 400 : 260);
      if (miss) { report(where, [{ c: 'NAV', msg: miss }]); continue; }
      const m = await page.evaluate(measure);
      const f = judge(s, m, '1280×720', { full: false }).map((x) => ({ ...x, c: `C10/${x.c}` }));
      if (m.ring) {
        const a = parseColor(m.ring.color);
        const b = parseColor(m.ring.bg);
        const r = a && b ? contrast(a, b) : 0;
        if (r < 3) f.push({ c: 'C10', msg: `고리 대비 ${r.toFixed(2)}:1 (${m.ring.color} / ${m.ring.bg})` });
        if (mode.reducedMotion === 'reduce' && m.ring.anim !== 'none') f.push({ c: 'C10', msg: `움직임 줄이기인데 고리 animation=${m.ring.anim}` });
      }
      if (mode.reducedMotion === 'reduce' && m.running.length) f.push({ c: 'C10', msg: `움직임 줄이기인데 도는 애니메이션: ${m.running.join(', ')}` });
      report(where, f);
      n += 1;
    }
    await ctx.close();
  }
  return n;
}

/** C11 — 동작 */
async function behaviour() {
  const { ctx, page } = await openPage({ width: 1280, height: 720 });
  const B = (msg) => failures.push({ where: 'C11 동작', c: 'C11', msg });
  const flowAt = () => page.evaluate(() => { const v = globalThis.__lab.flow.get(); return { key: v.key, index: v.index, chip: v.beat.chip }; });

  // ① 2-2 '장면 10까지' 장에서 → 아홉 번 → 뒤로 보기 장, ⏮에 고리
  consoleWhere = 'C11 2-2';
  const s22 = beatsOfLabel('2-2').find((s) => s.beat.checks.includes('step:9'));
  if (!s22) B('2-2에 step:9 장이 없다');
  else {
    await goto(page, s22);
    await page.evaluate(() => { document.activeElement?.blur?.(); });
    for (let k = 0; k < 9; k += 1) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(60); }
    let ok = false;
    for (let t = 0; t < 20 && !ok; t += 1) {
      await page.waitForTimeout(100);
      const at = await flowAt();
      ok = at.chip === '뒤로 보기' && await page.evaluate(() => Boolean(document.querySelector('#nowbar [data-action="back"].is-now')));
    }
    const at = await flowAt();
    if (!ok) B(`2-2: → 아홉 번 뒤 2초 안에 '뒤로 보기' 장 + ⏮ 고리가 아니다(지금 #${at.index} ${at.chip})`);
  }

  // ② 5-4 ★ 옮기기 — 이루면 [계속]이 파래지고 보이는 덩어리는 그대로
  consoleWhere = 'C11 5-4';
  const s54 = beatsOfLabel('5-4').find((s) => s.beat.checks.includes('act:move-star'));
  if (s54) {
    await goto(page, s54);
    const before = await page.evaluate(measure);
    const box = await page.locator('#workspace [data-act~="move-star"]').first().boundingBox();
    if (!box) B('5-4: [data-act~="move-star"] 그래프를 찾지 못했다');
    else {
      await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.35);
      await settle(page, 400);
      const after = await page.evaluate(measure);
      const blueNow = after.blues.length === 1 && after.blues[0].inBar && after.blues[0].isNow;
      if (!blueNow) B(`5-4: ★을 옮긴 뒤 [계속 →]이 파란 .is-now가 아니다 (파란 단추 ${after.blues.length}개, 지금 할 일 ${after.open})`);
      if (before.beatsVisible.sort().join() !== after.beatsVisible.sort().join()) B(`5-4: ★을 옮기자 보이는 덩어리가 바뀌었다 ${before.beatsVisible} → ${after.beatsVisible}`);
      if (after.index !== s54.i) B(`5-4: ★을 옮기자 장이 저절로 바뀌었다(#${after.index})`);
    }
  }

  // ③ 새로 고쳐도 같은 쪽·장
  consoleWhere = 'C11 reload';
  for (const [label, i] of [['2-2', 3], ['5-4', 2], ['2-표지', 1], ['6-4', 4], ['2-6', 2]]) {
    const s = pick(label, i);
    if (!s) continue;
    await goto(page, s);
    await page.reload();
    await page.waitForFunction(() => globalThis.__lab?.flow);
    await settle(page, 300);
    const at = await flowAt();
    if (at.key !== s.key || at.index !== s.i) B(`새로 고침: ${label} #${i} → ${at.key} #${at.index}`);
  }

  // ④ PageDown — 안 끝난 할 일 장을 넘기고 미션은 ☐
  consoleWhere = 'C11 PageDown';
  const s21 = beatsOfLabel('2-1').find((s) => s.beat.kind === 'work');
  if (s21) {
    await goto(page, s21);
    await page.evaluate(() => { document.activeElement?.blur?.(); });
    await page.keyboard.press('PageDown');
    await settle(page, 200);
    const at = await flowAt();
    const done = await page.evaluate((k) => globalThis.__lab.progress.missionsDone(k), s21.key);
    if (at.index !== s21.i + 1) B(`PageDown: 2-1 #${s21.i}에서 #${at.index}(다음 장 #${s21.i + 1}이어야)`);
    if (Object.values(done ?? {}).some(Boolean)) B('PageDown: 건너뛴 미션이 ✅가 됐다');
  }
  await ctx.close();
}

/* ── 스크린숏 묶음(§6.2) ── */

async function answerOne(page, wantRight) {
  // 보이는 한 문제씩 보기에서 지금 문제를 맞히거나(wantRight) 한 번 틀린다
  for (let k = 0; k < 4; k += 1) {
    const state = await page.evaluate(() => document.querySelector('.quiz__q--one')?.dataset.state ?? null);
    if (wantRight && state === 'right') return;
    const opts = page.locator('.quiz__q--one .quiz__opt:visible');
    const n = await opts.count();
    if (k >= n) return;
    await opts.nth(k).click();
    await settle(page, 120);
    if (!wantRight) return;
  }
}

async function shots(dir) {
  mkdirSync(dir, { recursive: true });
  const take = async (page, file) => { await settle(page, 350); await page.screenshot({ path: join(dir, `${file}.png`) }); console.log(`📸 ${file}.png`); };
  const at = async (page, label, i) => { const s = pick(label, i); if (!s) { console.log(`  (없음: ${label} #${i})`); return null; } await goto(page, s); return s; };
  const idx = (label, test) => beatsOfLabel(label).find(test)?.i;

  let { ctx, page } = await openPage({ width: 1280, height: 720, errors: false });
  await at(page, '0-1', 0); await take(page, 's01-0-1-intro');
  await at(page, '0-1', 1); await take(page, 's02-0-1-try');
  await at(page, '0-2', 1); await take(page, 's03-0-2-hook');
  await at(page, '0-3', 3); await take(page, 's04-0-3-run');
  await at(page, '0-5', 1); await take(page, 's05-0-5-read');
  for (const i of [0, 1, 2]) { await at(page, '2-표지', i); await take(page, `s06-2-cover-${i}`); }
  for (const s of beatsOfLabel('2-2')) {
    await goto(page, s);
    if (s.beat.kind === 'check' && s.ask) {
      const wrong = s.ask.answer === 0 ? 1 : 0;
      await page.locator('[data-act~="ask"] .quiz__opt').nth(wrong).click();
    }
    await take(page, `s07-2-2-${s.i}-${s.beat.id}`);
  }
  const endI = idx('2-4', (s) => s.beat.checks.includes('end'));
  if (endI !== undefined) { await at(page, '2-4', endI); await take(page, 's08-2-4-end'); }
  for (const i of [1, 2, 3]) {
    await at(page, '2-6', i);
    if (i === 2) await page.evaluate(() => { const p = document.querySelector('#workspace [data-pager]'); if (p?.pager?.canNext()) p.pager.next(); });
    await take(page, `s09-2-6-${i}`);
  }
  for (const i of [1, 2, 3]) { await at(page, '5-4', i); await take(page, `s10-5-4-${i}`); }
  const casesI = idx('5-1', (s) => s.beat.id === 'cases');
  if (casesI !== undefined) { await at(page, '5-1', casesI); await take(page, 's11-5-1-cases'); }
  for (const i of [0, 1, 2, 3, 4]) {
    await at(page, '2-정리', i);
    if (i === 2) { await answerOne(page, true); await page.evaluate(() => { const p = document.querySelector('#workspace [data-pager]'); if (p?.pager?.canNext()) p.pager.next(); }); }
    await take(page, `s12-2-review-${i}`);
  }
  const q63 = idx('6-3', (s) => s.beat.id === 'quiz');
  if (q63 !== undefined) {
    await at(page, '6-3', q63);
    for (let k = 0; k < 2; k += 1) { await answerOne(page, true); await page.evaluate(() => { const p = document.querySelector('#workspace [data-pager]'); if (p?.pager?.canNext()) p.pager.next(); }); }
    await take(page, 's13-6-3-quiz');
    await at(page, '6-3', q63 + 1); await take(page, 's13-6-3-result');
  }
  for (const i of [1, 2, 3, 4]) { await at(page, '6-4', i); await take(page, `s14-6-4-${i}`); }
  const stepK = idx('5-5', (s) => s.beat.checks.includes('act:step-k'));
  if (stepK !== undefined) { await at(page, '5-5', stepK); await take(page, 's18-5-5-step-k'); }
  await ctx.close();

  const run22 = idx('2-2', (s) => s.beat.checks.includes('step:9')) ?? 2;
  for (const [w, h] of [[1366, 768], [1280, 600]]) {
    ({ ctx, page } = await openPage({ width: w, height: h, errors: false }));
    await at(page, '2-2', run22); await take(page, `s15-2-2-run-${w}x${h}`);
    await at(page, '2-표지', 2); await take(page, `s15-2-cover-2-${w}x${h}`);
    await ctx.close();
  }
  ({ ctx, page } = await openPage({ width: 390, height: 844, errors: false }));
  await at(page, '2-2', run22); await settle(page, 400); await take(page, 's16-2-2-run-phone');
  await at(page, '5-4', 2); await settle(page, 400); await take(page, 's16-5-4-k-phone');
  await ctx.close();
  ({ ctx, page } = await openPage({ width: 1280, height: 720, colorScheme: 'dark', errors: false }));
  await at(page, '2-2', run22); await take(page, 's17-2-2-run-dark');
  const ask22 = idx('2-2', (s) => s.beat.kind === 'check');
  if (ask22 !== undefined) { await at(page, '2-2', ask22); await take(page, 's17-2-2-ask-dark'); }
  await ctx.close();
}

/* ── 본문 ── */
try {
  if (SHOTS) {
    await shots(SHOTS);
    console.log(`\n스크린숏: ${SHOTS}`);
  } else {
    const { counts, secs } = await audit();
    const byC = {};
    for (const x of failures) byC[x.c] = (byC[x.c] ?? 0) + 1;
    console.log(`화면 점검 — ${Object.entries(counts).map(([k, v]) => `${k} ${v}상태`).join(' · ')} · ${secs}초`);
    if (!failures.length) console.log('✅ 실패 없음');
    else {
      console.log(`❌ 실패 ${failures.length}개 — ${Object.entries(byC).sort().map(([k, v]) => `${k}:${v}`).join(' ')}\n`);
      const seen = new Set();
      for (const x of failures) {
        const line = `${x.where.padEnd(44)} ${x.c.padEnd(7)} ${x.msg}`;
        if (seen.has(line)) continue;
        seen.add(line);
        console.log(line);
      }
    }
    process.exitCode = failures.length ? 1 : 0;
  }
} finally {
  await browser.close();
}

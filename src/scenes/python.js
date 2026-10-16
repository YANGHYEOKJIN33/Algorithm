/**
 * 🐍 파이썬 실습 쪽 — Colab 노트북(src/app/notebooks.js)을 사이트에서 미리 읽는 화면. 장은 셋(FINAL_SPEC §2.6·§4.3):
 *
 *   nb-open    📒 Colab에서 노트북 열기 — 큰 [📒 Colab에서 열기] 하나 · [⬇ 노트북 받기] · Colab이 처음이라면 4단계   colab
 *   nb-follow  ▶ 셀을 차례로 실행하며 따라 하기 — "섹션 2 / 7 — 제목" 넘기기(마크다운 셀의 '## '에서 나눈다).
 *              코드마다 "이 줄이 하는 일"과 "실행 결과 예시", 📋 복사. 넘기기는 지금 할 일 줄의 [다음 섹션 →]이 한다
 *   nb-result  🔍 내 결과 확인하기 — 🙋 선생님께 보여 줄 결과(nb.check) + ✅ 실습 점검표 세 칸                    act:nb-done
 *              (아직 체크하지 않은 첫 칸에 data-act="nb-done" — 보라 고리)
 */
import { el, fill } from '../ui/dom.js';
import { getNotebook } from '../app/notebooks.js';
import { colabUrl, notebookUrl } from '../app/links.js';

/* ── 아주 작은 마크다운 → HTML (제목·굵게·인라인 코드·목록·인용·표·코드 블록·링크) ── */
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
export function markdown(src) {
  const out = [];
  const ls = src.split('\n');
  let i = 0;
  while (i < ls.length) {
    const l = ls[i];
    if (/^\s*$/.test(l)) { i += 1; continue; }
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) { const h = Math.min(4, m[1].length + 1); out.push(`<h${h}>${inline(m[2])}</h${h}>`); i += 1; continue; }
    if (/^ {4}/.test(l)) {
      const block = [];
      while (i < ls.length && (/^ {4}/.test(ls[i]) || /^\s*$/.test(ls[i]))) { block.push(ls[i].slice(4)); i += 1; }
      out.push(`<pre class="nb__pseudo">${esc(block.join('\n').trimEnd())}</pre>`);
      continue;
    }
    if (/^>/.test(l)) {
      const block = [];
      while (i < ls.length && /^>/.test(ls[i])) { block.push(ls[i].replace(/^>\s?/, '')); i += 1; }
      out.push(`<blockquote>${block.map(inline).join('<br>')}</blockquote>`);
      continue;
    }
    if (/^\|/.test(l)) {
      const rows = [];
      while (i < ls.length && /^\|/.test(ls[i])) { rows.push(ls[i]); i += 1; }
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r));
      out.push(`<table class="mini"><thead><tr>${cells(body[0]).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (/^(\s*[-*]|\s*\d+\.)\s/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < ls.length && /^(\s*[-*]|\s*\d+\.)\s/.test(ls[i])) { items.push(ls[i].replace(/^(\s*[-*]|\s*\d+\.)\s/, '')); i += 1; }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    const para = [];
    while (i < ls.length && !/^\s*$/.test(ls[i]) && !/^(#|>|\||\s{4}|\s*[-*]\s|\s*\d+\.\s)/.test(ls[i])) { para.push(ls[i]); i += 1; }
    out.push(`<p>${para.map(inline).join(' ')}</p>`);
  }
  return out.join('\n');
}

/* ── 파이썬 색칠 (주석·글자·예약어만) ── */
const KW = new Set(['import', 'from', 'as', 'for', 'in', 'if', 'else', 'elif', 'while', 'def', 'return', 'try', 'except', 'print', 'range', 'len', 'and', 'or', 'not', 'True', 'False', 'None', 'with', 'lambda']);
export function highlightPython(code) {
  return code.split('\n').map((line) => {
    let out = '';
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '#') { out += `<span class="c">${esc(line.slice(i))}</span>`; break; }
      if (ch === "'" || ch === '"') {
        const q = ch;
        let j = i + 1;
        while (j < line.length && line[j] !== q) j += line[j] === '\\' ? 2 : 1;
        out += `<span class="s">${esc(line.slice(i, j + 1))}</span>`;
        i = j + 1;
        continue;
      }
      const m = line.slice(i).match(/^[A-Za-z_]\w*/);
      if (m) { out += KW.has(m[0]) ? `<span class="k">${m[0]}</span>` : m[0]; i += m[0].length; continue; }
      out += esc(ch);
      i += 1;
    }
    return out;
  }).join('\n');
}

function copyButton(text) {
  const btn = el('button.pill.pill--sm', {
    type: 'button',
    onclick: async () => {
      try { await navigator.clipboard.writeText(text); btn.textContent = '✅ 복사했어요'; } catch { btn.textContent = '복사가 막혔어요. 직접 선택해서 복사해 주세요'; }
      setTimeout(() => { btn.textContent = '📋 복사'; }, 1600);
    },
  }, '📋 복사');
  return btn;
}

/**
 * 점검표 세 칸 — 진도에는 nb:<노트북 id>의 0·1·2번으로 저장한다(순서를 바꾸지 않는다).
 * 세 번째 칸은 위 상자의 "선생님께 보여 줄 결과"(notebooks.js의 check)와 내 화면을 견주는 일이다.
 */
const CHECKS = [
  '📒 Colab에서 열고 파일 → 드라이브에 사본 저장하기',
  '▶ 맨 위 셀부터 차례로 끝까지 실행하기',
  '🔍 내 결과가 위 상자의 결과와 같은지 확인하기',
];

/**
 * 노트북 셀을 섹션으로 — 마크다운 셀이 '## '로 시작하면 새 섹션. 첫 '## ' 앞(제목·사용법·준비 셀)은 "시작하기".
 * [{ heading, cells }] — 화면과 떨어진 순수 함수(test/slides.test.js)
 */
export function splitSections(cells) {
  const out = [];
  let cur = null;
  for (const c of cells) {
    const m = c.type === 'md' ? c.text.match(/^##\s+(.+)/) : null;
    if (m || !cur) {
      cur = { heading: m ? m[1].trim() : '시작하기', cells: [] };
      out.push(cur);
    }
    cur.cells.push(c);
  }
  return out;
}

/** 섹션 첫 마크다운의 제목 줄은 넘기기 머리에 이미 있으니 뺀다 */
const dropHeading = (text) => text.replace(/^#{1,2}\s+.*(\n|$)/, '').trim();

/** 코드 셀 하나 — 코드 · 이 줄이 하는 일 · 실행 결과 예시 · 📋 복사 */
function codeCell(c, n) {
  return el('div.nb__cell', {},
    el('div.nb__cellhead', {}, el('span', {}, `코드 셀 ${n}`), el('span.topbar__spacer'), copyButton(c.code)),
    el('pre.nb__code', { html: highlightPython(c.code) }),
    c.explain.length ? el('ul.nb__explain', { 'aria-label': '이 줄이 하는 일' }, c.explain.map((e) => el('li', {}, e))) : null,
    c.out ? el('pre.nb__out', {}, c.out) : null);
}

/** ▶ 따라 하기 — 섹션 넘기기(data-pager). 지금 할 일 줄이 pager.next()/prev()를 부른다 */
function sectionPager(nb) {
  const sections = splitSections(nb.cells);
  // 코드 셀 번호는 노트북 전체에서 이어지게
  let n = 0;
  const numbered = sections.map((s) => ({
    heading: s.heading,
    cells: s.cells.map((c, i) => {
      if (c.type === 'md') {
        const text = i === 0 ? dropHeading(c.text) : c.text;
        return text ? { md: text } : null;
      }
      n += 1;
      return { code: c, n };
    }).filter(Boolean),
  }));
  const subs = new Set();
  let cur = 0;
  const head = el('div.nb-sec__head');
  const body = el('div.nb-sec__body');
  const box = el('div.nb-sec', { 'data-pager': 'section' }, head, body);

  function draw() {
    const s = numbered[cur];
    fill(head,
      el('span.nb-sec__no', {}, `섹션 ${cur + 1} / ${numbered.length}`),
      el('strong.nb-sec__title', {}, s.heading),
      el('span.nb-sec__dots', { 'aria-hidden': 'true' }, numbered.map((_, i) => el('span.quiz__dot', { 'data-current': i === cur ? 'true' : null, 'data-state': i < cur ? 'right' : null }))));
    fill(body, s.cells.map((c) => (c.md ? el('div.nb__md', { html: markdown(c.md) }) : codeCell(c.code, c.n))));
    body.scrollTop = 0;
  }
  const changed = () => { for (const fn of subs) { try { fn(box.pager); } catch { /* 듣는 쪽의 잘못은 무시 */ } } };
  const to = (i) => { cur = i; draw(); changed(); return true; };

  box.pager = {
    get label() { return `섹션 ${cur + 1} / ${numbered.length}`; },
    get index() { return cur; },
    get total() { return numbered.length; },
    nextLabel: '다음 섹션 →',
    canNext: () => cur < numbered.length - 1,
    canPrev: () => cur > 0,
    next: () => (cur < numbered.length - 1 ? to(cur + 1) : false),
    prev: () => (cur > 0 ? to(cur - 1) : false),
    onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
  draw();
  return box;
}

/** 지금 할 곳 표시 — 아직 체크하지 않은 첫 칸에만 붙인다 */
const NB_DONE = { 'data-act': 'nb-done' };

/** 🔍 결과 확인 — 선생님께 보여 줄 결과 + ✅ 실습 점검표. 아직 안 한 첫 칸에 보라 고리(data-act="nb-done") */
function checklist(nb, ctx) {
  const key = `nb:${nb.id}`;
  const box = el('section.nbcheck', { 'aria-label': '실습 점검표' });
  function draw() {
    const got = ctx?.progress?.answers(key) ?? {};
    const n = CHECKS.filter((_, i) => got[i]).length;
    const firstOpen = CHECKS.findIndex((_, i) => !got[i]);
    fill(box,
      el('div.nbcheck__head', {}, el('strong', {}, '✅ 실습 점검표'), el('span.card__meta', {}, ` ${n} / ${CHECKS.length}${n === CHECKS.length ? ' · 실습 끝! 👏' : ' · 모두 체크하면 이 실습은 끝이에요'}`)),
      el('ul.nbcheck__list', {}, CHECKS.map((t, i) => el('li', { 'data-done': got[i] ? 'true' : null }, el('label', i === firstOpen ? NB_DONE : {},
        el('input', {
          type: 'checkbox', checked: got[i] ? true : null,
          onchange: (e) => {
            ctx?.progress?.answer(key, i, e.target.checked);
            const now = ctx?.progress?.answers(key) ?? {};
            if (CHECKS.every((_, k) => now[k])) ctx?.check('nb-done');
            draw();
            box.querySelectorAll('input')[i]?.focus({ preventScroll: true });
          },
        }), el('span', {}, t))))));
  }
  draw();
  return box;
}

function pythonPage(notebookId) {
  return {
    kind: 'view',
    mount(root, ctx) {
      const nb = getNotebook(notebookId);
      if (!nb) { fill(root, el('div.placeholder', {}, '노트북을 찾지 못했어요.')); return {}; }
      fill(root, el('div.read.nb', {},
        /* ① 열기 */
        el('section.nb-block.nb-open', { 'data-beat': 'nb-open' },
          el('div.nb-open__intro', {}, el('strong.nb-open__title', {}, nb.title), el('p', {}, nb.intro)),
          el('div.nb-open__go', {},
            el('a.nb-open__colab.pill--colab', { href: colabUrl(nb.id), target: '_blank', rel: 'noopener' }, '📒 Colab에서 열기'),
            el('a.pill.pill--sm', { href: notebookUrl(nb.id), target: '_blank', rel: 'noopener' }, '⬇ 노트북 받기')),
          el('div.nb-open__howto', {},
            el('strong', {}, 'Colab이 처음이라면'),
            el('ol', {},
              el('li', {}, '"📒 Colab에서 열기"를 누르고 구글 계정으로 로그인해요.'),
              el('li', {}, '위쪽 메뉴에서 [파일 → 드라이브에 사본 저장]을 누르면 내 노트북이 생겨요. 사본은 마음껏 고쳐도 원본은 그대로예요.'),
              el('li', {}, '셀 왼쪽의 ▶를 누르거나 Shift + Enter를 눌러, 맨 위 셀부터 차례로 실행해요.'),
              el('li', {}, '오류가 나면 앞쪽 셀을 건너뛰지 않았는지 살펴봐요. 그래도 안 되면 [런타임 → 모두 실행]을 누르면 돼요.'))),
          el('p.card__meta', {}, "💡 학교에서 Colab이 막히면 다음 장의 '실행 결과 예시'를 보며 따라가요.")),
        /* ② 따라 하기 */
        el('section.nb-block.nb-follow', { 'data-beat': 'nb-follow' }, sectionPager(nb)),
        /* ③ 결과 확인 */
        el('section.nb-block.nb-result', { 'data-beat': 'nb-result' },
          el('p.nb-result__teacher', {}, el('span', {}, '🙋 선생님께 보여 줄 결과: '), el('strong', {}, nb.check)),
          checklist(nb, ctx))));
      return {};
    },
  };
}

export const PYTHON_SCENE = { python: pythonPage };

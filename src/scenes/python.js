/**
 * 🐍 파이썬 실습 쪽 — Colab 노트북(src/app/notebooks.js)을 사이트에서 미리 읽는 화면.
 * 코드마다 "이 줄이 하는 일"을 쉬운 말로 붙이고, 복사 단추와 Colab 열기 단추를 둔다.
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
      try { await navigator.clipboard.writeText(text); btn.textContent = '✅ 복사했어요'; } catch { btn.textContent = '복사가 막혔어요 — 직접 골라 복사하세요'; }
      setTimeout(() => { btn.textContent = '📋 복사'; }, 1600);
    },
  }, '📋 복사');
  return btn;
}

function pythonPage(notebookId) {
  return {
    kind: 'view',
    mount(root) {
      const nb = getNotebook(notebookId);
      if (!nb) { fill(root, el('div.placeholder', {}, '노트북을 찾지 못했어요.')); return {}; }
      let n = 0;
      const cells = nb.cells.map((c) => {
        if (c.type === 'md') return el('div.nb__md', { html: markdown(c.text) });
        n += 1;
        return el('div.nb__cell', {},
          el('div.nb__cellhead', {}, el('span', {}, `코드 셀 ${n}`), el('span.topbar__spacer'), copyButton(c.code)),
          el('pre.nb__code', { html: highlightPython(c.code) }),
          c.explain.length ? el('ul.nb__explain', {}, c.explain.map((e) => el('li', {}, e))) : null,
          c.out ? el('pre.nb__out', {}, c.out) : null);
      });
      fill(root, el('div.read.nb', {},
        el('div.nb__top', {},
          el('p', {}, el('b', {}, nb.title), el('br'), nb.intro),
          el('a.pill.pill--colab', { href: colabUrl(nb.id), target: '_blank', rel: 'noopener' }, '📒 Colab에서 열기'),
          el('a.pill', { href: notebookUrl(nb.id), target: '_blank', rel: 'noopener' }, '⬇ 노트북 받기')),
        el('details.nb__howto', {},
          el('summary', {}, 'Colab이 처음이라면 — 사용법 4단계'),
          el('ol', {},
            el('li', {}, '"📒 Colab에서 열기"를 누르고 구글 계정으로 로그인해요.'),
            el('li', {}, '위쪽 메뉴 파일 → 드라이브에 사본 저장 을 누르면 내 노트북이 돼요(고쳐도 원본은 그대로).'),
            el('li', {}, '셀 왼쪽 ▶(또는 Shift + Enter)로 위에서부터 차례로 실행해요.'),
            el('li', {}, '오류가 나면 위 셀을 빠뜨리지 않았는지 확인하고, 런타임 → 모두 실행 을 눌러 봐요.'))),
        cells));
      return {};
    },
  };
}

export const PYTHON_SCENE = { python: pythonPage };

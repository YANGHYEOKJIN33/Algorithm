/**
 * 🐍 파이썬 실습 쪽 — Colab 노트북(src/app/notebooks.js)을 사이트에서 미리 읽는 화면.
 * 코드마다 "이 줄이 하는 일"을 쉬운 말로 붙이고, 복사 단추와 Colab 열기 단추를 둔다.
 * 맨 위 ✅ 실습 점검표를 모두 체크하면 미션 'act:nb-done'이 이루어진다(진도에 저장).
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
 * 세 번째 칸 뒤에는 노트북마다 다른 "선생님께 보여 줄 결과"(notebooks.js의 check)가 붙는다.
 */
const CHECKS = [
  '📒 Colab에서 열고 파일 → 드라이브에 사본 저장하기',
  '▶ 맨 위 셀부터 차례로 끝까지 실행하기',
  '🔍 내 결과 확인: ',
];

/** ✅ 실습 점검표 — 무엇을 하면 실습이 끝난 것인지, 선생님께 무엇을 보여 주면 되는지 */
function checklist(nb, ctx) {
  const key = `nb:${nb.id}`;
  const box = el('section.nbcheck', { 'aria-label': '실습 점검표' });
  function draw() {
    const got = ctx?.progress?.answers(key) ?? {};
    const n = CHECKS.filter((_, i) => got[i]).length;
    fill(box,
      el('div.nbcheck__head', {}, el('strong', {}, '✅ 실습 점검표'), el('span.card__meta', {}, ` ${n} / ${CHECKS.length} · 모두 체크하면 이 실습은 끝이에요!`)),
      el('p', {}, '🙋 선생님께 보여 줄 것: ', el('strong', {}, '아래 🔍 결과가 나온 내 Colab 화면')),
      el('ul.nbcheck__list', {}, CHECKS.map((t, i) => el('li', {}, el('label', {},
        el('input', {
          type: 'checkbox', checked: got[i] ? true : null,
          onchange: (e) => {
            ctx?.progress?.answer(key, i, e.target.checked);
            const now = ctx?.progress?.answers(key) ?? {};
            if (CHECKS.every((_, k) => now[k])) ctx?.check('nb-done');
            draw();
          },
        }), el('span', {}, t, i === CHECKS.length - 1 ? el('strong', {}, nb.check) : null))))),
      el('p.card__meta', {}, '💡 학교에서 Colab을 쓸 수 없다면, 셀마다 붙은 "실행 결과 예시"를 보면서 코드가 하는 일을 따라가요. 코드 셀의 📋 복사 단추로 코드를 옮겨서 다른 파이썬 환경에서 실행해도 돼요.'));
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
        checklist(nb, ctx),
        el('details.nb__howto', {},
          el('summary', {}, 'Colab이 처음이라면 — 사용법 4단계'),
          el('ol', {},
            el('li', {}, '"📒 Colab에서 열기"를 누르고 구글 계정으로 로그인해요.'),
            el('li', {}, '위쪽 메뉴에서 [파일 → 드라이브에 사본 저장]을 누르면 내 노트북이 생겨요. 사본은 마음껏 고쳐도 원본은 그대로예요.'),
            el('li', {}, '셀 왼쪽의 ▶를 누르거나 Shift + Enter를 눌러, 맨 위 셀부터 차례로 실행해요.'),
            el('li', {}, '오류가 나면 앞쪽 셀을 건너뛰지 않았는지 살펴봐요. 그래도 안 되면 [런타임 → 모두 실행]을 누르면 돼요.'))),
        cells));
      return {};
    },
  };
}

export const PYTHON_SCENE = { python: pythonPage };

/**
 * 만들어 두는 파일 생성기 — `npm run build`
 *
 *   practice/        크롤링 연습 사이트 (정적 HTML 7쪽 + 안내 쪽). 자바스크립트 없이 읽혀야 크롤링할 수 있다.
 *   data/*.csv       수업용 데이터 4개 (연습 원본 · 전처리 끝난 것 · 측정표 · 판정표)
 *   notebooks/*.ipynb Colab 실습 노트북 9개 (src/app/notebooks.js가 원본)
 *   docs/OBJECTIVES.md 교사용 학습 목표표 (src/app/course/*.js가 원본)
 *
 * 원본(src/core/data, src/app/notebooks.js)을 고치면 이 스크립트를 다시 돌려 파일을 맞춘다.
 * test/build.test.js가 디스크의 파일과 지금 원본으로 만든 결과가 같은지 확인한다.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLUMNS, practiceRecords, practicePages, CHANGES, DUPLICATE_ID, NUMERIC } from '../src/core/data/practice.js';
import { isMissing, mean, mode, quartiles, round } from '../src/core/stats.js';
import { shuffle } from '../src/core/random.js';
import { NOTEBOOKS } from '../src/app/notebooks.js';
import { cleanRecords } from '../src/core/data/clean.js';
import { SITE_URL, REPO_URL } from '../src/app/links.js';
import { objectivesMarkdown } from './objectives.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ───────────── CSV ───────────── */

const csvCell = (v) => (isMissing(v) ? '' : String(v));
export function toCsv(columns, rows) {
  return `${[columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\n')}\n`;
}

/** 전처리 끝난 데이터 — src/core/data/clean.js (브라우저와 함께 쓴다) */
export { cleanRecords };

/** 가로로 합치기 연습 — 측정표(전부)와 판정표(순서 섞음, 판정 못한 3마리 빠짐) */
export const UNLABELED = [100, 200, 300];
export function mergeParts() {
  const clean = cleanRecords();
  const measure = clean.map((r) => ({ 번호: r.번호, 부리길이: r.부리길이, 부리깊이: r.부리깊이, 날개길이: r.날개길이, 몸무게: r.몸무게 }));
  const label = shuffle(clean.filter((r) => !UNLABELED.includes(r.번호)).map((r) => ({ 번호: r.번호, 종: r.종 })), 2024);
  return { measure, label };
}

export function dataFiles() {
  const { measure, label } = mergeParts();
  return {
    'data/penguins.csv': toCsv(COLUMNS, practiceRecords()),
    'data/penguins_clean.csv': toCsv(COLUMNS, cleanRecords()),
    'data/penguins_measure.csv': toCsv(['번호', '부리길이', '부리깊이', '날개길이', '몸무게'], measure),
    'data/penguins_label.csv': toCsv(['번호', '종'], label),
  };
}

/* ───────────── 크롤링 연습 사이트 ───────────── */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PRACTICE_CSS = `/* 크롤링 연습 사이트 — 자바스크립트 없이 HTML만으로 읽히게 만든다 */
:root { color-scheme: light dark; --bg: #f6f8fb; --fg: #14181f; --muted: #5a6472; --line: #d3d8e0; --head: #e9eef6; --accent: #1857c4; --card: #fff; }
@media (prefers-color-scheme: dark) { :root { --bg: #12151b; --fg: #e8ecf2; --muted: #a3adbb; --line: #333b48; --head: #232833; --accent: #7aa9ff; --card: #1a1e26; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: "Pretendard", "Noto Sans KR", system-ui, sans-serif; line-height: 1.6; }
header, main, footer { max-width: 960px; margin: 0 auto; padding: 16px; }
header h1 { margin: 0 0 4px; font-size: 1.5rem; }
header p { margin: 0; color: var(--muted); }
a { color: var(--accent); }
.note { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; font-size: .92rem; }
.pager { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin: 12px 0; }
.pager a, .pager span { padding: 3px 10px; border: 1px solid var(--line); border-radius: 999px; text-decoration: none; background: var(--card); }
.pager .now { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
.wrap { overflow-x: auto; background: var(--card); border: 1px solid var(--line); border-radius: 10px; }
table { border-collapse: collapse; width: 100%; font-size: .92rem; font-variant-numeric: tabular-nums; }
th, td { border-bottom: 1px solid var(--line); padding: 4px 10px; text-align: center; white-space: nowrap; }
th { background: var(--head); position: sticky; top: 0; }
tbody tr:hover td { background: var(--head); }
footer { color: var(--muted); font-size: .85rem; }
code { background: var(--head); padding: 0 4px; border-radius: 4px; }
`;

function pager(p, n) {
  const items = [];
  items.push(p > 1 ? `<a href="page${p - 1}.html" rel="prev">← 이전</a>` : '<span>← 이전</span>');
  for (let i = 1; i <= n; i += 1) items.push(i === p ? `<span class="now">${i}</span>` : `<a href="page${i}.html">${i}</a>`);
  items.push(p < n ? `<a href="page${p + 1}.html" rel="next">다음 →</a>` : '<span>다음 →</span>');
  return `<nav class="pager" aria-label="쪽 이동">${items.join('')}</nav>`;
}

const FOOT = `<footer>
  <p>데이터 출처: palmerpenguins (Horst, Hill &amp; Gorman, 2020) · Palmer Station LTER, Dr. Kristen Gorman · 라이선스 CC0.<br>
  이 사이트는 <a href="../">「펭귄 데이터로 배우는 인공지능」</a> 수업의 크롤링 연습용이에요. 수업을 위해 일부 값을 바꿔 두었어요(<a href="index.html#traps">자세히</a>).</p>
</footer>`;

function page(p, rows, n) {
  const body = rows.map((r) => `      <tr>${COLUMNS.map((c) => `<td>${esc(csvCell(r[c]))}</td>`).join('')}</tr>`).join('\n');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>펭귄 관측 기록 ${p}쪽 — 크롤링 연습</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<header>
  <h1>🐧 남극 펭귄 관측 기록 (${p}쪽 / ${n}쪽)</h1>
  <p>크롤링 연습용 사이트 · <a href="index.html">처음으로</a></p>
</header>
<main>
  <p class="note">단위 — 부리길이·부리깊이·날개길이: mm(밀리미터), 몸무게: g(그램). 빈 칸은 측정하지 못한 값이에요.</p>
  ${pager(p, n)}
  <div class="wrap">
  <table id="penguins">
    <thead>
      <tr>${COLUMNS.map((c) => `<th>${c}</th>`).join('')}</tr>
    </thead>
    <tbody>
${body}
    </tbody>
  </table>
  </div>
  ${pager(p, n)}
</main>
${FOOT}
</body>
</html>
`;
}

function practiceIndex(pages) {
  const total = pages.reduce((a, p) => a + p.length, 0);
  const traps = CHANGES.map((c) => `<li>${c.번호}번 펭귄의 ${c.열}: 원래 ${c.원래} → ${c.바꾼값 === null ? '빈칸' : c.바꾼값} (${c.이유})</li>`).join('\n      ');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>남극 펭귄 관측소 — 크롤링 연습 사이트</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<header>
  <h1>🐧 남극 펭귄 관측소</h1>
  <p>웹 크롤링 연습을 위해 만든 사이트예요. 마음껏 긁어 가도 괜찮아요(그래도 천천히!).</p>
</header>
<main>
  <p class="note">펭귄 관측 기록이 <b>${pages.length}쪽</b>에 나뉘어 <b>모두 ${total}줄</b> 실려 있어요. 쪽마다 표 하나(<code>&lt;table id="penguins"&gt;</code>)가 있어요.<br>
  주소 규칙: <code>${SITE_URL}practice/page1.html</code> … <code>page${pages.length}.html</code></p>
  <h2>쪽 목록</h2>
  <ul>
    ${pages.map((p, i) => `<li><a href="page${i + 1}.html">${i + 1}쪽</a> — ${p.length}줄 (번호 ${p[0].번호} ~ ${p[p.length - 1].번호})</li>`).join('\n    ')}
  </ul>
  <h2>열(속성)</h2>
  <p>${COLUMNS.join(' · ')}</p>
  <h2 id="traps">숨겨 둔 함정 🕵️</h2>
  <p>이 데이터에는 가공·전처리 수업을 위한 함정이 숨어 있어요: <b>빈칸</b>, <b>이상한 값</b>, <b>겹친 행</b>. 먼저 스스로 찾아본 뒤 아래를 펼쳐 보세요.</p>
  <details>
    <summary>선생님용 — 원본에서 바꾼 곳 보기</summary>
    <ul>
      ${traps}
      <li>${DUPLICATE_ID}번 펭귄: 1쪽 마지막 줄과 2쪽 첫 줄에 두 번 실림 (겹친 행)</li>
      <li>그 밖의 빈칸(측정값 2줄·성별 11칸)은 원본 데이터에 원래 있던 결측치예요.</li>
    </ul>
  </details>
</main>
${FOOT}
</body>
</html>
`;
}

export function practiceFiles() {
  const pages = practicePages();
  const files = { 'practice/style.css': PRACTICE_CSS, 'practice/index.html': practiceIndex(pages) };
  pages.forEach((rows, i) => { files[`practice/page${i + 1}.html`] = page(i + 1, rows, pages.length); });
  return files;
}

/* ───────────── 노트북 ───────────── */

const lines = (text) => {
  const ls = text.split('\n');
  return ls.map((l, i) => (i < ls.length - 1 ? `${l}\n` : l));
};

export function notebookJson(nb) {
  const cells = [];
  cells.push({ cell_type: 'markdown', metadata: {}, source: lines(`> 📒 이 노트북은 [펭귄 데이터로 배우는 인공지능](${SITE_URL}) 수업의 실습이에요. 원본: [${REPO_URL}](${REPO_URL})`) });
  for (const c of nb.cells) {
    if (c.type === 'md') {
      cells.push({ cell_type: 'markdown', metadata: {}, source: lines(c.text) });
    } else {
      if (c.explain.length) cells.push({ cell_type: 'markdown', metadata: {}, source: lines(c.explain.map((e) => `- ${e}`).join('\n')) });
      cells.push({ cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: lines(c.code) });
    }
  }
  return `${JSON.stringify({
    cells,
    metadata: {
      colab: { provenance: [], toc_visible: true },
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python' },
    },
    nbformat: 4,
    nbformat_minor: 0,
  }, null, 1)}\n`;
}

export function notebookFiles() {
  return Object.fromEntries(NOTEBOOKS.map((nb) => [`notebooks/${nb.id}.ipynb`, notebookJson(nb)]));
}

export function allFiles() {
  return { ...dataFiles(), ...practiceFiles(), ...notebookFiles(), 'docs/OBJECTIVES.md': `${objectivesMarkdown()}\n` };
}

/* ───────────── 실행 ───────────── */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = allFiles();
  for (const [rel, content] of Object.entries(files)) {
    const path = join(ROOT, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  console.log(`파일 ${Object.keys(files).length}개를 만들었어요.`);
}

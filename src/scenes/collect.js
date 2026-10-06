/**
 * 🕸 수집 — 웹 페이지의 구조(HTML) · 크롤링 한 단계씩 · 크롤링 예절
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import { infoTerm } from '../ui/infoTip.js';
import { quizBox } from '../ui/quizBox.js';
import { CRAWL_PAGES, CRAWL_COLUMNS } from '../core/data/sets.js';
import { practicePages } from '../core/data/practice.js';
import * as CRAWL from '../core/crawl.js';
import { pyList, counters } from '../viz/bits.js';
import { PRACTICE_URL } from '../app/links.js';

const tagSpan = (t) => el('span.html__tag', {}, t);

/** HTML 한 줄짜리 <tr> — 칸마다 <td>를 따로 감싸 강조할 수 있게 */
function trLine(cells, { head = false, rowIdx, onCell = null, selCell = null } = {}) {
  const cellTag = head ? 'th' : 'td';
  return el('div.html__line.html__line--tr', { 'data-row': rowIdx },
    el('span.html__indent', {}, '    '), tagSpan('<tr>'),
    cells.map((c, ci) => el(`span.html__cell${selCell === ci ? '.is-sel' : ''}`, {
      onclick: onCell ? () => onCell(ci) : null,
      tabindex: onCell ? 0 : null,
      onkeydown: onCell ? (e) => { if (e.key === 'Enter') onCell(ci); } : null,
    }, tagSpan(`<${cellTag}>`), el('span.html__text', {}, c), tagSpan(`</${cellTag}>`))),
    tagSpan('</tr>'));
}

function htmlSource(page, p, opts = {}) {
  const { rowState = () => '', selRow = null, selCell = null } = opts;
  return el('div.html', { role: 'figure', 'aria-label': `${p}쪽 HTML` },
    el('div.html__line', {}, tagSpan('<html>')),
    el('div.html__line', {}, el('span.html__indent', {}, '  '), tagSpan('<h1>'), el('span.html__text', {}, `펭귄 관측 기록 (${p}쪽)`), tagSpan('</h1>')),
    el('div.html__line', {}, el('span.html__indent', {}, '  '), tagSpan('<table>')),
    (() => { const n = trLine(CRAWL_COLUMNS, { head: true, rowIdx: 0 }); n.className += ` ${rowState(0)}`; return n; })(),
    page.rows.map((r, i) => {
      const n = trLine(CRAWL_COLUMNS.map((c) => String(r[c] ?? '')), { rowIdx: i + 1, selCell: selRow === i + 1 ? selCell : null, onCell: opts.onCell ? (ci) => opts.onCell(i + 1, ci) : null });
      n.className += ` ${rowState(i + 1)}`;
      return n;
    }),
    el('div.html__line', {}, el('span.html__indent', {}, '  '), tagSpan('</table>')),
    el('div.html__line', {}, el('span.html__indent', {}, '  '), tagSpan(`<a href="page${p + 1}.html">`), el('span.html__text', {}, '다음 쪽'), tagSpan('</a>')),
    el('div.html__line', {}, tagSpan('</html>')));
}

/* ═════════════ 웹 페이지와 HTML (탐험) ═════════════ */

function webExplore(root, ctx) {
  const page = CRAWL_PAGES[0];
  const pages = practicePages();
  const total = pages.reduce((n, pg) => n + pg.length, 0);
  // 찾아보기 과제 — 2번 펭귄의 몸무게 칸을 HTML에서 찾기
  const goal = { row: 2, cell: CRAWL_COLUMNS.indexOf('몸무게') };
  const goalValue = String(page.rows[goal.row - 1][CRAWL_COLUMNS[goal.cell]]);
  let sel = { row: 1, cell: 3 };
  let found = false;
  const left = el('div.browser');
  const right = el('div.webx__src');
  const path = el('div.webx__path');
  const quest = el('p.callout');

  /** from: 'screen'(왼쪽 화면의 칸) | 'html'(오른쪽 HTML의 <td>) */
  function pick(row, cell, from) {
    sel = { row, cell };
    if (from === 'screen') ctx?.check('web-cell');
    if (from === 'html' && row === goal.row && cell === goal.cell) { found = true; ctx?.check('web-td'); }
    draw();
  }

  function draw() {
    fill(left,
      el('div.browser__bar', {}, el('span.browser__dots', {}, '● ● ●'), el('span.browser__url', {}, `${PRACTICE_URL}page1.html`)),
      el('div.browser__page', {},
        el('h4', {}, '펭귄 관측 기록 (1쪽)'),
        el('table.webtable', {},
          el('thead', {}, el('tr', {}, CRAWL_COLUMNS.map((c) => el('th', {}, c)))),
          el('tbody', {}, page.rows.map((r, i) => el(`tr${sel.row === i + 1 ? '.is-row' : ''}`, {},
            CRAWL_COLUMNS.map((c, ci) => el(`td${sel.row === i + 1 && sel.cell === ci ? '.is-sel' : ''}`, {
              tabIndex: 0, onclick: () => pick(i + 1, ci, 'screen'),
              onkeydown: (e) => { if (e.key === 'Enter') pick(i + 1, ci, 'screen'); },
            }, String(r[c]))))))),
        el('a.browser__link', {}, '다음 쪽 →')));
    fill(right,
      el('div.webx__cap', {}, '💻 컴퓨터가 받은 HTML (페이지 소스) — <td>를 눌러 보세요'),
      htmlSource(page, 1, { rowState: (i) => (i === sel.row ? 'is-row' : ''), selRow: sel.row, selCell: sel.cell, onCell: (row, ci) => pick(row, ci, 'html') }));
    const value = String(page.rows[sel.row - 1][CRAWL_COLUMNS[sel.cell]]);
    fill(path,
      el('span.webx__crumb', {}, '<html>'), ' › ', el('span.webx__crumb', {}, '<table>'), ' › ',
      el('span.webx__crumb.is-row', {}, `<tr> ${sel.row + 1}번째 줄`), ' › ',
      el('span.webx__crumb.is-sel', {}, `<td> ${sel.cell + 1}번째 칸`), ' → ', el('strong', {}, `"${value}"`),
      el('span.webx__note', {}, `  (첫 번째 <tr>은 제목 줄 <th>예요)`));
    quest.className = found ? 'callout callout--add' : 'callout';
    fill(quest, found
      ? `✅ 찾았어요! ${goalValue}은 ${goal.row + 1}번째 <tr>(제목 줄 다음 ${goal.row}번째 펭귄 줄)의 ${goal.cell + 1}번째 <td> 안에 있어요. 크롤러도 이렇게 태그 위치로 칸을 찾아요.`
      : `🔎 찾아보기 — ${goal.row}번 펭귄의 ${CRAWL_COLUMNS[goal.cell]} ${goalValue}은 HTML의 어디에 있을까요? 오른쪽 HTML에서 그 <td>를 찾아 눌러 보세요.`);
  }

  fill(root, el('div.read.read--wide', {},
    el('div.card.card--soft', {}, el('p.card__text', {}, el('strong', {}, '🐧 왜 웹 페이지를 볼까? '),
      `펭귄 기록 ${total}줄이 웹 페이지 ${pages.length}쪽에 나뉘어 있어요. 손으로 베끼면 몇 시간! 프로그램이 대신 읽게 하려면 웹 페이지가 무엇으로 만들어졌는지 알아야 해요.`)),
    el('div.netline', {},
      el('span.netline__box', {}, '💻 내 컴퓨터'),
      el('span.netline__arrow', {}, '요청 →', el('small', {}, 'page1.html 주세요')),
      el('span.netline__box', {}, '🖥 서버'),
      el('span.netline__arrow.netline__arrow--back', {}, '← 응답', el('small', {}, 'HTML 글자')),
      el('span.netline__box', {}, '🖼 브라우저가 그림으로')),
    el('div.webx', {},
      el('div.webx__col', {}, el('div.webx__cap', {}, '👀 사람이 보는 화면 — 칸을 눌러 보세요'), left),
      el('div.webx__col', {}, right)),
    path,
    quest,
    el('div.cards', {},
      el('div.card', {}, el('div.card__title', {}, infoTerm('태그', { strong: true }), ' — 이름표'), el('p.card__text', {}, '<td>3750</td>처럼 꺾쇠 이름표가 내용을 감싸요. 여는 태그 <td>와 닫는 태그 </td> 사이가 내용이에요.')),
      el('div.card', {}, el('div.card__title', {}, '<table> · <tr> · <td>'), el('p.card__text', {}, '표 = table, 줄(행) = tr(table row), 칸 = td(table data). 제목 칸은 th(table header)예요.')),
      el('div.card', {}, el('div.card__title', {}, '크롤러가 하는 일'), el('p.card__text', {}, '"모든 <tr>을 찾아, 그 안의 <td> 글자를 꺼낸다." 사람이 눈으로 표를 읽는 일을 태그 위치로 대신해요. 다음 쪽에서 한 단계씩 봐요.'))),
    el('p.card__meta', {}, '직접 보기: ', el('a', { href: `${PRACTICE_URL}page1.html`, target: '_blank', rel: 'noopener' }, '연습 사이트 1쪽 열기 ↗'),
      ' — 열린 쪽에서 마우스 오른쪽 단추 → "페이지 소스 보기"(Ctrl+U)를 누르면 HTML이 보여요. 이 화면은 1쪽의 앞 3줄·4열만 줄여 보여 줘요.'),
  ));
  draw();
  return {};
}

/* ═════════════ 크롤링 한 단계씩 ═════════════ */

const PHASE_NET = {
  idle: null, loop: null,
  request: 'request', response: 'response',
};

/** 크롤러의 다섯 단계 ①~⑤ — 장면의 phase와 의사코드 줄 번호를 짝짓는다 */
const CRAWL_STEPS = [
  { no: '①', name: '요청', line: 3, phases: ['request', 'response'] },
  { no: '②', name: '분석', line: 4, phases: ['parse'] },
  { no: '③', name: '<tr> 찾기', line: 5, phases: ['find'] },
  { no: '④', name: '칸 꺼내기', line: 7, phases: ['select', 'row'] },
  { no: '⑤', name: '모으기', line: 8, phases: ['append'] },
];

function stepStrip(phase) {
  const done = phase === 'frame' || phase === 'save';
  return el('span', { style: 'margin-left:auto;display:inline-flex;gap:4px;flex-wrap:wrap', 'aria-label': '크롤러의 다섯 단계' },
    CRAWL_STEPS.map((s) => {
      const on = s.phases.includes(phase);
      return el(`span.tag${on ? '.tag--current' : done ? '.tag--add' : ''}`, {
        title: `의사코드 ${s.line}줄`, 'aria-current': on ? 'step' : null,
        style: on ? 'font-weight:700' : null,
      }, `${s.no} ${s.name}`);
    }));
}

const crawl = {
  kind: 'step',
  pseudo: CRAWL.PSEUDO,
  python: CRAWL.PYTHON,
  notebook: '01_web_crawling',
  stageTitle: '요청 → 받은 HTML → 태그 찾기',
  stageHint: '찾은 <tr>은 파랑, 지금 줄은 진한 테두리',
  dataTitle: '행목록 (리스트 안의 리스트)',
  rows: ['1.15fr', '1fr'],
  frames: () => CRAWL.crawlFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const p = f.page;
        const net = PHASE_NET[f.phase] ?? (p ? 'done' : null);
        const haveHtml = p && !['loop', 'request'].includes(f.phase);
        const found = ['find', 'select', 'row', 'append'].includes(f.phase);
        const rowState = (i) => {
          const cls = [];
          if (found) cls.push('is-found');
          if (f.rowIndex === i) cls.push('is-row');
          if (i === 0 && found) cls.push('is-head');
          return cls.join(' ');
        };
        fill(stage,
          el('div.netline.netline--sm', {},
            el('span.netline__box', {}, '💻 내 프로그램'),
            el(`span.netline__arrow${net === 'request' ? '.is-on' : ''}`, { title: f.url ?? `${CRAWL.SITE}/page1.html` }, '요청 →', el('small', {}, p ? `page${p}.html` : '')),
            el('span.netline__box', {}, '🖥 서버'),
            el(`span.netline__arrow.netline__arrow--back${net === 'response' ? '.is-on' : ''}`, {}, '← 응답', el('small', {}, 'HTML')),
            stepStrip(f.phase)),
          p ? el('div.crawlstage', {},
            el('div.crawlstage__html', {},
              el('div.webx__cap', {}, `📄 받은 HTML — ${p}쪽`),
              haveHtml ? htmlSource(CRAWL_PAGES[p - 1], p, { rowState }) : el('div.placeholder', {}, f.phase === 'request' ? '⏳ 서버에 요청하는 중…' : `🔁 p = ${p} — 이제 ${p}쪽 차례예요.`)),
            el('div.crawlstage__side', {},
              f.cells ? el('div.cut', {}, el('div.webx__cap', {}, '✂️ 꺼낸 칸 글자 — 따옴표 = 아직 글자'),
                el('div.cut__cells', {}, f.cells.map((c, i) => el('span.cut__cell', { 'data-flip': `cell-${p}-${f.rowIndex}-${i}` }, `'${c}'`)))) : null,
              f.phase === 'parse' || found ? tagTree(CRAWL_PAGES[p - 1], found, f.rowIndex) : null))
            : f.table
              ? el('div.crawlout', {},
                el('div.crawlstage', {},
                  el('div', {},
                    el('div.webx__cap', {}, '🧾 데이터프레임 df'),
                    el('table.dtable', {},
                      el('thead', {}, el('tr', {}, el('th.dtable__idx'), f.table.columns.map((c) => el('th', {}, c)))),
                      el('tbody', {}, f.table.rows.map((r, i) => el('tr', {}, el('th.dtable__idx', {}, String(i)), r.map((c) => el('td', {}, c))))))),
                  el('div', {},
                    el('div.webx__cap', {}, '💾 penguins.csv'),
                    f.csv ? el('pre.csvbox', {}, f.csv) : el('div.placeholder', {}, '다음 줄에서 CSV 파일로 저장해요.'))),
                el('p.card__meta', {}, "💡 꺼낸 값은 아직 글자예요 — '3750'은 숫자가 아니라 글자 4개. CSV를 다시 읽으면(read_csv) 판다스가 숫자로 바꿔 줘요."))
              : el('div.placeholder', {}, `쪽 번호 p를 1부터 ${CRAWL_PAGES.length}까지 바꾸며 쪽마다 ①~⑤를 되풀이해요. ${CRAWL_PAGES.length}쪽까지 모이면 끝!`),
        );
        flip(stage);

        const items = f.rows.map((r, i) => ({
          key: `row-${i}`, cls: i === f.rows.length - 1 && f.phase === 'append' ? 'is-new' : '',
          content: el('code.rowcode', {}, `[${r.map((c) => `'${c}'`).join(', ')}]`),
        }));
        fill(data,
          counters([['요청 횟수', f.counters.requests], ['찾은 <tr>', f.counters.found], ['모은 줄', f.counters.collected, 'add']]),
          pyList('rows', items, { vertical: true, note: f.table ? ' = 행목록 → 위의 표(df)가 되었어요' : ' = 행목록', empty: '아직 비어 있어요' }));
        // 방금 넣은 줄이 칸 아래로 숨지 않게 — 자료구조 칸 안에서만 스크롤(페이지는 그대로)
        const fresh = data.querySelector('.pylist__item.is-new');
        if (fresh) {
          const r = fresh.getBoundingClientRect();
          const b = data.getBoundingClientRect();
          if (r.bottom > b.bottom) data.scrollTop += r.bottom - b.bottom + 12;
        }
        flip(data);
      },
    };
  },
};

/** 태그 나무 — html > table > tr… (찾은 tr 강조) */
function tagTree(page, found, rowIndex) {
  const node = (label, cls = '') => el(`span.tnode${cls ? `.${cls}` : ''}`, {}, label);
  return el('div.ttree', {},
    el('div.webx__cap', {}, '🌳 태그 나무 (BeautifulSoup)'),
    el('ul', {},
      el('li', {}, node('html'),
        el('ul', {},
          el('li', {}, node('h1')),
          el('li', {}, node('table'),
            el('ul', {}, [0, ...page.rows.map((_, i) => i + 1)].map((i) => el('li', {},
              node(i === 0 ? 'tr (제목)' : `tr ${i}`, [found ? 'is-found' : '', i === rowIndex ? 'is-row' : '', i === 0 && found ? 'is-head' : ''].filter(Boolean).join('.')),
              el('span.tnode__kids', {}, i === 0 ? ' th × 4' : ' td × 4'))))),
          el('li', {}, node('a'))))));
}

/* ═════════════ 크롤링 예절 ═════════════ */

const MANNERS = [
  { icon: '🤖', title: 'robots.txt 먼저 보기', text: '사이트 주소 뒤에 /robots.txt를 붙이면 "크롤러는 여기까지만"이라는 안내가 나와요. Disallow로 막아 둔 곳은 긁지 않아요.' },
  { icon: '📜', title: '이용약관 확인', text: '자동 수집을 금지하는 사이트도 있어요. 공식 API나 공공데이터(공공데이터포털 등)가 있으면 그걸 먼저 써요.' },
  { icon: '🐢', title: '천천히, 조금씩', text: '한꺼번에 많이 요청하면 서버가 힘들어져요(공격처럼 보일 수도 있어요). 쪽을 넘길 때마다 1초씩 쉬어 가요.', code: 'time.sleep(1)' },
  { icon: '🔒', title: '개인정보는 모으지 않기', text: '이름·연락처·사진처럼 사람을 알아볼 수 있는 정보는 모으지도, 퍼뜨리지도 않아요.' },
  { icon: '©️', title: '저작권과 출처', text: '모은 글·그림에도 저작권이 있어요. 수업·연구에 쓸 때도 출처를 밝히고, 다시 팔거나 퍼뜨리지 않아요.' },
  { icon: '⚖️', title: '끝까지 골고루 모으기', text: '앞 쪽만 모으면 데이터가 한쪽으로 치우쳐요. 연습 사이트 1~3쪽은 모두 아델리펭귄이고 턱끈펭귄은 6쪽부터 나와요. 7쪽을 끝까지 모아야 세 종이 빠짐없이 들어와요.' },
];

const MANNERS_QUIZ = [
  { q: 'robots.txt에서 Disallow로 막아 둔 쪽도, 기술적으로 열리면 긁어 와도 된다.', options: ['O', 'X'], answer: 1, why: '열린다고 허락된 것은 아니에요. 사이트가 정한 약속을 지켜요.' },
  { q: '쪽을 넘길 때마다 1초씩 쉬어 가며 요청하는 것은 좋은 습관이다.', options: ['O', 'X'], answer: 0, why: '서버에 부담을 덜 주는 예절이에요. 파이썬에서는 time.sleep(1)로 쉬어요.' },
  { q: '친구들의 SNS 프로필(이름·사진)을 모아 학습 데이터로 써도 된다.', options: ['O', 'X'], answer: 1, why: '사람을 알아볼 수 있는 개인정보예요. 모으면 안 돼요.' },
  { q: '같은 데이터를 공식 API로 받을 수 있다면 크롤링보다 API를 먼저 쓴다.', options: ['O', 'X'], answer: 0, why: 'API는 사이트가 허락한 정식 통로라 안정적이고 안전해요.' },
  { q: '이 사이트의 연습 쪽(practice/)은 크롤링 연습을 위해 만든 곳이라 마음껏 긁어도 된다.', options: ['O', 'X'], answer: 0, why: '연습용으로 공개한 쪽이에요. 그래도 반복문으로 수천 번 요청하지는 말아요!' },
  { q: '연습 사이트 1쪽(50줄)만 모아도 세 종의 펭귄이 골고루 들어온다.', options: ['O', 'X'], answer: 1, why: '1~3쪽은 모두 아델리펭귄이에요. 앞 쪽만 모으면 한 종으로 치우친 데이터가 돼요.' },
];

function manners(root) {
  fill(root, el('div.read', {},
    el('div.cards.cards--3', {}, MANNERS.map((m) => el('div.card', {},
      el('div.card__icon', {}, m.icon), el('div.card__title', {}, m.title),
      el('p.card__text', {}, m.text),
      m.code ? el('p.card__meta', {}, '(파이썬: ', el('code', {}, m.code), ')') : null))),
    el('div.callout', {}, '💡 이 수업의 연습 사이트(', el('a', { href: PRACTICE_URL, target: '_blank', rel: 'noopener' }, 'practice/'), ')는 크롤링 연습용으로 만든 곳이라 안심하고 연습할 수 있어요. 다른 사이트를 크롤링할 때는 위 여섯 가지를 꼭 확인하세요.'),
    quizBox(MANNERS_QUIZ, { row: true, title: '✅ O/X로 확인해요' })));
  return {};
}

export const COLLECT_SCENES = {
  webExplore: { kind: 'view', mount: webExplore },
  crawl,
  manners: { kind: 'view', mount: manners },
};

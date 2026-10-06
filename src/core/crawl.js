/**
 * 🕸 웹 크롤링 — 미니 관측소 2쪽을 요청 → 분석 → <tr> 찾기 → 칸 꺼내기 → 모으기 순서로 기록한다.
 *
 * 장면(frame) 하나 = 의사코드 한 줄이 실행된 직후의 모습.
 * 화면은 이 목록만 앞뒤로 넘기며 그린다(되감기가 쉽다).
 */
import { CRAWL_PAGES, CRAWL_COLUMNS } from './data/sets.js';

export const SITE = 'https://yanghyeokjin33.github.io/Algorithm/practice';

export const PSEUDO = [
  { code: '행목록 ← 빈 리스트', note: '긁어 온 줄을 차곡차곡 담을 빈 상자를 준비해요.' },
  { code: '반복: 쪽 번호 p = 1부터 2까지', note: '관측소 표가 두 쪽으로 나뉘어 있어서 쪽마다 같은 일을 되풀이해요.' },
  { code: '    HTML ← p쪽 주소에 요청해서 받아 온다', note: '브라우저가 하는 일과 같아요 — 서버에 "이 쪽 주세요"라고 요청하면 HTML 글자가 돌아와요.' },
  { code: '    문서 ← HTML을 분석해 태그 나무로 만든다', note: '긴 글자 덩어리를 <table> → <tr> → <td> 처럼 태그가 겹겹이 든 나무로 바꿔야 원하는 곳을 찾을 수 있어요.' },
  { code: '    줄들 ← 문서에서 <tr> 태그를 모두 찾는다', note: '<tr>은 표의 한 줄(table row)이에요. 맨 위 제목 줄도 <tr>이라 함께 찾아져요.' },
  { code: '    반복: 줄들의 각 줄 tr (제목 줄은 건너뜀)', note: '제목 줄을 빼고, 펭귄 한 마리가 적힌 줄을 하나씩 봐요.' },
  { code: '        칸들 ← tr 안 <td> 태그들의 글자', note: '<td>는 칸 하나(table data)예요. 태그는 버리고 안의 글자만 꺼내요.' },
  { code: '        행목록에 칸들을 추가한다', note: '꺼낸 칸들(한 줄)을 행목록 맨 뒤에 붙여요 — 리스트 안에 리스트가 쌓여요.' },
  { code: '표 ← 행목록으로 데이터프레임을 만든다', note: '리스트를 행과 열이 있는 표(데이터프레임)로 바꿔요. 이제 분석할 수 있어요.' },
  { code: '표를 CSV 파일로 저장한다', note: '쉼표로 칸을 나눈 글자 파일(CSV)로 저장하면 다음 수업에서 다시 불러 쓸 수 있어요.' },
];

export const PYTHON = [
  'rows = []',
  'for p in range(1, 3):',
  "    html = requests.get(f'{SITE}/page{p}.html').text",
  "    soup = BeautifulSoup(html, 'html.parser')",
  "    trs = soup.find_all('tr')",
  '    for tr in trs[1:]:',
  "        cells = [td.text for td in tr.find_all('td')]",
  '        rows.append(cells)',
  `df = pd.DataFrame(rows, columns=[${CRAWL_COLUMNS.map((c) => `'${c}'`).join(', ')}])`,
  "df.to_csv('penguins.csv', index=False)",
];

/** 미니 관측소 p쪽의 HTML을 줄 단위로 만든다 — 화면의 "HTML 보기"와 같다 */
export function pageHtml(p) {
  const page = CRAWL_PAGES[p - 1];
  const lines = [
    { text: '<html>', tag: 'html' },
    { text: `  <h1>펭귄 관측 기록 (${p}쪽)</h1>`, tag: 'h1' },
    { text: '  <table>', tag: 'table' },
    { text: `    <tr>${CRAWL_COLUMNS.map((c) => `<th>${c}</th>`).join('')}</tr>`, tag: 'tr', row: 0 },
  ];
  page.rows.forEach((r, i) => {
    lines.push({
      text: `    <tr>${CRAWL_COLUMNS.map((c) => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`,
      tag: 'tr', row: i + 1,
    });
  });
  lines.push({ text: '  </table>', tag: 'table' });
  lines.push({ text: `  <a href="page${p + 1}.html">다음 쪽</a>`, tag: 'a' });
  lines.push({ text: '</html>', tag: 'html' });
  return lines;
}

/** 칸 글자 — 크롤링한 값은 처음엔 모두 글자(문자열)다 */
const cellText = (v) => (v === null || v === undefined ? '' : String(v));

export function crawlFrames() {
  const frames = [];
  const rows = [];            // 행목록 (리스트 안의 리스트)
  const counters = { requests: 0, found: 0, collected: 0 };
  const snap = (extra) => frames.push({
    rows: rows.map((r) => [...r]),
    counters: { ...counters },
    page: null, phase: 'idle', rowIndex: null, cells: null, table: null, csv: null,
    ...extra,
  });

  snap({ line: 1, icon: '📋', say: '행목록이라는 빈 리스트를 만들었어요. 여기에 긁어 온 줄을 모아요.' });

  for (let p = 1; p <= CRAWL_PAGES.length; p += 1) {
    const page = CRAWL_PAGES[p - 1];
    const url = `${SITE}/page${p}.html`;
    snap({ line: 2, icon: '🔁', page: p, phase: 'loop', url, say: `${p}쪽 차례예요. 같은 일을 쪽마다 되풀이해요.` });

    counters.requests += 1;
    snap({ line: 3, icon: '📨', page: p, phase: 'request', url, say: `서버에 "${p}쪽 HTML 주세요"라고 요청했어요(requests.get).` });
    snap({ line: 3, icon: '📄', page: p, phase: 'response', url, say: '서버가 HTML 글자를 돌려주었어요. 사람에겐 표로 보이지만, 컴퓨터가 받은 건 태그가 섞인 긴 글자예요.' });
    snap({ line: 4, icon: '🌳', page: p, phase: 'parse', url, say: 'HTML을 분석해 태그 나무로 만들었어요(BeautifulSoup). 이제 원하는 태그를 찾을 수 있어요.' });

    counters.found += page.rows.length + 1;
    snap({ line: 5, icon: '🔎', page: p, phase: 'find', url, say: `<tr> 태그 ${page.rows.length + 1}개를 찾았어요. 첫 번째는 제목 줄(<th>)이라 건너뛸 거예요.` });

    page.rows.forEach((r, i) => {
      const cells = CRAWL_COLUMNS.map((c) => cellText(r[c]));
      snap({ line: 6, icon: '👉', page: p, phase: 'select', url, rowIndex: i + 1,
        say: `${i + 1}번째 펭귄 줄(<tr>)을 골랐어요.` });
      snap({ line: 7, icon: '✂️', page: p, phase: 'row', url, rowIndex: i + 1, cells,
        say: `${i + 1}번째 줄의 <td> 칸 ${cells.length}개에서 글자만 꺼냈어요: [${cells.join(', ')}]` });
      rows.push(cells);
      counters.collected += 1;
      snap({ line: 8, icon: '📥', page: p, phase: 'append', url, rowIndex: i + 1, cells,
        say: `행목록 맨 뒤에 추가했어요. 지금까지 ${rows.length}줄을 모았어요.` });
    });
  }

  const table = { columns: [...CRAWL_COLUMNS], rows: rows.map((r) => [...r]) };
  snap({ line: 9, icon: '🧾', phase: 'frame', table, say: `행목록 ${rows.length}줄을 데이터프레임(표)으로 바꿨어요. 왼쪽 0, 1, 2…는 판다스가 붙이는 인덱스예요.` });
  const csv = [CRAWL_COLUMNS.join(','), ...rows.map((r) => r.join(','))].join('\n');
  snap({ line: 10, icon: '💾', phase: 'save', table, csv, say: 'CSV 파일로 저장했어요. 칸은 쉼표로, 줄은 줄바꿈으로 나뉘어요. 크롤링 끝!' });
  return frames;
}

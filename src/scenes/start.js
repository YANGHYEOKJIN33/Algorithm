/**
 * 🏁 시작 — 0-1 완성품 미리 보기 · 0-2 수업 지도 · 0-3 화면 사용법 · 0-4 펭귄 표 · 0-5 의사코드 읽는 법
 *
 * 긴 장면(완성품·화면 사용법)은 start/ 폴더에 있고, 이 파일에서 미션 신호(ctx.check)를 이어 준다.
 * ✋ 할 일의 act: 낱말이 모두 이 파일에 모여 있다:
 *   predict · three-species (0-1) · stages (0-2) · tour-all (0-3) · cell · nan (0-4)
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import { infoTerm } from '../ui/infoTip.js';
import { practiceRecords, COLUMNS, SPECIES, originalRecords, DUPLICATE_ID } from '../core/data/practice.js';
import { isMissing, fmt } from '../core/stats.js';
import { dataTable } from '../viz/table.js';
import { varBox } from '../viz/bits.js';
import { SPECIES_SHAPE } from '../viz/chart.js';
import * as BASICS from '../core/basics.js';
import { TABS } from '../app/lessons.js';
import { unitProgress, canDoDone } from '../app/missions.js';
import { courseGoal } from './start/goal.js';
import { screenTour } from './start/tour.js';
import { ensureStartStyle } from './start/style.js';

/* ═════════════ 0-2 수업 지도 ═════════════ */

/**
 * 단원마다 바뀌지 않는 보조 정보 — 파이썬 도구 이름.
 * what·change는 그 단원의 unit(question·before·after)이 아직 비어 있을 때만 대신 보여 준다.
 * 단원의 동사·질문·데이터 변화·할 수 있어요 목록은 TABS(각 단원의 course 파일)에서 그때그때 읽는다.
 */
const STAGE_EXTRA = {
  collect: { what: '프로그램으로 웹 페이지의 표를 긁어 와서(크롤링) 데이터프레임으로 만들어요.', change: ['HTML 글자', '표(345줄)'], tools: 'requests · BeautifulSoup · pandas' },
  inspect: { what: '빈칸(결측치)이 어디에 몇 개 있는지, 홀로 동떨어진 값(이상치)은 없는지 찾아요.', change: ['표 345줄', 'NaN 20칸 · 8200g?! · 겹친 행'], tools: 'isnull() · quantile() · boxplot()' },
  prep: { what: '필요한 속성만 남기고, 잘못된 행은 지우고, 빈칸은 채우고, 글자는 숫자로 바꿔요.', change: ['수컷·암컷', '0·1'], tools: 'drop() · fillna() · map()' },
  ready: { what: '흩어진 표를 하나로 합쳐요. 그다음 입력 X와 정답 y로, 훈련 80%와 테스트 20%로 나눠요.', change: ['한 표', '훈련 | 테스트'], tools: 'concat() · merge() · train_test_split()' },
  ml: { what: '분류·회귀·군집 가운데 문제에 맞는 알고리즘을 골라, 훈련 데이터로 모델을 학습시켜요.', change: ['부리·날개', '"젠투!"'], tools: 'KNeighborsClassifier · DecisionTreeClassifier · LinearRegression · KMeans' },
  project: { what: '처음 보는 테스트 데이터로 정확도를 재고, 나만의 주제로 프로젝트를 해요.', change: ['6마리 중 5마리 정답', '정확도 83%'], tools: 'accuracy_score() · Colab' },
};

function pipeline(root, ctx) {
  ensureStartStyle();
  const home = ctx.lesson.tab;
  const units = TABS.filter((t) => t.unit.no > 0).sort((a, b) => a.unit.no - b.unit.no);
  let pick = 0;
  const opened = new Set([0]);
  const hookBox = el('div.smap-hook');
  const stepsBox = el('div.smap-steps', { role: 'group', 'aria-label': '인공지능 프로젝트 여섯 단계 — 눌러서 열기' });
  const countLine = el('p.smap-count');
  const detail = el('div.smap-card', { 'aria-live': 'polite' });

  function drawHook() {
    const h = home.unit.hook;
    if (!h) { fill(hookBox); hookBox.hidden = true; return; }
    const mine = ctx.progress.hook(home.id);
    fill(hookBox,
      el('span.smap-hook__q', {}, `🤔 생각 열기 — ${h.q}`),
      h.options.map((op, i) => el('button.quiz__opt', {
        type: 'button', 'aria-pressed': String(mine === i), 'data-state': mine === i ? 'mine' : null,
        onclick: () => { ctx.progress.setHook(home.id, i); drawHook(); },
      }, op)),
      el('p.smap-hook__note', {}, mine === null
        ? '정답을 맞히라는 게 아니에요. 내 생각을 먼저 정해 두는 거예요. 아래 지도에 힌트가 있어요.'
        : `내 생각: "${h.options[mine]}". 정답은 0단원 정리에서 확인해요. 🔒`));
  }

  function drawSteps() {
    const parts = units.map((t, i) => {
      const pr = unitProgress(ctx.progress, t);
      return el('button.smap-step', {
        type: 'button', 'aria-pressed': String(i === pick), title: `${t.unit.no}단원 ${t.label}${t.verb ? ` — ${t.verb}` : ''} · 진도 ${pr.done}/${pr.total}쪽`,
        onclick: () => openStage(i),
      },
      el('span.smap-step__no', {}, String(t.unit.no)),
      el('span.smap-step__name', {}, `${t.icon} ${t.label}`),
      el('span.smap-step__verb', {}, t.verb || ' '),
      opened.has(i) ? el('span.smap-step__seen', { 'aria-label': '열어 봤어요' }, '✓') : null,
      el('span.smap-step__bar', { style: `--p:${pr.total ? pr.done / pr.total : 0}`, 'aria-hidden': 'true' }));
    });
    fill(stepsBox, parts.flatMap((b, i) => (i < parts.length - 1 ? [b, el('span.smap-to', { 'aria-hidden': 'true' }, '→')] : [b])));
    countLine.textContent = opened.size === units.length
      ? `🎉 여섯 단계를 모두 열어 봤어요. 맨 위 탭의 1~6이 바로 이 순서예요.`
      : `열어 본 단계 ${opened.size} / ${units.length}. 번호 카드를 눌러 보세요. 맨 위 탭의 번호와 같은 번호예요.`;
  }

  function drawDetail() {
    const t = units[pick];
    const u = t.unit;
    const extra = STAGE_EXTRA[t.id] ?? { what: t.tip ?? '', change: [], tools: '' };
    const pr = unitProgress(ctx.progress, t);
    const before = u.before ?? extra.change[0];
    const after = u.after ?? extra.change[1];
    fill(detail,
      el('header.smap-card__head', {},
        el('span.smap-card__icon', { 'aria-hidden': 'true' }, t.icon),
        el('div', {},
          el('p.smap-card__kicker', {}, `${u.no}단원 · 맨 위 탭의 ${u.no}번`),
          el('h3', {}, `${t.label}`, t.verb ? el('span', {}, ` — ${t.verb}`) : null)),
        el('span.smap-meter', { style: `--p:${pr.total ? pr.done / pr.total : 0}`, 'aria-label': `진도 ${pr.done} / ${pr.total}쪽` }, '진도 ', el('span'), ` ${pr.done}/${pr.total}쪽`)),
      el('div.smap-card__grid', {},
        el('div.smap-card__col', {},
          el('p.smap-q', {}, `🤔 ${u.question ?? extra.what}`),
          before || after ? el('div.flowpair', {},
            el('div.flowpair__box', {}, el('span.tag', {}, '들어올 때'), el('p', {}, before ?? '')),
            el('span.flowpair__arrow', { 'aria-hidden': 'true' }, '→'),
            el('div.flowpair__box.flowpair__box--after', {}, el('span.tag.tag--add', {}, '나갈 때'), el('p', {}, after ?? ''))) : null,
          extra.tools ? el('p.smap-tools', {}, `🐍 파이썬 도구: ${extra.tools}`) : null),
        u.canDo?.length ? el('div.smap-card__col', {},
          el('h4', {}, '🎯 이 단원을 마치면 할 수 있어요'),
          el('ul.cando', {}, u.canDo.map((c) => el('li', { 'data-done': canDoDone(ctx.progress, t, c) ? 'true' : null }, c.text)))) : null),
      el('div.smap-card__foot', {},
        el('button.pill', { type: 'button', onclick: () => ctx.go(t.id) }, `${t.icon} ${u.no}단원 표지 보기 →`)));
  }

  function openStage(i) {
    pick = i;
    const before = opened.size;
    opened.add(i);
    if (opened.size === units.length && before < units.length) ctx.check('stages');
    drawSteps();
    drawDetail();
  }

  fill(root, el('div.read.smap', {},
    el('div.hero', {},
      el('div.hero__emoji', { 'aria-hidden': 'true' }, '🐧❓'),
      el('div', {},
        el('h3', {}, home.unit.question ?? '처음 보는 펭귄의 종을 컴퓨터가 맞힐 수 있을까?'),
        el('p', {}, '사람은 사진만 보고도 알아보지만, 컴퓨터는 숫자로 된 데이터에서 규칙을 배워야 해요. 그 규칙을 배우기까지 데이터는 여섯 단계를 거쳐요.'))),
    hookBox,
    stepsBox,
    countLine,
    detail,
    el('div.callout', {}, '💡 실제 인공지능 프로젝트에서는 흔히 시간의 70~80%를 수집, 가공, 전처리에 써요. 데이터가 나쁘면 아무리 좋은 알고리즘도 엉뚱한 것을 배우기 때문이지요(Garbage in, garbage out).'),
  ));
  drawHook();
  const unsub = ctx.progress.subscribe(() => { drawSteps(); drawDetail(); });
  return { destroy: unsub };
}

/* ═════════════ 0-4 펭귄 데이터와 표 ═════════════ */

const SPECIES_INFO = [
  { name: '아델리', look: '부리가 짧고 굵어요. 눈 둘레에 흰 테가 있어요.' },
  { name: '턱끈', look: '턱 아래에 검은 끈 무늬가 있고, 부리가 길어요.' },
  { name: '젠투', look: '몸집이 가장 크고 날개가 길어요. 부리는 길고 얇아요.' },
];

/** 부리 길이·깊이를 어디서 재는지 보여 주는 간단한 그림 */
function billFigure() {
  return el('figure.billfig', { html: `
    <svg viewBox="0 0 260 120" role="img" aria-label="부리길이와 부리깊이를 재는 곳">
      <ellipse cx="70" cy="62" rx="52" ry="40" class="billfig__head"/>
      <circle cx="78" cy="48" r="5" class="billfig__eye"/>
      <path d="M118 50 L214 60 L118 76 Z" class="billfig__bill"/>
      <line x1="118" y1="92" x2="214" y2="92" class="billfig__dim"/>
      <line x1="118" y1="86" x2="118" y2="98" class="billfig__dim"/><line x1="214" y1="86" x2="214" y2="98" class="billfig__dim"/>
      <text x="166" y="110" text-anchor="middle" class="billfig__txt">부리길이</text>
      <line x1="232" y1="50" x2="232" y2="76" class="billfig__dim"/>
      <line x1="226" y1="50" x2="238" y2="50" class="billfig__dim"/><line x1="226" y1="76" x2="238" y2="76" class="billfig__dim"/>
      <text x="238" y="40" text-anchor="middle" class="billfig__txt">부리깊이</text>
    </svg>` },
  el('figcaption', {}, '부리길이는 부리를 앞뒤로 잰 길이, 부리깊이는 위아래로 잰 두께예요. 날개길이와 몸무게도 함께 쟀어요.'));
}

function dataIntro(root, ctx) {
  ensureStartStyle();
  const all = practiceRecords();
  const recs = all.slice(0, 8);
  const original = originalRecords();
  const counts = SPECIES.map((sp) => original.filter((r) => r.종 === sp).length);
  let sel = { row: 2, col: '몸무게' };
  const tableBox = el('div.tablebox');
  const info = el('div.cellinfo', { 'aria-live': 'polite' });

  function pickCell(row, col) {
    sel = { row, col };
    ctx.check('cell');
    if (isMissing(recs[row][col])) ctx.check('nan');
    draw();
  }

  function draw() {
    const table = dataTable({
      columns: COLUMNS, rows: recs,
      rowClass: (r, i) => (i === sel.row ? 'is-row' : ''),
      colClass: (c) => (c === sel.col ? 'is-col' : ''),
      cellClass: (r, c, i) => (i === sel.row && c === sel.col ? 'is-focus' : ''),
    });
    table.classList.add('dtable--click');
    table.querySelectorAll('tbody tr').forEach((tr, i) => {
      tr.querySelectorAll('td').forEach((td, ci) => {
        td.tabIndex = 0;
        td.addEventListener('click', () => pickCell(i, COLUMNS[ci]));
        td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickCell(i, COLUMNS[ci]); } });
      });
    });
    fill(tableBox, table);
    const r = recs[sel.row];
    const v = r[sel.col];
    fill(info,
      el('div.cellinfo__row', {}, el('span.tag.tag--current', {}, '행'), ` 인덱스 ${sel.row}: 펭귄 ${r.번호}번 한 마리의 기록`),
      el('div.cellinfo__row', {}, el('span.tag.tag--result', {}, '열'), ` '${sel.col}': 모든 펭귄의 ${sel.col} 값을 세로로 모은 속성 하나`),
      el('div.cellinfo__row', {}, el(`span.tag${isMissing(v) ? '.tag--warn' : '.tag--add'}`, {}, '값'), ` ${isMissing(v) ? 'NaN: 비어 있는 칸이에요! (결측치)' : fmt(v)}`),
      el('div.cellinfo__code', {}, el('code', {}, `df.loc[${sel.row}, '${sel.col}']`), ' → ', el('code', {}, isMissing(v) ? 'nan' : String(v))));
  }

  const total = counts.reduce((a, b) => a + b, 0);
  fill(root, el('div.read', {},
    el('div.cards', {}, SPECIES_INFO.map((s, i) => el('div.card', {},
      el('div.card__title', {}, el(`span.legend__mark.sp${i}`, {}, SPECIES_SHAPE[i]), ` ${s.name}펭귄`, el('span.card__meta', {}, ` · ${counts[i]}마리`)),
      el('p.card__text', {}, s.look))),
    el('div.card.card--soft', {}, billFigure())),
    el('p.di-count', { 'aria-label': '줄 수 맞추기' },
      '🧮 ', el('span', {}, `원본 펭귄 ${SPECIES.map((sp, i) => `${sp} ${counts[i]}`).join(' + ')} = `), el('b', {}, `${total}마리`),
      el('span.di-count__eq', {}, ' + '),
      el('span.di-count__dup', {}, `수업을 위해 한 번 더 넣은 ${DUPLICATE_ID}번 펭귄 1줄`),
      el('span.di-count__eq', {}, ' = '), el('b', {}, `연습 표 ${all.length}줄`),
      el('span.card__meta', {}, ' (겹친 줄은 3단원 🧹 전처리에서 찾아서 지워요)')),
    el('div.datawrap', {},
      el('div.datawrap__table', {},
        el('div.datawrap__cap', {}, `연습 표의 처음 8줄 (전체 ${all.length}줄 × ${COLUMNS.length}열). 칸을 눌러 보세요. 빨간 NaN은 빈칸이에요.`),
        tableBox),
      el('div.datawrap__side', {},
        info,
        el('ul.termlist', {},
          el('li', {}, infoTerm('행', { strong: true }), ' = 관측 하나(펭귄 한 마리)'),
          el('li', {}, infoTerm('열', { strong: true }), ' = ', infoTerm('속성'), ' 하나(부리길이, 몸무게 …)'),
          el('li', {}, infoTerm('인덱스', { strong: true }), ' = 왼쪽의 회색 번호. 0부터 세고, 펭귄 번호와 달라요'),
          el('li', {}, infoTerm('결측치', { strong: true, label: 'NaN' }), ' = 비어 있는 칸'),
          el('li', {}, infoTerm('데이터프레임', { strong: true }), ' = 판다스(파이썬 도구)에서 이런 표를 부르는 이름'),
          el('li', {}, el('strong', {}, el('code', {}, 'df')), ' = 이 표에 붙인 이름(변수). 코드에서 df가 보이면 "이 펭귄 표"라고 읽으면 돼요'),
          el('li', {}, el('strong', {}, el('code', {}, "df.loc[인덱스, '열']")), ' = 그 행과 그 열이 만나는 칸 하나. 지금 누른 칸이 바로 이런 칸이에요. 예: ', el('code', {}, "df.loc[2, '몸무게']"))))),
    el('p.card__meta', {}, '데이터 출처: palmerpenguins. Gorman 박사 연구팀이 2007~2009년에 남극 파머 기지에서 관측했어요(CC0). 수업을 위해 빈칸 1칸, 잘못 적은 값 1칸, 겹친 행 1줄을 일부러 넣었어요.'),
  ));
  draw();
  return {};
}

/* ═════════════ 0-5 의사코드 읽는 법 (단계 실행) ═════════════ */

const pseudoIntro = {
  kind: 'step',
  pseudo: BASICS.PSEUDO,
  python: BASICS.PYTHON,
  stageTitle: '펭귄 줄',
  stageHint: '파란 테두리는 지금 보는 펭귄, 👑는 지금까지 가장 무거운 펭귄',
  dataTitle: '변수(상자)',
  dataHint: '← 로 새 값을 넣으면 상자 속 값이 바뀌어요',
  rows: ['1.2fr', '0.8fr'],
  frames: () => BASICS.maxFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        fill(stage, el('div.lineup', {}, f.items.map((p, i) => {
          const sp = SPECIES.indexOf(p.label);
          const cls = [p.id === f.focus ? 'is-focus' : '', p.id === f.bestId ? 'is-best' : '', i > 0 && f.items.findIndex((x) => x.id === f.focus) > i ? 'is-past' : ''].filter(Boolean).join('.');
          return el(`div.lineup__card${cls ? `.${cls}` : ''}`, {},
            p.id === f.bestId ? el('span.lineup__crown', { 'data-flip': 'crown' }, '👑') : null,
            el('span.lineup__emoji', {}, '🐧'),
            el('span.lineup__id', {}, `${p.id}번`),
            el('span.lineup__sp', {}, el(`span.legend__mark.sp${sp}`, {}, SPECIES_SHAPE[sp]), ` ${p.label}`),
            el('strong.lineup__w', {}, `${p.w}g`));
        })),
        f.cmp !== null ? el(`div.compare${f.cmp ? '.compare--yes' : '.compare--no'}`, {},
          `p의 몸무게 ${f.items.find((x) => x.id === f.focus).w}g  >  최고 ${f.best}g ?`, el('strong', {}, f.cmp ? '  참 ✅' : '  거짓 ✖️')) : null);
        flip(stage);
        // 1줄(최고 ← 첫 펭귄)만 실행한 장면에서는 반복이 아직 시작되지 않아 p가 비어 있다
        const cur = f.line === 1 ? null : f.items.find((x) => x.id === f.focus);
        fill(data, el('div.varrow', {},
          varBox('최고', `${f.best}g`, { hot: f.line === 1 || f.line === 4, sub: `${f.bestId}번 펭귄` }),
          varBox('p', cur ? `${cur.w}g` : '—', { sub: cur ? `${cur.id}번 펭귄` : '' }),
          el('div.varrow__note', {},
            el('p', {}, el('strong', {}, '의사(擬似)코드 '), '= 진짜 코드를 흉내 내어 프로그램의 순서를 사람 말로 적은 글이에요. 왼쪽 줄을 위에서부터 한 줄씩 실행해요.'),
            el('p', {}, el('strong', {}, '← '), '오른쪽 값을 왼쪽 상자(변수)에 넣어요. 넣으면 예전 값은 사라져요.'),
            el('p', {}, el('strong', {}, '반복 '), '같은 일을 되풀이해요. 그 아래 들여 쓴 줄이 반복할 때마다 하는 일이에요.'),
            el('p', {}, el('strong', {}, '만약 '), '조건이 참일 때만 그 아래 줄을 실행해요.'))));
      },
    };
  },
};

export const START_SCENES = {
  courseGoal: {
    kind: 'view',
    mount: (root, ctx) => courseGoal(root, ctx, {
      predicted: () => ctx.check('predict'),
      allSpecies: () => ctx.check('three-species'),
    }),
  },
  pipeline: { kind: 'view', mount: pipeline },
  screenTour: {
    kind: 'view',
    mount: (root, ctx) => screenTour(root, ctx, { allSeen: () => ctx.check('tour-all') }),
  },
  dataIntro: { kind: 'view', mount: dataIntro },
  pseudoIntro,
};

/**
 * 🏁 시작 — 프로젝트 흐름 · 펭귄 데이터와 표 · 의사코드 읽는 법
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import { infoTerm } from '../ui/infoTip.js';
import { practiceRecords, COLUMNS, SPECIES, originalRecords } from '../core/data/practice.js';
import { isMissing, fmt } from '../core/stats.js';
import { dataTable } from '../viz/table.js';
import { varBox } from '../viz/bits.js';
import { SPECIES_SHAPE } from '../viz/chart.js';
import * as BASICS from '../core/basics.js';

/* ═════════════ 프로젝트 흐름 ═════════════ */

const STAGES = [
  {
    id: 'collect', icon: '🕸', name: '수집', tab: 'collect',
    what: '웹 페이지의 표를 프로그램으로 긁어 와(크롤링) 데이터프레임으로 만들어요.',
    change: ['HTML 글자', '→', '표(345줄)'],
    tools: 'requests · BeautifulSoup · pandas',
  },
  {
    id: 'inspect', icon: '🔍', name: '가공', tab: 'inspect',
    what: '빈칸(결측치)이 어디에 몇 개 있는지, 동떨어진 값(이상치)이 있는지 찾아요.',
    change: ['표 345줄', '→', 'NaN 20칸 · 8200g?! · 겹친 행'],
    tools: 'isnull() · quantile() · boxplot()',
  },
  {
    id: 'prep', icon: '🧹', name: '전처리', tab: 'prep',
    what: '필요한 속성만 남기고, 잘못된 행은 지우고, 빈칸은 채우고, 글자는 숫자로 바꿔요.',
    change: ['수컷·암컷', '→', '0·1'],
    tools: 'drop() · fillna() · map()',
  },
  {
    id: 'ready', icon: '🧩', name: '학습 준비', tab: 'ready',
    what: '흩어진 표를 하나로 합치고, 입력 X와 정답 y, 훈련 80%와 테스트 20%로 나눠요.',
    change: ['한 표', '→', '훈련 | 테스트'],
    tools: 'concat() · merge() · train_test_split()',
  },
  {
    id: 'ml', icon: '🤖', name: '기계학습', tab: 'ml',
    what: '훈련 데이터로 모델을 학습시켜요. 분류·예측·군집에 맞는 알고리즘을 골라요.',
    change: ['부리·날개', '→', '"젠투!"'],
    tools: 'KNeighborsClassifier · DecisionTree · LinearRegression · KMeans',
  },
  {
    id: 'project', icon: '🚀', name: '평가·프로젝트', tab: 'project',
    what: '처음 보는 테스트 데이터로 정확도를 재고, 나만의 주제로 프로젝트를 해요.',
    change: ['6마리 중', '5마리', '정답 83%'],
    tools: 'accuracy_score() · Colab',
  },
];

function pipeline(root, ctx) {
  let pick = 0;
  const detail = el('div.pipe__detail');
  const steps = STAGES.map((st, i) => el('button.pipe__step', {
    type: 'button', onclick: () => { pick = i; draw(); },
  }, el('span.pipe__no', {}, String(i + 1)), el('span.pipe__icon', {}, st.icon), el('span.pipe__name', {}, st.name)));

  function draw() {
    steps.forEach((b, i) => b.setAttribute('aria-pressed', String(i === pick)));
    const st = STAGES[pick];
    fill(detail,
      el('div.pipe__card', {},
        el('div.pipe__cardhead', {}, el('span.pipe__bigicon', {}, st.icon), el('h3', {}, `${pick + 1}. ${st.name}`)),
        el('p', {}, st.what),
        el('div.pipe__change', { 'aria-label': '표가 바뀌는 모습' }, st.change.map((c, i) => el(`span${i === 1 ? '.pipe__arrow' : '.pipe__chip'}`, {}, c))),
        el('p.card__meta', {}, `🐍 파이썬 도구: ${st.tools}`),
        el('div', {}, el('button.pill.ctrl--primary', { type: 'button', onclick: () => ctx.go(st.tab) }, `${st.icon} ${st.name} 탭으로 가기 →`))));
  }

  fill(root, el('div.read', {},
    el('div.hero', {},
      el('div.hero__emoji', { 'aria-hidden': 'true' }, '🐧❓'),
      el('div', {},
        el('h3', {}, '처음 보는 펭귄의 부리와 날개를 재면, 컴퓨터가 종을 맞힐 수 있을까요?'),
        el('p', {}, '사람은 사진을 보고 알아보지만, 컴퓨터는 숫자로 된 데이터에서 규칙을 배워야 해요. 그 규칙을 배우기까지 데이터는 여섯 단계를 거쳐요.'))),
    el('div.pipe', { role: 'group', 'aria-label': '인공지능 프로젝트 여섯 단계' },
      steps.flatMap((b, i) => (i < steps.length - 1 ? [b, el('span.pipe__to', { 'aria-hidden': 'true' }, '→')] : [b]))),
    detail,
    el('div.callout', {}, '💡 실제 인공지능 프로젝트에서는 시간의 대부분(흔히 70~80%)을 수집·가공·전처리에 써요. 데이터가 나쁘면 아무리 좋은 알고리즘도 엉뚱한 것을 배우기 때문이에요(Garbage in, garbage out).'),
  ));
  draw();
  return {};
}

/* ═════════════ 펭귄 데이터와 표 ═════════════ */

const SPECIES_INFO = [
  { name: '아델리', look: '부리가 짧고 굵어요. 눈 둘레에 흰 테가 있어요.' },
  { name: '턱끈', look: '턱 아래에 검은 끈 무늬가 있어요. 부리가 길어요.' },
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
  el('figcaption', {}, '부리길이는 앞뒤로, 부리깊이는 위아래로 잰 두께예요. 날개길이·몸무게도 함께 쟀어요.'));
}

function dataIntro(root) {
  const recs = practiceRecords().slice(0, 8);
  const counts = SPECIES.map((sp) => originalRecords().filter((r) => r.종 === sp).length);
  let sel = { row: 2, col: '몸무게' };
  const tableBox = el('div.tablebox');
  const info = el('div.cellinfo', { 'aria-live': 'polite' });

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
        const pickCell = () => { sel = { row: i, col: COLUMNS[ci] }; draw(); };
        td.addEventListener('click', pickCell);
        td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickCell(); } });
      });
    });
    fill(tableBox, table);
    const r = recs[sel.row];
    const v = r[sel.col];
    fill(info,
      el('div.cellinfo__row', {}, el('span.tag.tag--current', {}, '행'), ` 인덱스 ${sel.row} — 펭귄 ${r.번호}번 한 마리의 기록`),
      el('div.cellinfo__row', {}, el('span.tag.tag--result', {}, '열'), ` '${sel.col}' — 모든 펭귄의 ${sel.col} 값이 세로로 모여 있어요(속성 하나)`),
      el('div.cellinfo__row', {}, el(`span.tag${isMissing(v) ? '.tag--warn' : '.tag--add'}`, {}, '값'), ` ${isMissing(v) ? 'NaN — 비어 있어요! (결측치)' : fmt(v)}`),
      el('div.cellinfo__code', {}, el('code', {}, `df.loc[${sel.row}, '${sel.col}']`), ' → ', el('code', {}, isMissing(v) ? 'nan' : String(v))));
  }

  fill(root, el('div.read', {},
    el('div.cards', {}, SPECIES_INFO.map((s, i) => el('div.card', {},
      el('div.card__title', {}, el(`span.legend__mark.sp${i}`, {}, SPECIES_SHAPE[i]), ` ${s.name}펭귄`, el('span.card__meta', {}, ` · ${counts[i]}마리`)),
      el('p.card__text', {}, s.look))),
    el('div.card.card--soft', {}, billFigure())),
    el('div.datawrap', {},
      el('div.datawrap__table', {},
        el('div.datawrap__cap', {}, '연습 데이터의 처음 8줄 (전체 345줄 × 9열) — 칸을 눌러 보세요'),
        tableBox),
      el('div.datawrap__side', {},
        info,
        el('ul.termlist', {},
          el('li', {}, infoTerm('행', { strong: true }), ' = 관측 하나(펭귄 한 마리)'),
          el('li', {}, infoTerm('열', { strong: true }), ' = ', infoTerm('속성'), ' 하나(부리길이, 몸무게 …)'),
          el('li', {}, infoTerm('인덱스', { strong: true }), ' = 왼쪽 회색 번호, 0부터 세요'),
          el('li', {}, infoTerm('결측치', { strong: true, label: 'NaN' }), ' = 비어 있는 칸'),
          el('li', {}, infoTerm('데이터프레임', { strong: true }), ' = 이런 표를 파이썬(판다스)이 부르는 이름')))),
    el('p.card__meta', {}, '데이터 출처: palmerpenguins — 남극 파머 기지에서 2007~2009년에 관측(Gorman 박사 연구팀, CC0). 수업을 위해 빈칸 1칸·잘못 적은 값 1칸·겹친 행 1줄을 일부러 넣었어요.'),
  ));
  draw();
  return {};
}

/* ═════════════ 의사코드 읽는 법 (단계 실행) ═════════════ */

const pseudoIntro = {
  kind: 'step',
  pseudo: BASICS.PSEUDO,
  python: BASICS.PYTHON,
  stageTitle: '펭귄 줄',
  stageHint: '지금 보는 펭귄은 파란 테두리, 지금까지 가장 무거운 펭귄은 👑',
  dataTitle: '변수(상자)',
  dataHint: '← 로 값을 넣으면 상자 속 값이 바뀌어요',
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
        const cur = f.items.find((x) => x.id === f.focus);
        fill(data, el('div.varrow', {},
          varBox('최고', `${f.best}g`, { hot: f.line === 1 || f.line === 4, sub: `${f.bestId}번 펭귄` }),
          varBox('p', cur ? `${cur.w}g` : '—', { sub: cur ? `${cur.id}번 펭귄` : '' }),
          el('div.varrow__note', {},
            el('p', {}, el('strong', {}, '← '), '오른쪽 값을 왼쪽 상자에 넣어요. 넣으면 예전 값은 사라져요.'),
            el('p', {}, el('strong', {}, '반복 '), '같은 일을 되풀이해요. 들여 쓴 줄이 반복 안에서 할 일이에요.'),
            el('p', {}, el('strong', {}, '만약 '), '조건이 참일 때만 그 아래 줄을 실행해요.'))));
      },
    };
  },
};

export const START_SCENES = {
  pipeline: { kind: 'view', mount: pipeline },
  dataIntro: { kind: 'view', mount: dataIntro },
  pseudoIntro,
};

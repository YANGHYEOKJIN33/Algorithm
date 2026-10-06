/**
 * 🚀 프로젝트 — 모델 평가(정확도) · 전체 흐름 정리 · 이해 확인 · 프로젝트 안내
 */
import { el, fill } from '../ui/dom.js';
import { quizBox } from '../ui/quizBox.js';
import * as EV from '../core/ml/evaluate.js';
import { s, marker } from '../viz/svg.js';
import { createScatter, starPath, sizeOf } from '../viz/scatter.js';
import { speciesLegend, speciesIndex, SPECIES_SHAPE } from '../viz/chart.js';
import { colabUrl, notebookUrl, DATA_CSV_URL } from '../app/links.js';
import { QUIZ } from '../app/quiz.js';

const AXES = { x: [33, 56], y: [12.5, 22], xLabel: '부리길이 (mm)', yLabel: '부리깊이 (mm)' };

/* ═════════════ 모델 평가 ═════════════ */

const evaluate = {
  kind: 'step',
  pseudo: EV.PSEUDO,
  python: EV.PYTHON,
  notebook: '09_project_template',
  stageTitle: '훈련 데이터(작은 점) · 테스트 펭귄 ★',
  stageHint: '테스트 펭귄의 진짜 종은 가린 채 맞혀요',
  dataTitle: '채점표',
  rows: ['1.25fr', '0.85fr'],
  frames: () => EV.evalFrames(),
  mount({ stage, data }) {
    stage.classList.add('fit');
    const sc = createScatter({ ...AXES, ...sizeOf(stage, { reserve: 30 }) });
    fill(stage, speciesLegend([el('span.legend__item', {}, el('span.legend__mark', {}, '★'), '테스트 펭귄')]), el('div.fit__grow', {}, sc.svg));
    return {
      render(v) {
        const f = v.frame;
        sc.clear('points', 'links', 'over');
        const t = f.test.find((x) => x.id === f.focus);
        if (t) for (const id of f.neighbors) {
          const p = f.train.find((x) => x.id === id);
          sc.layers.links.append(s('line.link.link--nb', { x1: sc.sx(t.x), y1: sc.sy(t.y), x2: sc.sx(p.x), y2: sc.sy(p.y) }));
        }
        for (const p of f.train) {
          const si = speciesIndex(p.label);
          sc.layers.points.append(marker(si, sc.sx(p.x), sc.sy(p.y), 5, { class: `pt sp${si}${t && !f.neighbors.includes(p.id) ? ' is-dim' : ''}` }));
        }
        const graded = new Map(f.rows.map((r) => [r.id, r]));
        for (const q of f.test) {
          const g = s('g', { transform: `translate(${sc.sx(q.x)},${sc.sy(q.y)})` }, starPath(q.id === f.focus ? 12 : 9));
          sc.layers.over.append(g);
          const r = graded.get(q.id);
          if (r) sc.layers.over.append(s(`text.grade${r.ok ? '.is-ok' : '.is-no'}`, { x: sc.sx(q.x) + 10, y: sc.sy(q.y) - 8 }, r.ok ? '⭕' : '❌'));
          if (q.id === f.focus) sc.layers.over.append(s('circle.pt-ring.pt-ring--current', { cx: sc.sx(q.x), cy: sc.sy(q.y), r: 16 }));
        }
        const pct = f.accuracy !== null ? Math.round(f.accuracy * 100) : null;
        fill(data, el('div.evalds', {},
          el('table.mini', {},
            el('thead', {}, el('tr', {}, ['번호', '진짜 종 (y_test)', '예측 (pred)', '채점'].map((h) => el('th', {}, h)))),
            el('tbody', {}, f.test.map((q) => {
              const r = graded.get(q.id);
              const si = speciesIndex(q.label);
              return el(`tr${q.id === f.focus ? '.is-best' : ''}`, {},
                el('td', {}, `${q.id}번`),
                el('td', {}, r ? [el(`span.legend__mark.sp${si}`, {}, SPECIES_SHAPE[si]), ` ${q.label}`] : '(가림)'),
                el('td', {}, r ? r.pred : q.id === f.focus ? '…' : ''),
                el('td', {}, r ? (r.ok ? '⭕ 맞음' : '❌ 틀림') : ''));
            }))),
          el('div.evalds__score', {},
            el('div.calcgrid__k', {}, '맞힌수 ÷ 테스트 수'),
            el('div.evalds__big', {}, `${f.correct} ÷ ${f.test.length}`),
            el('div.lrx__meter', {}, el('span', { style: `width:${pct ?? 0}%` })),
            el('div.evalds__pct', {}, pct !== null ? `정확도 ${pct}%` : '채점 중…'))));
      },
    };
  },
};

/* ═════════════ 전체 흐름 정리 ═════════════ */

const FLOW = [
  { tab: 'collect', icon: '🕸', step: '수집', did: '연습 사이트 7쪽을 크롤링해 345줄 표를 만들었어요.', pseudo: '요청 → 분석 → <tr> 찾기 → 칸 꺼내기 → 행목록에 추가', py: 'requests.get · BeautifulSoup · find_all · DataFrame · to_csv' },
  { tab: 'inspect', icon: '🔍', step: '가공', did: '결측치 20칸(12줄)과 이상치(8200g) 하나, 겹친 행 하나를 찾았어요.', pseudo: '칸마다 비었나? → True 세기 → 위치 모으기 · Q1/Q3/IQR → 울타리 밖', py: 'isnull() · sum() · any(axis=1) · quantile() · boxplot()' },
  { tab: 'prep', icon: '🧹', step: '전처리', did: '핵심 속성 4개를 고르고, 지우고, 채우고, 글자를 숫자로 바꿨어요.', pseudo: '속성 고르기 · 행/열 지우기 · 평균/최빈값으로 채우기 · 바꿈표로 바꾸기', py: 'drop() · drop_duplicates() · dropna() · fillna() · map()' },
  { tab: 'ready', icon: '🧩', step: '학습 준비', did: '표를 합치고, X와 y, 훈련 80%와 테스트 20%로 나눴어요.', pseudo: '아래로 잇기 · 열쇠로 짝 찾기 · 섞기 → 앞 80% / 나머지 20%', py: 'concat() · merge() · train_test_split()' },
  { tab: 'ml', icon: '🤖', step: '기계학습', did: '분류(k-최근접 이웃·트리), 예측(선형 회귀), 군집(k-평균)을 배웠어요.', pseudo: '거리·다수결 / 질문으로 나누기 / 평균에서 벗어난 정도 / 배정↔이동', py: 'KNeighborsClassifier · DecisionTreeClassifier · LinearRegression · KMeans' },
  { tab: 'project', icon: '📊', step: '평가', did: '처음 보는 테스트 데이터로 정확도를 쟀어요(6마리 중 5마리, 83%).', pseudo: '테스트마다 예측 → 정답과 견주기 → 맞힌수 ÷ 전체', py: 'predict() · accuracy_score() · mean_squared_error()' },
];

function summary(root, ctx) {
  fill(root, el('div.read.read--wide', {},
    el('table.mini.flowtable', {},
      el('thead', {}, el('tr', {}, ['단계', '우리가 한 일', '의사코드 핵심', '파이썬', ''].map((h) => el('th', {}, h)))),
      el('tbody', {}, FLOW.map((r) => el('tr', {},
        el('td', {}, el('b', {}, `${r.icon} ${r.step}`)), el('td', {}, r.did), el('td', {}, el('code', {}, r.pseudo)), el('td', {}, el('code.flowtable__py', {}, r.py)),
        el('td', {}, el('button.pill.pill--sm', { type: 'button', onclick: () => ctx.go(r.tab) }, '다시 보기 →')))))),
    el('div.cards', {},
      el('div.card.card--current', {}, el('div.card__title', {}, '🔁 데이터가 바뀐 모습'), el('p.card__text', {}, 'HTML 글자 → 345줄 표(빈칸·이상치·겹친 행) → 깨끗한 341줄 표 → X(속성 4개)·y(종) → 훈련 272줄 · 테스트 69줄 → 모델 → 예측')),
      el('div.card.card--result', {}, el('div.card__title', {}, '🧠 자료구조가 한 일'), el('p.card__text', {}, '리스트(행목록·거리목록·위치목록), 사전(세기표·바꿈표·투표), 큐(트리의 할일), 표(데이터프레임)·점수표(Q). 알고리즘은 결국 자료구조를 바꿔 가는 절차예요.')),
      el('div.card.card--add', {}, el('div.card__title', {}, '✅ 기억할 것 세 가지'), el('p.card__text', {}, '① 데이터가 나쁘면 결과도 나쁘다. ② 테스트 데이터는 학습에 쓰지 않는다. ③ 알고리즘은 목적(분류·예측·군집)에 맞춰 고른다.')))));
  return {};
}

/* ═════════════ 이해 확인 ═════════════ */

function quiz(root) {
  fill(root, el('div.read', {}, quizBox(QUIZ, { title: '📝 이해 확인 — 10문제' })));
  return {};
}

/* ═════════════ 프로젝트 안내 ═════════════ */

const STEPS = [
  { icon: '🎯', name: '문제 정하기', todo: '무엇을 맞힐까? 분류·예측·군집 중 무엇인가? 정답(y)은 무엇인가?', py: '—', tab: 'ml' },
  { icon: '🕸', name: '데이터 모으기', todo: '공개 데이터를 내려받거나 크롤링해요. 출처와 이용 조건을 적어 둬요.', py: 'pd.read_csv · requests · BeautifulSoup', tab: 'collect' },
  { icon: '🔍', name: '데이터 살펴보기', todo: '행·열 수, 결측치, 이상치를 확인해요. 그래프로 그려 봐요.', py: 'shape · isnull().sum() · describe() · boxplot', tab: 'inspect' },
  { icon: '🧹', name: '전처리', todo: '핵심 속성 고르기, 지우기·채우기, 글자를 숫자로.', py: 'drop · dropna · fillna · map', tab: 'prep' },
  { icon: '🧩', name: '나누기', todo: 'X와 y, 훈련과 테스트로 나눠요.', py: 'train_test_split', tab: 'ready' },
  { icon: '🤖', name: '모델 학습', todo: '목적에 맞는 알고리즘을 골라 fit() 해요. 두 가지 이상 견줘 보면 더 좋아요.', py: 'KNeighborsClassifier · DecisionTreeClassifier · LinearRegression · KMeans', tab: 'ml' },
  { icon: '📊', name: '평가', todo: '테스트 데이터로 정확도(분류)·오차(예측)를 재고, 틀린 예를 살펴봐요.', py: 'accuracy_score · mean_squared_error', tab: 'project' },
  { icon: '🎤', name: '발표', todo: '문제 → 데이터 → 전처리 근거 → 모델 선택 이유 → 결과 → 한계와 개선점 순서로.', py: '—', tab: null },
];

const TOPICS = [
  { icon: '🌸', title: '붓꽃 품종 분류', kind: '분류', data: 'scikit-learn 내장 데이터 load_iris()', algo: 'k-최근접 이웃 · 의사결정 트리' },
  { icon: '🍷', title: '와인 종류 분류', kind: '분류', data: 'scikit-learn 내장 데이터 load_wine()', algo: '의사결정 트리 · k-최근접 이웃' },
  { icon: '🌡', title: '우리 동네 기온 예측', kind: '예측', data: '기상자료개방포털(data.kma.go.kr)의 일별 기온 CSV', algo: '선형 회귀' },
  { icon: '🚲', title: '공공자전거 대여량 예측', kind: '예측', data: '서울 열린데이터광장(data.seoul.go.kr)·공공데이터포털(data.go.kr)', algo: '선형 회귀 · 의사결정 트리' },
  { icon: '🛒', title: '매점 판매 기록으로 상품 묶기', kind: '군집', data: '학교 매점·학급 설문 데이터(개인정보 없이)', algo: 'k-평균' },
  { icon: '🐧', title: '펭귄 성별 맞히기', kind: '분류', data: '이 수업의 펭귄 데이터 (정답: 성별)', algo: 'k-최근접 이웃 · 의사결정 트리' },
];

const CHECK_KEY = 'ai-data-lab:project-check';

function project(root) {
  let checked = {};
  try { checked = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}'); } catch { checked = {}; }
  const save = () => { try { localStorage.setItem(CHECK_KEY, JSON.stringify(checked)); } catch { /* 무시 */ } };
  const list = el('ol.projsteps');
  function drawSteps() {
    fill(list, STEPS.map((st, i) => el(`li.projstep${checked[i] ? '.is-done' : ''}`, {},
      el('label.projstep__check', {}, el('input', { type: 'checkbox', checked: Boolean(checked[i]), onchange: (e) => { checked[i] = e.target.checked; save(); drawSteps(); } }), el('span.sr-only', {}, `${st.name} 했어요`)),
      el('span.projstep__icon', {}, st.icon),
      el('div.projstep__body', {}, el('b', {}, `${i + 1}. ${st.name}`), el('span', {}, st.todo), el('code.flowtable__py', {}, st.py)))));
  }
  drawSteps();
  fill(root, el('div.read.read--wide', {},
    el('div.nb__top', {},
      el('p', {}, '📒 ', el('b', {}, '프로젝트 틀 노트북'), ' — 펭귄 데이터로 처음부터 끝까지(수집 → 평가) 돌아가는 완성 예시예요. 단계마다 "✏️ 여기를 바꿔요" 표시가 있어, 내 데이터와 내 목표로 바꿔 쓰면 돼요.'),
      el('a.pill.pill--colab', { href: colabUrl('09_project_template'), target: '_blank', rel: 'noopener' }, '📒 Colab에서 열기'),
      el('a.pill', { href: notebookUrl('09_project_template'), target: '_blank', rel: 'noopener' }, '⬇ 노트북 받기')),
    el('div.projgrid', {},
      el('section', {}, el('h3', {}, '✅ 단계별 체크리스트'), el('p.panel__hint', {}, '한 단계씩 끝낼 때마다 체크하세요(이 브라우저에만 저장돼요).'), list),
      el('section', {},
        el('h3', {}, '💡 주제 예시'),
        el('div.cards', {}, TOPICS.map((t) => el('div.card', {},
          el('div.card__title', {}, `${t.icon} ${t.title}`, ' ', el(`span.tag${t.kind === '분류' ? '.tag--current' : t.kind === '예측' ? '.tag--result' : '.tag--add'}`, {}, t.kind)),
          el('p.card__text', {}, '📂 ', t.data), el('p.card__meta', {}, `🤖 ${t.algo}`)))),
        el('h3', {}, '🔎 데이터 구하는 곳'),
        el('ul', {},
          el('li', {}, '공공데이터포털 data.go.kr · 서울 열린데이터광장 data.seoul.go.kr · 기상자료개방포털 data.kma.go.kr'),
          el('li', {}, 'scikit-learn 내장 데이터: load_iris(), load_wine(), load_diabetes() — 내려받기 없이 바로 써요'),
          el('li', {}, 'Kaggle Datasets(kaggle.com/datasets) — 회원가입이 필요해요'),
          el('li', {}, '직접 크롤링 — 🕸 수집 탭의 예절(robots.txt·천천히·개인정보 없이)을 꼭 지켜요'),
          el('li', {}, '이 수업의 펭귄 데이터: ', el('a', { href: DATA_CSV_URL, target: '_blank', rel: 'noopener' }, 'penguins.csv')))),
    ),
    el('div.callout', {}, '🧭 평가 기준 예시 — ① 문제가 분명한가(무엇을 맞히나) ② 데이터 출처와 수집 방법을 밝혔나 ③ 결측치·이상치를 확인하고 처리한 근거가 있나 ④ 목적에 맞는 알고리즘을 골랐나 ⑤ 테스트 데이터로 공정하게 평가했나 ⑥ 한계와 개선점을 말할 수 있나')));
  return {};
}

export const PROJECT_SCENES = {
  evaluate,
  summary: { kind: 'view', mount: summary },
  quiz: { kind: 'view', mount: quiz },
  project: { kind: 'view', mount: project },
};

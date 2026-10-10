/**
 * 🤖 기계학습 개념 — 학습 방법(지도·비지도·강화) · 강화학습 맛보기 · 학습 목적(분류·회귀·군집)
 *
 * 미션 신호: ctx.check('algo-map') — 알고리즘 지도에서 "몸무게 예측"에 맞는 알고리즘(선형 회귀)을 골랐을 때
 * (학습 방법·목적 쪽의 문제 상자는 'quiz:answer' 사건을 스스로 올려 보낸다 → 미션 'quiz'·'right:N')
 */
import { el, fill } from '../ui/dom.js';
import { quizBox } from '../ui/quizBox.js';
import { infoTerm } from '../ui/infoTip.js';
import * as RL from '../core/ml/rl.js';
import * as KM from '../core/ml/kmeans.js';
import * as LR from '../core/ml/linreg.js';
import { knnTrain, linregData } from '../core/data/sets.js';
import { s, marker } from '../viz/svg.js';
import { makeChart, speciesIndex } from '../viz/chart.js';
import { fmt } from '../core/stats.js';

/* ── 작은 그림들 ── */

function miniScatter(kind, { height = 190 } = {}) {
  const pts = knnTrain();
  const c = makeChart({ width: 300, height, x: [34, 54], y: [12.5, 22], xLabel: '부리길이', yLabel: '부리깊이', pad: { l: 46, r: 8, t: 8, b: 36 }, xTicks: 4, yTicks: 3 });
  if (kind === 'cluster') {
    const run = KM.runKMeans(pts, [21, 160, 282]);
    run.centers.forEach((ct, j) => c.plot.append(s(`ellipse.groupring.cl${j}`, { cx: c.sx(ct.x), cy: c.sy(ct.y), rx: 42, ry: 30 })));
    pts.forEach((p, i) => c.plot.append(marker(0, c.sx(p.x), c.sy(p.y), 4.5, { class: `pt cl${run.assign[i]}` })));
  } else if (kind === 'grey') {
    pts.forEach((p) => c.plot.append(marker(0, c.sx(p.x), c.sy(p.y), 4.5, { class: 'pt unk' })));
  } else {
    pts.forEach((p) => { const si = speciesIndex(p.label); c.plot.append(marker(si, c.sx(p.x), c.sy(p.y), 4.5, { class: `pt sp${si}` })); });
    if (kind === 'classify') {
      c.plot.append(s('path.star', { d: 'M0,-9L2.1,-2.9L8.6,-2.8L3.4,1.1L5.3,7.3L0,3.6L-5.3,7.3L-3.4,1.1L-8.6,-2.8L-2.1,-2.9Z', transform: `translate(${c.sx(43.5)},${c.sy(18.1)})` }));
      // 글자는 ★ 바로 위 빈 곳에(오른쪽의 턱끈 ▲들을 가리지 않게) — .pt-label은 테두리(halo)가 있다
      c.plot.append(s('text.pt-label', { x: c.sx(43.5), y: c.sy(18.1) - 14, 'text-anchor': 'middle' }, '? → 턱끈'));
    }
  }
  return c.svg;
}

function miniRegression({ height = 190 } = {}) {
  const pts = linregData();
  const { w, b } = LR.fitLine(pts);
  const c = makeChart({ width: 300, height, x: [168, 236], y: [2800, 6200], xLabel: '날개길이', yLabel: '몸무게', pad: { l: 54, r: 8, t: 8, b: 36 }, xTicks: 4, yTicks: 3 });
  c.plot.append(s('line.fitline', { x1: c.sx(170), y1: c.sy(w * 170 + b), x2: c.sx(234), y2: c.sy(w * 234 + b) }));
  pts.forEach((p) => { const si = speciesIndex(p.label); c.plot.append(marker(si, c.sx(p.x), c.sy(p.y), 4.5, { class: `pt sp${si}` })); });
  const qy = w * 210 + b;
  c.plot.append(s('circle.predpt', { cx: c.sx(210), cy: c.sy(qy), r: 6 }));
  c.plot.append(s('text.pt-label', { x: c.sx(210) - 70, y: c.sy(qy) - 10 }, `210mm → ${Math.round(qy)}g`));
  return c.svg;
}

function rlLoop() {
  return el('div.rlloop', { role: 'img', 'aria-label': '에이전트가 행동하면 환경이 보상을 돌려주는 순환' },
    el('div.rlloop__box', {}, '🐧', el('small', {}, '에이전트(배우는 쪽)')),
    el('div.rlloop__arrows', {},
      el('div.rlloop__arrow', {}, '행동 → (왼쪽? 오른쪽?)'),
      el('div.rlloop__arrow.rlloop__arrow--back', {}, '← 보상 (+10 물고기 / −10 구멍)')),
    el('div.rlloop__box', {}, '🧊', el('small', {}, '환경(얼음길)')));
}

/* ═════════════ 학습 방법에 따른 구분 ═════════════ */

const TYPE_QUIZ = [
  { q: '사진마다 "고양이/개" 정답이 붙은 데이터로, 새 사진이 고양이인지 개인지 맞히게 한다.', options: ['지도학습', '비지도학습', '강화학습'], answer: 0, why: '정답(레이블)이 붙은 데이터로 배우니 지도학습(분류)이에요.' },
  { q: '온라인 쇼핑몰 고객들을 구매 습관이 비슷한 무리로 나눈다. 무리의 정답은 정해져 있지 않다.', options: ['지도학습', '비지도학습', '강화학습'], answer: 1, why: '정답 없이 비슷한 것끼리 묶으니 비지도학습(군집)이에요.' },
  { q: '바둑 AI가 스스로 수많은 판을 두며 이기면 +, 지면 − 점수를 받아 실력을 키운다.', options: ['지도학습', '비지도학습', '강화학습'], answer: 2, why: '해 보고 받은 보상으로 더 나은 행동을 익히니 강화학습이에요.' },
  { q: '지난 10년 동안의 아파트 넓이와 가격 데이터로 새 아파트의 가격을 예측한다.', options: ['지도학습', '비지도학습', '강화학습'], answer: 0, why: '정답(가격)이 있는 데이터로 숫자를 예측하니 지도학습(회귀)이에요.' },
  { q: '펭귄 341마리의 부리 길이·깊이만 보고(종은 모름) 비슷한 펭귄끼리 3무리로 나눈다.', options: ['지도학습', '비지도학습', '강화학습'], answer: 1, why: '종(정답)을 쓰지 않으니 비지도학습이에요. 이 사이트에서 배울 k-평균이 이런 일을 해요.' },
  { q: '로봇 청소기가 부딪히면 −, 먼지를 치우면 + 신호를 받으며 집 안을 도는 길을 익힌다.', options: ['지도학습', '비지도학습', '강화학습'], answer: 2, why: '행동하고, 보상을 받고, 고치는 일을 되풀이하니 강화학습이에요.' },
];

function learnTypes(root) {
  const card = (cls, icon, title, label, svg, rows) => el(`div.card.typecard${cls}`, {},
    el('div.typecard__head', {}, el('span.card__icon', {}, icon), el('div', {}, el('div.card__title', {}, title), el('div.card__meta', {}, label))),
    el('div.typecard__fig', {}, svg),
    el('ul.typecard__list', {}, rows.map((r) => el('li', {}, r))));
  fill(root, el('div.read.read--wide', {},
    el('div.cards.cards--3', {},
      card('.card--current', '👩‍🏫', '지도학습', '정답(레이블)이 있는 데이터로 배워요', miniScatter('labeled'), [
        el('span', {}, el('b', {}, '데이터: '), '문제(부리·날개) + 정답(종 또는 몸무게)'),
        el('span', {}, el('b', {}, '배우는 것: '), '문제에서 정답으로 가는 규칙'),
        el('span', {}, el('b', {}, '예: '), '펭귄 종 분류, 스팸 메일 거르기, 몸무게 회귀(숫자 예측)'),
        el('span', {}, el('b', {}, '이 수업: '), 'k-최근접 이웃 · 의사결정 트리 · 선형 회귀')]),
      card('.card--add', '🧭', '비지도학습', '정답 없이 데이터 속 구조를 찾아요', miniScatter('cluster'), [
        el('span', {}, el('b', {}, '데이터: '), '문제(부리길이·부리깊이)만, 정답 없음'),
        el('span', {}, el('b', {}, '배우는 것: '), '비슷한 것끼리 모인 무리(군집)'),
        el('span', {}, el('b', {}, '예: '), '고객 무리 나누기, 비슷한 뉴스 묶기'),
        el('span', {}, el('b', {}, '이 수업: '), 'k-평균')]),
      card('.card--result', '🎮', '강화학습', '직접 해 보고 받은 보상으로 익혀요', rlLoop(), [
        el('span', {}, el('b', {}, '데이터: '), '정답 대신 행동의 결과(보상)'),
        el('span', {}, el('b', {}, '배우는 것: '), '보상을 가장 많이 받는 행동'),
        el('span', {}, el('b', {}, '예: '), '게임·바둑 AI, 로봇 걷기, 자율주행'),
        el('span', {}, el('b', {}, '이 수업: '), '다음 쪽 "강화학습 맛보기"')])),
    el('div.callout', {}, '💡 가르는 질문은 하나예요. "데이터에 ', infoTerm('레이블', { strong: true, label: '정답(레이블)' }), '이 있나?" 있으면 지도학습, 없으면 비지도학습이에요. 정답 대신 ', infoTerm('보상', { strong: true }), '을 받으며 배우면 강화학습이고요.'),
    quizBox(TYPE_QUIZ, { row: true, title: '✅ 어떤 학습일까요?' })));
  return {};
}

/* ═════════════ 강화학습 맛보기 (단계 실행) ═════════════ */

/** 맛보기용 쉬운 의사코드 — 줄 번호(1~8)는 core/ml/rl.js의 장면(line)과 같다. 핵심은 7번 "보상으로 점수표를 고친다" */
const RL_PSEUDO = [
  { code: '점수표 ← 모든 칸·방향에 0', note: '처음에는 어느 쪽이 좋은지 모르니 점수가 모두 0이에요.' },
  { code: '반복: 도전 1, 2, 3, 4번째', note: '물고기나 구멍에 닿으면 도전 한 번이 끝나고, 출발 칸에서 다시 해요.' },
  { code: '    펭귄을 출발 칸에 세운다', note: '가운데 🏁 칸에서 시작해요.' },
  { code: '    반복: 물고기나 구멍에 닿을 때까지', note: '한 걸음씩 움직여요.' },
  { code: '        점수가 더 큰 쪽으로 간다 (같으면 아무 쪽이나)', note: '배운 것은 써먹고, 아직 모르는 곳(점수가 같은 곳)은 새로 가 봐요.' },
  { code: '        움직이고 보상을 받는다 (🐟 +10 · 🕳 −10 · 한 걸음 −1)', note: '보상은 정답이 아니라 "좋았나, 나빴나"를 알려 주는 신호예요.' },
  { code: '        보상으로 점수표를 고친다', note: '새 점수 = 받은 보상 + 0.9 × (다음 칸에서 가장 큰 점수). 좋은 결과가 한 칸씩 거꾸로 전해져요.' },
  { code: '        한 칸 옮긴다', note: '옮긴 칸에서 다시 점수가 큰 쪽을 골라요.' },
];

const rlStep = {
  kind: 'step',
  pseudo: RL_PSEUDO,
  python: RL.PYTHON,
  stageTitle: '얼음길 — 🕳 구멍(−10) · 🐟 물고기(+10) · 한 걸음 −1',
  stageHint: '',
  dataTitle: '점수표 Q (칸 × 행동)',
  rows: ['1.3fr', '0.8fr'],   // 얼음길 아래 도전 결과 표가 잘리지 않게(점수표는 4줄뿐)
  // 장면 설명의 Q[칸, 방향]을 화면의 이름(점수표)으로
  frames: () => RL.rlFrames().map((f) => ({ ...f, say: f.say.replace(/^Q\[/, '점수표[') })),
  mount({ stage, data }) {
    return {
      render(v) {
        const f = v.frame;
        const cells = RL.CELLS.map((icon, i) => {
          const here = f.pos === i;
          const visited = f.trail.includes(i);
          return el(`div.ice__cell${here ? '.is-here' : ''}${visited ? '.is-trail' : ''}${i === RL.HOLE ? '.is-hole' : ''}${i === RL.FISH ? '.is-fish' : ''}`, {},
            el('span.ice__no', {}, `${i}칸`),
            el('span.ice__icon', {}, icon || (i === RL.START ? '🏁' : '')),
            here ? el('span.ice__peng', {}, '🐧') : null,
            here && f.reward !== null ? el(`span.ice__reward${f.reward > 0 ? '.is-plus' : '.is-minus'}`, {}, f.reward > 0 ? `+${f.reward}` : String(f.reward)) : null);
        });
        const moves = [];
        for (let i = 1; i < f.trail.length; i += 1) moves.push(f.trail[i] > f.trail[i - 1] ? '→' : '←');
        fill(stage,
          el('div.ice', {}, cells),
          el('div.ice__info', {},
            el('span.tag.tag--current', {}, f.episode ? `${f.episode}번째 도전` : '시작 전'),
            moves.length ? el('span', {}, '지나온 길: 🏁 ', moves.join(' ')) : null),
          el('table.mini', {},
            el('thead', {}, el('tr', {}, el('th', {}, '도전'), el('th', {}, '걸음 수'), el('th', {}, '보상 합'), el('th', {}, '결과'))),
            el('tbody', {}, f.results.map((r) => el('tr', {}, el('td', {}, `${r.episode}번째`), el('td', {}, String(r.steps)), el('td', {}, String(r.total)),
              el('td', {}, r.end === 'fish' ? '🐟 물고기!' : '🕳 구멍'))))));
        const qcell = (s2, a) => {
          const val = f.Q[s2][a];
          const hot = f.updated && f.updated[0] === s2 && f.updated[1] === a;
          return el(`td.qcell${hot ? '.is-hot' : ''}${val > 0 ? '.is-pos' : val < 0 ? '.is-neg' : ''}`, {}, fmt(val));
        };
        fill(data, el('div.qwrap', {},
          el('table.mini.qtable', {},
            el('thead', {}, el('tr', {}, el('th', {}, '칸'), el('th', {}, '← 왼쪽'), el('th', {}, '→ 오른쪽'), el('th', {}, '더 좋은 쪽'))),
            el('tbody', {}, [1, 2, 3].map((c) => {
              const [l, r] = f.Q[c];
              return el(`tr${f.pos === c ? '.is-best' : ''}`, {}, el('th', {}, `${c}칸${c === RL.START ? ' 🏁' : ''}`), qcell(c, 0), qcell(c, 1),
                el('td', {}, l === r ? '? (같아요)' : l > r ? '←' : '→'));
            }))),
          el('div.varrow__note', {},
            el('p', {}, '점수표는 "이 칸에서 이쪽으로 가면 얼마나 좋을까"를 적은 표예요. 펭귄은 점수가 큰 쪽으로 가요.'),
            el('p', {}, '보상을 받을 때마다 점수표를 고쳐요. 물고기의 +10이 한 칸씩 거꾸로 전해지면서, 출발 칸에서도 → 점수가 커져요.'),
            el('p', {}, '정답을 알려 준 사람은 없어요. 이렇게 보상만으로 배우는 방법을 강화학습이라고 해요.'))));
      },
    };
  },
};

/* ═════════════ 학습 목적에 따른 구분 ═════════════ */

const PURPOSE_QUIZ = [
  { q: '내일 기온이 몇 도일지 맞힌다.', options: ['분류', '회귀', '군집'], answer: 1, why: '답이 숫자(기온)이니 회귀(숫자 예측)예요.' },
  { q: '메일이 스팸인지 아닌지 정한다.', options: ['분류', '회귀', '군집'], answer: 0, why: '정해진 무리(스팸/정상) 중 하나를 고르니 분류예요.' },
  { q: '음악 취향이 비슷한 사람끼리 무리를 짓는다(무리 이름은 정해져 있지 않다).', options: ['분류', '회귀', '군집'], answer: 2, why: '정답 없이 비슷한 것끼리 묶으니 군집이에요.' },
  { q: '펭귄의 부리·날개를 보고 아델리·턱끈·젠투 중 하나로 정한다.', options: ['분류', '회귀', '군집'], answer: 0, why: '세 종 중 하나를 고르니 분류예요.' },
  { q: '날개길이를 보고 펭귄의 몸무게(g)를 어림한다.', options: ['분류', '회귀', '군집'], answer: 1, why: '답이 숫자(몸무게)이니 회귀(숫자 예측)예요. 선형 회귀가 바로 이런 일을 해요.' },
];

/** 🗺 이 단원의 알고리즘 지도 — 단원 표지의 핵심 아이디어(bigIdea·note)와 같은 내용 */
const ALGO_MAP = [
  { name: 'k-최근접 이웃', sub: 'knn', how: '지도학습', purpose: '분류', tag: 'current', idea: '가까운 이웃 k마리의 다수결', task: '341번 펭귄의 종 맞히기' },
  { name: '의사결정 트리', sub: 'tree', how: '지도학습', purpose: '분류', more: ' (회귀도 가능)', tag: 'current', idea: '예/아니오 질문으로 좁혀 가기', task: '283번 펭귄의 종 맞히기' },
  { name: '선형 회귀', sub: 'linreg', how: '지도학습', purpose: '회귀', tag: 'result', idea: '점들 사이로 직선 긋기', task: '날개 210mm 펭귄의 몸무게' },
  { name: 'k-평균', sub: 'kmeans', how: '비지도학습', purpose: '군집', tag: 'add', idea: '배정과 중심 옮기기를 되풀이', task: '종을 모르는 18마리를 3묶음으로' },
];

function purposes(root, ctx) {
  // 지도를 "읽기"만 하지 않고 직접 골라 보게 — 다른 쪽으로 떠나지 않고 이 쪽에서 미션을 이룬다
  const pickNote = el('p.callout', { 'aria-live': 'polite' }, '🎯 문제: 날개길이로 펭귄의 ', el('b', {}, '몸무게(숫자)'), '를 맞히고 싶어요. 아래 지도에서 알맞은 알고리즘의 [✋ 고르기]를 눌러 보세요.');
  const pick = (a) => {
    const ok = a.sub === 'linreg';
    pickNote.className = `callout ${ok ? 'callout--add' : 'callout--warn'}`;
    fill(pickNote, ok
      ? ['⭕ 맞아요! 몸무게는 숫자이니 ', el('b', {}, '회귀(숫자 예측)'), ' 문제이고, 선형 회귀를 써요. 정답(몸무게)을 알려 주며 배우니 지도학습이지요.']
      : ['❌ ', el('b', {}, a.name), `은(는) ${a.purpose}에 쓰여요. 몸무게처럼 `, el('b', {}, '숫자'), '를 내놓는 알고리즘을 찾아보세요.']);
    if (ok) ctx.check('algo-map');
  };
  const card = (cls, title, sub, svg, out) => el(`div.card.typecard${cls}`, {},
    el('div.typecard__head', {}, el('div', {}, el('div.card__title', {}, title), el('div.card__meta', {}, sub))),
    el('div.typecard__fig', {}, svg),
    el('div.typecard__out', {}, out));
  // 그림을 조금 낮게 그려 알고리즘 지도가 첫 화면에 들어오게 한다
  const H = 150;
  fill(root, el('div.read.read--wide', {},
    el('div.cards.cards--3', {},
      card('.card--current', '🏷 분류 (classification)', '정해진 무리 가운데 하나를 골라요', miniScatter('classify', { height: H }), ['내놓는 것: ', el('b', {}, '이름표(종)'), ' — "턱끈"']),
      card('.card--result', '📈 회귀 (regression)', '숫자를 내놓는 예측이에요', miniRegression({ height: H }), ['내놓는 것: ', el('b', {}, '숫자'), ' — "4653g"']),
      card('.card--add', '🫧 군집 (clustering)', '정답 없이 비슷한 것끼리 묶어요', miniScatter('cluster', { height: H }), ['내놓는 것: ', el('b', {}, '무리 번호'), ' — "묶음 2"'])),
    el('h3', {}, '🗺 이 단원의 알고리즘 지도', el('span.card__meta', {}, ' — 무엇을 맞힐지 정하면, 이 표에서 알고리즘을 골라요')),
    pickNote,
    el('table.mini.algomap', {},
      el('thead', {}, el('tr', {}, ['알고리즘', '학습 방법', '학습 목적', '한 줄 아이디어', '이 단원에서 해 볼 일', ''].map((h) => el('th', {}, h)))),
      el('tbody', {}, ALGO_MAP.map((a) => el('tr', {},
        el('td', {}, el('b', {}, a.name)), el('td', {}, a.how),
        el('td', {}, el(`span.tag.tag--${a.tag}`, {}, a.purpose), a.more ?? ''),
        el('td', {}, a.idea), el('td', {}, a.task),
        el('td', {}, el('button.pill.pill--sm', { type: 'button', onclick: () => pick(a) }, '✋ 고르기'), ' ',
          el('button.pill.pill--sm', { type: 'button', onclick: () => ctx.go('ml', null, a.sub) }, '배우러 가기 →')))))),
    quizBox(PURPOSE_QUIZ, { row: true, title: '✅ 분류·회귀·군집 중 무엇일까요?' })));
  return {};
}

export const CONCEPT_SCENES = {
  learnTypes: { kind: 'view', mount: learnTypes },
  rl: rlStep,
  purposes: { kind: 'view', mount: purposes },
};

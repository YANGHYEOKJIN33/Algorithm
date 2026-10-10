/**
 * 🏁 0-1 완성품 미리 보기 — "이 수업이 끝나면 이런 인공지능을 만들어요"
 *   슬라이더(부리길이·부리깊이)를 움직이면 전처리를 마친 341마리를 기억한 k-최근접 이웃(k = 3)이
 *   그 자리에서 종을 맞힌다. 새 펭귄은 산점도의 ★, 투표한 이웃 3마리는 주황 고리.
 *   아래(오른쪽)에는 수업 전체의 "이 수업을 마치면" 4가지 · 6단계 여정 · 안심 상자.
 *
 * 미션 신호는 start.js가 넘겨 주는 hooks로 알린다(미션 낱말은 start.js에 모아 둔다).
 *   hooks.predicted()   학생이 직접 움직여 예측이 나왔다
 *   hooks.allSpecies()  세 종을 모두 한 번씩 예측시켰다
 */
import { el, fill } from '../../ui/dom.js';
import { s, marker } from '../../viz/svg.js';
import { createScatter, starPath } from '../../viz/scatter.js';
import { speciesLegend, speciesIndex, SPECIES_SHAPE } from '../../viz/chart.js';
import { SPECIES } from '../../core/data/practice.js';
import { rankNeighbors } from '../../core/ml/knn.js';
import { round } from '../../core/stats.js';
import { unitStrip } from '../unit.js';
import { demoTrain, demoPredict, DEMO_K } from './model.js';
import { ensureStartStyle } from './style.js';

const X = { min: 32, max: 60, label: '부리길이 (mm)' };
const Y = { min: 13, max: 22, label: '부리깊이 (mm)' };
const START = { x: 39, y: 18.5 };

const OUTCOMES = [
  { no: '1', text: '웹 페이지에서 펭귄 기록을 모아 표로 만들 수 있어요.' },
  { no: '2·3·4', text: '표의 빈칸과 이상치를 찾아 고치고, 학습에 맞게 합치고 나눌 수 있어요.' },
  { no: '5', text: 'k-최근접 이웃, 의사결정 트리 같은 알고리즘으로 종을 맞히는 모델을 만들 수 있어요.' },
  { no: '6', text: '처음 보는 펭귄으로 정확도를 재고, 나만의 주제로 프로젝트를 할 수 있어요.' },
];

function slider(name, range, value, onInput) {
  const out = el('output.sg-slider__val');
  const input = el('input', {
    type: 'range', min: range.min, max: range.max, step: 0.1, value,
    'aria-label': `${name} (mm)`, oninput: () => onInput(Number(input.value)),
  });
  const set = (v) => { input.value = String(v); out.textContent = `${v.toFixed(1)} mm`; };
  set(value);
  return { node: el('label.sg-slider', {}, el('span.sg-slider__name', {}, name), out, input), set };
}

export function courseGoal(root, ctx, hooks = {}) {
  ensureStartStyle();
  const train = demoTrain();
  let q = { ...START };
  const found = new Set();      // 학생이 직접 움직여 예측시켜 본 종
  let lastPred = null;

  const sc = createScatter({ x: [X.min, X.max], y: [Y.min, Y.max], xLabel: X.label, yLabel: Y.label, width: 440, height: 270, onClick: (x, y) => move(round(x, 1), round(y, 1)) });
  for (const p of train) {
    const si = speciesIndex(p.label);
    sc.layers.points.append(marker(si, sc.sx(p.x), sc.sy(p.y), 3, { class: `pt pt--sm sp${si}` }));
  }
  sc.mover('q', () => starPath(11));

  const sx = slider('부리길이', X, q.x, (v) => move(v, q.y));
  const sy = slider('부리깊이', Y, q.y, (v) => move(q.x, v));
  const pred = el('div.sg-pred', { 'aria-live': 'polite' });
  const foundBox = el('div.sg-found');

  function move(x, y) {
    q = { x: Math.min(X.max, Math.max(X.min, x)), y: Math.min(Y.max, Math.max(Y.min, y)) };
    draw(true);
  }

  function draw(byStudent) {
    sx.set(q.x);
    sy.set(q.y);
    const nb = rankNeighbors(train, q).slice(0, DEMO_K);
    const { counts, pred: sp } = demoPredict(train, q);
    sc.clear('links');
    for (const n of nb) {
      sc.layers.links.append(s('line.link.link--nb', { x1: sc.sx(q.x), y1: sc.sy(q.y), x2: sc.sx(n.x), y2: sc.sy(n.y) }));
      sc.layers.links.append(s('circle.pt-ring.pt-ring--result', { cx: sc.sx(n.x), cy: sc.sy(n.y), r: 7 }));
    }
    sc.move('q', q.x, q.y);

    const si = speciesIndex(sp);
    fill(pred,
      el('span.sg-pred__label', {}, '🤖 인공지능의 예측'),
      el('strong.sg-pred__name', {}, el(`span.legend__mark.sp${si}`, {}, SPECIES_SHAPE[si]), ` ${sp}펭귄`),
      el('span.sg-pred__votes', {}, `가까운 ${DEMO_K}마리의 투표: `,
        SPECIES.filter((name) => counts[name]).map((name) => `${name} ${counts[name]}표`).join(' · ')));
    if (sp !== lastPred) { pred.classList.remove('is-new'); void pred.offsetWidth; pred.classList.add('is-new'); }
    lastPred = sp;

    if (byStudent) {
      hooks.predicted?.();
      const before = found.size;
      found.add(sp);
      if (found.size === SPECIES.length && before < SPECIES.length) hooks.allSpecies?.();
    }
    fill(foundBox,
      el('span.sg-found__label', {}, '맞혀 본 종'),
      SPECIES.map((name, i) => el('span.sg-found__sp', { 'data-on': found.has(name) ? 'true' : null },
        found.has(name) ? '✓ ' : '', el(`span.legend__mark.sp${i}`, {}, SPECIES_SHAPE[i]), ` ${name}`)),
      found.size < SPECIES.length ? el('span.tm-muted', {}, ' · 힌트: 부리가 길고 두꺼우면? 길고 얇으면?') : el('strong', {}, ' 🎉 세 종 모두!'));
  }

  fill(root, el('div.read.sg', {},
    el('header.sg-hero', {},
      el('div.sg-hero__emoji', { 'aria-hidden': 'true' }, '🐧🤖'),
      el('div', {},
        el('p.sg-hero__kicker', {}, '🏁 이 수업의 도착점'),
        el('h3', {}, '처음 보는 펭귄의 종을 맞히는 인공지능을 만들어요'),
        el('p', {}, '부리만 재서 알려 주면 종을 맞혀 주는 프로그램이에요. 만들기 전에 완성품부터 써 볼까요?'))),
    el('div.sg-grid', {},
      el('section.sg-demo', { 'aria-label': '완성품 미리 보기' },
        el('div.sg-demo__head', {},
          el('h4', {}, '🔮 완성품 미리 보기 — 새 펭귄(★)의 부리를 재 보세요'),
          speciesLegend([el('span.legend__item', {}, el('span.legend__mark', {}, '★'), '새 펭귄')])),
        el('div.sg-demo__body', {},
          el('div.sg-chart', {}, sc.svg),
          el('div.sg-ctrl', {}, sx.node, sy.node, pred, foundBox)),
        el('p.sg-demo__foot', {}, `점 하나는 전처리를 마친 펭귄 ${train.length}마리 가운데 한 마리예요. k-최근접 이웃(k = ${DEMO_K})은 이 기록을 기억해 두었다가, ★과 가장 가까운 ${DEMO_K}마리(주황 고리)의 투표로 종을 정해요. 그래프를 눌러도 ★을 옮길 수 있어요. 이 모델은 5단원에서 직접 만들어요.`)),
      el('div.sg-col', {},
        el('section.ucard.ucard--goal', {},
          el('h3', {}, '🎯 이 수업을 마치면 할 수 있어요'),
          el('ul.sg-out', {}, OUTCOMES.map((o) => el('li', {}, el('span.sg-out__no', {}, `${o.no}단원`), el('span', {}, o.text))))),
        el('section.ucard', {},
          el('h3', {}, '🧭 6단계 여정', el('span.card__meta', {}, ' (맨 위 탭의 번호와 같아요)')),
          unitStrip(null, (id) => ctx.go(id))),
        el('p.sg-calm', {}, el('strong', {}, '🙂 파이썬을 몰라도 돼요. '),
          '의사코드 읽는 법(0-5)만 익히면 충분히 따라올 수 있어요. Colab 실습에서도 ▶ 실행만 누르면 돼요.')))));
  draw(false);
  return {};
}

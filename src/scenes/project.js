/**
 * 🚀 프로젝트 — 6-1 모델 평가(정확도·틀린 예) · 6-2 전체 흐름 정리 · 6-3 이해 확인 10문제 · 6-4 수행평가 안내
 *
 * 미션의 act: 낱말 (ctx.check)
 *   wrong-look        6-1 채점표의 ❌ 줄을 눌러 틀린 펭귄의 이웃 살펴보기
 *   improve           6-1 🔧 고쳐 보고 다시 채점 — 다시 채점해 163번을 맞혔을 때
 *   flow-open · flow-all   6-2 단원 줄을 펼쳐 보기 · 1~6단원을 모두 펼쳐 보기
 *   topic · proj-check     6-4 데이터 카드 고르기 · 진행표 체크
 * 6-3은 문제 상자의 사건(quiz · right:N), 6-4의 Colab 단추는 colab 사건으로 저절로 체크된다.
 *
 * 장(beat) 덩어리(data-beat, FINAL_SPEC §4.4)
 *   6-2  flow-table(단원 표 — 한 번에 한 줄만 펼친다) · flow-recap(기억할 것 세 카드)
 *   6-3  final-quiz(한 문제씩, 단원 꼬리표) · final-result(단원별 ⭕/❌ · 아직 못 맞힌 문제)
 *   6-4  pj-task(평가 요소·배점·제출) · pj-data(15개 분야 데이터) · pj-fair(채점 방법) · pj-nb(수행평가 노트북 여는 법) · pj-steps(진행표)
 * 보라 고리(data-act) — 그릴 때 정한다: 6-1 첫 ❌ 줄 wrong-look · 🔧 단추/바꿔 보기 improve
 *   6-2 아직 안 펼친 첫 단원 flow-open flow-all · 6-4 데이터 카드 topic · 아직 안 한 첫 단계 proj-check
 *
 * 모양: 공용 CSS 파일을 건드리지 않으려고 장면이 처음 붙을 때 <style> 하나(.pj-*)를 머리에 넣는다.
 * 색·간격·글자 크기는 tokens.css의 토큰만 쓴다(밝은/어두운 화면이 저절로 맞는다).
 */
import { el, fill } from '../ui/dom.js';
import { refCard } from '../ui/refCard.js';
import { quizBox } from '../ui/quizBox.js';
import * as EV from '../core/ml/evaluate.js';
import { rankNeighbors } from '../core/ml/knn.js';
import { s, marker } from '../viz/svg.js';
import { createScatter, starPath, sizeOf } from '../viz/scatter.js';
import { speciesLegend, speciesIndex, SPECIES_SHAPE } from '../viz/chart.js';
import { colabUrl, notebookUrl } from '../app/links.js';
import { ASSESS_DATASETS } from '../app/assessment.js';
import { QUIZ } from '../app/quiz.js';
import { TABS } from '../app/lessons.js';
import { unitProgress } from '../app/missions.js';
import { FINAL_KEY } from '../app/record.js';

const STYLE_ID = 'project-scenes-style';
const CSS = String.raw`
/* ── 6-1 모델 평가 ── */
.pj-eval { display: flex; flex-wrap: wrap; gap: var(--sp-3); align-items: flex-start; }
.pj-eval__table { flex: 1 1 300px; min-width: 0; }
.pj-eval .evalds__score { flex: 0 0 150px; }
.pj-grade td, .pj-grade th { white-space: nowrap; }
.pj-grade tr.pj-focus td { background: var(--current-bg); font-weight: 700; }
.pj-look { white-space: nowrap; }
.pj-look[aria-pressed="true"] { border-color: var(--current); box-shadow: 0 0 0 2px var(--current); font-weight: 700; }
.pj-why { flex: 1 1 230px; min-width: 0; display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-sm); line-height: 1.45;
  border: 1px dashed var(--border-strong); border-radius: var(--radius); padding: var(--sp-2) var(--sp-3); background: var(--surface); }
.pj-why[data-ok="false"] { border: 2px solid var(--warn); background: var(--warn-bg); }
.pj-why[data-ok="true"] { border: 2px solid var(--add); background: var(--add-bg); }
.pj-why__head { font-weight: 700; }
.pj-why__tip { color: var(--text-muted); }
.pj-nbs { display: flex; flex-wrap: wrap; gap: 4px; }
.pj-nb { border: 1px solid var(--border); border-radius: 999px; padding: 0 8px; background: var(--surface); font-size: var(--fs-xs); white-space: nowrap; }
.pj-fixgo { align-self: flex-start; margin-top: 2px; border-color: var(--current); color: var(--current); font-weight: 700; }
/* 🔧 고쳐 보고 다시 채점 */
.pj-imp { display: flex; flex-direction: column; gap: 6px; }
.pj-imp__ctl { display: flex; flex-wrap: wrap; gap: 6px var(--sp-2); align-items: center; font-size: var(--fs-sm); }
.pj-imp__k { display: inline-flex; gap: 4px; align-items: center; font-family: var(--font-code); font-size: var(--fs-xs); font-weight: 700; }
.pj-imp__tog[aria-pressed="true"] { font-weight: 700; }
.pj-imp__body { display: flex; flex-wrap: wrap; gap: var(--sp-2); align-items: stretch; }
.pj-imp__grid { flex: 1 1 420px; min-width: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; }
.pj-imp__row { display: flex; align-items: center; gap: 4px; min-width: 0; padding: 2px 6px; font: inherit; font-size: var(--fs-xs); color: inherit; text-align: left;
  border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); white-space: nowrap; }
.pj-imp__row[data-ok="false"] { border-color: var(--warn); background: var(--warn-bg); }
.pj-imp__row[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--current); }
.pj-imp__id { font-weight: 700; }
.pj-imp__mark { margin-left: auto; }
.pj-imp__chg { border-radius: 999px; padding: 0 6px; font-weight: 700; }
.pj-imp__chg.is-fix { background: var(--add-bg); color: var(--add); border: 1px solid var(--add); }
.pj-imp__chg.is-break { background: var(--warn-bg); color: var(--warn); border: 1px solid var(--warn); }
.pj-imp__score { flex: 0 0 132px; gap: 0 !important; padding: 4px var(--sp-2) !important; }
.pj-imp__score .evalds__big { font-size: var(--fs-lg); }
.pj-imp__note { margin: 0; font-size: var(--fs-sm) !important; line-height: 1.4; }
.pj-imp__note.is-warn { color: var(--warn); font-weight: 700; }
.pj-imp__note.is-add { color: var(--add); font-weight: 700; }
.pj-imp__warn { margin: 0; font-size: var(--fs-xs) !important; color: var(--text-muted); }
.pj-imp__tag:empty { display: none; }
.pj-imp__tag { font-weight: 700; color: var(--current); }
.pj-imp__row { flex-wrap: wrap; }
@media (max-width: 1100px) { .pj-imp__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .pj-imp__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .pj-imp__score { flex: 1 1 100%; } }

/* ── 6-2 전체 흐름 정리 ── */
.pj-intro { font-size: var(--fs-sm) !important; color: var(--text-muted); margin: 0; }
.pj-scroll { overflow-x: auto; }
.pj-flow { min-width: 760px; }
.pj-flow td { vertical-align: top; }
.pj-unit { display: inline-grid; grid-template-columns: auto auto auto; column-gap: 6px; align-items: center; text-align: left;
  border: 0; background: none; padding: 2px 4px 2px 0; border-radius: var(--radius-sm); }
.pj-unit:hover:not(:disabled) { background: var(--surface-2); }
.pj-unit__caret { grid-row: 1 / span 2; color: var(--text-muted); font-size: var(--fs-xs); }
.pj-no { grid-row: 1 / span 2; display: inline-grid; place-items: center; width: 1.6em; height: 1.6em; border-radius: 50%;
  background: var(--current); color: #fff; font-weight: 700; font-size: var(--fs-xs); }
.pj-unit__name { font-weight: 700; white-space: nowrap; }
.pj-unit__verb { grid-column: 3; font-size: var(--fs-xs); color: var(--text-muted); white-space: nowrap; }
.pj-flow tr[data-open="true"] > td, .pj-flow tr.pj-flow__detail > td { background: var(--current-bg); }
.pj-flow__go { white-space: nowrap; text-align: right; }
.pj-prog { display: block; font-size: var(--fs-xs); color: var(--text-muted); margin-bottom: 4px; }
.pj-prog.is-done { color: var(--add); font-weight: 700; }
.pj-detail { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr); gap: var(--sp-3); padding: var(--sp-1) 0 var(--sp-2); }
.pj-detail h4 { margin: 0 0 4px; font-size: var(--fs-sm); }
.pj-count { font-size: var(--fs-sm) !important; margin: 0; }
.pj-head { display: flex; flex-direction: column; gap: 2px; }

/* ── 6-3 이해 확인 ── */
.pj-quizhead { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
.pj-quizhead p { flex: 1 1 320px; margin: 0; font-size: var(--fs-sm) !important; }
.pj-tally { display: flex; flex-wrap: wrap; gap: 6px; font-size: var(--fs-xs); }
.pj-tally span { border: 1px solid var(--border); border-radius: 999px; padding: 1px 8px; background: var(--surface); white-space: nowrap; }
.pj-tally span[data-wrong] { border-color: var(--warn); background: var(--warn-bg); }
.pj-final .quiz__opts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (max-width: 640px) { .pj-final .quiz__opts { grid-template-columns: 1fr; } }

/* ── 6-3 결과 ── */
.pj-quiznote { font-size: var(--fs-sm) !important; color: var(--text-muted); margin: 0 0 var(--sp-2); }
.pj-result { display: flex; flex-direction: column; gap: var(--sp-2); max-width: 960px; }
.pj-result__score { font-size: var(--fs-lg) !important; margin: 0; }
.pj-unitgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--sp-2); }
.pj-unitcell { display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); padding: var(--sp-2) var(--sp-3); }
.pj-unitcell[data-wrong] { border-color: var(--warn); background: var(--warn-bg); }
.pj-unitcell__name { font-weight: 700; font-size: var(--fs-sm); }
.pj-unitcell__marks { display: flex; gap: 6px; font-size: var(--fs-lg); }
.pj-mark.is-none { color: var(--text-muted); }
.pj-left h4 { margin: 0 0 var(--sp-2); font-size: var(--fs-md); }
.pj-left__list { list-style: none; margin: 0; padding: 0 !important; display: flex; flex-direction: column; gap: 3px; }
.pj-left__list li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: var(--sp-2); align-items: center; font-size: var(--fs-sm) !important; line-height: 1.3 !important; }
.pj-left__list .pill--sm { padding-block: 0; }
.pj-left__tag { font-weight: 700; white-space: nowrap; }
.pj-left__q { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pj-result__foot { display: flex; justify-content: flex-end; }

/* ── 6-4 프로젝트 안내 ── */
.pj-block { display: flex; flex-direction: column; gap: var(--sp-3); min-width: 0; }
.pj-sub { margin: 0 !important; font-size: var(--fs-md) !important; }
.pj-stepsbox { display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(220px, 1fr); gap: var(--sp-4); align-items: start; }
.pj-stepsbox .projsteps { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 6px; }
.pj-stepsbox .projstep { padding: 6px var(--sp-2); }
.pj-stepsbox .projstep__body { font-size: var(--fs-xs); line-height: 1.4; }
.pj-stepsbox .projstep__body b { font-size: var(--fs-sm); }
.pj-stepsbox .projstep__body code { display: none; }
.pj-criteria { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); padding: var(--sp-2) var(--sp-3); }
.pj-criteria ol { margin: var(--sp-2) 0; padding-left: 1.3em; }
.pj-criteria li { font-size: var(--fs-sm) !important; line-height: 1.45 !important; }
.projstep__check { padding: 2px; border-radius: 4px; }
@media (max-width: 900px) { .pj-stepsbox { grid-template-columns: 1fr; } }
.pj-parts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-2); }
.pj-part { display: flex; flex-direction: column; gap: 4px; padding: var(--sp-2) var(--sp-3); }
.pj-part p { margin: 0; }
.pj-part__head { display: flex; align-items: center; gap: 8px; }
.pj-part__no { font-size: var(--fs-lg); font-weight: 700; color: var(--current); }
.pj-part__pts { margin-left: auto; font-weight: 700; border-radius: 999px; padding: 0 10px; background: var(--current-bg); color: var(--current); white-space: nowrap; }
.pj-taskfoot { display: flex; flex-direction: column; gap: 4px; }
.pj-taskfoot p { margin: 0; }
.pj-datas { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; padding: 2px; border-radius: var(--radius); }
.pj-data { text-align: left; font: inherit; color: inherit; display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; }
.pj-data[aria-pressed="true"] { border-color: var(--current); box-shadow: 0 0 0 2px var(--current); background: var(--current-bg); }
.pj-data__field { font-weight: 700; font-size: var(--fs-sm); }
.pj-data .card__text { font-size: var(--fs-xs); line-height: 1.35; }
.pj-data .card__meta { font-size: var(--fs-xs); }
.pj-picked { margin: 0; font-size: var(--fs-sm); }
.pj-fairs { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-2); }
.pj-fairnote { margin: 0; }
.pj-howto { margin: 0; padding-left: 1.4em; display: flex; flex-direction: column; gap: 6px; }
.pj-howto li { font-size: var(--fs-sm); line-height: 1.45; }
.pj-partlist li { font-size: var(--fs-sm) !important; }
@media (max-width: 1100px) { .pj-datas { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 760px) { .pj-parts, .pj-fairs { grid-template-columns: 1fr; } .pj-datas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.pj-col { display: flex; flex-direction: column; gap: var(--sp-3); min-width: 0; }
.projstep__go { align-self: flex-start; margin-top: 2px; }
@media (max-width: 760px) { .pj-detail { grid-template-columns: 1fr; } }
`;

function ensureProjectStyle() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

const AXES = { x: [33, 56], y: [12.5, 22], xLabel: '부리길이 (mm)', yLabel: '부리깊이 (mm)' };
const tabById = (id) => TABS.find((t) => t.id === id);

/* ═════════════ 6-1 모델 평가 ═════════════ */

/** 틀린 까닭 한 줄 — 같은 종 훈련 펭귄들의 부리 범위와 견준다 */
function whyWrong(f, t, pred) {
  const same = f.train.filter((p) => p.label === t.label);
  const range = (key) => [Math.min(...same.map((p) => p[key])), Math.max(...same.map((p) => p[key]))];
  const [x0, x1] = range('x');
  const [y0, y1] = range('y');
  const r = (a, b) => `${a.toFixed(1)}~${b.toFixed(1)}mm`;
  if (t.x < x0) return `부리길이가 ${t.x}mm예요. 훈련 데이터의 ${t.label}(${r(x0, x1)})보다 짧아서 ${pred} 무리 곁에 놓였어요.`;
  if (t.x > x1) return `부리길이가 ${t.x}mm예요. 훈련 데이터의 ${t.label}(${r(x0, x1)})보다 길어서 ${pred} 무리 곁에 놓였어요.`;
  if (t.y < y0) return `부리깊이가 ${t.y}mm예요. 훈련 데이터의 ${t.label}(${r(y0, y1)})보다 얕아서 ${pred} 무리 곁에 놓였어요.`;
  if (t.y > y1) return `부리깊이가 ${t.y}mm예요. 훈련 데이터의 ${t.label}(${r(y0, y1)})보다 깊어서 ${pred} 무리 곁에 놓였어요.`;
  return `${t.label} 무리보다 ${pred} 무리에 더 가까이 있어요.`;
}

const evaluate = {
  kind: 'step',
  pseudo: EV.PSEUDO,
  python: EV.PYTHON,
  notebook: '09_project_template',
  stageTitle: '훈련 데이터(작은 점) · 테스트 펭귄 ★',
  stageHint: '테스트 펭귄의 진짜 종은 가린 채 맞혀요',
  dataTitle: '채점표',
  dataHint: '채점한 줄의 단추를 누르면 그 펭귄의 이웃 3마리를 볼 수 있어요',
  rows: ['1fr', '1.1fr'],
  frames: () => EV.evalFrames(),
  mount({ stage, data, dataTools }, ctx) {
    ensureProjectStyle();
    stage.classList.add('fit');
    const sc = createScatter({ ...AXES, ...sizeOf(stage, { reserve: 30 }) });
    const modelTag = el('span.legend__item.pj-imp__tag');
    fill(stage, speciesLegend([el('span.legend__item', {}, el('span.legend__mark', {}, '★'), '테스트 펭귄'), modelTag]), el('div.fit__grow', {}, sc.svg));

    let pick = null;      // 학생이 채점표에서 눌러 살펴보는 테스트 펭귄 번호 (장면을 넘기면 풀린다)
    let shown = -1;
    let last = null;
    // 🔧 고쳐 보고 다시 채점 — 끝 장면에서만 켤 수 있다. null이면 꺼짐(처음 채점표)
    let improve = null;   // { k, wing, scale }
    let ipick = EV.TARGET_ID;
    const base = EV.improveScore();

    function look(row) {
      pick = row.id;
      if (!row.ok) ctx?.check('wrong-look');
      draw(last);
    }

    function setImprove(next) {
      improve = next;
      if (improve) {
        const res = EV.improveScore(improve);
        if (res.rows.find((r) => r.id === EV.TARGET_ID)?.ok) ctx?.check('improve');
      }
      draw(last);
    }

    function drawTools(f) {
      if (!dataTools) return;
      if (!f.done) { fill(dataTools); return; }
      const fixTab = el('button', { type: 'button', 'aria-pressed': String(Boolean(improve)), onclick: () => { if (!improve) { ipick = EV.TARGET_ID; setImprove({ k: EV.K, wing: false, scale: false }); } } }, '🔧 고쳐 보고 다시 채점');
      // 보라 고리 — 고쳐 보기를 아직 켜지 않았으면 이 단추(켜면 바꿔 보기 줄로 옮겨 간다)
      if (!improve) fixTab.setAttribute('data-act', 'improve');
      fill(dataTools, el('div.seg', { role: 'group', 'aria-label': '채점표 보기 고르기' },
        el('button', { type: 'button', 'aria-pressed': String(!improve), onclick: () => setImprove(null) }, '📋 처음 채점표'),
        fixTab));
    }

    /** 그림 — 지금 보는 테스트 펭귄과 이웃 k마리를 잇고, 이웃에 번호를 붙인다 */
    function drawPlot(f, graded, focusId, nbs) {
      const t = f.test.find((x) => x.id === focusId);
      const nbIds = new Set(nbs.map((n) => n.id));
      sc.clear('points', 'links', 'over');
      const at = (id) => f.train.find((p) => p.id === id);
      for (const n of nbs) {
        const p = at(n.id);
        sc.layers.links.append(s('line.link.link--nb', { x1: sc.sx(t.x), y1: sc.sy(t.y), x2: sc.sx(p.x), y2: sc.sy(p.y) }));
      }
      for (const p of f.train) {
        const si = speciesIndex(p.label);
        sc.layers.points.append(marker(si, sc.sx(p.x), sc.sy(p.y), 5, { class: `pt sp${si}${t && !nbIds.has(p.id) ? ' is-dim' : ''}` }));
      }
      // 이웃 번호 — 가까이 붙은 이웃끼리 글자가 겹치지 않게 아래로 비켜 쓴다
      const placed = [];
      for (const n of nbs) {
        const p = at(n.id);
        const x = sc.sx(p.x) + 7;
        let y = sc.sy(p.y) - 6;
        while (placed.some((q) => Math.abs(q.x - x) < 36 && Math.abs(q.y - y) < 13)) y += 14;
        placed.push({ x, y });
        sc.layers.over.append(s('text.pt-label', { x, y }, `${n.id}번`));
      }
      for (const q of f.test) {
        sc.layers.over.append(s('g', { transform: `translate(${sc.sx(q.x)},${sc.sy(q.y)})` }, starPath(q.id === focusId ? 12 : 9)));
        const r = graded.get(q.id);
        if (r) sc.layers.over.append(s(`text.grade${r.ok ? '.is-ok' : '.is-no'}`, { x: sc.sx(q.x) + 10, y: sc.sy(q.y) - 8 }, r.ok ? '⭕' : '❌'));
        if (q.id === focusId) {
          sc.layers.over.append(s('circle.pt-ring.pt-ring--current', { cx: sc.sx(q.x), cy: sc.sy(q.y), r: 16 }));
          sc.layers.over.append(s('text.pt-label', { x: sc.sx(q.x) - 14, y: sc.sy(q.y) + 28 }, `${q.id}번`));
        }
      }
    }

    function draw(v) {
      const f = v.frame;
      drawTools(f);
      if (improve && f.done) { drawImprove(f); return; }
      modelTag.textContent = '';
      const graded = new Map(f.rows.map((r) => [r.id, r]));
      const picked = pick !== null ? graded.get(pick) : null;
      const focusId = picked ? picked.id : f.focus;
      const t = f.test.find((x) => x.id === focusId);
      const nbs = t ? rankNeighbors(f.train, t).slice(0, f.k) : [];
      drawPlot(f, graded, focusId, nbs);

      // 채점표 · 정확도 · 살펴보기
      const pct = f.accuracy !== null ? Math.round(f.accuracy * 100) : null;
      const wrongLeft = f.rows.some((r) => !r.ok);
      let wrongMarked = false;
      const lookBtn = (q, r) => {
        const b = el('button.pill.pill--sm.pj-look', {
          type: 'button', 'aria-pressed': String(pick === q.id), title: `${q.id}번 펭귄의 이웃 ${f.k}마리 살펴보기`,
          onclick: () => look(r),
        }, r.ok ? '⭕ 맞음 🔎' : '❌ 틀림 🔎');
        // 보라 고리 — 채점표의 첫 ❌ 줄(아직 채점 전이면 없다 → 지금 할 일 줄이 ⏭로 안내)
        if (!r.ok && !wrongMarked) { b.setAttribute('data-act', 'wrong-look'); wrongMarked = true; }
        return b;
      };
      fill(data, el('div.pj-eval', {},
        el('div.pj-eval__table', {}, el('table.mini.pj-grade', {},
          el('thead', {}, el('tr', {}, ['번호', '진짜 종 (y_test)', '예측 (pred)', '채점'].map((h) => el('th', {}, h)))),
          el('tbody', {}, f.test.map((q) => {
            const r = graded.get(q.id);
            const si = speciesIndex(q.label);
            return el(`tr${q.id === focusId ? '.pj-focus' : ''}`, {},
              el('td', {}, `${q.id}번`),
              el('td', {}, r ? [el(`span.legend__mark.sp${si}`, {}, SPECIES_SHAPE[si]), ` ${q.label}`] : '(가림)'),
              el('td', {}, r ? r.pred : q.id === f.focus ? '…' : ''),
              el('td', {}, r ? lookBtn(q, r) : ''));
          })))),
        el('div.evalds__score', {},
          el('div.calcgrid__k', {}, '맞힌수 ÷ 테스트 수'),
          el('div.evalds__big', {}, `${f.correct} ÷ ${f.test.length}`),
          el('div.lrx__meter', {}, el('span', { style: `width:${pct ?? 0}%` })),
          el('div.evalds__pct', {}, pct !== null ? `정확도 ${pct}%` : '채점 중…')),
        whyBox(f, picked, t, nbs, wrongLeft)));
    }

    const fixBtn = () => el('button.pill.pill--sm.pj-fixgo', { type: 'button', onclick: () => { ipick = EV.TARGET_ID; setImprove({ k: EV.K, wing: false, scale: false }); } }, '🔧 고쳐 보고 다시 채점 →');

    function whyBox(f, picked, t, nbs, wrongLeft) {
      if (!picked) {
        return el('div.pj-why', {},
          el('div.pj-why__head', {}, '🔎 살펴보기'),
          f.rows.length === 0
            ? el('span', {}, '아직 채점 전이에요. 채점이 끝난 줄은 🔎 단추로 그 펭귄의 이웃을 볼 수 있어요.')
            : f.done && wrongLeft
              ? [el('span', {}, '채점이 끝났어요. ', el('b', {}, '❌ 틀림'), ' 줄의 🔎 단추로 왜 틀렸는지 볼 수 있고, 🔧로 모델을 고쳐 다시 채점할 수 있어요.'), fixBtn()]
              : el('span', {}, '채점한 줄의 단추(⭕/❌ 🔎)를 누르면 그 펭귄과 가까운 이웃 3마리, 그리고 다수결 결과가 나와요.'));
      }
      const votes = {};
      for (const n of nbs) votes[n.label] = (votes[n.label] ?? 0) + 1;
      const voteText = Object.entries(votes).sort((a, b) => b[1] - a[1]).map(([k, c]) => `${k} ${c}표`).join(' · ');
      return el('div.pj-why', { 'data-ok': String(picked.ok) },
        el('div.pj-why__head', {}, `🔎 ${t.id}번 — 진짜 종 ${t.label} · 예측 ${picked.pred} ${picked.ok ? '⭕' : '❌'}`),
        el('div.pj-nbs', {}, el('span', {}, `가까운 ${f.k}마리(거리):`), nbs.map((n) => el('span.pj-nb', {},
          el(`span.legend__mark.sp${speciesIndex(n.label)}`, {}, SPECIES_SHAPE[speciesIndex(n.label)]), ` ${n.id}번 ${n.label} · ${n.d.toFixed(2)}`))),
        el('span', {}, `다수결 → ${voteText} → '${picked.pred}'`),
        picked.ok
          ? el('span.pj-why__tip', {}, `이웃 대부분이 진짜 종(${t.label})과 같아서 맞혔어요.`)
          : [
            el('span', {}, '💡 ', whyWrong(f, t, picked.pred)),
            nbs[0]?.label === t.label
              ? el('span.pj-why__tip', {}, `가장 가까운 ${nbs[0].id}번은 진짜 종과 같은 ${t.label}인데, ${f.k}마리 다수결에서 졌어요.`)
              : null,
            f.done ? fixBtn() : null,
          ]);
    }

    /** 🔧 고쳐 보고 다시 채점 — 같은 훈련 18마리·테스트 6마리로 k·속성·크기 맞추기를 바꿔 다시 채점한다 */
    function drawImprove(f) {
      const res = EV.improveScore(improve);
      const graded = new Map(res.rows.map((r) => [r.id, r]));
      const was = new Map(base.rows.map((r) => [r.id, r]));
      const cur = graded.get(ipick) ?? graded.get(EV.TARGET_ID);
      drawPlot(f, graded, cur.id, cur.neighbors);
      const aside = [res.wing ? '날개길이는 그림 밖 속성' : '', res.scale ? '그림 눈금은 원래 mm' : ''].filter(Boolean);
      modelTag.textContent = `🔧 k=${res.k} · ${res.features.join('·')}${res.scale ? ' · 크기 맞춤' : ''}${aside.length ? ` (${aside.join(' · ')})` : ''}`;

      const set = (patch) => setImprove({ ...improve, ...patch });
      const toggle = (key, label) => el('button.pill.pill--sm.pj-imp__tog', {
        type: 'button', 'aria-pressed': String(improve[key]), onclick: () => set({ [key]: !improve[key] }),
      }, `${improve[key] ? '☑' : '☐'} ${label}`);
      const pct = Math.round(res.accuracy * 100);
      const basePct = Math.round(base.accuracy * 100);
      const note = EV.improveNote(res, base);
      const votes = {};
      for (const n of cur.neighbors) votes[n.label] = (votes[n.label] ?? 0) + 1;

      // 보라 고리 — 아직 163번을 못 맞혔으면 바꿔 보기 줄(k · 날개길이 · 크기 맞추기)
      const ctl = el('div.pj-imp__ctl', { role: 'group', 'aria-label': '모델 바꿔 보기' });
      if (!res.rows.find((r) => r.id === EV.TARGET_ID)?.ok) {
        ctl.setAttribute('data-act', 'improve');
        ctl.setAttribute('data-act-tag', '👆 바꿔 보세요');
      }
      fill(data, el('div.pj-imp', {},
        fill(ctl,
          el('strong', {}, '🔧 바꿔 보기'),
          el('span.pj-imp__k', {}, 'k =', el('span.seg', { role: 'group', 'aria-label': '이웃 수 k' },
            EV.IMPROVE_KS.map((k) => el('button', { type: 'button', 'aria-pressed': String(improve.k === k), onclick: () => set({ k }) }, String(k))))),
          toggle('wing', '날개길이도 넣기'),
          toggle('scale', '크기 맞추기(정규화)'),
          el('button.pill.pill--sm', { type: 'button', onclick: () => setImprove({ k: EV.K, wing: false, scale: false }), title: '처음 모델(k=3 · 부리길이·부리깊이 · 크기 그대로)로 돌아가기' }, '↺ 처음 모델')),
        el('div.pj-imp__body', {},
          el('div.pj-imp__grid', {}, res.rows.map((r) => {
            const si = speciesIndex(r.truth);
            const b = was.get(r.id);
            const change = b.ok === r.ok ? null : r.ok ? '고침!' : '새로 틀림';
            return el('button.pj-imp__row', {
              type: 'button', 'data-ok': String(r.ok), 'aria-pressed': String(r.id === cur.id),
              title: `${r.id}번의 이웃 ${res.k}마리를 그림에서 보기`, onclick: () => { ipick = r.id; draw(last); },
            },
            el('span.pj-imp__id', {}, `${r.id}번`),
            el(`span.legend__mark.sp${si}`, {}, SPECIES_SHAPE[si]),
            el('span', {}, `${r.truth} → ${r.pred}`),
            el('span.pj-imp__mark', {}, r.ok ? '⭕' : '❌'),
            change ? el(`span.pj-imp__chg${r.ok ? '.is-fix' : '.is-break'}`, {}, change) : null);
          })),
          el('div.evalds__score.pj-imp__score', {},
            el('div.calcgrid__k', {}, '다시 채점'),
            el('div.evalds__big', {}, `${res.correct} ÷ ${res.total}`),
            el('div.evalds__pct', {}, `정확도 ${pct}%`),
            el('div.calcgrid__k', {}, `처음 ${base.correct} ÷ ${base.total} (${basePct}%)`))),
        el('p.pj-imp__note', {}, `🔎 ${cur.id}번 이웃 ${res.k}마리: ${cur.neighbors.map((n) => `${n.id}번 ${n.label}`).join(' · ')} → ${Object.entries(votes).sort((a, b) => b[1] - a[1]).map(([k, c]) => `${k} ${c}표`).join(' · ')} → '${cur.pred}' ${cur.ok ? '⭕' : '❌'}`),
        el(`p.pj-imp__note.is-${note.kind}`, {}, note.text),
        el('p.pj-imp__warn', {}, `⚠️ 테스트가 ${res.total}마리뿐이라 한 마리만 달라져도 정확도가 약 17%p나 바뀌어요. 어느 방법이 정말 나은지는 더 많은 테스트 데이터로 다시 재 봐야 알 수 있어요. Colab의 테스트 69줄로 재면 결과가 또 달라요.`)));
    }

    return {
      render(v) {
        if (v.index !== shown) { pick = null; shown = v.index; }
        if (!v.frame.done) improve = null;
        last = v;
        draw(v);
      },
    };
  },
};

/* ═════════════ 6-2 전체 흐름 정리 ═════════════ */

/** 단원마다 — 우리가 한 일 · 의사코드 핵심 · 파이썬 함수 (단원 번호·이름·동사는 TABS에서) */
const FLOW = {
  collect: { did: '연습 사이트 7쪽을 크롤링해 345줄 표를 만들었어요.', pseudo: '요청 → 분석 → <tr> 찾기 → 칸 꺼내기 → 행목록에 추가', py: 'requests.get · BeautifulSoup · find_all · DataFrame · to_csv' },
  inspect: { did: '결측치 20칸(12줄), 이상치 하나(8200g), 겹친 행 하나를 찾았어요.', pseudo: '칸마다 비었나? → True 세기 → 위치 모으기 · Q1/Q3/IQR → 울타리 밖', py: 'isnull() · sum() · any(axis=1) · quantile() · boxplot()' },
  prep: { did: '핵심 속성 4개를 고르고, 잘못된 행은 지우고, 빈칸은 지우거나 채우고, 글자는 숫자로 바꿨어요.', pseudo: '속성 고르기 · 행/열 지우기 · 평균/최빈값으로 채우기 · 바꿈표로 바꾸기', py: 'drop() · drop_duplicates() · dropna() · fillna() · map()' },
  ready: { did: '표를 합친 뒤 X와 y로 나누고, 다시 훈련 80%와 테스트 20%로 나눴어요.', pseudo: '아래로 잇기 · 열쇠로 짝 찾기 · 섞기 → 앞 80% / 나머지 20%', py: 'concat() · merge() · train_test_split()' },
  ml: { did: '분류(k-최근접 이웃·의사결정 트리), 회귀(선형 회귀), 군집(k-평균) 알고리즘을 배웠어요.', pseudo: '거리·다수결 / 질문으로 나누기 / 평균에서 벗어난 정도 / 배정↔이동', py: 'KNeighborsClassifier · DecisionTreeClassifier · LinearRegression · KMeans' },
  project: { did: '처음 보는 테스트 데이터로 정확도를 쟀어요. 화면에서는 6마리 중 5마리(83%), Colab에서는 69줄 중 66줄(95.7%)을 맞혔어요.', pseudo: '테스트마다 예측 → 정답과 견주기 → 맞힌수 ÷ 전체', py: 'predict() · accuracy_score() · mean_squared_error()' },
};

function summary(root, ctx) {
  ensureProjectStyle();
  const units = TABS.filter((t) => t.unit.no > 0).sort((a, b) => a.unit.no - b.unit.no);
  const open = new Set();   // 지금 펼친 단원(하나)
  const seen = new Set();   // 이번에 한 번이라도 펼쳐 본 단원
  const body = el('tbody');
  const countLine = el('p.pj-count');

  function toggle(t) {
    if (open.has(t.id)) open.delete(t.id);
    else {
      open.clear();          // 한 번에 한 단원만 펼친다(표가 너무 길어지지 않게)
      open.add(t.id);
      seen.add(t.id);
      ctx.check('flow-open');
      if (units.every((u) => seen.has(u.id))) ctx.check('flow-all');
    }
    draw();
  }

  function detailRow(t) {
    const u = t.unit;
    return el('tr.pj-flow__detail', {}, el('td', { colspan: '5' }, el('div.pj-detail', {},
      el('div', {},
        el('h4', {}, '📦 데이터는 이렇게 바뀌었어요'),
        el('div.flowpair', {},
          el('div.flowpair__box', {}, el('span.tag', {}, '들어올 때'), el('p', {}, u.before ?? '')),
          el('span.flowpair__arrow', { 'aria-hidden': 'true' }, '→'),
          el('div.flowpair__box.flowpair__box--after', {}, el('span.tag.tag--add', {}, '나갈 때'), el('p', {}, u.after ?? '')))),
      el('div', {},
        el('h4', {}, `🐍 ${u.no}단원 파이썬 한 줄 정리`),
        u.cheats?.length
          ? el('table.cheat', {}, el('tbody', {}, u.cheats.map((c) => el('tr', {}, el('th', {}, c.idea), el('td', {}, el('code', {}, c.code))))))
          : el('p.card__meta', {}, '이 단원의 정리는 단원 정리 쪽에 있어요.')))));
  }

  function draw() {
    const next = units.find((u) => !seen.has(u.id));
    fill(body, units.map((t) => {
      const r = FLOW[t.id] ?? { did: t.tip ?? '', pseudo: '', py: '' };
      const pr = unitProgress(ctx.progress, t);
      const done = pr.total > 0 && pr.done === pr.total;
      const isOpen = open.has(t.id);
      const unitBtn = el('button.pj-unit', {
        type: 'button', 'aria-expanded': String(isOpen), title: `${t.unit.no}단원 ${t.label} — 파이썬 한 줄 정리 ${isOpen ? '접기' : '펼치기'}`,
        onclick: () => toggle(t),
      },
      el('span.pj-unit__caret', { 'aria-hidden': 'true' }, isOpen ? '▼' : '▶'),
      el('span.pj-no', {}, String(t.unit.no)),
      el('span.pj-unit__name', {}, `${t.icon} ${t.label}`),
      el('span.pj-unit__verb', {}, t.verb ?? ''));
      // 보라 고리 — 아직 펼쳐 보지 않은 첫 단원(다 펼치면 없다)
      if (t === next) unitBtn.setAttribute('data-act', 'flow-open flow-all');
      const row = el('tr', { 'data-open': isOpen ? 'true' : null },
        el('td', {}, unitBtn),
        el('td', {}, r.did),
        el('td', {}, el('code', {}, r.pseudo)),
        el('td', {}, el('code.flowtable__py', {}, r.py)),
        el('td.pj-flow__go', {},
          el(`span.pj-prog${done ? '.is-done' : ''}`, { title: `${t.unit.no}단원 진도 ${pr.done} / ${pr.total}쪽` }, done ? '✓ 다 했어요' : `진도 ${pr.done}/${pr.total}쪽`),
          el('button.pill.pill--sm', { type: 'button', title: `${t.unit.no}단원 ${t.label} 표지로 가기`, onclick: () => ctx.go(t.id) }, '다시 보기 →')));
      return isOpen ? [row, detailRow(t)] : row;
    }));
    countLine.textContent = seen.size === units.length
      ? '🎉 1~6단원을 모두 펼쳐 봤어요. 프로젝트도 이 순서를 그대로 따라가요.'
      : `펼쳐 본 단원 ${seen.size} / ${units.length} · 단원 이름(▶)을 펼치면 데이터가 바뀐 모습과 파이썬 한 줄 정리가 나와요(한 번에 한 단원).`;
  }

  fill(root, el('div.read.read--wide', {},
    el('section.pj-flowbox', { 'data-beat': 'flow-table' },
      el('div.pj-head', {},
        el('p.pj-intro', {}, '🗺 펭귄 데이터가 거쳐 온 6단계예요. 번호는 맨 위 줄의 단원 번호와 같아요. [다시 보기 →]는 그 단원의 표지로 가요.'),
        countLine),
      el('div.pj-scroll', {}, el('table.mini.flowtable.pj-flow', {},
        el('thead', {}, el('tr', {}, ['단원', '우리가 한 일', '의사코드 핵심', '파이썬', '진도'].map((h) => el('th', {}, h)))),
        body))),
    el('div.cards.pj-recap', { 'data-beat': 'flow-recap' },
      el('div.card.card--current', {}, el('div.card__title', {}, '🔁 데이터가 바뀐 모습'), el('p.card__text', {}, 'HTML 글자 → 345줄 표(빈칸·이상치·겹친 행) → 깨끗한 341줄 표 → X(속성 4개)·y(종) → 훈련 272줄 · 테스트 69줄 → 모델 → 예측')),
      el('div.card.card--result', {}, el('div.card__title', {}, '🧠 자료구조가 한 일'), el('p.card__text', {}, '리스트(행목록·거리목록·위치목록), 사전(세기표·바꿈표), 큐(트리의 할일 큐), 표(데이터프레임), 점수표(Q)를 썼어요. 알고리즘은 결국 자료구조를 한 단계씩 바꿔 가는 절차예요.')),
      el('div.card.card--add', {}, el('div.card__title', {}, '✅ 기억할 것 세 가지'), el('p.card__text', {}, '① 데이터가 나쁘면 결과도 나빠요. ② 테스트 데이터는 학습에 쓰지 않아요. ③ 알고리즘은 분류·회귀·군집 가운데 목적에 맞춰 골라요.')))));
  draw();
  const unsub = ctx.progress.subscribe(() => draw());
  return { destroy: unsub };
}

/* ═════════════ 6-3 이해 확인 ═════════════ */

const QUIZ_KEY = FINAL_KEY;

function quiz(root, ctx) {
  ensureProjectStyle();
  const units = new Map();   // 단원 → [문제 번호]
  QUIZ.forEach((q, i) => {
    const t = tabById(q.page?.tab);
    if (!t) return;
    if (!units.has(t)) units.set(t, []);
    units.get(t).push(i);
  });
  // 문제 앞 꼬리표 — 그 개념을 배운 단원("[2 가공]"). 틀리면 어느 단원을 다시 볼지 바로 보이게
  const tagOf = (q) => { const t = tabById(q.page?.tab); return t ? `[${t.unit.no} ${t.label}]` : ''; };
  const review = (ref) => (ctx.visit ? ctx.visit(ref.tab, ref.page, ref.sub) : ctx.go(ref.tab, ref.page, ref.sub));
  const box = el('div.quizbeat', { 'data-beat': 'final-quiz' });
  const result = el('section.pj-result', { 'data-beat': 'final-result', 'aria-live': 'polite' });
  let section = null;

  function drawBox() {
    section = quizBox(QUIZ, {
      one: true,
      tagOf,
      saved: ctx.progress.answers(QUIZ_KEY),
      firsts: ctx.progress.firsts(QUIZ_KEY),
      onPick: (qi, oi) => { ctx.progress.answer(QUIZ_KEY, qi, oi); drawResult(); },
      onReview: review,
      ref: (q) => refCard(null, q.page),
    });
    fill(box, el('p.pj-quiznote', {}, '처음 고른 답은 "처음에 맞힘"으로 따로 기록돼요. 찍지 말고 잘 생각해서 골라요.'), section);
  }

  /** ② 결과 — 단원별 ⭕/❌ 격자와 아직 못 맞힌 문제 */
  function drawResult() {
    const saved = ctx.progress.answers(QUIZ_KEY);
    const mark = (i) => { const v = saved[i]; return v === undefined || v === null ? 'none' : v === QUIZ[i].answer ? 'right' : 'wrong'; };
    const left = QUIZ.map((q, i) => ({ q, i })).filter(({ i }) => mark(i) !== 'right');
    const right = QUIZ.length - left.length;
    fill(result,
      el('p.pj-result__score', {}, `맞힌 문제 `, el('b', {}, `${right} / ${QUIZ.length}`), right === QUIZ.length ? ' — 🎉 모두 맞혔어요!' : ''),
      el('div.pj-unitgrid', { role: 'list', 'aria-label': '단원별 결과' }, [...units].map(([t, idx]) => el('div.pj-unitcell', {
        role: 'listitem', 'data-wrong': idx.some((i) => mark(i) === 'wrong') ? 'true' : null,
      },
      el('span.pj-unitcell__name', {}, `${t.unit.no} ${t.icon} ${t.label}`),
      el('span.pj-unitcell__marks', {}, idx.map((i) => el(`span.pj-mark.is-${mark(i)}`, { title: `Q${i + 1}` }, mark(i) === 'right' ? '⭕' : mark(i) === 'wrong' ? '❌' : '·')))))),
      left.length
        ? el('div.pj-left', {},
          el('h4', {}, `아직 못 맞힌 문제 ${left.length}개`),
          el('ul.pj-left__list', {}, left.map(({ q, i }) => el('li', {},
            el('span.pj-left__tag', {}, `Q${i + 1} ${tagOf(q)}`),
            el('span.pj-left__q', {}, q.q),
            q.page ? el('button.pill.pill--sm', { type: 'button', onclick: () => review(q.page) }, '📖 다시 보기 →') : null))))
        : el('p.callout.callout--add', {}, '단원마다 다시 볼 곳이 없어요. 6-4에서 나만의 프로젝트를 시작해요.'),
      el('div.pj-result__foot', {},
        el('button.pill.pill--sm', { type: 'button', onclick: reset }, '🔄 처음부터 다시 풀기')));
  }

  function reset() {
    QUIZ.forEach((_, i) => ctx.progress.answer(QUIZ_KEY, i, null));
    drawBox();
    drawResult();
  }

  fill(root, el('div.read.read--wide.pj-final', {}, box, result));
  drawBox();
  drawResult();
  return {};
}

/* ═════════════ 6-4 수행평가 안내 ═════════════ */

/** 평가 요소 — 학교 수행평가 기준(docs/ASSESSMENT.md)과 같은 순서·배점, 노트북의 질문 번호 */
const PARTS = [
  { no: '①', name: '문제 정의 및 개발 계획 수립', pts: 30, nb: '1-1 ~ 1-4', what: '누가·언제·무엇을 · 입력 → 출력 · 숫자로 정한 성공 기준 · 개발 계획표' },
  { no: '②', name: '데이터 준비 및 인공지능 기능 구현', pts: 30, nb: '2-1 ~ 2-5', what: '결측치·이상치를 숫자로 · 전처리를 고른 까닭 · 오류 없이 학습 · 새 입력으로 작동 확인' },
  { no: '③', name: '성능 점검 및 개선 방안', pts: 25, nb: '3-1 ~ 3-4', what: '"찍기"·성공 기준과 비교 · 틀린 예 2개 · 가설을 먼저 적은 실험 3개 · 한계와 개선 방안' },
  { no: '④', name: '결과 표현 및 개발 과정 설명', pts: 15, nb: '4-1 ~ 4-4', what: '그래프 설명 · 확인 행으로 원리 설명 · 개발 과정 · 🤖 AI 활용 기록' },
];

/** 채점 방법 — 인공지능을 써도, 점수는 학생 자신의 결과와 설명에서 나온다 */
const FAIR = [
  { icon: '🔑', title: '나만의 조건', text: '학번으로 SEED·TEST_SIZE·꼭 할 실험·확인 행이 정해져요. 같은 데이터를 골라도 친구와 숫자가 달라요.' },
  { icon: '🔢', title: '내 숫자로 근거', text: '📝 답마다 내 실행 결과의 숫자를 넣어요. 그 숫자가 출력과 맞는지 선생님이 바로 견줘 봐요.' },
  { icon: '🧪', title: '가설을 먼저', text: '실험은 가설을 적어야 돌아가요. 예상과 결과가 다를 때 까닭을 따지는 것이 점수가 돼요.' },
  { icon: '🔎', title: '확인 행 설명', text: '내 확인 행을 모델이 어떻게 판단했는지 출력의 숫자로 한 단계씩 설명해요.' },
  { icon: '🤖', title: 'AI 활용 기록', text: '무엇을 물었고, 무엇으로 확인해 어떻게 고쳤는지 적어요. AI가 틀렸던 경우도 하나 찾아요.' },
  { icon: '🗣', title: '구술 확인', text: '수업 중에 선생님이 노트북을 보며 물어봐요. 내가 설명하지 못하는 내용은 점수로 인정받기 어려워요.' },
];

/** 진행표 — 노트북의 질문 번호 그대로. go: [탭, 쪽, 하위탭] — "다시 보기" 단추가 데려갈 곳 */
const STEPS = [
  { id: 'start', icon: '🔑', name: '0 · 나만의 조건', todo: '사본 저장 → 학번·이름 적기 → 조건 네 가지 확인', go: null },
  { id: 'part1', icon: '🎯', name: '① 1-1 ~ 1-4 문제 정의·계획', todo: '데이터 고르기 · 사용 대상·상황·문제·필요 · 목적·기능·성공 기준 · 계획표', go: ['ml', 'purpose', 'concept'] },
  { id: 'part2a', icon: '🔍', name: '② 2-1 ~ 2-2 살피기·전처리', todo: '결측치·이상치를 숫자로 · 전처리를 고르고 까닭 적기', go: ['inspect'] },
  { id: 'part2b', icon: '🤖', name: '② 2-3 ~ 2-5 학습·작동 확인', todo: '나누기와 학습 · 새 입력 직접 넣기 · 알고리즘을 고른 까닭', go: ['ml'] },
  { id: 'part3a', icon: '📊', name: '③ 3-1 ~ 3-2 성능·틀린 예', todo: '"찍기"·성공 기준과 비교 · 틀린 예 2개를 행 번호와 값으로', go: ['project', 'eval'] },
  { id: 'part3b', icon: '🧪', name: '③ 3-3 ~ 3-4 실험·개선', todo: '가설 먼저 실험 3개(꼭 할 실험 포함) · 한계 3가지와 개선 방안', go: null },
  { id: 'part4', icon: '🖼', name: '④ 4-1 ~ 4-4 표현·설명', todo: '그래프 설명 · 확인 행 원리 · 개발 과정 · 🤖 AI 활용 기록', go: null },
  { id: 'submit', icon: '📮', name: '제출', todo: '런타임 → 모두 실행 → 제출 요약 확인 → 선생님이 알려 준 방법으로 내기', go: null },
];

const ASSESS_NB = '10_assessment_project';
const CHECK_KEY = 'ai-data-lab:assess-check';
const PLAN_KEY = 'ai-data-lab:assess-plan';

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') ?? {}; } catch { return {}; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장하지 못해도 수행평가에는 지장이 없다 */ }
}

function project(root, ctx) {
  ensureProjectStyle();
  const checked = readJSON(CHECK_KEY);
  const plan = { dataset: '', ...readJSON(PLAN_KEY) };
  const goBtn = (go, label) => el('button.pill.pill--sm.projstep__go', { type: 'button', onclick: () => ctx.go(...go) }, label);

  /* 데이터 고르기 — 누르면 노트북에 적을 코드가 나온다 */
  const dataBox = el('div.cards.pj-datas', { role: 'group', 'aria-label': '데이터 고르기', 'data-act': 'topic', 'data-act-tag': '👆 하나 골라요' });
  const picked = el('p.pj-picked', { 'aria-live': 'polite' });
  function drawData() {
    fill(dataBox, ASSESS_DATASETS.map((d) => el('button.card.pj-data', {
      type: 'button', 'aria-pressed': String(plan.dataset === d.code),
      onclick: () => {
        plan.dataset = d.code;
        writeJSON(PLAN_KEY, plan);
        ctx.check('topic');
        drawData();
      },
    },
    el('span.pj-data__field', {}, `${d.icon} ${d.field}`),
    el('span.card__text', {}, d.desc),
    el('span.card__meta', {}, `🎯 ${d.example}`))));
    const d = ASSESS_DATASETS.find((x) => x.code === plan.dataset);
    fill(picked, d
      ? ['✏️ 노트북 1-1에 이렇게 적어요: ', el('code', {}, `DATASET = '${d.code}'`), ' — 1-1 답에는 이 분야를 고른 까닭을 내 진로와 이어서 적어요.']
      : '카드를 누르면 노트북에 적을 코드가 나와요. 목록에 없는 데이터를 쓰고 싶으면 먼저 선생님께 확인받아요(개인정보가 든 데이터는 안 돼요).');
  }

  /* 진행표 */
  const list = el('ol.projsteps');
  function drawSteps() {
    const next = STEPS.find((st) => !checked[st.id]);
    fill(list, STEPS.map((st) => {
      const tab = st.go ? tabById(st.go[0]) : null;
      const box = el('label.projstep__check', {}, el('input', {
        type: 'checkbox', checked: Boolean(checked[st.id]),
        onchange: (e) => {
          checked[st.id] = e.target.checked;
          writeJSON(CHECK_KEY, checked);
          if (e.target.checked) ctx.check('proj-check');
          drawSteps();
        },
      }), el('span.sr-only', {}, `${st.name} 마쳤어요`));
      // 보라 고리 — 아직 체크하지 않은 첫 단계
      if (st === next) { box.setAttribute('data-act', 'proj-check'); box.setAttribute('data-act-tag', '☑ 하나씩 체크해요'); }
      return el(`li.projstep${checked[st.id] ? '.is-done' : ''}`, {},
        box,
        el('span.projstep__icon', {}, st.icon),
        el('div.projstep__body', {},
          el('b', {}, st.name), el('span', {}, st.todo),
          tab ? goBtn(st.go, `${tab.icon} ${tab.unit.no}단원 다시 보기 →`) : null));
    }));
  }

  drawData();
  drawSteps();
  fill(root, el('div.read.read--wide.pj-guide', {},
    el('section.pj-block', { 'data-beat': 'pj-task' },
      el('div.pj-parts', {}, PARTS.map((pt) => el('div.card.pj-part', {},
        el('div.pj-part__head', {}, el('span.pj-part__no', {}, pt.no), el('b', {}, pt.name), el('span.pj-part__pts', {}, `${pt.pts}점`)),
        el('p.card__text', {}, pt.what),
        el('p.card__meta', {}, `📒 노트북 ${pt.nb}`)))),
      el('div.callout.pj-taskfoot', {},
        el('p', {}, '✅ 내면 기본점수 ', el('b', {}, '30점'), '부터 시작해요(① ~ ④ 가장 낮은 수준의 합). 스스로 내지 않으면 ', el('b', {}, '20점'), '이에요.'),
        el('p', {}, '📮 ', el('b', {}, '사이트에서 내지 않아요.'), ' 노트북을 다 풀고 선생님이 알려 준 방법(클래스룸 등)으로 내요.'))),
    el('section.pj-block', { 'data-beat': 'pj-data' },
      dataBox,
      picked),
    el('section.pj-block', { 'data-beat': 'pj-fair' },
      el('div.cards.pj-fairs', {}, FAIR.map((f) => el('div.card', {},
        el('div.card__title', {}, `${f.icon} ${f.title}`),
        el('p.card__text', {}, f.text)))),
      el('p.callout.callout--add.pj-fairnote', {}, '💡 인공지능이 써 준 것도 ', el('b', {}, '내 숫자와 맞고, 내가 설명할 수 있어야'), ' 내 것이 돼요. 그래서 더 좋은 인공지능을 쓴다고 점수가 저절로 오르지 않아요.')),
    el('section.pj-block', { 'data-beat': 'pj-nb' },
      el('div.nb__top', {},
        el('p', {}, '📒 ', el('b', {}, '수행평가 노트북'), ' — 평가 요소 ① ~ ④의 질문이 차례로 들어 있어요. ✏️ 줄만 고치고 📝 답 칸을 채우면 완성돼요.'),
        el('a.pill.pill--colab', { href: colabUrl(ASSESS_NB), target: '_blank', rel: 'noopener' }, '📒 Colab에서 열기'),
        el('a.pill', { href: notebookUrl(ASSESS_NB), target: '_blank', rel: 'noopener' }, '⬇ 노트북 받기')),
      el('ol.pj-howto', {}, [
        ['파일 → 드라이브에 사본 저장', '사본이 아니면 고친 내용이 저장되지 않아요'],
        ['맨 위 셀에 학번·이름을 적고 ▶', '나만의 조건 네 가지가 나와요'],
        ['위에서부터 차례로 ▶ · 📝 답 채우기', '✏️ 줄만 고쳐요 · 답에는 내 숫자를 넣어요'],
        ['런타임 → 모두 실행', '맨 아래 제출 요약(요약코드·지문)이 오류 없이 나와야 해요'],
        ['선생님이 알려 준 방법으로 내기', '이 사이트에서는 내지 않아요'],
      ].map(([a, b]) => el('li', {}, el('b', {}, a), ` — ${b}`))),
      el('p.panel__hint', {}, '참고: 펭귄 데이터로 처음부터 끝까지 돌아가는 완성 예시는 ',
        el('a', { href: colabUrl('09_project_template'), target: '_blank', rel: 'noopener' }, '📒 09 프로젝트 틀'), '이에요.')),
    el('section.pj-block.pj-stepsbox', { 'data-beat': 'pj-steps' },
      list,
      el('aside.pj-criteria', {},
        el('h3.pj-sub', {}, '🧭 평가 요소와 배점'),
        el('ol.pj-partlist', {}, PARTS.map((pt) => el('li', {}, el('b', {}, `${pt.no} ${pt.name}`), ` ${pt.pts}점 · 노트북 ${pt.nb}`))),
        el('p.panel__hint', {}, '응시 기본점수 30점 · 미제출 20점')))));
  return {};
}

export const PROJECT_SCENES = {
  evaluate,
  summary: { kind: 'view', mount: summary },
  quiz: { kind: 'view', mount: quiz },
  // notebook: 이 쪽에 수행평가 노트북의 Colab 단추가 있다(미션 'colab'을 이룰 수 있다)
  project: { kind: 'view', mount: project, notebook: '10_assessment_project' },
};

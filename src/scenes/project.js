/**
 * 🚀 프로젝트 — 6-1 모델 평가(정확도·틀린 예) · 6-2 전체 흐름 정리 · 6-3 이해 확인 10문제 · 6-4 나만의 프로젝트 계획
 *
 * ✋ 할 일의 act: 낱말 (ctx.check)
 *   wrong-look        6-1 채점표의 ❌ 줄을 눌러 틀린 펭귄의 이웃 살펴보기
 *   improve           6-1 🔧 고쳐 보고 다시 채점 — 다시 채점해 163번을 맞혔을 때
 *   flow-open · flow-all   6-2 단원 줄을 펼쳐 보기 · 1~6단원을 모두 펼쳐 보기
 *   topic · proj-check     6-4 주제 정하기(예시 고르기·직접 적기) · 체크리스트 체크
 * 6-3은 문제 상자의 사건(quiz · right:N), 6-4의 Colab 단추는 colab 사건으로 저절로 체크된다.
 *
 * 모양: 공용 CSS 파일을 건드리지 않으려고 장면이 처음 붙을 때 <style> 하나(.pj-*)를 머리에 넣는다.
 * 색·간격·글자 크기는 tokens.css의 토큰만 쓴다(밝은/어두운 화면이 저절로 맞는다).
 */
import { el, fill } from '../ui/dom.js';
import { quizBox } from '../ui/quizBox.js';
import * as EV from '../core/ml/evaluate.js';
import { rankNeighbors } from '../core/ml/knn.js';
import { s, marker } from '../viz/svg.js';
import { createScatter, starPath, sizeOf } from '../viz/scatter.js';
import { speciesLegend, speciesIndex, SPECIES_SHAPE } from '../viz/chart.js';
import { colabUrl, notebookUrl, DATA_CSV_URL } from '../app/links.js';
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

/* ── 6-4 프로젝트 안내 ── */
.pj-col { display: flex; flex-direction: column; gap: var(--sp-3); min-width: 0; }
.pj-plan h3 { margin: 0 !important; }
.pj-plan label { display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-sm); font-weight: 700; }
.pj-plan input[type="text"] { font-weight: 400; width: 100%; padding: 6px var(--sp-2); border-color: var(--border-strong); }
.pj-kinds { display: flex; gap: var(--sp-2); flex-wrap: wrap; align-items: center; font-size: var(--fs-sm); font-weight: 700; }
.pj-algo { font-size: var(--fs-sm) !important; margin: 0; }
.pj-topic { text-align: left; font: inherit; color: inherit; }
.pj-topic[aria-pressed="true"] { border-color: var(--current); box-shadow: 0 0 0 2px var(--current); background: var(--current-bg); }
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
  if (t.x < x0) return `부리길이 ${t.x}mm — 훈련 ${t.label}(${r(x0, x1)})보다 짧아 ${pred} 곁에 있어요.`;
  if (t.x > x1) return `부리길이 ${t.x}mm — 훈련 ${t.label}(${r(x0, x1)})보다 길어 ${pred} 곁에 있어요.`;
  if (t.y < y0) return `부리깊이 ${t.y}mm — 훈련 ${t.label}(${r(y0, y1)})보다 얕아 ${pred} 곁에 있어요.`;
  if (t.y > y1) return `부리깊이 ${t.y}mm — 훈련 ${t.label}(${r(y0, y1)})보다 깊어 ${pred} 곁에 있어요.`;
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
      fill(dataTools, el('div.seg', { role: 'group', 'aria-label': '채점표 보기 고르기' },
        el('button', { type: 'button', 'aria-pressed': String(!improve), onclick: () => setImprove(null) }, '📋 처음 채점표'),
        el('button', { type: 'button', 'aria-pressed': String(Boolean(improve)), onclick: () => { if (!improve) { ipick = EV.TARGET_ID; setImprove({ k: EV.K, wing: false, scale: false }); } } }, '🔧 고쳐 보고 다시 채점')));
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
              el('td', {}, r ? el('button.pill.pill--sm.pj-look', {
                type: 'button', 'aria-pressed': String(pick === q.id), title: `${q.id}번 펭귄의 이웃 ${f.k}마리 살펴보기`,
                onclick: () => look(r),
              }, r.ok ? '⭕ 맞음 🔎' : '❌ 틀림 🔎') : ''));
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
            ? el('span', {}, '⏭ 한 단계를 눌러 채점을 시작해요. 채점한 줄은 단추를 눌러 이웃을 볼 수 있어요.')
            : f.done && wrongLeft
              ? [el('span', {}, '👆 채점표의 ', el('b', {}, '❌ 틀림'), ' 단추를 눌러 왜 틀렸는지 살펴본 뒤, 고쳐서 다시 채점해 봐요.'), fixBtn()]
              : el('span', {}, '👆 채점한 줄의 단추(⭕/❌ 🔎)를 누르면 그 펭귄의 가까운 이웃 3마리와 투표를 볼 수 있어요.'));
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
              ? el('span.pj-why__tip', {}, `가장 가까운 ${nbs[0].id}번은 ${t.label}지만 ${f.k}마리 다수결에서 졌어요.`)
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

      fill(data, el('div.pj-imp', {},
        el('div.pj-imp__ctl', {},
          el('strong', {}, '🔧 바꿔 보기'),
          el('span.pj-imp__k', {}, 'k =', el('span.seg', { role: 'group', 'aria-label': '이웃 수 k' },
            EV.IMPROVE_KS.map((k) => el('button', { type: 'button', 'aria-pressed': String(improve.k === k), onclick: () => set({ k }) }, String(k))))),
          toggle('wing', '날개길이도 넣기'),
          toggle('scale', '크기 맞추기(정규화)'),
          el('button.pill.pill--sm', { type: 'button', onclick: () => setImprove({ k: EV.K, wing: false, scale: false }), title: '처음 모델(k=3 · 부리길이·부리깊이 · 크기 그대로)로' }, '↺ 처음 모델')),
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
        el('p.pj-imp__warn', {}, `⚠️ 테스트가 ${res.total}마리뿐이라 한 마리만 달라져도 정확도가 약 17%p 바뀌어요. 어느 방법이 정말 나은지는 Colab 09에서 테스트 69줄로 확인해요.`)));
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
  inspect: { did: '결측치 20칸(12줄)과 이상치(8200g) 하나, 겹친 행 하나를 찾았어요.', pseudo: '칸마다 비었나? → True 세기 → 위치 모으기 · Q1/Q3/IQR → 울타리 밖', py: 'isnull() · sum() · any(axis=1) · quantile() · boxplot()' },
  prep: { did: '핵심 속성 4개를 고르고, 지우고, 채우고, 글자를 숫자로 바꿨어요.', pseudo: '속성 고르기 · 행/열 지우기 · 평균/최빈값으로 채우기 · 바꿈표로 바꾸기', py: 'drop() · drop_duplicates() · dropna() · fillna() · map()' },
  ready: { did: '표를 합치고, X와 y, 훈련 80%와 테스트 20%로 나눴어요.', pseudo: '아래로 잇기 · 열쇠로 짝 찾기 · 섞기 → 앞 80% / 나머지 20%', py: 'concat() · merge() · train_test_split()' },
  ml: { did: '분류(k-최근접 이웃·트리), 회귀(선형 회귀), 군집(k-평균)을 배웠어요.', pseudo: '거리·다수결 / 질문으로 나누기 / 평균에서 벗어난 정도 / 배정↔이동', py: 'KNeighborsClassifier · DecisionTreeClassifier · LinearRegression · KMeans' },
  project: { did: '처음 보는 테스트 데이터로 정확도를 쟀어요(화면 6마리 중 5마리 83% · Colab 69줄 중 66줄 95.7%).', pseudo: '테스트마다 예측 → 정답과 견주기 → 맞힌수 ÷ 전체', py: 'predict() · accuracy_score() · mean_squared_error()' },
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
    fill(body, units.map((t) => {
      const r = FLOW[t.id] ?? { did: t.tip ?? '', pseudo: '', py: '' };
      const pr = unitProgress(ctx.progress, t);
      const done = pr.total > 0 && pr.done === pr.total;
      const isOpen = open.has(t.id);
      const row = el('tr', { 'data-open': isOpen ? 'true' : null },
        el('td', {}, el('button.pj-unit', {
          type: 'button', 'aria-expanded': String(isOpen), title: `${t.unit.no}단원 ${t.label} — 파이썬 한 줄 정리 ${isOpen ? '접기' : '펼치기'}`,
          onclick: () => toggle(t),
        },
        el('span.pj-unit__caret', { 'aria-hidden': 'true' }, isOpen ? '▼' : '▶'),
        el('span.pj-no', {}, String(t.unit.no)),
        el('span.pj-unit__name', {}, `${t.icon} ${t.label}`),
        el('span.pj-unit__verb', {}, t.verb ?? ''))),
        el('td', {}, r.did),
        el('td', {}, el('code', {}, r.pseudo)),
        el('td', {}, el('code.flowtable__py', {}, r.py)),
        el('td.pj-flow__go', {},
          el(`span.pj-prog${done ? '.is-done' : ''}`, { title: `${t.unit.no}단원 진도 ${pr.done} / ${pr.total}쪽` }, done ? '✓ 다 했어요' : `진도 ${pr.done}/${pr.total}쪽`),
          el('button.pill.pill--sm', { type: 'button', title: `${t.unit.no}단원 ${t.label} 표지로 가기`, onclick: () => ctx.go(t.id) }, '다시 보기 →')));
      return isOpen ? [row, detailRow(t)] : row;
    }));
    countLine.textContent = seen.size === units.length
      ? '🎉 1~6단원을 모두 펼쳐 봤어요. 프로젝트도 이 순서 그대로 해요.'
      : `펼쳐 본 단원 ${seen.size} / ${units.length} — 단원 이름(▶)을 누르면 그 단원의 데이터 변화와 파이썬 한 줄 정리가 펼쳐져요.`;
  }

  fill(root, el('div.read.read--wide', {},
    el('div.pj-head', {},
      el('p.pj-intro', {}, '🗺 펭귄 데이터가 거쳐 온 6단계예요. 번호는 맨 위 탭의 번호와 같고, [다시 보기 →]는 그 단원의 표지로 가요.'),
      countLine),
    el('div.pj-scroll', {}, el('table.mini.flowtable.pj-flow', {},
      el('thead', {}, el('tr', {}, ['단원', '우리가 한 일', '의사코드 핵심', '파이썬', '진도'].map((h) => el('th', {}, h)))),
      body)),
    el('div.cards', {},
      el('div.card.card--current', {}, el('div.card__title', {}, '🔁 데이터가 바뀐 모습'), el('p.card__text', {}, 'HTML 글자 → 345줄 표(빈칸·이상치·겹친 행) → 깨끗한 341줄 표 → X(속성 4개)·y(종) → 훈련 272줄 · 테스트 69줄 → 모델 → 예측')),
      el('div.card.card--result', {}, el('div.card__title', {}, '🧠 자료구조가 한 일'), el('p.card__text', {}, '리스트(행목록·거리목록·위치목록), 사전(세기표·바꿈표), 큐(트리의 할일), 표(데이터프레임)·점수표(Q). 알고리즘은 결국 자료구조를 바꿔 가는 절차예요.')),
      el('div.card.card--add', {}, el('div.card__title', {}, '✅ 기억할 것 세 가지'), el('p.card__text', {}, '① 데이터가 나쁘면 결과도 나쁘다. ② 테스트 데이터는 학습에 쓰지 않는다. ③ 알고리즘은 목적(분류·회귀·군집)에 맞춰 고른다.')))));
  draw();
  const unsub = ctx.progress.subscribe(() => draw());
  return { destroy: unsub };
}

/* ═════════════ 6-3 이해 확인 ═════════════ */

const QUIZ_KEY = FINAL_KEY;

function quiz(root, ctx) {
  ensureProjectStyle();
  // 문제 앞에 그 개념을 배운 단원을 붙인다 — 틀리면 어느 단원을 다시 볼지 바로 보이게
  const questions = QUIZ.map((q) => {
    const t = tabById(q.page?.tab);
    return t ? { ...q, q: `[${t.unit.no} ${t.label}] ${q.q}` } : q;
  });
  const box = el('div');
  const tally = el('div.pj-tally', { 'aria-label': '단원별 결과' });

  function drawTally() {
    const saved = ctx.progress.answers(QUIZ_KEY);
    const byUnit = new Map();
    QUIZ.forEach((q, i) => {
      const t = tabById(q.page?.tab);
      if (!t) return;
      const v = saved[i];
      const mark = v === undefined || v === null ? '·' : v === q.answer ? '⭕' : '❌';
      byUnit.set(t, `${byUnit.get(t) ?? ''}${mark}`);
    });
    fill(tally, el('b', {}, '단원별 (⭕ 맞음 · ❌ 틀림 · 아직)'), [...byUnit].map(([t, marks]) => el('span', {
      title: `${t.unit.no}단원 ${t.label}`, 'data-wrong': marks.includes('❌') ? 'true' : null,
    }, `${t.unit.no} ${t.label} ${marks}`)));
  }

  function drawBox() {
    fill(box, quizBox(questions, {
      title: '📝 수업 전체 이해 확인',
      saved: ctx.progress.answers(QUIZ_KEY),
      firsts: ctx.progress.firsts(QUIZ_KEY),
      onPick: (qi, oi) => { ctx.progress.answer(QUIZ_KEY, qi, oi); drawTally(); },
      onReview: (ref) => ctx.go(ref.tab, ref.page, ref.sub),
    }));
  }

  function reset() {
    QUIZ.forEach((_, i) => ctx.progress.answer(QUIZ_KEY, i, null));
    drawBox();
    drawTally();
  }

  fill(root, el('div.read.pj-final', {},
    el('div.pj-quizhead', {},
      el('p', {}, '1~5단원에서 2문제씩 골랐어요. 처음 고른 답이 기록되니(처음에 맞힘) 찍지 말고 생각해서 골라요. 틀리면 ', el('b', {}, '[📖 그 쪽 다시 보기 →]'), '로 그 개념을 배운 쪽에 다녀와서 다시 골라 보세요. 고른 답은 이 브라우저에 저장돼요.'),
      el('button.pill.pill--sm', { type: 'button', onclick: reset }, '🔄 처음부터 다시 풀기')),
    tally,
    box));
  drawBox();
  drawTally();
  return {};
}

/* ═════════════ 6-4 프로젝트 안내 ═════════════ */

/** go: [탭, 쪽, 하위탭] — "다시 보기" 단추가 데려갈 곳 */
const STEPS = [
  { id: 'problem', icon: '🎯', name: '문제 정하기', todo: '무엇을 맞힐까(정답 y)? 분류·회귀·군집 중 무엇인가? 모둠이면 역할(데이터·코드·발표)도 나눠요.', py: '', go: ['ml', 'purpose', 'concept'] },
  { id: 'collect', icon: '🕸', name: '데이터 모으기', todo: '공개 데이터를 내려받거나 크롤링해요. 출처와 이용 조건을 적어 둬요.', py: 'pd.read_csv · requests · BeautifulSoup', go: ['collect'] },
  { id: 'inspect', icon: '🔍', name: '데이터 살펴보기', todo: '행·열 수, 결측치, 이상치, 겹친 행을 확인해요. 그래프로 그려 봐요.', py: 'shape · isnull().sum() · duplicated() · describe() · boxplot', go: ['inspect'] },
  { id: 'prep', icon: '🧹', name: '전처리', todo: '핵심 속성 고르기, 지우기·채우기, 글자를 숫자로.', py: 'drop_duplicates · dropna · fillna · map', go: ['prep'] },
  { id: 'split', icon: '🧩', name: '나누기', todo: 'X와 y, 훈련과 테스트로 나눠요.', py: 'train_test_split', go: ['ready'] },
  { id: 'train', icon: '🤖', name: '모델 학습', todo: '목적에 맞는 알고리즘을 골라 fit() 해요. 두 가지 이상 견줘 보면 더 좋아요.', py: 'KNeighborsClassifier · DecisionTreeClassifier · LinearRegression · KMeans', go: ['ml'] },
  { id: 'eval', icon: '📊', name: '평가와 개선', todo: '테스트 데이터로 정확도(분류)·오차(회귀)를 재고, 틀린 예를 살펴 고쳐 봐요.', py: 'accuracy_score · mean_squared_error', go: ['project', 'eval'] },
  { id: 'impact', icon: '⚖️', name: '사회적 영향 점검', todo: '개인정보가 들어 있지 않나? 데이터가 한쪽으로 치우치지(편향) 않았나? 틀린 예측으로 피해를 보는 사람은 없나?', py: '', go: ['collect', 'manners'] },
  { id: 'present', icon: '🎤', name: '발표', todo: '문제 → 데이터 → 전처리 근거 → 모델 선택 이유 → 결과 → 한계와 개선점 순서로.', py: '', go: null },
];
/** 예전 판은 체크를 순서 번호로 저장했다 — 번호를 단계 id로 옮겨 읽는다 */
const OLD_ORDER = ['problem', 'collect', 'inspect', 'prep', 'split', 'train', 'eval', 'present'];

const KINDS = {
  분류: { what: '정해진 무리 중 하나를 골라요(종·품종)', algo: 'k-최근접 이웃 · 의사결정 트리', py: 'KNeighborsClassifier · DecisionTreeClassifier', go: ['ml', 'idea', 'knn'] },
  회귀: { what: '숫자를 내놓는 예측이에요(몸무게·기온)', algo: '선형 회귀', py: 'LinearRegression', go: ['ml', 'idea', 'linreg'] },
  군집: { what: '정답 없이 비슷한 것끼리 묶어요', algo: 'k-평균', py: 'KMeans', go: ['ml', 'idea', 'kmeans'] },
};

const TOPICS = [
  { icon: '🌸', title: '붓꽃 품종 분류', kind: '분류', data: 'scikit-learn 내장 데이터 load_iris()', algo: 'k-최근접 이웃 · 의사결정 트리' },
  { icon: '🍷', title: '와인 종류 분류', kind: '분류', data: 'scikit-learn 내장 데이터 load_wine()', algo: '의사결정 트리 · k-최근접 이웃' },
  { icon: '🌡', title: '우리 동네 기온 예측', kind: '회귀', data: '기상자료개방포털(data.kma.go.kr)의 일별 기온 CSV', algo: '선형 회귀' },
  { icon: '🚲', title: '공공자전거 대여량 예측', kind: '회귀', data: '서울 열린데이터광장(data.seoul.go.kr)·공공데이터포털(data.go.kr)', algo: '선형 회귀 · 의사결정 트리' },
  { icon: '🛒', title: '매점 판매 기록으로 상품 묶기', kind: '군집', data: '학교 매점·학급 설문 데이터(개인정보 없이)', algo: 'k-평균' },
  { icon: '🐧', title: '펭귄 성별 맞히기', kind: '분류', data: '이 수업의 펭귄 데이터 (정답: 성별)', algo: 'k-최근접 이웃 · 의사결정 트리' },
];

const CHECK_KEY = 'ai-data-lab:project-check';
const PLAN_KEY = 'ai-data-lab:project-plan';

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') ?? {}; } catch { return {}; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장하지 못해도 계획 세우기에는 지장이 없다 */ }
}

function project(root, ctx) {
  ensureProjectStyle();
  const checked = {};
  for (const [k, v] of Object.entries(readJSON(CHECK_KEY))) checked[/^\d+$/.test(k) ? OLD_ORDER[Number(k)] : k] = Boolean(v);
  const plan = { topic: '', kind: null, ...readJSON(PLAN_KEY) };
  if (plan.kind === '예측') plan.kind = '회귀';   // 예전 판은 회귀를 '예측'이라 불렀다
  const saveChecks = () => writeJSON(CHECK_KEY, checked);
  const savePlan = () => writeJSON(PLAN_KEY, plan);
  const goBtn = (go, label) => el('button.pill.pill--sm.projstep__go', { type: 'button', onclick: () => ctx.go(...go) }, label);

  /* 내 프로젝트 계획 — 주제 · 학습 목적 → 알맞은 알고리즘 */
  const topicInput = el('input', {
    type: 'text', value: plan.topic, maxlength: '60', 'aria-label': '내 프로젝트 주제',
    placeholder: '예: 우리 동네 기온 예측 — 아래 주제 예시를 눌러도 돼요',
    oninput: (e) => {
      plan.topic = e.target.value;
      savePlan();
      if (plan.topic.trim().length >= 2) ctx.check('topic');
      drawTopics();
    },
  });
  const kindRow = el('div.pj-kinds');
  const algoLine = el('p.pj-algo');
  function drawPlan() {
    fill(kindRow, el('span', {}, '학습 목적'), el('span.seg', { role: 'group', 'aria-label': '학습 목적' },
      Object.keys(KINDS).map((k) => el('button', {
        type: 'button', 'aria-pressed': String(plan.kind === k), title: KINDS[k].what,
        onclick: () => { plan.kind = k; savePlan(); drawPlan(); },
      }, k))));
    const kd = KINDS[plan.kind];
    fill(algoLine, kd
      ? ['→ ', el('b', {}, plan.kind), ` — ${kd.what}. 알맞은 알고리즘: `, el('b', {}, kd.algo), ' ', el('code.flowtable__py', {}, kd.py), ' ',
        goBtn(kd.go, '5단원에서 다시 보기 →')]
      : '학습 목적을 고르면 알맞은 알고리즘을 알려 줘요. 헷갈리면 정답(y)이 있는지, 숫자인지부터 생각해 봐요.');
  }

  /* 주제 예시 — 누르면 내 계획에 들어간다 */
  const topicBox = el('div.cards');
  function drawTopics() {
    fill(topicBox, TOPICS.map((t) => el('button.card.pj-topic', {
      type: 'button', 'aria-pressed': String(plan.topic === t.title),
      onclick: () => {
        plan.topic = t.title;
        plan.kind = t.kind;
        topicInput.value = t.title;
        savePlan();
        ctx.check('topic');
        drawPlan();
        drawTopics();
      },
    },
    el('span.card__title', {}, `${t.icon} ${t.title}`, ' ', el(`span.tag${t.kind === '분류' ? '.tag--current' : t.kind === '회귀' ? '.tag--result' : '.tag--add'}`, {}, t.kind)),
    el('span.card__text', {}, '📂 ', t.data), el('span.card__meta', {}, `🤖 ${t.algo}`))));
  }

  /* 단계별 체크리스트 */
  const list = el('ol.projsteps');
  function drawSteps() {
    fill(list, STEPS.map((st, i) => {
      const tab = st.go ? tabById(st.go[0]) : null;
      return el(`li.projstep${checked[st.id] ? '.is-done' : ''}`, {},
        el('label.projstep__check', {}, el('input', {
          type: 'checkbox', checked: Boolean(checked[st.id]),
          onchange: (e) => {
            checked[st.id] = e.target.checked;
            saveChecks();
            if (e.target.checked) ctx.check('proj-check');
            drawSteps();
          },
        }), el('span.sr-only', {}, `${st.name} 했어요`)),
        el('span.projstep__icon', {}, st.icon),
        el('div.projstep__body', {},
          el('b', {}, `${i + 1}. ${st.name}`), el('span', {}, st.todo), st.py ? el('code.flowtable__py', {}, st.py) : null,
          tab ? goBtn(st.go, `${tab.icon} ${tab.unit.no}단원 다시 보기 →`) : null));
    }));
  }

  drawPlan();
  drawTopics();
  drawSteps();
  fill(root, el('div.read.read--wide', {},
    el('div.nb__top', {},
      el('p', {}, '📒 ', el('b', {}, '프로젝트 틀 노트북'), ' — 펭귄 데이터로 처음부터 끝까지(수집 → 평가) 돌아가는 완성 예시예요. "✏️ 여기를 바꿔요" 표시가 있는 DATA_URL·TARGET·FEATURES를 내 데이터와 내 목표로 바꿔 쓰면 돼요.'),
      el('a.pill.pill--colab', { href: colabUrl('09_project_template'), target: '_blank', rel: 'noopener' }, '📒 Colab에서 열기'),
      el('a.pill', { href: notebookUrl('09_project_template'), target: '_blank', rel: 'noopener' }, '⬇ 노트북 받기')),
    el('div.projgrid', {},
      el('div.pj-col', {},
        el('section.card.card--current.pj-plan', {},
          el('h3', {}, '📝 내 프로젝트 계획', el('span.card__meta', {}, ' · 이 브라우저에만 저장돼요')),
          el('label', {}, '주제 — 무엇을 맞힐까?', topicInput),
          kindRow,
          algoLine),
        el('section', {}, el('h3', {}, '✅ 단계별 체크리스트'), el('p.panel__hint', {}, '한 단계씩 끝낼 때마다 체크하세요. 막히면 [다시 보기 →]로 그 단원에 다녀와요.'), list)),
      el('div.pj-col', {},
        el('section', {}, el('h3', {}, '💡 주제 예시 — 눌러서 내 주제로'), topicBox),
        el('section', {},
          el('h3', {}, '🔎 데이터 구하는 곳'),
          el('ul', {},
            el('li', {}, '공공데이터포털 data.go.kr · 서울 열린데이터광장 data.seoul.go.kr · 기상자료개방포털 data.kma.go.kr'),
            el('li', {}, 'scikit-learn 내장 데이터: load_iris(), load_wine(), load_diabetes() — 내려받기 없이 바로 써요'),
            el('li', {}, 'Kaggle Datasets(kaggle.com/datasets) — 회원가입이 필요해요'),
            el('li', {}, '직접 크롤링 — 🕸 수집 단원의 예절(robots.txt·천천히·개인정보 없이)을 꼭 지켜요'),
            el('li', {}, '이 수업의 펭귄 데이터: ', el('a', { href: DATA_CSV_URL, target: '_blank', rel: 'noopener' }, 'penguins.csv')))))),
    el('div.callout', {}, '🧭 평가 기준 예시 — ① 문제가 분명한가(무엇을 맞히나) ② 데이터 출처와 수집 방법을 밝혔나 ③ 결측치·이상치를 확인하고 처리한 근거가 있나 ④ 목적에 맞는 알고리즘을 골랐나 ⑤ 테스트 데이터로 공정하게 평가하고, 틀린 예를 보고 고쳐 봤나 ⑥ 개인정보·편향을 점검했나 ⑦ 모둠원이 역할을 나눠 함께 해결했나 ⑧ 한계와 개선점을 말할 수 있나')));
  return {};
}

export const PROJECT_SCENES = {
  evaluate,
  summary: { kind: 'view', mount: summary },
  quiz: { kind: 'view', mount: quiz },
  // notebook: 이 쪽에 프로젝트 틀 노트북의 Colab 단추가 있다(미션 'colab'을 이룰 수 있다)
  project: { kind: 'view', mount: project, notebook: '09_project_template' },
};

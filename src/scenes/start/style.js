/**
 * 🏁 시작 단원 장면의 모양 — 공용 CSS 파일을 건드리지 않으려고 장면이 처음 붙을 때 <style> 하나를 머리에 넣는다.
 * 색·간격·글자 크기는 모두 tokens.css의 토큰만 쓴다(밝은/어두운 화면이 저절로 맞는다).
 *   .sg-*   0-1 완성품 미리 보기
 *   .smap-* 0-2 수업 지도
 *   .tour-* · .tm-*  0-3 화면 사용법(.tm = 화면 모형)  · .tour-flash = 진짜 화면 부분 반짝이기
 *   .di-*   0-4 펭귄 표
 */
const ID = 'start-scenes-style';

const CSS = String.raw`
/* ── 0-1 완성품 미리 보기 ── */
.sg { max-width: 1180px; gap: var(--sp-3); }
.sg-hero {
  display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-2) var(--sp-4);
  border-radius: var(--radius); border: 1px solid color-mix(in srgb, var(--current) 35%, var(--border));
  background: linear-gradient(135deg, var(--current-bg), var(--surface));
}
.sg-hero__emoji { font-size: calc(2.2rem * var(--scale)); line-height: 1; }
.sg-hero__kicker { font-size: var(--fs-xs) !important; color: var(--current); font-weight: 700; line-height: 1.4 !important; }
.sg-hero h3 { font-size: var(--fs-xl) !important; line-height: 1.25; }
.sg-hero p:last-child { font-size: var(--fs-sm) !important; color: var(--text-muted); line-height: 1.5 !important; }
.sg-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr); gap: var(--sp-3); align-items: start; }
.sg-col { display: flex; flex-direction: column; gap: var(--sp-3); min-width: 0; }

.sg-demo {
  border: 2px solid var(--result); border-radius: var(--radius); background: var(--surface);
  padding: var(--sp-2) var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0;
}
.sg-demo__head { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
.sg-demo__head h4 { font-size: var(--fs-md) !important; }
.sg-demo__head .legend { margin-left: auto; }
.sg-demo__body { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(190px, 1fr); gap: var(--sp-3); align-items: center; }
.sg-chart { min-width: 0; }
.sg-chart svg { width: 100%; height: auto; max-height: 46vh; }
.sg-chart .mover { transition: transform .15s ease-out; }
.sg-ctrl { display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0; }
.sg-slider { display: grid; grid-template-columns: auto 1fr; gap: 0 var(--sp-2); align-items: center; font-size: var(--fs-sm); }
.sg-slider__name { font-weight: 700; }
.sg-slider__val { justify-self: end; font-family: var(--font-code); font-weight: 700; color: var(--current); }
.sg-slider input { grid-column: 1 / -1; width: 100%; accent-color: var(--current); margin: 0; height: 1.4rem; cursor: pointer; }
.sg-pred {
  border: 2px solid var(--result); background: var(--result-bg); border-radius: var(--radius);
  padding: var(--sp-2) var(--sp-3); display: flex; flex-direction: column; gap: 2px; text-align: center;
}
.sg-pred__label { font-size: var(--fs-xs); color: var(--text-muted); font-weight: 700; }
.sg-pred__name { font-size: var(--fs-xl); line-height: 1.2; }
.sg-pred__votes { font-size: var(--fs-xs); }
.sg-pred.is-new { animation: sg-pop .45s cubic-bezier(.34, 1.5, .5, 1); }
@keyframes sg-pop { 40% { transform: scale(1.06); } }
.sg-found { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: var(--fs-xs); }
.sg-found__label { font-weight: 700; color: var(--text-muted); margin-right: 2px; }
.sg-found__sp { border: 1px dashed var(--border-strong); border-radius: 999px; padding: 0 8px; background: var(--surface); }
.sg-found__sp[data-on="true"] { border-style: solid; border-color: var(--add); background: var(--add-bg); color: var(--add); font-weight: 700; }
.sg-demo__foot { font-size: var(--fs-xs) !important; color: var(--text-muted); line-height: 1.5 !important; }

.sg-out { list-style: none; padding: 0 !important; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.sg-out li { display: grid; grid-template-columns: 5.4rem minmax(0, 1fr); gap: var(--sp-2); align-items: baseline; font-size: var(--fs-sm) !important; line-height: 1.5 !important; }
.sg-out__no { justify-self: start; font-size: var(--fs-xs); font-weight: 700; color: var(--current); background: var(--current-bg); border-radius: 999px; padding: 0 7px; white-space: nowrap; }
.sg-calm { margin: 0; border-left: 4px solid var(--add); background: var(--add-bg); border-radius: var(--radius-sm); padding: var(--sp-2) var(--sp-3); font-size: var(--fs-sm) !important; line-height: 1.55 !important; }
.sg-calm strong { color: var(--add); }
@media (max-width: 1000px) { .sg-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .sg-demo__body { grid-template-columns: 1fr; } .sg-hero h3 { font-size: var(--fs-lg) !important; } }

/* ── 0-2 수업 지도 ── */
.smap { max-width: 1180px; gap: var(--sp-3); }
.smap-hook { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; border: 1px solid var(--result); background: color-mix(in srgb, var(--result-bg) 55%, var(--surface)); border-radius: var(--radius); padding: var(--sp-2) var(--sp-3); }
.smap-hook__q { font-weight: 700; font-size: var(--fs-sm) !important; line-height: 1.45 !important; }
.smap-hook .quiz__opt { padding: 2px var(--sp-3); font-size: var(--fs-sm); border-radius: 999px; }
.smap-hook .quiz__opt[data-state="mine"] { border-color: var(--result); background: var(--result-bg); font-weight: 700; }
.smap-hook__note { flex: 1 1 100%; font-size: var(--fs-xs) !important; color: var(--text-muted); line-height: 1.4 !important; }
.smap-steps { display: flex; align-items: stretch; gap: 4px; }
.smap-to { align-self: center; color: var(--text-muted); font-size: var(--fs-sm); }
.smap-step {
  position: relative; overflow: hidden; flex: 1 1 0; min-width: 0;
  display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 6px; align-items: center;
  padding: var(--sp-2) var(--sp-2) calc(var(--sp-2) + 3px); border-radius: var(--radius); text-align: left;
}
.smap-step__no { grid-row: span 2; display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 999px; background: var(--surface-2); font-weight: 700; font-size: var(--fs-sm); }
.smap-step__name { font-weight: 700; font-size: var(--fs-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.smap-step__verb { font-size: var(--fs-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.smap-step__bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--surface-2); }
.smap-step__bar::after { content: ''; position: absolute; inset: 0 auto 0 0; width: calc(var(--p, 0) * 100%); background: var(--add); }
.smap-step__seen { position: absolute; top: 3px; right: 5px; font-size: var(--fs-xs); color: var(--add); }
.smap-step[aria-pressed="true"], .smap-step[aria-pressed="true"]:hover:not(:disabled) { background: var(--current); border-color: var(--current); color: #fff; }
.smap-step[aria-pressed="true"] .smap-step__no { background: #fff; color: var(--current); }
.smap-step[aria-pressed="true"] .smap-step__verb, .smap-step[aria-pressed="true"] .smap-step__seen { color: #fff; }
.smap-step[aria-pressed="true"] .smap-step__bar { background: rgba(255, 255, 255, .35); }
.smap-step[aria-pressed="true"] .smap-step__bar::after { background: #fff; }
.smap-count { font-size: var(--fs-xs) !important; color: var(--text-muted); margin-top: -6px; }
.smap-card { border: 1px solid var(--current); background: color-mix(in srgb, var(--current-bg) 45%, var(--surface)); border-radius: var(--radius); padding: var(--sp-3) var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-2); }
.smap-card__head { display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap; }
.smap-card__icon { font-size: calc(2rem * var(--scale)); line-height: 1; }
.smap-card__kicker { font-size: var(--fs-xs) !important; color: var(--text-muted); font-weight: 700; line-height: 1.4 !important; }
.smap-card__head h3 { font-size: var(--fs-lg) !important; }
.smap-card__head h3 span { color: var(--current); }
.smap-meter { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.smap-meter > span { position: relative; width: 110px; height: 7px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.smap-meter > span::after { content: ''; position: absolute; inset: 0 auto 0 0; width: calc(var(--p) * 100%); background: var(--add); }
.smap-card__grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sp-3) var(--sp-4); align-items: start; }
.smap-card__col { display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0; }
.smap-q { font-weight: 700; font-size: var(--fs-md) !important; line-height: 1.5 !important; }
.smap-card h4 { font-size: var(--fs-sm) !important; color: var(--current); }
.smap-card .cando li { font-size: var(--fs-sm) !important; line-height: 1.5 !important; }
.smap-tools { font-size: var(--fs-xs) !important; color: var(--text-muted); }
.smap-card__foot { display: flex; justify-content: flex-end; }
@media (max-width: 900px) {
  .smap-steps { flex-wrap: wrap; }
  .smap-step { flex: 1 1 30%; }
  .smap-to { display: none; }
  .smap-card__grid { grid-template-columns: 1fr; }
}

/* ── 0-3 화면 사용법 ── */
.tour { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(270px, 1fr); gap: var(--sp-4); align-items: start; }
.tour__side { display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0; position: sticky; top: 0; }
.tour__explain { border: 2px solid var(--result); background: color-mix(in srgb, var(--result-bg) 55%, var(--surface)); border-radius: var(--radius); padding: var(--sp-2) var(--sp-3); display: flex; flex-direction: column; gap: 6px; min-height: 9.5rem; }
.tour__explain h3 { font-size: var(--fs-md); display: flex; align-items: center; gap: var(--sp-2); margin: 0; }
.tour__explain p { margin: 0; font-size: var(--fs-sm); line-height: 1.6; }
.tour__flash { font-size: var(--fs-xs) !important; color: var(--text-muted); }
.tour__num { display: inline-grid; place-items: center; min-width: 1.5rem; height: 1.5rem; border-radius: 999px; background: var(--result); color: #fff; font-weight: 700; font-size: var(--fs-sm); flex: 0 0 auto; }
.tour__list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.tour__item { width: 100%; display: flex; align-items: center; gap: 6px; padding: 3px var(--sp-2); border-radius: var(--radius-sm); font-size: var(--fs-xs); text-align: left; }
.tour__item .tour__num { min-width: 1.25rem; height: 1.25rem; font-size: var(--fs-xs); background: var(--surface-2); color: var(--text); }
.tour__item[data-seen="true"] { border-color: var(--add); }
.tour__item[data-seen="true"] .tour__num { background: var(--add); color: #fff; }
.tour__item[aria-pressed="true"], .tour__item[aria-pressed="true"]:hover:not(:disabled) { border-color: var(--result); background: var(--result-bg); font-weight: 700; }
.tour__count { font-size: var(--fs-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.tour__count[data-all="true"] { color: var(--add); font-weight: 700; }

.tm {
  position: relative; border: 1px solid var(--border-strong); border-radius: var(--radius); background: var(--bg);
  padding: 12px 10px 10px; display: flex; flex-direction: column; gap: 9px;
  font-size: calc(0.68rem * var(--scale)); line-height: 1.35; box-shadow: var(--shadow); min-width: 0;
}
.tm-cap { position: absolute; top: -0.65rem; right: 12px; font-size: var(--fs-xs); background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 0 8px; color: var(--text-muted); }
.tm-row { display: flex; gap: 9px; min-width: 0; align-items: stretch; }
.tm-grow { flex: 1 1 auto; }
.tm-r {
  position: relative; min-width: 0; border: 1px solid var(--border); border-radius: 6px; background: var(--surface);
  padding: 5px 6px 4px 14px; outline: 3px solid transparent; outline-offset: 1px; transition: outline-color .2s ease, background .2s ease;
}
.tm-r.is-pick { outline-color: var(--result); background: color-mix(in srgb, var(--result-bg) 75%, var(--surface)); }
.tm-badge {
  position: absolute; top: -9px; left: -8px; z-index: 2; width: 1.45rem; height: 1.45rem; padding: 0; border-radius: 999px;
  display: grid; place-items: center; font-weight: 700; font-size: calc(0.78rem * var(--scale)); line-height: 1;
  background: var(--result); color: #fff; border: 2px solid var(--surface); box-shadow: var(--shadow);
}
.tm-badge:hover:not(:disabled) { background: var(--result); filter: brightness(1.1); border-color: var(--surface); }
.tm-badge[data-seen="true"] { background: var(--add); }
.tm-badge[data-seen="true"]:hover:not(:disabled) { background: var(--add); }
.tm-r.is-pick > .tm-badge { transform: scale(1.18); }
.tm-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tm-muted { color: var(--text-muted); }
.tm-chip { display: inline-block; border: 1px solid var(--border); border-radius: 999px; padding: 0 5px; background: var(--surface); white-space: nowrap; }
.tm-chip--blue { background: var(--current); border-color: var(--current); color: #fff; font-weight: 700; }
.tm-chip--soft { border-color: var(--current); background: var(--current-bg); }
.tm-chip--term { border-style: dashed; border-color: var(--current); color: var(--current); }
.tm-chip--done { border-color: var(--add); color: var(--add); }
.tm-chip--ask { border-color: var(--result); background: var(--result-bg); font-weight: 700; }
.tm-tabs { display: flex; gap: 3px; min-width: 0; }
.tm-tab { position: relative; flex: 1 1 0; min-width: 0; border: 1px solid var(--border); border-radius: 4px; padding: 1px 4px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700; }
.tm-tab small { display: block; font-weight: 400; color: var(--text-muted); font-size: .9em; overflow: hidden; text-overflow: ellipsis; }
.tm-tab::after { content: ''; position: absolute; left: 0; bottom: 0; height: 2px; width: calc(var(--p, 0) * 100%); background: var(--add); }
.tm-tab.is-on { background: var(--current); border-color: var(--current); color: #fff; }
.tm-tab.is-on small { color: #fff; }
.tm-tab.is-on::after { background: #fff; }
.tm-tools { display: flex; gap: 3px; align-items: center; height: 100%; }
.tm-head { display: flex; gap: 5px; align-items: center; min-width: 0; }
.tm-head .tm-steps { flex: 1 1 auto; min-width: 0; overflow: hidden; white-space: nowrap; }
.tm-lesson { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 9px; }
.tm-title { font-weight: 700; font-size: 1.12em; }
.tm-goal b { color: var(--current); }
.tm-miss { background: var(--surface-2); }
.tm-miss .tm-r { margin-top: 8px; padding-top: 3px; }
.tm-ctrl { display: flex; gap: 4px; align-items: center; background: color-mix(in srgb, var(--current-bg) 70%, var(--surface)); flex-wrap: wrap; }
.tm-btn { border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; background: var(--surface); white-space: nowrap; }
.tm-btn--main { background: var(--current); border-color: var(--current); color: #fff; font-weight: 700; }
.tm-say { flex: 1 1 100%; border: 1px solid var(--add); background: var(--add-bg); border-radius: 4px; padding: 1px 5px; }
.tm-work { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.4fr); grid-template-rows: auto auto; gap: 9px; }
.tm-code { grid-row: span 2; display: flex; flex-direction: column; gap: 2px; }
.tm-panelhead { display: flex; gap: 3px; align-items: center; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 2px; margin-bottom: 2px; flex-wrap: wrap; }
.tm-panelhead .tm-chip { font-weight: 400; }
.tm-code__line { font-family: var(--font-code); white-space: pre; overflow: hidden; text-overflow: ellipsis; padding: 0 3px; border-radius: 3px; border: 1px solid transparent; }
.tm-code__line.is-on { background: var(--current-bg); border-color: var(--current); color: var(--current); font-weight: 700; }
.tm-pengs { display: flex; gap: 3px; justify-content: center; padding-top: 6px; }
.tm-peng { position: relative; flex: 0 1 3.1rem; min-width: 0; text-align: center; border: 1px solid var(--border); border-radius: 4px; padding: 1px 2px; }
.tm-peng.is-on { border: 2px solid var(--current); background: var(--current-bg); }
.tm-peng.is-best { border-color: var(--result); }
.tm-peng__crown { position: absolute; top: -0.85em; left: 0; right: 0; }
.tm-vars { display: flex; gap: 6px; }
.tm-var { border: 1px solid var(--border-strong); border-radius: 4px; padding: 1px 6px; }
.tm-var b { font-family: var(--font-code); }
.tm-var.is-hot { border-color: var(--add); background: var(--add-bg); }

/* 진짜 화면 부분 반짝이기 — 번호를 누르면 약 1.5초 */
.tour-flash { outline: 3px solid var(--result) !important; outline-offset: 2px; border-radius: var(--radius-sm); animation: tour-flash 1.5s ease-in-out; }
@keyframes tour-flash {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  25%, 75% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--result) 35%, transparent); }
  50% { box-shadow: 0 0 0 2px color-mix(in srgb, var(--result) 35%, transparent); }
}
@media (max-width: 1000px) {
  .tour { grid-template-columns: 1fr; }
  .tour__side { position: static; }
}
@media (max-width: 640px) {
  .tm-lesson, .tm-work { grid-template-columns: 1fr; }
  .tm-code { grid-row: auto; }
  .tm-row { flex-wrap: wrap; }
}

/* ── 0-4 펭귄 표 ── */
.di-count { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: var(--fs-sm); border: 1px dashed var(--border-strong); border-radius: var(--radius-sm); padding: 4px var(--sp-2); background: var(--surface); }
.di-count b { font-variant-numeric: tabular-nums; }
.di-count__eq { color: var(--text-muted); font-weight: 700; }
.di-count__dup { color: var(--warn); }
`;

export function ensureStartStyle() {
  if (typeof document === 'undefined' || document.getElementById(ID)) return;
  const style = document.createElement('style');
  style.id = ID;
  style.textContent = CSS;
  document.head.append(style);
}

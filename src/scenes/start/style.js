/**
 * 🏁 시작 단원 장면의 모양 — 공용 CSS 파일을 건드리지 않으려고 장면이 처음 붙을 때 <style> 하나를 머리에 넣는다.
 * 색·간격·글자 크기는 모두 tokens.css의 토큰만 쓴다(밝은/어두운 화면이 저절로 맞는다).
 *   .sg-*   0-1 완성품 미리 보기
 *   .smap-* 0-2 수업 지도
 *   .tour-* · .tm-*  0-3 화면 사용법(.tm = 화면 모형)  · .tour-flash = 진짜 화면 부분 반짝이기(보라 = 지금 볼 곳)
 *   .di-*   0-4 펭귄 표
 * 장(beat)마다 덩어리 한두 개만 보이므로(FINAL_SPEC §2.5) 덩어리는 가로를 넉넉히 쓰고, 1280×720에서 스크롤 없이 들어가게 잡는다.
 */
const ID = 'start-scenes-style';

const CSS = String.raw`
/* ── 0-1 완성품 미리 보기 ── */
.sg { max-width: 1180px; gap: var(--sp-3); }
.sg-demo {
  border: 2px solid var(--result); border-radius: var(--radius); background: var(--surface);
  padding: var(--sp-2) var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0;
}
.sg-demo__head { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
.sg-demo__head h4 { font-size: var(--fs-md) !important; }
.sg-demo__head .legend { margin-left: auto; }
.sg-demo__body { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(240px, 1fr); gap: var(--sp-4); align-items: center; }
.sg-chart { min-width: 0; display: flex; justify-content: center; }
.sg-chart svg { width: 100%; height: auto; max-height: min(50vh, 380px); }
.sg-chart .mover { transition: transform .15s ease-out; }
.sg-ctrl { display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0; }
.sg-sliders { display: flex; flex-direction: column; gap: var(--sp-2); padding: var(--sp-2); border-radius: var(--radius-sm); }
.sg-slider { display: grid; grid-template-columns: auto 1fr; gap: 0 var(--sp-2); align-items: center; font-size: var(--fs-sm); }
.sg-slider__name { font-weight: 700; }
.sg-slider__val { justify-self: end; font-family: var(--font-code); font-weight: 700; color: var(--current); }
.sg-slider input { grid-column: 1 / -1; width: 100%; accent-color: var(--current); margin: 0; height: 1.6rem; cursor: pointer; }
.sg-pred {
  border: 2px solid var(--result); background: var(--result-bg); border-radius: var(--radius);
  padding: var(--sp-2) var(--sp-3); display: flex; flex-direction: column; gap: 2px; text-align: center;
}
.sg-pred__label { font-size: var(--fs-xs); color: var(--text-muted); font-weight: 700; }
.sg-pred__name { font-size: var(--fs-xl); line-height: 1.2; }
.sg-pred__votes { font-size: var(--fs-xs); }
.sg-pred.is-new { animation: sg-pop .45s cubic-bezier(.34, 1.5, .5, 1); }
@keyframes sg-pop { 40% { transform: scale(1.06); } }
@media (prefers-reduced-motion: reduce) { .sg-pred.is-new { animation: none; } }
.sg-found { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: var(--fs-xs); }
.sg-found__label { font-weight: 700; color: var(--text-muted); margin-right: 2px; }
.sg-found__sp { border: 1px dashed var(--border-strong); border-radius: 999px; padding: 0 8px; background: var(--surface); }
.sg-found__sp[data-on="true"] { border-style: solid; border-color: var(--add); background: var(--add-bg); color: var(--add); font-weight: 700; }
.sg-demo__foot { font-size: var(--fs-xs) !important; color: var(--text-muted); line-height: 1.5 !important; }

.sg-outwrap { display: flex; flex-direction: column; gap: var(--sp-3); max-width: 900px; width: 100%;  }
.sg-out { list-style: none; padding: 0 !important; margin: 0; display: flex; flex-direction: column; gap: var(--sp-2); }
.sg-out li {
  display: grid; grid-template-columns: 6.2rem minmax(0, 1fr); gap: var(--sp-3); align-items: center;
  font-size: var(--fs-lg) !important; line-height: 1.5 !important;
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); padding: var(--sp-2) var(--sp-3);
}
.sg-out__no { justify-self: start; font-size: var(--fs-sm); font-weight: 700; color: var(--current); background: var(--current-bg); border-radius: 999px; padding: 2px 10px; white-space: nowrap; }
.sg-calm { margin: 0; border-left: 4px solid var(--add); background: var(--add-bg); border-radius: var(--radius-sm); padding: var(--sp-2) var(--sp-3); font-size: var(--fs-md) !important; line-height: 1.55 !important; }
.sg-calm strong { color: var(--add); }
@media (max-width: 760px) { .sg-demo__body { grid-template-columns: 1fr; } .sg-out li { grid-template-columns: 1fr; font-size: var(--fs-md) !important; } }

/* ── 0-2 수업 지도 ── */
.smap { max-width: 1180px; gap: var(--sp-3); }
.smap-open { display: flex; flex-direction: column; gap: var(--sp-4); max-width: 900px; width: 100%;  }
.smap-open .hero h3 { font-size: var(--fs-xl); line-height: 1.3; }
.smap-open .hero p { color: var(--text-muted); }
.smap-hook {
  display: flex; flex-direction: column; gap: var(--sp-2);
  border: 1px solid var(--result); background: color-mix(in srgb, var(--result-bg) 55%, var(--surface));
  border-radius: var(--radius); padding: var(--sp-3) var(--sp-4);
}
.smap-hook__label { font-size: var(--fs-sm) !important; font-weight: 700; color: var(--result); line-height: 1.4 !important; }
.smap-hook__q { font-weight: 700; font-size: calc(1.375rem * var(--scale)) !important; line-height: 1.4 !important; }
.smap-hook__opts { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--sp-2); padding: 2px; border-radius: var(--radius); }
.smap-hook .quiz__opt { min-height: 64px; padding: var(--sp-2) var(--sp-3); font-size: var(--fs-md); border-radius: var(--radius); text-align: center; justify-content: center; }
.smap-hook .quiz__opt[data-state="mine"] { border: 2px solid var(--current); background: var(--current-bg); font-weight: 700; }
.smap-hook__note { font-size: var(--fs-sm) !important; color: var(--text-muted); line-height: 1.5 !important; }
.smap-map { display: flex; flex-direction: column; gap: var(--sp-2); }
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
.smap-count { font-size: var(--fs-xs) !important; color: var(--text-muted); }
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
.tour { max-width: 1180px; gap: var(--sp-3); }
.tour-part { display: flex; flex-direction: column; gap: var(--sp-3); max-width: 1040px; width: 100%;  }
.tour-part__cap { font-size: var(--fs-xs) !important; color: var(--text-muted); font-weight: 700; line-height: 1.4 !important; margin-bottom: calc(var(--sp-2) * -1); }
.tour-part__flash { font-size: var(--fs-xs) !important; color: var(--text-muted); line-height: 1.5 !important; display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
.tour-legend { list-style: none; margin: 0; padding: 0 !important; display: flex; flex-direction: column; gap: var(--sp-2); }
.tour-legend__row { display: grid; grid-template-columns: 11rem minmax(0, 1fr); gap: var(--sp-3); align-items: center; font-size: var(--fs-md) !important; line-height: 1.5 !important; }
.tour-legend__part { justify-self: end; font-size: calc(0.8rem * var(--scale)); }
.tour-legend__text b { color: var(--now); }

.tour-run { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(250px, 1fr); gap: var(--sp-4); align-items: start; max-width: 1180px; width: 100%;  }
.tour__side { display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0; }
.tour__explain { border: 2px solid var(--border-strong); background: var(--surface); border-radius: var(--radius); padding: var(--sp-3); display: flex; flex-direction: column; gap: 6px; min-height: 10rem; }
.tour__explain h3 { font-size: var(--fs-lg); display: flex; align-items: center; gap: var(--sp-2); margin: 0; }
.tour__explain p { margin: 0; font-size: var(--fs-md); line-height: 1.6; }
.tour__num { display: inline-grid; place-items: center; min-width: 1.6rem; height: 1.6rem; border-radius: 999px; background: var(--text); color: var(--surface); font-weight: 700; font-size: var(--fs-sm); flex: 0 0 auto; }
.tour__count { font-size: var(--fs-sm); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.tour__count[data-all="true"] { color: var(--add); font-weight: 700; }

.tour-help { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--sp-3); }
.tour-help__card { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--sp-3); align-items: start; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); padding: var(--sp-3); }
.tour-help__icon { font-size: calc(1.6rem * var(--scale)); line-height: 1; width: 2.2rem; text-align: center; }
.tour-help__card h4 { font-size: var(--fs-md) !important; margin: 0 0 2px; }
.tour-help__card p { font-size: var(--fs-sm) !important; line-height: 1.55 !important; margin: 0; }

/* 화면 모형(.tm) — 진짜 화면을 줄여 그린 상자들 */
.tm-bar {
  display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap;
  border: 1px solid var(--border-strong); border-radius: var(--radius); background: var(--surface);
  padding: 8px 10px; box-shadow: var(--shadow); font-size: calc(0.8rem * var(--scale));
}
.tm-bar--now { flex-wrap: nowrap; }
.tm-muted { color: var(--text-muted); }
.tm-chip { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--border); border-radius: 999px; padding: 2px 9px; background: var(--surface); white-space: nowrap; }
.tm-chip--pill { border-color: var(--border-strong); }
.tm-chip--blue { background: var(--current); border-color: var(--current); color: #fff; font-weight: 700; }
.tm-chip--soft { border-color: var(--current); background: var(--current-bg); }
.tm-chip--ghost { border-style: dashed; color: var(--text-muted); background: transparent; }
.tm-chip--ring { outline: 3px solid var(--now); outline-offset: 2px; }
.tm-dots { display: inline-flex; gap: 2px; }
.tm-dot { width: 7px; height: 7px; border-radius: 999px; border: 1px solid var(--text-muted); display: inline-block; }
.tm-dot.is-done { background: var(--add); border-color: var(--add); }
.tm-dot.is-on { border: 2px solid var(--current); }
.tm-bchips { display: inline-flex; align-items: center; gap: 3px; margin: 0 auto; }
.tm-bchip { display: inline-grid; place-items: center; min-width: 1.5rem; height: 1.5rem; padding: 0 6px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted); white-space: nowrap; }
.tm-bchip.is-done { border-color: var(--add); color: var(--add); background: var(--add-bg); }
.tm-bchip.is-on { background: var(--current); border-color: var(--current); color: #fff; font-weight: 700; }
.tm-now { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.tm-now__line1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tm-now__label { display: inline-block; border-radius: 999px; padding: 0 8px; background: var(--now-bg); color: var(--now); font-weight: 700; border: 1px solid var(--now); white-space: nowrap; }
.tm-now__say { font-weight: 700; font-size: 1.1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tm {
  position: relative; border: 1px solid var(--border-strong); border-radius: var(--radius); background: var(--bg);
  padding: 14px 12px 10px; display: flex; flex-direction: column; gap: 10px;
  font-size: calc(0.86rem * var(--scale)); line-height: 1.4; box-shadow: var(--shadow); min-width: 0;
}
.tm-cap { position: absolute; top: -0.7rem; right: 12px; font-size: var(--fs-xs); background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 0 8px; color: var(--text-muted); }
.tm-r {
  position: relative; min-width: 0; border: 1px solid var(--border); border-radius: 6px; background: var(--surface);
  padding: 6px 8px 5px 18px; outline: 3px solid transparent; outline-offset: 1px; transition: outline-color .2s ease, background .2s ease; cursor: pointer;
}
.tm-r.is-pick { outline-color: var(--text); background: color-mix(in srgb, var(--surface-2) 70%, var(--surface)); }
.tm-badge {
  position: absolute; top: -10px; left: -9px; z-index: 2; width: 1.7rem; height: 1.7rem; padding: 0; border-radius: 999px;
  display: grid; place-items: center; font-weight: 700; font-size: calc(0.85rem * var(--scale)); line-height: 1;
  background: var(--text); color: var(--surface); border: 2px solid var(--surface); box-shadow: var(--shadow);
}
.tm-badge:hover:not(:disabled) { background: var(--text); color: var(--surface); filter: brightness(1.25); border-color: var(--surface); }
.tm-badge[data-seen="true"] { background: var(--add); color: #fff; }
.tm-badge[data-seen="true"]:hover:not(:disabled) { background: var(--add); color: #fff; }
.tm-r.is-pick > .tm-badge { transform: scale(1.15); }
.tm-work { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.4fr); grid-template-rows: auto auto auto; gap: 10px; }
.tm-code { grid-row: span 3; display: flex; flex-direction: column; gap: 2px; }
.tm-say { display: flex; align-items: center; gap: 4px; border-color: var(--add); background: var(--add-bg); }
.tm-say__text { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tm-say__tag { font-weight: 700; color: var(--add); }
.tm-panelhead { display: flex; gap: 3px; align-items: center; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 2px; margin-bottom: 4px; flex-wrap: wrap; }
.tm-panelhead .tm-chip { font-weight: 400; padding: 0 6px; }
.tm-code__line { font-family: var(--font-code); white-space: pre; overflow: hidden; text-overflow: ellipsis; padding: 1px 3px; border-radius: 3px; border: 1px solid transparent; }
.tm-code__line.is-on { background: var(--current-bg); border-color: var(--current); color: var(--current); font-weight: 700; }
.tm-pengs { display: flex; gap: 4px; justify-content: center; padding-top: 8px; }
.tm-peng { position: relative; flex: 0 1 3.3rem; min-width: 0; text-align: center; border: 1px solid var(--border); border-radius: 4px; padding: 1px 2px; }
.tm-peng.is-on { border: 2px solid var(--current); background: var(--current-bg); }
.tm-peng.is-best { border-color: var(--result); }
.tm-peng__crown { position: absolute; top: -0.9em; left: 0; right: 0; }
.tm-vars { display: flex; gap: 6px; }
.tm-var { border: 1px solid var(--border-strong); border-radius: 4px; padding: 2px 8px; }
.tm-var b { font-family: var(--font-code); }
.tm-var.is-hot { border-color: var(--add); background: var(--add-bg); }
.tm-player { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; background: var(--surface); }
.tm-meter { display: inline-flex; align-items: center; gap: 4px; color: var(--text-muted); }
.tm-meter__track { position: relative; width: 70px; height: 6px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.tm-meter__track span { position: absolute; inset: 0 auto 0 0; width: 70%; background: var(--current); }
.tm-player__btns { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.tm-btn { border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; background: var(--surface); white-space: nowrap; }
.tm-btn--main { background: var(--current); border-color: var(--current); color: #fff; font-weight: 700; outline: 2px solid var(--now); outline-offset: 2px; }

/* 진짜 화면 부분 반짝이기 — 장에 들어오면 약 1.6초(보라 = 지금 볼 곳) */
.tour-flash { outline: 3px solid var(--now) !important; outline-offset: 3px; border-radius: var(--radius-sm); animation: tour-flash 1.6s ease-in-out; }
@keyframes tour-flash {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  25%, 75% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--now) 30%, transparent); }
  50% { box-shadow: 0 0 0 2px color-mix(in srgb, var(--now) 30%, transparent); }
}
@media (prefers-reduced-motion: reduce) { .tour-flash { animation: none; } }
@media (max-width: 1000px) {
  .tour-run { grid-template-columns: 1fr; }
  .tour-legend__row { grid-template-columns: 1fr; gap: 2px; }
  .tour-legend__part { justify-self: start; }
  .tm-bar--now { flex-wrap: wrap; }
}
@media (max-width: 640px) {
  .tm-work { grid-template-columns: 1fr; }
  .tm-code { grid-row: auto; }
}

/* ── 0-4 펭귄 표 ── */
.di { max-width: 1180px; }
.di-species { display: flex; flex-direction: column; gap: var(--sp-3); }
.di-count { display: flex; flex-direction: column; align-items: center; gap: var(--sp-3); padding: var(--sp-3) 0; max-width: 900px; width: 100%; margin: 0 auto; }
.di-count__sum { display: flex; align-items: center; justify-content: center; gap: var(--sp-3); flex-wrap: wrap; }
.di-count__term { display: flex; flex-direction: column; align-items: center; min-width: 6rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); padding: var(--sp-2) var(--sp-3); }
.di-count__term b { font-size: calc(1.75rem * var(--scale)); line-height: 1.2; font-variant-numeric: tabular-nums; }
.di-count__term small { font-size: var(--fs-sm); color: var(--text-muted); }
.di-count__term--dup { border-color: var(--warn); background: var(--warn-bg); }
.di-count__term--dup b { color: var(--warn); }
.di-count__term--total { border: 2px solid var(--current); background: var(--current-bg); }
.di-count__term--total b { color: var(--current); }
.di-count__op { font-size: var(--fs-xl); font-weight: 700; color: var(--text-muted); }
.di-count__note { font-size: var(--fs-md) !important; }
.di-count .card__meta { text-align: center; }
`;

export function ensureStartStyle() {
  if (typeof document === 'undefined' || document.getElementById(ID)) return;
  const style = document.createElement('style');
  style.id = ID;
  style.textContent = CSS;
  document.head.append(style);
}

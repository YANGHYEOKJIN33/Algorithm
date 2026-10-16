/**
 * 진입점 — 화면 부품을 붙이고, 재생기·학습 흐름·장면 무대를 잇는다.
 *
 *   맨 위 줄(topNav)      지금 어디에 있나 — 단원 · 쪽 · 🎯 · 장 칩 · 📖 · ⋯
 *   무대(sceneHost)       한 번에 장 하나 — 슬라이드(slideCard) 또는 장면
 *   지금 할 일 줄(nowBar)  할 일 한 문장과 단추 하나 — 단계 실행이면 재생 단추 묶음(controls)
 *   보라 고리(spotlight)   지금 할 곳 하나
 * 모두 학습 흐름(flow)을 구독한다. 흐름은 store(쪽·장 위치)·progress(진도)·missions(할 일)에서 만든다.
 */
import { createStore } from './state.js';
import { createPlayer } from './player.js';
import { createProgress } from './progress.js';
import { createMissions } from './missions.js';
import { createFlow } from './flow.js';
import { qs } from '../ui/dom.js';
import { mountTopNav } from '../ui/topNav.js';
import { mountNowBar } from '../ui/nowBar.js';
import { mountSpotlight } from '../ui/spotlight.js';
import { mountControls } from '../ui/controls.js';
import { mountActionCard } from '../ui/actionCard.js';
import { createCodePanel } from '../ui/codePanel.js';
import { mountSceneHost } from '../ui/sceneHost.js';
import { createGlossaryPanel } from '../ui/glossaryPanel.js';
import { createCourseDrawer } from '../ui/courseDrawer.js';

const store = createStore();
const player = createPlayer(store);
const progress = createProgress();
const missions = createMissions(progress);
const flow = createFlow({ store, progress, missions });
const glossary = createGlossaryPanel();
let host = null;
// 진도를 지우면 지금 쪽도 다시 붙인다(문제 상자·표지가 기억하던 답을 버리게)
const course = createCourseDrawer(store, progress, { flow, onReset: () => host?.remount() });

// 보기 설정(테마·글자 크기)을 문서 뿌리에 반영한다 — 부품을 그리기 전에
store.subscribe((state) => {
  const root = document.documentElement;
  if (state.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', state.theme);
  root.style.setProperty('--scale', String(state.scale));
});

mountTopNav(qs('#topnav'), { store, flow, progress, glossary, course });
mountNowBar(qs('#nowbar'), { store, flow, player, missions, progress });
mountControls(qs('.nowbar__player'), store, player);
mountActionCard(qs('#caption'), player);
const codePanel = createCodePanel(qs('#panel-code'), store);
host = mountSceneHost(store, player, codePanel, { glossary, progress, missions, flow });
mountSpotlight({ flow, store });

// 다른 쪽으로 가거나 재생 화면이 아닌 장(슬라이드 등)으로 가면 재생을 멈춘다(보이지 않는 화면이 혼자 돌지 않게)
store.subscribe((state, prev) => { if (state.tab !== prev.tab || state.mlTab !== prev.mlTab) player.pause(); });
flow.subscribe((v) => { if (v.beat.overlay || v.beat.kind !== 'work') player.pause(); });

// 🐍 파이썬 같이 보기를 켜면 → 미션 'python'
store.subscribe((state, prev) => { if (state.codeView === 'python' && prev.codeView !== 'python') missions.emit({ type: 'python' }); });

// 개발·화면 점검용(scripts/audit-ui.mjs가 쓴다)
globalThis.__lab = { store, player, progress, missions, flow };

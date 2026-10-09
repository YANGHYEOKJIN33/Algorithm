/**
 * 진입점 — 화면 부품을 붙이고, 재생기와 장면 무대를 연결한다.
 */
import { createStore } from './state.js';
import { createPlayer } from './player.js';
import { createProgress } from './progress.js';
import { createMissions } from './missions.js';
import { goPatch } from './lessons.js';
import { qs } from '../ui/dom.js';
import { mountTopbar } from '../ui/topbar.js';
import { mountLessonBar } from '../ui/lessonBar.js';
import { mountControls } from '../ui/controls.js';
import { mountActionCard } from '../ui/actionCard.js';
import { createCodePanel } from '../ui/codePanel.js';
import { mountSceneHost } from '../ui/sceneHost.js';
import { createGlossaryPanel } from '../ui/glossaryPanel.js';
import { createOnboarding } from '../ui/onboarding.js';
import { createCourseDrawer } from '../ui/courseDrawer.js';

const store = createStore();
const player = createPlayer(store);
const progress = createProgress();
const missions = createMissions(progress);
const glossary = createGlossaryPanel();
let host = null;
// 진도를 지우면 지금 쪽도 다시 붙인다(문제 상자·표지가 기억하던 답을 버리게)
const course = createCourseDrawer(store, progress, { onReset: () => host?.remount() });
const onboarding = createOnboarding({ onTour: () => store.set(goPatch('start', 'tour')) });

mountTopbar(qs('#topbar'), store, { progress, onHelp: onboarding.open, onGlossary: () => glossary.open(), onCourse: course.open });
mountLessonBar(qs('#lessonbar'), store, { progress, missions, player, glossary });
mountControls(qs('#controlbar'), store, player);
mountActionCard(qs('#actionbar'), player);
const codePanel = createCodePanel(qs('#panel-code'), store);
host = mountSceneHost(store, player, codePanel, { glossary, progress, missions });

// 보기 설정(테마·글자 크기)을 문서 뿌리에 반영한다
store.subscribe((state) => {
  const root = document.documentElement;
  if (state.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', state.theme);
  root.style.setProperty('--scale', String(state.scale));
});

// 다른 쪽으로 가면 재생을 멈춘다(보이지 않는 화면이 혼자 돌지 않게)
store.subscribe((state, prev) => { if (state.tab !== prev.tab || state.mlTab !== prev.mlTab) player.pause(); });

// 🐍 파이썬 같이 보기를 켜면 → 미션 'python'
store.subscribe((state, prev) => { if (state.codeView === 'python' && prev.codeView !== 'python') missions.emit({ type: 'python' }); });

onboarding.maybeShow();

// 개발 중 확인용
globalThis.__lab = { store, player, progress, missions };

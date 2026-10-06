/**
 * 진입점 — 화면 부품을 붙이고, 재생기와 장면 무대를 연결한다.
 */
import { createStore } from './state.js';
import { createPlayer } from './player.js';
import { qs } from '../ui/dom.js';
import { mountTopbar } from '../ui/topbar.js';
import { mountLessonBar } from '../ui/lessonBar.js';
import { mountControls } from '../ui/controls.js';
import { mountActionCard } from '../ui/actionCard.js';
import { createCodePanel } from '../ui/codePanel.js';
import { mountSceneHost } from '../ui/sceneHost.js';
import { createGlossaryPanel } from '../ui/glossaryPanel.js';
import { createOnboarding } from '../ui/onboarding.js';

const store = createStore();
const player = createPlayer(store);
const glossary = createGlossaryPanel();
const onboarding = createOnboarding();

mountTopbar(qs('#topbar'), store, { onHelp: onboarding.open, onGlossary: () => glossary.open() });
mountLessonBar(qs('#lessonbar'), store);
mountControls(qs('#controlbar'), store, player);
mountActionCard(qs('#actionbar'), player);
const codePanel = createCodePanel(qs('#panel-code'), store);
mountSceneHost(store, player, codePanel, { glossary });

// 보기 설정(테마·글자 크기)을 문서 뿌리에 반영한다
store.subscribe((state) => {
  const root = document.documentElement;
  if (state.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', state.theme);
  root.style.setProperty('--scale', String(state.scale));
});

// 다른 쪽으로 가면 재생을 멈춘다(보이지 않는 화면이 혼자 돌지 않게)
store.subscribe((state, prev) => { if (state.tab !== prev.tab || state.mlTab !== prev.mlTab) player.pause(); });

onboarding.maybeShow();

// 개발 중 확인용
globalThis.__lab = { store, player };

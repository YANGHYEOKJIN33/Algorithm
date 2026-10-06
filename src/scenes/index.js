/**
 * 장면 목록 — 쪽(lessons.js)의 scene 이름 → 장면 정의.
 *   step 장면: { kind:'step', pseudo, python, notebook, frames(ctx), mount(slots, ctx) → { render(view) } }
 *   view 장면: { kind:'view', mount(root, ctx) → { destroy? } }
 * 새 수업을 더할 때는 장면 파일 하나를 만들고 여기에 이름을 더하면 된다.
 */
import { el, fill } from '../ui/dom.js';
import { START_SCENES } from './start.js';
import { COLLECT_SCENES } from './collect.js';
import { INSPECT_SCENES } from './inspect.js';
import { PREP_SCENES } from './prep.js';
import { READY_SCENES } from './ready.js';
import { KNN_SCENES } from './knn.js';
import { TREE_SCENES } from './tree.js';
import { LINREG_SCENES } from './linreg.js';
import { KMEANS_SCENES } from './kmeans.js';
import { CONCEPT_SCENES } from './concepts.js';
import { PROJECT_SCENES } from './project.js';
import { PYTHON_SCENE } from './python.js';

const SCENES = {
  ...START_SCENES,
  ...COLLECT_SCENES,
  ...INSPECT_SCENES,
  ...PREP_SCENES,
  ...READY_SCENES,
  ...KNN_SCENES,
  ...TREE_SCENES,
  ...LINREG_SCENES,
  ...KMEANS_SCENES,
  ...CONCEPT_SCENES,
  ...PROJECT_SCENES,
  ...PYTHON_SCENE,
};

const missing = (name) => ({
  kind: 'view',
  mount(root) { fill(root, el('div.placeholder', {}, `준비 중인 화면이에요: ${name}`)); return {}; },
});

export function getScene(name) {
  if (name.startsWith('python:') && SCENES.python) return SCENES.python(name.slice(7));
  return SCENES[name] ?? missing(name);
}

export function sceneNames() { return Object.keys(SCENES); }

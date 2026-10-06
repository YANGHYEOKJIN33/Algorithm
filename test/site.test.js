/** 사이트 구성 — 모든 쪽이 있는 장면을 가리키고, 만들어 둔 파일이 원본과 같은지 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { allPages, TABS, currentLesson, goPatch } from '../src/app/lessons.js';
import { NOTEBOOKS } from '../src/app/notebooks.js';
import { GLOSSARY } from '../src/app/glossary.js';
import { QUIZ } from '../src/app/quiz.js';
import { allFiles, cleanRecords, mergeParts, UNLABELED } from '../scripts/build.mjs';

/* 장면 정의는 화면(DOM) 코드라 Node에서 불러오지 않는다 — 장면 이름만 소스에서 읽어 견준다 */
const sceneSrc = ['start', 'collect', 'inspect', 'prep', 'ready', 'knn', 'tree', 'linreg', 'kmeans', 'concepts', 'project']
  .map((n) => readFileSync(new URL(`../src/scenes/${n}.js`, import.meta.url), 'utf8')).join('\n');
const exported = new Set([...sceneSrc.matchAll(/export const \w+_SCENES = \{([\s\S]*?)\};/g)]
  .flatMap((m) => [...m[1].matchAll(/(?:^|[{,\s])(\w+)(?=\s*[:,]|\s*$)/g)].map((k) => k[1])));

test('모든 쪽은 제목·배울 것·해 볼 것·장면을 가진다', () => {
  const pages = allPages();
  assert.ok(pages.length >= 40, `쪽 수 ${pages.length}`);
  for (const p of pages) {
    assert.ok(p.title && p.goal && p.todo && p.scene, `${p.tab}/${p.id}`);
    if (p.scene.startsWith('python:')) {
      assert.ok(NOTEBOOKS.some((n) => n.id === p.scene.slice(7)), `노트북 없음: ${p.scene}`);
    } else {
      assert.ok(exported.has(p.scene), `장면 없음: ${p.scene}`);
    }
  }
});

test('탭마다 쪽 위치를 따로 기억하고, 범위를 벗어나지 않는다', () => {
  const st = { tab: 'inspect', 'step:inspect': 99 };
  const { index, steps, key } = currentLesson(st);
  assert.equal(key, 'step:inspect');
  assert.equal(index, steps.length - 1);
  const ml = currentLesson({ tab: 'ml', mlTab: 'tree' });
  assert.equal(ml.key, 'step:ml:tree');
  assert.deepEqual(goPatch('ml', 'step', 'knn'), { tab: 'ml', mlTab: 'knn', 'step:ml:knn': 1 });
});

test('수업 순서 탭 7개 — 수집 → 가공 → 전처리 → 학습 준비 → 기계학습 → 프로젝트', () => {
  assert.deepEqual(TABS.map((t) => t.id), ['start', 'collect', 'inspect', 'prep', 'ready', 'ml', 'project']);
});

test('파이썬 실습 쪽이 탭마다 있다(수업 중간에 파이썬 코드를 준다)', () => {
  const py = allPages().filter((p) => p.scene.startsWith('python:')).map((p) => p.scene.slice(7));
  for (const id of ['01_web_crawling', '02_missing_outlier', '03_preprocessing', '04_merge_split', '05_knn', '06_decision_tree', '07_linear_regression', '08_kmeans']) {
    assert.ok(py.includes(id), id);
  }
});

test('만들어 둔 파일(연습 사이트·CSV·노트북)이 지금 원본과 같다 — 다르면 npm run build', () => {
  for (const [rel, content] of Object.entries(allFiles())) {
    const path = new URL(`../${rel}`, import.meta.url);
    assert.ok(existsSync(path), `${rel}이 없다`);
    assert.equal(readFileSync(path, 'utf8'), content, `${rel}이 원본과 다르다`);
  }
});

test('노트북은 올바른 nbformat 4 JSON이다', () => {
  for (const nb of NOTEBOOKS) {
    const json = JSON.parse(readFileSync(new URL(`../notebooks/${nb.id}.ipynb`, import.meta.url), 'utf8'));
    assert.equal(json.nbformat, 4);
    assert.ok(json.cells.some((c) => c.cell_type === 'code'));
    for (const c of json.cells) assert.ok(Array.isArray(c.source));
  }
});

test('전처리 끝난 데이터 — 341마리, 빈칸 없음, 이상치·겹친 행 없음', () => {
  const rows = cleanRecords();
  assert.equal(rows.length, 341);
  for (const r of rows) for (const v of Object.values(r)) assert.ok(v !== null && v !== undefined);
  assert.ok(rows.every((r) => r.몸무게 < 8000));
  assert.equal(new Set(rows.map((r) => r.번호)).size, 341);
  const { measure, label } = mergeParts();
  assert.equal(measure.length, 341);
  assert.equal(label.length, 341 - UNLABELED.length);
});

test('용어 사전·퀴즈 자료가 비어 있지 않다', () => {
  assert.ok(GLOSSARY.flatMap((g) => g.items).length >= 50);
  for (const q of QUIZ) assert.ok(q.answer >= 0 && q.answer < q.options.length && q.why);
});

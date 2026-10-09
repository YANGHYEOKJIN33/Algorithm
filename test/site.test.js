/** 사이트 구성 — 모든 쪽이 있는 장면을 가리키고, 만들어 둔 파일이 원본과 같은지 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { allPages, TABS, currentLesson, goPatch, unitPages } from '../src/app/lessons.js';
import { NOTEBOOKS } from '../src/app/notebooks.js';
import { GLOSSARY } from '../src/app/glossary.js';
import { QUIZ } from '../src/app/quiz.js';
import { allFiles, cleanRecords, mergeParts, UNLABELED } from '../scripts/build.mjs';
import { courseProblems } from '../scripts/check-course.mjs';

test('수업 내용이 약속을 지킨다 — 🎯 목표(~할 수 있다)·✋ 할 일(이룰 수 있는 확인 낱말)·학습 요소·단원 표지/정리 자료', () => {
  assert.ok(allPages().length >= 50, `쪽 수 ${allPages().length}`);
  const problems = courseProblems();
  assert.deepEqual(problems, [], `node scripts/check-course.mjs 로 자세히 보기\n${problems.slice(0, 30).join('\n')}`);
});

test('탭마다 쪽 위치를 따로 기억하고, 범위를 벗어나지 않는다', () => {
  const st = { tab: 'inspect', 'step:inspect': 99 };
  const { index, steps, key } = currentLesson(st);
  assert.equal(key, 'step:inspect');
  assert.equal(index, steps.length - 1);
  const ml = currentLesson({ tab: 'ml', mlTab: 'tree' });
  assert.equal(ml.key, 'step:ml:tree');
  assert.deepEqual(goPatch('ml', 'step', 'knn'), { tab: 'ml', mlTab: 'knn', 'step:ml:knn': 1 });
  // 단원 표지는 맨 앞, 정리는 맨 뒤(기계학습은 '단원 정리' 하위 탭)
  assert.equal(currentLesson({ tab: 'inspect' }).steps[0].auto, 'cover');
  assert.equal(currentLesson({ tab: 'inspect' }).steps.at(-1).auto, 'review');
  assert.equal(currentLesson({ tab: 'ml', mlTab: 'concept' }).steps[0].auto, 'cover');
  assert.equal(currentLesson({ tab: 'ml', mlTab: 'review' }).steps[0].auto, 'review');
  assert.equal(unitPages(TABS.find((t) => t.id === 'inspect'))[1].label, '2-1');
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

test('노트북 셀이 무언가를 보여 주면 "실행 결과 예시"(out)가 있다 — Colab을 못 쓰는 학생도 따라오게', () => {
  const missing = [];
  for (const nb of NOTEBOOKS) {
    let n = 0;
    for (const c of nb.cells) {
      if (c.type === 'md') continue;
      n += 1;
      if (/koreanize|글꼴/.test(c.code) || c.out) continue;
      const lines = c.code.split('\n').map((l) => l.replace(/#.*$/, '').trimEnd()).filter((l) => l.trim());
      const last = lines.at(-1) ?? '';
      const topPrint = lines.some((l) => /^print\(/.test(l));
      const expr = last && !/^\s/.test(last) && !/^(import|from|for|if|def|with|try|while)\b/.test(last)
        && !/^[\w\[\]'",. ]+\s*[-+*/]?=[^=]/.test(last) && !/^plt\.|\.plot\(|show\(\)|plot_tree|^!/.test(last);
      if (topPrint || expr) missing.push(`${nb.id} 코드 셀 ${n}: ${last.slice(0, 50)}`);
    }
  }
  assert.deepEqual(missing, []);
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
  // 판정표도 341마리를 모두 담는다 — 번호로 합치면 341줄 그대로(4단원 표지·4-3·Colab 04와 같은 흐름)
  const { measure, label } = mergeParts();
  assert.deepEqual(UNLABELED, []);
  assert.equal(measure.length, 341);
  assert.equal(label.length, 341);
  assert.deepEqual([...label.map((r) => r.번호)].sort((a, b) => a - b), measure.map((r) => r.번호).sort((a, b) => a - b));
  assert.notDeepEqual(label.map((r) => r.번호), measure.map((r) => r.번호), '판정표는 순서가 섞여 있다');
});

test('용어 사전·퀴즈 자료가 비어 있지 않다', () => {
  assert.ok(GLOSSARY.flatMap((g) => g.items).length >= 50);
  for (const q of QUIZ) assert.ok(q.answer >= 0 && q.answer < q.options.length && q.why);
});

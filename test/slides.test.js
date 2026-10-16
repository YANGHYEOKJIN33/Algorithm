/** 무대와 슬라이드의 순수 함수 — 한 문제씩 넘기기 · Colab 섹션 나누기 · 장 덩어리 거르개 · 도입 머리 줄 (FINAL_SPEC §2.2·§2.6·§2.7·§5.1) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TABS, unitPages } from '../src/app/lessons.js';
import { pageBeats, deckKind } from '../src/app/beats.js';
import { getNotebook } from '../src/app/notebooks.js';
import { nextQuestion, firstOpenQuestion } from '../src/ui/quizBox.js';
import { splitSections } from '../src/scenes/python.js';
import { beatFilterCss } from '../src/ui/sceneHost.js';
import { lookBackBeat, introKicker, introMeta, NOW_RULE_LINE } from '../src/ui/slideCard.js';

const all = TABS.flatMap((tab) => unitPages(tab));

test('한 문제씩: 아직 못 맞힌 첫 문제에서 연다(다 맞혔으면 첫 문제)', () => {
  assert.equal(firstOpenQuestion([null, null, null], [0, 1, 2]), 0);
  assert.equal(firstOpenQuestion([0, 0, null], [0, 1, 2]), 1);
  assert.equal(firstOpenQuestion([0, 1, 2], [0, 1, 2]), 0);
});

test('한 문제씩: 맞히거나 두 번 틀려야 다음 문제로 갈 수 있다', () => {
  const answers = [0, 1, 2];
  // 아직 안 풀었다
  assert.equal(nextQuestion({ picked: [null, null, null], wrongs: [0, 0, 0], answers, cur: 0 }), null);
  // 한 번 틀렸다 — 아직 정답이 열리지 않았다
  assert.equal(nextQuestion({ picked: [2, null, null], wrongs: [1, 0, 0], answers, cur: 0 }), null);
  // 두 번 틀려 정답이 열렸다 → 다음 안 푼 문제
  assert.equal(nextQuestion({ picked: [2, null, null], wrongs: [2, 0, 0], answers, cur: 0 }), 1);
  // 맞혔다 → 다음 안 푼 문제(지금 다음부터 한 바퀴)
  assert.equal(nextQuestion({ picked: [null, 1, null], wrongs: [0, 0, 0], answers, cur: 1 }), 2);
  assert.equal(nextQuestion({ picked: [null, 1, 2], wrongs: [0, 0, 0], answers, cur: 2 }), 0);
});

test('한 문제씩: 모두 한 번씩 풀고 나면 아직 못 맞힌 문제만 돈다', () => {
  const answers = [0, 1, 2, 3];
  const picked = [0, 0, 2, 0];          // 1번·3번이 틀렸다
  const wrongs = [0, 2, 0, 1];
  assert.equal(nextQuestion({ picked, wrongs, answers, cur: 2 }), 3);
  assert.equal(nextQuestion({ picked, wrongs, answers, cur: 1 }), 3);
  // 다 맞히면 더 갈 곳이 없다 → 지금 할 일 줄이 다음 장으로
  assert.equal(nextQuestion({ picked: [0, 1, 2, 3], wrongs: [0, 2, 0, 1], answers, cur: 3 }), null);
});

test('Colab 섹션은 마크다운 셀의 "## "에서 나뉘고, 셀이 빠지거나 겹치지 않는다', () => {
  const colab = all.filter((it) => deckKind(it.page) === 'colab');
  assert.equal(colab.length, 8);
  for (const it of colab) {
    const nb = getNotebook(it.page.scene.slice('python:'.length));
    assert.ok(nb, `${it.label} 노트북`);
    const secs = splitSections(nb.cells);
    assert.ok(secs.length >= 2, `${it.label} 섹션이 둘 이상`);
    assert.equal(secs.flatMap((s) => s.cells).length, nb.cells.length, `${it.label} 셀 수`);
    for (const s of secs.slice(1)) assert.match(s.cells[0].text ?? '', /^##\s/, `${it.label} "${s.heading}"는 ## 마크다운으로 시작`);
    for (const s of secs) assert.ok(s.heading.length > 0);
  }
});

test('장 덩어리 거르개 — show 목록 밖의 [data-beat]만 숨긴다', () => {
  assert.equal(beatFilterCss(null), '');
  const css = beatFilterCss(['knn-chart', 'knn-side']);
  assert.match(css, /^#panel-view\[data-beats\] \[data-beat\]:not\(\[data-beat="knn-chart"\]\):not\(\[data-beat="knn-side"\]\) \{ display: none !important; \}$/);
  assert.match(beatFilterCss(['a"b']), /data-beat="a\\"b"/);
});

test('❓ [← 그림 다시 보기]는 확인 장 앞의 마지막 할 일 장으로 간다', () => {
  for (const it of all) {
    const beats = pageBeats(it.tab, it.sub, it.page);
    const c = beats.findIndex((b) => b.kind === 'check');
    if (c < 0) continue;
    const back = lookBackBeat(beats, c);
    assert.ok(back >= 0 && back < c, `${it.label} 돌아갈 장`);
    assert.equal(beats[back].overlay, false, `${it.label} 돌아갈 장은 슬라이드가 아니다`);
  }
});

test('도입 슬라이드 머리 줄·할 일 수', () => {
  const inspect = TABS.find((t) => t.id === 'inspect');
  const it = unitPages(inspect).find((x) => x.label === '2-2');
  assert.ok(it);
  assert.match(introKicker(it.tab, it.sub, it.page), /^2단원 \S+ 가공 · 2-2 · 👣 단계 실행 · 약 \d+분$/);
  assert.match(introMeta(it.page), /^✋ 할 일 \d+개 · ❓ 확인 문제 1개$/);
  assert.match(NOW_RULE_LINE, /보라 고리/);
  assert.match(NOW_RULE_LINE, /파란 단추/);
});

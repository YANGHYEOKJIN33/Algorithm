import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProgress } from '../src/app/progress.js';
import { TABS } from '../src/app/lessons.js';
import { firstScore, askScore, unitQuizScore, recordText, scoreText } from '../src/app/record.js';
import { pageKey } from '../src/app/progress.js';

test('처음 고른 답은 다시 골라도 바뀌지 않는다 — 찍어서 맞혀도 처음 답이 남는다', () => {
  const p = createProgress();
  p.answer('unit:inspect', 0, 0);
  p.answer('unit:inspect', 0, 1);
  p.answer('unit:inspect', 0, 2);
  assert.equal(p.answers('unit:inspect')[0], 2);
  assert.equal(p.firsts('unit:inspect')[0], 0);
  // "다시 풀기"(null)는 지금 답만 지우고 처음 답은 남긴다
  p.answer('unit:inspect', 0, null);
  assert.equal(p.firsts('unit:inspect')[0], 0);
  // 실습 점검표의 체크(참/거짓)는 처음 답으로 세지 않는다
  p.answer('nb:01_web_crawling', 0, true);
  assert.deepEqual(p.firsts('nb:01_web_crawling'), {});
});

test('학습 기록 — 단원 확인 문제와 쪽 확인 문제를 처음 답으로 센다', () => {
  const p = createProgress();
  const tab = TABS.find((t) => t.id === 'inspect');
  const quiz = tab.unit.quiz;
  // 1번은 처음에 맞히고, 2번은 틀린 뒤 맞힌다
  p.answer('unit:inspect', 0, quiz[0].answer);
  p.answer('unit:inspect', 1, (quiz[1].answer + 1) % quiz[1].options.length);
  p.answer('unit:inspect', 1, quiz[1].answer);
  assert.deepEqual(unitQuizScore(p, tab), { right: 1, tried: 2, total: quiz.length });
  assert.equal(scoreText(unitQuizScore(p, tab)), `처음에 맞힘 1/${quiz.length} (푼 문제 2)`);

  const page = tab.pages.find((pg) => pg.ask);
  p.answer(`ask:${pageKey(tab.id, null, page.id)}`, 0, page.ask.answer);
  const a = askScore(p, tab);
  assert.equal(a.right, 1);
  assert.equal(a.tried, 1);
  assert.equal(a.total, tab.pages.filter((pg) => pg.ask).length);

  assert.deepEqual(firstScore(p, 'final', [{ answer: 0 }]), { right: 0, tried: 0, total: 1 });
  const text = recordText(p, new Date(2026, 9, 9, 10, 5));
  assert.match(text, /2026-10-09 10:05/);
  assert.match(text, /\[2단원 🔍 가공\]/);
  assert.match(text, new RegExp(`단원 확인 문제 처음에 맞힘 1/${quiz.length}`));
  for (const t of TABS) assert.ok(text.includes(`[${t.unit.no}단원 ${t.icon} ${t.label}]`), t.id);
});

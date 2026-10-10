/**
 * 📋 내 학습 기록 — 진도에서 "처음에 맞힌 문제"와 스스로 점검을 모아 한눈에 보이게 한다.
 * 확인 문제는 맞힐 때까지 다시 고를 수 있어서 ✅만으로는 이해했는지 알 수 없다.
 * 그래서 처음 고른 답(progress.firsts)을 따로 세어, 학생이 복사해 학급 설문지·과제 칸에 붙여 넣게 한다.
 */
import { TABS, unitPages } from './lessons.js';
import { pageKey } from './progress.js';
import { unitProgress, canDoDone } from './missions.js';
import { QUIZ } from './quiz.js';

/** 6-3 이해 확인의 저장 열쇠 — 문제를 바꾸면 숫자를 올려, 예전 답이 새 문제에 붙지 않게 한다 */
export const FINAL_KEY = 'final:3';

/** 문제 묶음 하나를 처음 고른 답으로 센다 — { right, tried, total } */
export function firstScore(progress, quizKey, questions) {
  const first = progress.firsts(quizKey);
  let right = 0;
  let tried = 0;
  questions.forEach((q, i) => {
    if (first[i] === undefined) return;
    tried += 1;
    if (first[i] === q.answer) right += 1;
  });
  return { right, tried, total: questions.length };
}

/** 단원 안 쪽마다의 ❓ 확인 문제를 처음 고른 답으로 센다 */
export function askScore(progress, tab) {
  let right = 0;
  let tried = 0;
  let total = 0;
  for (const it of unitPages(tab)) {
    const ask = it.page.ask;
    if (!ask) continue;
    total += 1;
    const first = progress.firsts(`ask:${pageKey(tab.id, it.sub?.id, it.page.id)}`)[0];
    if (first === undefined) continue;
    tried += 1;
    if (first === ask.answer) right += 1;
  }
  return { right, tried, total };
}

/** 단원 확인 문제(정리 쪽) */
export function unitQuizScore(progress, tab) {
  return firstScore(progress, `unit:${tab.id}`, tab.unit.quiz ?? []);
}

/** '처음에 맞힘 2/3' — 아직 안 푼 문제가 있으면 '(푼 문제 2)'를 붙인다 */
export function scoreText({ right, tried, total }) {
  if (!total) return '';
  if (!tried) return `아직 안 풂 (0/${total})`;
  return `처음에 맞힘 ${right}/${total}${tried < total ? ` (푼 문제 ${tried})` : ''}`;
}

/** 한 줄 요약용 — '4/5', 안 푼 문제가 있으면 '2/3(푼 2)', 하나도 안 풀었으면 '–/3' */
function shortScore({ right, tried, total }) {
  if (!tried) return `–/${total}`;
  return `${right}/${total}${tried < total ? `(푼 ${tried})` : ''}`;
}

const unitName = (t) => `${t.unit.no}단원 ${t.icon} ${t.label}`;

/**
 * 복사해 붙여 넣을 글 — 학급 설문지의 긴 답 칸 하나에 들어가게 짧게.
 * 맨 위에 단원마다 한 줄(진도 · 처음에 맞힌 수 · 스스로 점검), 그 아래에 "아직"인 목표만 적는다.
 */
export function recordText(progress, now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const when = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  let done = 0;
  let total = 0;
  const lines = [];
  const notYet = [];
  for (const t of TABS) {
    const pr = unitProgress(progress, t);
    done += pr.done;
    total += pr.total;
    const a = askScore(progress, t);
    const q = unitQuizScore(progress, t);
    const self = progress.self(t.id);
    const canDo = t.unit.canDo ?? [];
    const yes = canDo.filter((_, i) => self[i] === 'yes').length;
    const no = canDo.filter((_, i) => self[i] === 'no').length;
    lines.push(`${unitName(t)} | 쪽 ${pr.done}/${pr.total} | 쪽❓ ${shortScore(a)} | 단원❓ ${shortScore(q)} | 점검 😀${yes} 🤔${no}${yes + no < canDo.length ? ` 안함${canDo.length - yes - no}` : ''}`);
    canDo.forEach((c, i) => {
      const pagesOk = canDoDone(progress, t, c);
      if (self[i] === 'no' || (self[i] === 'yes' && !pagesOk)) {
        notYet.push(`- ${t.unit.no}단원: ${c.text} (${self[i] === 'no' ? '스스로 🤔 아직' : '😀 골랐지만 쪽 미완료'})`);
      }
    });
  }
  const fin = firstScore(progress, FINAL_KEY, QUIZ);
  return [
    `📋 펭귄 데이터로 배우는 인공지능 — 내 학습 기록 (${when})`,
    `전체 쪽 ${done}/${total} · 6-3 이해 확인 처음에 맞힘 ${shortScore(fin)}`,
    '읽는 법: 쪽 = ✋ 할 일을 모두 한 쪽 수 · ❓ 점수 = 처음 고른 답이 맞은 수(–는 아직 안 풂) · 점검 = 할 수 있어요 스스로 점검',
    '',
    ...lines,
    '',
    notYet.length ? '더 볼 목표:' : '더 볼 목표: 없음',
    ...notYet,
  ].join('\n');
}

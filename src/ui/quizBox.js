/**
 * 문제 상자 — 보기를 고르면 바로 정답·이유를 보여 준다(틀려도 다시 고를 수 있다).
 * questions: [{ q, options: [..], answer: index, why, page? }]
 *
 * 고를 때마다 'quiz:answer' 사건({ answered, right, total })을 올려 보낸다 → 미션 'quiz'·'right:N'
 * 선택: saved(이미 고른 답 { 번호: 보기 }) · onPick(번호, 보기) — 진도에 저장할 때
 *       onReview(page) — 틀린 문제 아래 "📖 그 쪽 다시 보기" 단추
 */
import { el, fill } from './dom.js';

export function quizBox(questions, { row = false, title = null, saved = null, onPick = null, onReview = null } = {}) {
  const picked = questions.map((_, i) => (saved && saved[i] !== undefined ? saved[i] : null));
  const score = el('span.quiz__score');
  const bar = el('span.quiz__bar', { 'aria-hidden': 'true' });
  const list = el('div.quiz');

  function draw() {
    const answered = picked.filter((p) => p !== null).length;
    const right = picked.filter((p, i) => p === questions[i].answer).length;
    score.textContent = answered ? `푼 문제 ${answered} / ${questions.length} · 맞힌 문제 ${right}` : `${questions.length}문제`;
    bar.style.setProperty('--p', String(answered / questions.length));
    fill(list, questions.map((qq, qi) => el('div.quiz__q', { 'data-state': picked[qi] === null ? null : picked[qi] === qq.answer ? 'right' : 'wrong' },
      el('div.quiz__ask', {}, `Q${qi + 1}. ${qq.q}`),
      el(`div.quiz__opts${row ? '.quiz__opts--row' : ''}`, {}, qq.options.map((op, oi) => {
        let state = null;
        if (picked[qi] !== null) {
          if (oi === qq.answer) state = 'right';
          else if (oi === picked[qi]) state = 'wrong';
        }
        return el('button.quiz__opt', {
          type: 'button', 'data-state': state, 'aria-pressed': String(picked[qi] === oi),
          onclick: (e) => {
            picked[qi] = oi;
            onPick?.(qi, oi);
            draw();
            const detail = {
              answered: picked.filter((p) => p !== null).length,
              right: picked.filter((p, i) => p === questions[i].answer).length,
              total: questions.length,
            };
            (e.currentTarget.isConnected ? e.currentTarget : list).dispatchEvent(new CustomEvent('quiz:answer', { bubbles: true, detail }));
          },
        }, op);
      })),
      picked[qi] !== null ? el(`p.quiz__why.callout${picked[qi] === qq.answer ? '.callout--add' : '.callout--warn'}`, {},
        picked[qi] === qq.answer ? '⭕ 맞았어요! ' : '❌ 다시 생각해 봐요. ', qq.why,
        picked[qi] !== qq.answer && qq.page && onReview
          ? el('button.pill.pill--sm.quiz__review', { type: 'button', onclick: () => onReview(qq.page) }, '📖 그 쪽 다시 보기 →')
          : null) : null)));
  }
  draw();
  return el('section.quizwrap', {}, el('div.quizwrap__head', {}, title ? el('h3', {}, title) : null, score, bar), list);
}

/**
 * 문제 상자 — 보기를 고르면 바로 정답·이유를 보여 준다(틀려도 다시 고를 수 있다).
 * questions: [{ q, options: [..], answer: index, why }]
 */
import { el, fill } from './dom.js';

export function quizBox(questions, { row = false, title = null } = {}) {
  const picked = questions.map(() => null);
  const score = el('span.quiz__score');
  const list = el('div.quiz');

  function draw() {
    const answered = picked.filter((p) => p !== null).length;
    const right = picked.filter((p, i) => p === questions[i].answer).length;
    score.textContent = answered ? `맞힌 문제 ${right} / ${questions.length}` : `${questions.length}문제`;
    fill(list, questions.map((qq, qi) => el('div.quiz__q', {},
      el('div.quiz__ask', {}, `Q${qi + 1}. ${qq.q}`),
      el(`div.quiz__opts${row ? '.quiz__opts--row' : ''}`, {}, qq.options.map((op, oi) => {
        let state = null;
        if (picked[qi] !== null) {
          if (oi === qq.answer) state = 'right';
          else if (oi === picked[qi]) state = 'wrong';
        }
        return el('button.quiz__opt', {
          type: 'button', 'data-state': state, 'aria-pressed': String(picked[qi] === oi),
          onclick: () => { picked[qi] = oi; draw(); },
        }, op);
      })),
      picked[qi] !== null ? el(`p.quiz__why.callout${picked[qi] === qq.answer ? '.callout--add' : '.callout--warn'}`, {},
        picked[qi] === qq.answer ? '⭕ 맞았어요! ' : '❌ 다시 생각해 봐요. ', qq.why) : null)));
  }
  draw();
  return el('section.quizwrap', {}, el('div.quizwrap__head', {}, title ? el('h3', {}, title) : null, score), list);
}

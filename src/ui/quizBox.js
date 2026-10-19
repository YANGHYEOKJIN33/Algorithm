/**
 * 문제 상자 — 보기를 고르면 맞았는지 바로 알려 준다(틀려도 다시 고를 수 있다).
 * questions: [{ q, options: [..], answer: index, why, page? }]
 *
 * 틀리면 정답을 바로 보여 주지 않는다 — "다시 생각해 봐요"와 [그 쪽 다시 보기]만. 맞히거나 두 번 틀리면 정답·이유를 연다.
 * 고를 때마다 'quiz:answer' 사건({ answered, right, total })을 올려 보낸다 → 미션 'quiz'·'right:N'
 * 선택: saved(이미 고른 답 { 번호: 보기 }) · onPick(번호, 보기) — 진도에 저장할 때
 *       firsts(처음 고른 답 { 번호: 보기 }) — 주면 점수 줄에 "처음에 맞힘 n"을 함께 보인다(📋 학습 기록과 같은 수)
 *       onReview(page) — 틀린 문제 아래 "📖 그 쪽 다시 보기" 단추
 *
 * 한 문제씩 보기(one: true, FINAL_SPEC §2.9·§2.10·§5.1)
 *   ref(q, i) → 노드를 주면 왼쪽에 근거(그 문제를 배운 쪽의 핵심), 오른쪽에 문제를 놓는다(refCard.js)
 *   "Q 2 / 3"과 점(●)으로 지금 문제만 보인다. tagOf(q, i)를 주면 앞에 꼬리표("[2 가공] Q 3 / 10").
 *   돌려주는 section에 data-pager와 .pager가 붙는다 — 지금 할 일 줄의 [다음 문제 →]·[← 이전 문제]가 이것을 넘긴다.
 *     pager = { label, index, total, stats, canNext(), canPrev(), next(), prev(), onChange(fn) }
 *   · 아직 맞히지 못한 첫 문제에서 연다(다 맞혔으면 첫 문제).
 *   · 지금 문제를 맞히거나 두 번 틀려 정답이 열리면 canNext()가 참이 된다.
 *   · 모든 문제를 한 번씩 풀고 나면 next()는 아직 못 맞힌 문제만 돈다. 다 맞히면 canNext()는 거짓 → 다음 장으로.
 */
import { el, fill } from './dom.js';

/**
 * 한 문제씩 보기의 다음 문제 번호(없으면 null) — 화면과 떨어진 순수 함수(test/slides.test.js)
 *   st = { picked: [보기|null], wrongs: [틀린 횟수], answers: [정답], cur }
 */
export function nextQuestion({ picked, wrongs, answers, cur }) {
  const n = answers.length;
  const right = (i) => picked[i] !== null && picked[i] !== undefined && picked[i] === answers[i];
  const open = right(cur) || (wrongs[cur] ?? 0) >= 2;
  if (!open) return null;
  const allAnswered = picked.every((p) => p !== null && p !== undefined);
  // 아직 안 푼 문제가 있으면 그것부터, 다 풀었으면 아직 못 맞힌 문제만 — 지금 문제 다음부터 한 바퀴
  const want = allAnswered ? (i) => !right(i) : (i) => picked[i] === null || picked[i] === undefined;
  for (let k = 1; k < n; k += 1) {
    const i = (cur + k) % n;
    if (want(i)) return i;
  }
  return null;
}

/** 한 문제씩 보기를 열 문제 — 아직 맞히지 못한 첫 문제(다 맞혔으면 0) */
export function firstOpenQuestion(picked, answers) {
  const i = answers.findIndex((a, k) => picked[k] !== a);
  return i < 0 ? 0 : i;
}

/** 보기 넷이 모두 짧으면 2×2로 */
const shortOptions = (opts) => opts.length === 4 && opts.every((o) => String(o).length <= 16);

export function quizBox(questions, {
  row = false, title = null, saved = null, firsts = null, onPick = null, onReview = null,
  one = false, tagOf = null, ref = null,
} = {}) {
  const picked = questions.map((_, i) => (saved && saved[i] !== undefined && saved[i] !== null ? saved[i] : null));
  const first = firsts ? questions.map((_, i) => (firsts[i] !== undefined ? firsts[i] : null)) : null;
  // 문제마다 틀린 횟수 — 저장된 답이 틀린 것이면 한 번 틀린 것으로 시작
  const wrongs = questions.map((qq, i) => (picked[i] !== null && picked[i] !== qq.answer ? 1 : 0));
  const answers = questions.map((qq) => qq.answer);
  const score = el('span.quiz__score');
  const bar = el('span.quiz__bar', { 'aria-hidden': 'true' });
  const list = el('div.quiz');
  const subs = new Set();
  let cur = one ? firstOpenQuestion(picked, answers) : 0;

  const stats = () => ({
    answered: picked.filter((p) => p !== null).length,
    right: picked.filter((p, i) => p === questions[i].answer).length,
    total: questions.length,
  });
  const changed = () => { for (const fn of subs) { try { fn(pager); } catch { /* 듣는 쪽의 잘못은 무시 */ } } };

  function pick(e, qi, oi) {
    const qq = questions[qi];
    if (picked[qi] === oi) return;
    picked[qi] = oi;
    if (first && first[qi] === null) first[qi] = oi;
    if (oi !== qq.answer) wrongs[qi] += 1;
    onPick?.(qi, oi);
    draw();
    const target = e.currentTarget?.isConnected ? e.currentTarget : list;
    target.dispatchEvent(new CustomEvent('quiz:answer', { bubbles: true, detail: stats() }));
    if (one) {
      // 다시 그린 뒤에도 같은 보기에 초점을 둔다(키보드로 푸는 학생)
      list.querySelectorAll('.quiz__opt')[oi]?.focus({ preventScroll: true });
      changed();
    }
  }

  function options(qq, qi, extraCls = '') {
    const reveal = picked[qi] === qq.answer || wrongs[qi] >= 2;
    const cls = one
      ? (row ? '.quiz__opts--row' : shortOptions(qq.options) ? '.quiz__opts--grid' : '')
      : (row ? '.quiz__opts--row' : '');
    return el(`div.quiz__opts${cls}${extraCls}`, { role: 'group', 'aria-label': `Q${qi + 1}의 보기` }, qq.options.map((op, oi) => {
      let state = null;
      if (picked[qi] !== null) {
        if (oi === qq.answer && reveal) state = 'right';
        else if (oi === picked[qi] && picked[qi] !== qq.answer) state = 'wrong';
      }
      return el('button.quiz__opt', {
        type: 'button', 'data-state': state, 'aria-pressed': String(picked[qi] === oi),
        onclick: (e) => pick(e, qi, oi),
      }, op);
    }));
  }

  function feedback(qq, qi) {
    if (picked[qi] === null) return null;
    const ok = picked[qi] === qq.answer;
    return el(`p.quiz__why.callout${ok ? '.callout--add' : '.callout--warn'}`, { 'aria-live': one ? 'polite' : null },
      ok ? ['⭕ 맞았어요! ', qq.why]
        : wrongs[qi] >= 2 ? ['❌ 정답은 초록 칸이에요. ', qq.why]
          : ref ? '❌ 아니에요. 📖 근거를 다시 읽고 다른 보기를 골라 보세요.' : '❌ 아니에요. 한 번 더 생각해 보고 다른 보기를 골라 보세요.',
      !ok && !ref && qq.page && onReview
        ? el('button.pill.pill--sm.quiz__review', { type: 'button', onclick: () => onReview(qq.page) }, '📖 그 쪽 다시 보기 →')
        : null);
  }

  /* ── 모든 문제를 한꺼번에(예전 모양) ── */
  function drawAll() {
    const s = stats();
    const firstRight = first ? first.filter((p, i) => p === questions[i].answer).length : 0;
    score.textContent = s.answered
      ? `푼 문제 ${s.answered} / ${questions.length} · 맞힌 문제 ${s.right}${first ? ` · 처음에 맞힘 ${firstRight}` : ''}`
      : `${questions.length}문제${first ? ' · 처음 고른 답이 기록돼요' : ''}`;
    bar.style.setProperty('--p', String(s.answered / questions.length));
    fill(list, questions.map((qq, qi) => el('div.quiz__q', { 'data-state': picked[qi] === null ? null : picked[qi] === qq.answer ? 'right' : 'wrong' },
      el('div.quiz__ask', {}, `Q${qi + 1}. ${qq.q}`),
      options(qq, qi),
      feedback(qq, qi))));
  }

  /* ── 한 문제씩 ── */
  const kicker = el('p.quiz__kicker');
  const refBox = one && ref ? el('div.quiz__refbox') : null;
  const dots = el('span.quiz__dots', { 'aria-hidden': 'true' });
  function drawOne() {
    const qq = questions[cur];
    const n = questions.length;
    fill(kicker,
      tagOf ? el('span.quiz__tag', {}, tagOf(qq, cur)) : null,
      el('strong.quiz__no', {}, `Q ${cur + 1} / ${n}`),
      title ? el('span.quiz__title', {}, title) : null);
    fill(dots, questions.map((q2, i) => el('span.quiz__dot', {
      'data-state': picked[i] === null ? null : picked[i] === q2.answer ? 'right' : 'wrong',
      'data-current': i === cur ? 'true' : null,
    })));
    const state = picked[cur] === null ? null : picked[cur] === qq.answer ? 'right' : 'wrong';
    fill(list, el('div.quiz__q.quiz__q--one', { 'data-state': state, 'data-q': String(cur) },
      el('div.quiz__ask', {}, qq.q),
      options(qq, cur),
      feedback(qq, cur)));
    // 왼쪽 근거 — 문제가 바뀔 때만 다시 그린다(펼친 설명·스크롤이 답을 고를 때마다 닫히지 않게)
    if (refBox && refBox.dataset.q !== String(cur)) {
      refBox.dataset.q = String(cur);
      fill(refBox, ref(qq, cur));
      refBox.scrollTop = 0;
    }
  }

  function draw() { if (one) drawOne(); else drawAll(); }

  const pager = {
    get label() { return `문제 ${cur + 1} / ${questions.length}`; },
    get index() { return cur; },
    get total() { return questions.length; },
    get stats() { return stats(); },
    nextLabel: '다음 문제 →',
    canNext: () => nextQuestion({ picked, wrongs, answers, cur }) !== null,
    canPrev: () => cur > 0,
    next() {
      const to = nextQuestion({ picked, wrongs, answers, cur });
      if (to === null) return false;
      cur = to;
      draw();
      changed();
      return true;
    },
    prev() {
      if (cur <= 0) return false;
      cur -= 1;
      draw();
      changed();
      return true;
    },
    /** 문제 번호로 바로(정리·결과 장의 "다시 풀기") */
    go(i) {
      const to = Math.max(0, Math.min(questions.length - 1, Number(i) | 0));
      if (to === cur) return;
      cur = to;
      draw();
      changed();
    },
    onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
  };

  draw();
  if (!one) return el('section.quizwrap', {}, el('div.quizwrap__head', {}, title ? el('h3', {}, title) : null, score, bar), list);

  const main = [el('div.quizwrap__head.quizwrap__head--one', {}, kicker, dots), list];
  // ref가 있으면 왼쪽에 근거, 오른쪽에 문제 — 앞 쪽으로 옮겨 가지 않고 좌우를 견주며 푼다
  const section = refBox
    ? el('section.quizwrap.quizwrap--one.quizwrap--ref', { 'data-pager': 'quiz' }, refBox, el('div.quizwrap__main', {}, ...main))
    : el('section.quizwrap.quizwrap--one', { 'data-pager': 'quiz' }, ...main);
  section.pager = pager;
  return section;
}

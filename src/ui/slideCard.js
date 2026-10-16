/**
 * 슬라이드 — 장면 위에 겹쳐 그리는 장(#slidecard). 장면은 밑에 그대로 붙어 있다(sceneHost가 visibility·inert로 숨긴다).
 *
 *   intro 도입(§2.2)   🎯 이 쪽을 마치면 · 💡 왜 · 학습 요소 · 할 일 수     (0-1에는 보라 고리·파란 단추 한 줄)
 *   code  읽기(§2.3)   📝 이번에 따라갈 의사코드 — 모든 줄의 설명을 펼친 읽기 모드 + 📦 이 쪽의 데이터(page.setup)
 *   check ❓(§2.7)     확인 문제 하나. 처음 고른 답이 📋 학습 기록에 남는다(progress.firsts). 두 번 틀리면 정답 칸을 연다
 *   wrap  정리(§2.8)   핵심 한 줄(page.takeaway) · 🎯 목표 ✓ · 이 쪽에서 한 일 ✅/☐ [다시 하기 →] · 💡 더 알아보기
 *
 * 할 일 문장은 지금 할 일 줄에만 나온다(N1). 예외는 정리의 "이 쪽에서 한 일" 기록뿐.
 * 파란 단추도 지금 할 일 줄에만 있다(N3) — 슬라이드 안의 단추는 모두 흰 바탕(보조)이다.
 * 장이 바뀌면 초점을 슬라이드 제목으로 옮긴다(Enter = 파란 [계속 →], nowBar.js).
 *
 *   const slides = mountSlideCard(root, { flow, progress, missions, glossary, codePanel })
 *   slides.show(v, def)   v = flow.get(), def = 지금 장면 정의(읽기 장의 의사코드)
 *   slides.hide()
 */
import { el, fill } from './dom.js';
import { pageLabel, pageKind, levelTag } from '../app/lessons.js';
import { deckKind, beatOfCheck } from '../app/beats.js';
import { colabUrl } from '../app/links.js';
import { readView as codeReadView } from './codePanel.js';

/** 🖱(U+1F5B1)는 이모지 표시(U+FE0F)가 없으면 작은 글자로 보인다 */
const emoji = (t) => String(t ?? '').replace(/\u{1F5B1}(?!️)/gu, '\u{1F5B1}️');

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** 0-1 도입에만 붙는 한 줄 — 이 사이트를 따라가는 방법(FINAL_SPEC §2.2) */
export const NOW_RULE_LINE = '👆 보라 고리와 파란 단추가 언제나 지금 할 일을 알려 줘요. 맨 아래 지금 할 일 줄을 읽고 따라 해요.';

/** 쪽 종류 — 👣 단계 실행 · 🔎 살펴보기 · 🐍 Colab 실습 */
export function kindName(page) {
  const k = pageKind(page);
  if (k) return k;
  return deckKind(page) === 'step' ? { icon: '👣', name: '단계 실행' } : { icon: '🔎', name: '살펴보기' };
}

/** 도입 슬라이드 머리 줄 — "2단원 🔍 가공 · 2-2 · 👣 단계 실행 · 약 5분" */
export function introKicker(tab, sub, page) {
  const label = pageLabel(tab, sub, page);
  const k = kindName(page);
  return [`${tab.unit.no}단원 ${tab.icon} ${tab.label}`, label, `${k.icon} ${k.name}`, page.minutes ? `약 ${page.minutes}분` : null]
    .filter(Boolean).join(' · ');
}

/** "✋ 할 일 2개 · ❓ 확인 문제 1개" */
export function introMeta(page) {
  const ms = page.missions ?? [];
  const work = ms.filter((m) => m.check !== 'ask').length;
  const asks = ms.some((m) => m.check === 'ask') ? 1 : 0;
  return [work ? `✋ 할 일 ${work}개` : null, asks ? `❓ 확인 문제 ${asks}개` : null].filter(Boolean).join(' · ');
}

/** ❓ 장에서 [← 그림 다시 보기]가 가는 장 — 확인 장 앞의 마지막 할 일 장(없으면 슬라이드가 아닌 마지막 장) */
export function lookBackBeat(beats, from) {
  for (let i = from - 1; i >= 0; i -= 1) if (beats[i].kind === 'work') return i;
  for (let i = from - 1; i >= 0; i -= 1) if (!beats[i].overlay) return i;
  return -1;
}

export function mountSlideCard(root, { flow, progress, missions, glossary } = {}) {
  let lastSig = '';
  let lastBeat = '';
  /** 쪽마다 이번에 ❓를 틀린 횟수 — 두 번 틀리면 정답 칸을 연다(저장하지 않는다) */
  const askWrongs = new Map();

  const heading = (tag, text, cls = '') => el(`${tag}.slide__title${cls}`, { tabindex: '-1', 'data-slide-heading': '' }, text);

  /* ── 도입 ── */
  function intro(v) {
    const { tab, sub, page } = v;
    const tag = levelTag(page);
    const terms = (page.terms ?? []).slice(0, 3);
    const first = pageLabel(tab, sub, page) === '0-1';
    return el('article.slide.slide--intro', { 'aria-labelledby': 'slide-h' },
      el('p.slide__kicker', {}, introKicker(tab, sub, page),
        tag ? el(`span.tag${page.level === 'challenge' ? '.tag--result' : ''}.slide__level`, {}, tag) : null),
      Object.assign(heading('h2', page.title), { id: 'slide-h' }),
      el('p.slide__goal', {}, el('span.slide__goalmark', {}, '🎯 이 쪽을 마치면: '), page.objective || page.title),
      page.why ? el('p.slide__why', {}, '💡 ', page.why) : null,
      terms.length ? el('div.slide__terms', {},
        el('span.slide__label', {}, '학습 요소'),
        terms.map((t) => el('button.termchip', { type: 'button', title: `📖 용어 사전에서 '${t}' 보기`, onclick: () => glossary?.open(t) }, t))) : null,
      introMeta(page) ? el('p.slide__meta', {}, introMeta(page)) : null,
      first ? el('p.slide__rule', {}, NOW_RULE_LINE) : null);
  }

  /* ── 읽기(의사코드 미리 읽기) ── */
  function code(v, def) {
    const n = def?.pseudo?.length ?? 0;
    return el('article.slide.slide--code', { 'aria-labelledby': 'slide-h' },
      Object.assign(heading('h2', `📝 이번에 따라갈 의사코드 — ${n}줄`), { id: 'slide-h' }),
      v.page.setup ? el('p.slide__setup', {}, '📦 ', v.page.setup) : null,
      def?.pseudo ? codeReadView(def) : el('p.placeholder', {}, '이 쪽에는 의사코드가 없어요.'));
  }

  /* ── ❓ 확인 문제 ── */
  function askState(v) {
    const qk = `ask:${v.key}`;
    const picked = progress.answers(qk)[0];
    const first = progress.firsts(qk)[0];
    if (!askWrongs.has(v.key)) askWrongs.set(v.key, picked !== undefined && picked !== null && picked !== v.page.ask?.answer ? 1 : 0);
    return { qk, picked: picked ?? undefined, first, wrongs: askWrongs.get(v.key) };
  }

  function check(v) {
    const ask = v.page.ask;
    if (!ask) return el('article.slide.slide--check', {}, heading('h2', '❓ 확인 문제'), el('p.placeholder', {}, '이 쪽에는 확인 문제가 없어요.'));
    const { qk, picked, first, wrongs } = askState(v);
    const answered = picked !== undefined;
    const right = answered && picked === ask.answer;
    const reveal = right || wrongs >= 2;
    const grid = ask.options.length === 4 && ask.options.every((o) => String(o).length <= 18);
    const back = lookBackBeat(v.beats, v.index);

    // 기록은 예전 ❓ 말풍선(drawAsk)과 똑같이 — progress.answer가 처음 고른 답(firsts)을 남기고, 미션에는 맞았는지만
    const onPick = (oi) => {
      if (picked === oi) return;
      if (oi !== ask.answer) askWrongs.set(v.key, (askWrongs.get(v.key) ?? 0) + 1);
      progress.answer(qk, 0, oi);
      missions?.emit({ type: 'ask', right: oi === ask.answer });
      draw(flow.get(), curDef);
      root.querySelectorAll('.ask__opt')[oi]?.focus({ preventScroll: true });
    };

    const opts = el(`div.ask__opts${grid ? '.ask__opts--grid' : ''}`, { 'data-act': 'ask', role: 'group', 'aria-label': '보기' },
      ask.options.map((op, oi) => {
        let state = null;
        if (answered) {
          if (oi === picked && right) state = 'right';
          else if (oi === picked) state = 'wrong';
          else if (oi === ask.answer && reveal) state = 'reveal';
        }
        return el('button.quiz__opt.ask__opt', {
          type: 'button', 'data-state': state, 'aria-pressed': String(picked === oi),
          onclick: () => onPick(oi),
        }, el('span.ask__letter', { 'aria-hidden': 'true' }, LETTERS[oi] ?? String(oi + 1)), el('span.ask__text', {}, op));
      }));

    let fb = null;
    if (right) {
      fb = el('p.ask__fb.callout.callout--add', { 'aria-live': 'polite' }, '⭕ 맞았어요! ', ask.why,
        first !== undefined && first !== ask.answer ? ' (처음 고른 답은 틀렸으니까 설명을 한 번 더 읽어 봐요.)' : '');
    } else if (answered && wrongs >= 2) {
      fb = el('p.ask__fb.callout.callout--warn', { 'aria-live': 'polite' }, '❌ 정답은 초록 칸이에요. ', ask.why);
    } else if (answered) {
      fb = el('div.ask__fb.callout.callout--warn', { 'aria-live': 'polite' },
        el('span', {}, '❌ 아직이에요. 그림을 다시 살펴보고 다른 답을 골라요.'),
        back >= 0 ? el('button.pill.pill--sm.ask__back', { type: 'button', onclick: () => flow.go(back) }, '← 그림 다시 보기') : null);
    }

    return el('article.slide.slide--check', { 'aria-labelledby': 'slide-h' },
      el('p.slide__kicker', {}, '❓ 확인 문제 · 처음 고른 답이 📋 학습 기록에 남아요'),
      Object.assign(heading('h2', ask.q, '.ask__q'), { id: 'slide-h' }),
      opts,
      fb);
  }

  /* ── 정리 ── */
  function wrap(v, def) {
    const { tab, sub, page } = v;
    const ms = page.missions ?? [];
    const done = progress.missionsDone(v.key);
    const colabPage = deckKind(page) === 'colab';
    const left = ms.filter((_, i) => !done[i]).length;
    return el('article.slide.slide--wrap', { 'aria-labelledby': 'slide-h' },
      Object.assign(heading('h2', `✅ ${pageLabel(tab, sub, page) || page.short || ''} 정리`), { id: 'slide-h' }),
      page.takeaway ? el('section.wrap__key', {},
        el('span.slide__label', {}, '핵심 한 줄'),
        el('p.wrap__takeaway', {}, page.takeaway)) : null,
      el('p.wrap__goal', { 'data-done': v.pageDone ? 'true' : null },
        el('span.wrap__goalmark', { 'aria-hidden': 'true' }, v.pageDone ? '✓' : '🎯'),
        el('span', {}, page.objective || page.title),
        v.pageDone ? el('span.sr-only', {}, ' (이뤘어요)') : null),
      ms.length ? el('section.wrap__did', {},
        el('span.slide__label', {}, '이 쪽에서 한 일', el('span.wrap__count', {}, ` ${ms.length - left}/${ms.length}`)),
        el('ul.wrap__list', {}, ms.map((m, i) => {
          const ok = Boolean(done[i]);
          const at = beatOfCheck(v.beats, m.check);
          return el('li.wrap__item', { 'data-done': ok ? 'true' : null },
            el('span.wrap__box', { 'aria-hidden': 'true' }, ok ? '✅' : '☐'),
            el('span.wrap__text', {}, emoji(m.text)),
            el('span.sr-only', {}, ok ? ' (했어요)' : ' (아직)'),
            !ok && at >= 0 ? el('button.pill.pill--sm.wrap__redo', { type: 'button', onclick: () => flow.go(at) }, '다시 하기 →') : null);
        }))) : null,
      colabPage ? el('p.wrap__teacher', {}, '🙋 선생님께 결과 화면을 보여 주세요') : null,
      page.more ? el('details.wrap__more', {},
        el('summary', {}, '💡 더 알아보기'),
        el('p', {}, page.more)) : null,
      !colabPage && def?.notebook ? el('a.pill.pill--sm.wrap__colab', { href: colabUrl(def.notebook), target: '_blank', rel: 'noopener' }, '📒 Colab에서 같은 내용 해 보기') : null);
  }

  /* ── 그리기 ── */

  /** 다시 그릴지 가르는 서명 — 같은 장에서 진도만 바뀐 것이면 그 장에 필요한 값만 본다 */
  function sigOf(v) {
    const base = `${v.key}#${v.index}|${v.beat.kind}`;
    if (v.beat.kind === 'check') {
      const s = askState(v);
      return `${base}|${s.picked}|${s.wrongs}`;
    }
    if (v.beat.kind === 'wrap') {
      const done = progress.missionsDone(v.key);
      return `${base}|${(v.page.missions ?? []).map((_, i) => (done[i] ? 1 : 0)).join('')}|${v.pageDone}`;
    }
    return base;
  }

  function draw(v, def, force = false) {
    const sig = sigOf(v);
    if (!force && sig === lastSig) return false;
    lastSig = sig;
    let card;
    switch (v.beat.kind) {
      case 'intro': card = intro(v); break;
      case 'code': card = code(v, def); break;
      case 'check': card = check(v); break;
      case 'wrap': card = wrap(v, def); break;
      default: card = el('article.slide', {}, heading('h2', v.beat.title ?? v.beat.chip));
    }
    root.dataset.kind = v.beat.kind;
    fill(root, card);
    return true;
  }

  let curDef = null;

  return {
    /** 슬라이드 장을 그린다 — 장이 바뀌었으면 초점을 제목으로 */
    show(v, def = curDef) {
      curDef = def;
      const beatSig = `${v.key}#${v.index}`;
      const moved = beatSig !== lastBeat;
      lastBeat = beatSig;
      draw(v, def, moved);
      root.hidden = false;
      if (moved) {
        root.scrollTop = 0;
        const h = root.querySelector('[data-slide-heading]');
        // 다른 곳(글 입력칸 등)에 초점이 있으면 빼앗지 않는다
        const active = document.activeElement;
        const free = !active || active === document.body || root.contains(active) || active.closest?.('#nowbar, #topnav, #slidecard');
        if (h && free) h.focus({ preventScroll: true });
      }
    },
    hide() {
      if (!lastBeat && !root.childElementCount) return;
      lastBeat = '';
      lastSig = '';
      delete root.dataset.kind;
      fill(root);
    },
  };
}

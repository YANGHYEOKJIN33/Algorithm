/**
 * 🧭 단원 표지 · 📝 단원 정리 — 교과서의 "대단원 도입"과 "대단원 정리"를 한 장에 한 가지씩(FINAL_SPEC §2.1·§2.9·§4.3).
 *
 *   표지(3장)  cv-hook  🤔 생각 열기 — 핵심 질문 + 내 생각 하나 고르기(맞히는 문제가 아니다)   act:hook
 *             cv-flow  📦 데이터는 이렇게 바뀌어요 — 들어올 때 → 나갈 때 + 📌 한마디
 *             cv-goals 🎯 이 단원을 마치면 할 수 있어요 — 할 수 있어요 줄마다 쪽 칩([2-1] [2-2])   act:begin
 *             (출발 [시작하기 →]은 지금 할 일 줄의 파란 단추 하나뿐이다. 성취기준·쪽 목록은 📚 목차로)
 *   정리(5장)  rv-summary ⏱ 1분 요약 · rv-reveal 🤔 정답 공개 · rv-quiz ❓ 한 문제씩(right:N)
 *             · rv-self ✅ 스스로 점검(act:selfcheck) · rv-end 🎉 단원 끝(마지막 단원은 수업 마무리 카드)
 *
 * 덩어리마다 data-beat를 달면 장면 무대(sceneHost)가 지금 장의 덩어리만 보이고 그 위에 장 제목(.beat-head)을 붙인다.
 * 지금 할 곳에는 data-act(hook · selfcheck) — 보라 고리가 그곳을 찾는다.
 * 내용은 모두 course/<단원>.js의 unit에서 가져온다(장면에는 글을 적지 않는다).
 */
import { el, fill } from '../ui/dom.js';
import { TABS, unitPages, findPage } from '../app/lessons.js';
import { pageDone, canDoDone, unitProgress } from '../app/missions.js';
import { quizBox } from '../ui/quizBox.js';
import { askScore, unitQuizScore, scoreText } from '../app/record.js';
import { recordButton } from '../ui/recordCopy.js';

/**
 * 1~6단원 흐름 띠 — 예전 표지·정리 머리 칸에 있던 것. 이제 표지·정리에는 쓰지 않는다(맨 위 줄의 단원 알약이 대신한다).
 * start/goal.js가 아직 부르므로 남겨 둔다 — 그 쪽에서 지우면 이것도 지운다.
 */
export function unitStrip(currentId, go) {
  const units = TABS.filter((t) => t.unit.no > 0);
  return el('ol.ustrip', { 'aria-label': '인공지능 프로젝트 여섯 단계' }, units.map((t) => el('li', {},
    el(`button.ustrip__step${t.id === currentId ? '.is-here' : ''}`, {
      type: 'button', title: `${t.unit.no}단원 ${t.label} — ${t.verb}`, 'aria-current': t.id === currentId ? 'step' : null,
      onclick: go ? () => go(t.id) : null,
    }, el('span.ustrip__no', {}, String(t.unit.no)), el('span.ustrip__icon', {}, t.icon), el('span.ustrip__name', {}, t.label),
    el('span.ustrip__verb', {}, t.verb)))));
}

/** 단원 안 쪽 ref('2-1'의 id 또는 '하위탭:id') → 쪽 칩에 쓸 것 */
function pageRef(tab, ref) {
  const it = findPage(tab, ref);
  return it ? { it, label: it.label } : null;
}

/** 단원의 학습 요소(쪽 순서, 겹치지 않게) */
const unitTerms = (tab) => [...new Set(unitPages(tab).flatMap((it) => it.page.terms ?? []))];

/* ═════════════ 표지 ═════════════ */

function unitCover(root, ctx) {
  const { tab } = ctx.lesson;
  const u = tab.unit;
  const all = unitPages(tab);                                    // 표지·정리까지 — 목차·단원 알약의 진도와 같은 수

  /* ① 생각 열기 */
  const hookBox = el('div.cv-hook__card');
  function drawHook() {
    if (!u.hook) { fill(hookBox); return; }
    const mine = ctx.progress.hook(tab.id);
    fill(hookBox,
      el('span.cv-hook__label', {}, '🤔 생각 열기'),
      el('p.cv-hook__q', {}, u.hook.q),
      el('div.cv-hook__opts', { 'data-act': 'hook', role: 'group', 'aria-label': '내 생각 고르기', style: `--n:${u.hook.options.length}` },
        u.hook.options.map((op, i) => el('button.quiz__opt.cv-hook__opt', {
          type: 'button', 'aria-pressed': String(mine === i), 'data-state': mine === i ? 'mine' : null,
          onclick: () => { ctx.progress.setHook(tab.id, i); ctx.check('hook'); drawHook(); },
        }, op))),
      el('p.cv-hook__note', { 'aria-live': 'polite' }, mine === null
        ? `맞히는 문제가 아니에요. 정답은 ${u.no}단원 정리에서 열려요 🔒`
        : `내 생각: "${u.hook.options[mine]}". 정답은 단원 정리에서 확인해요 🔒`));
  }

  /* ② 데이터 변화 */
  const flowBlock = (u.before || u.after) ? el('section.cv-block.cv-flow', { 'data-beat': 'cv-flow' },
    el('div.cv-flow__pair', {},
      el('div.cv-flow__box', {}, el('span.tag', {}, '들어올 때'), el('p', {}, u.before ?? '')),
      el('span.cv-flow__arrow', { 'aria-hidden': 'true' }, '→'),
      el('div.cv-flow__box.cv-flow__box--after', {}, el('span.tag.tag--add', {}, '나갈 때'), el('p', {}, u.after ?? ''))),
    u.note ? el('p.callout.cv-flow__note', {}, '📌 ', u.note) : null) : null;

  /* ③ 목표와 길 */
  const goalList = el('ul.cv-goals__list');
  const goalMeta = el('p.cv-goals__meta');
  /** 쪽 칩 — 그 쪽의 첫 할 일 장으로. 표지를 떠나며 출발 미션도 이룬다 */
  const go = (it) => { ctx.check('begin'); ctx.visit(tab.id, it.page.id, it.sub?.id); };
  function drawGoals() {
    const pr = unitProgress(ctx.progress, tab);
    goalMeta.textContent = [u.minutes ? `약 ${u.minutes}분` : null, `표지·정리 포함 ${all.length}쪽`, `완료 ${pr.done}/${pr.total}`].filter(Boolean).join(' · ');
    fill(goalList, (u.canDo ?? []).map((c) => {
      const ok = canDoDone(ctx.progress, tab, c);
      const refs = (c.pages ?? []).map((r) => pageRef(tab, r)).filter(Boolean);
      return el('li.cv-goals__row', { 'data-done': ok ? 'true' : null },
        el('span.cv-goals__mark', { 'aria-hidden': 'true' }, ok ? '✓' : '·'),
        el('span.cv-goals__text', {}, c.text, ok ? el('span.sr-only', {}, ' (이뤘어요)') : null),
        el('span.cv-goals__chips', {}, refs.map(({ it, label }) => {
          const done = pageDone(ctx.progress, tab, it.sub, it.page);
          return el('button.cv-chip', {
            type: 'button', 'data-done': done ? 'true' : null,
            title: `${label} ${it.page.title}${done ? ' ✓ 마침' : ''} — 이 쪽으로 가기`,
            onclick: () => go(it),
          }, done ? `✓ ${label}` : label);
        })));
    }));
  }

  fill(root, el('div.read.unitdeck.unitdeck--cover', {},
    u.hook ? el('section.cv-block.cv-hook', { 'data-beat': 'cv-hook' }, hookBox) : el('section.cv-block.cv-hook', { 'data-beat': 'cv-hook' }),
    flowBlock,
    el('section.cv-block.cv-goals', { 'data-beat': 'cv-goals' }, goalList, goalMeta)));
  drawHook();
  const unsub = ctx.progress.subscribe(() => drawGoals());
  return { destroy: unsub };
}

/* ═════════════ 정리 ═════════════ */

/** 지금 할 곳 — 아직 고르지 않은 첫 줄의 단추 묶음 */
const SELF_ACT = { 'data-act': 'selfcheck' };

function unitReview(root, ctx) {
  const { tab } = ctx.lesson;
  const u = tab.unit;
  const terms = unitTerms(tab);
  /** "📖 그 쪽 다시 보기 →"·"다시 보기 →" — 그 쪽의 첫 할 일 장으로 */
  const visit = (ref) => {
    const it = findPage(tab, ref);
    if (it) ctx.visit(tab.id, it.page.id, it.sub?.id);
    else ctx.go(tab.id);
  };

  /* ① 1분 요약 */
  const summary = el('section.cv-block.rv-summary', { 'data-beat': 'rv-summary' },
    u.summary?.length ? el('ol.rv-summary__list', {}, u.summary.map((s) => el('li', {}, s))) : null,
    terms.length ? el('div.rv-terms', { 'aria-label': '이 단원의 핵심 용어' },
      el('span.slide__label', {}, '핵심 용어'),
      terms.map((t) => el('span.termchip.termchip--static', {}, t))) : null);

  /* ② 생각 열기 — 정답 공개 */
  const reveal = el('section.cv-block.rv-reveal', { 'data-beat': 'rv-reveal' });
  function drawReveal() {
    if (!u.hook) { fill(reveal, el('p.placeholder', {}, '이 단원에는 생각 열기 질문이 없어요.')); return; }
    const mine = ctx.progress.hook(tab.id);
    const ans = u.hook.options[u.hook.answer];
    fill(reveal,
      el('p.rv-reveal__q', {}, u.hook.q),
      el('div.rv-reveal__rows', {},
        el('p.rv-reveal__row', {}, el('span.rv-reveal__label', {}, '처음 내 생각'),
          el('strong', {}, mine === null ? '(고르지 않았어요)' : `"${u.hook.options[mine]}"`),
          mine === null ? null : el('span.rv-reveal__mark', {}, mine === u.hook.answer ? ' ⭕' : ' → 이제는?')),
        el('p.rv-reveal__row.rv-reveal__row--ans', {}, el('span.rv-reveal__label', {}, '정답'), el('strong', {}, ans))),
      el('p.callout.callout--add.rv-reveal__why', {}, '✔ ', u.hook.reveal));
  }

  /* ③ 단원 확인 문제 — 한 문제씩 */
  const quizBlock = el('section.cv-block.rv-quiz', { 'data-beat': 'rv-quiz' },
    u.quiz?.length ? quizBox(u.quiz, {
      one: true,
      saved: ctx.progress.answers(`unit:${tab.id}`),
      firsts: ctx.progress.firsts(`unit:${tab.id}`),
      onPick: (qi, oi) => ctx.progress.answer(`unit:${tab.id}`, qi, oi),
      onReview: visit,
    }) : el('p.placeholder', {}, '이 단원에는 확인 문제가 없어요.'));

  /* ④ 스스로 점검 */
  const selfBox = el('ul.rv-self__list');
  const askLine = el('p.card__meta.rv-self__asks');
  function drawSelf() {
    const mine = ctx.progress.self(tab.id);
    const firstOpen = (u.canDo ?? []).findIndex((_, i) => !mine[i]);
    fill(selfBox, (u.canDo ?? []).map((c, i) => {
      const pagesOk = canDoDone(ctx.progress, tab, c);
      const v = mine[i];
      return el('li.rv-self__item', { 'data-v': v ?? null },
        el('span.rv-self__mark', { title: pagesOk ? '이 목표와 관련된 쪽을 모두 마쳤어요' : '아직 마치지 않은 쪽이 있어요', 'aria-hidden': 'true' }, pagesOk ? '✓' : '·'),
        el('span.rv-self__text', {}, c.text),
        el('span.rv-self__btns', { ...(i === firstOpen ? SELF_ACT : {}), role: 'group', 'aria-label': '스스로 점검' },
          el('button.pill.pill--sm', { type: 'button', 'aria-pressed': String(v === 'yes'), onclick: () => rate(i, 'yes') }, '😀 할 수 있어요'),
          el('button.pill.pill--sm', { type: 'button', 'aria-pressed': String(v === 'no'), onclick: () => rate(i, 'no') }, '🤔 아직')),
        v === 'no' && c.pages?.[0] ? el('button.pill.pill--sm.rv-self__go', { type: 'button', onclick: () => visit(c.pages[0]) }, '다시 보기 →') : null);
    }));
    const a = askScore(ctx.progress, tab);
    askLine.textContent = a.total ? `❓ 이 단원 쪽마다 있는 확인 문제: ${scoreText(a)} · 처음 고른 답으로 센 결과예요. 틀렸던 쪽은 한 번 더 보고 오면 좋아요.` : '';
  }
  function rate(i, v) {
    ctx.progress.setSelf(tab.id, i, v);
    const mine = ctx.progress.self(tab.id);
    if ((u.canDo ?? []).every((_, k) => mine[k])) ctx.check('selfcheck');
    drawSelf();
  }

  /* ⑤ 단원 끝 */
  const endScore = el('p.rv-end__score');
  const last = tab === TABS.at(-1);
  const finaleBox = last ? el('div.rv-end__finale') : null;
  function drawEnd() {
    const q = unitQuizScore(ctx.progress, tab);
    const a = askScore(ctx.progress, tab);
    fill(endScore,
      q.total ? el('span', {}, `단원 문제 처음에 맞힘 ${q.right}/${q.total}`) : null,
      q.total && a.total ? ' · ' : null,
      a.total ? el('span', {}, `쪽 확인 문제 ${a.right}/${a.total}`) : null);
    if (finaleBox) fill(finaleBox, finale(ctx));
  }
  const endBlock = el('section.cv-block.rv-end', { 'data-beat': 'rv-end' },
    endScore,
    terms.length ? el('details.rv-end__terms', {},
      el('summary', {}, `📖 핵심 용어 ${terms.length}개 — 눌러서 뜻 다시 보기`),
      el('div.termrow', {}, terms.map((t) => el('button.termchip', { type: 'button', onclick: () => ctx.glossary?.open(t) }, t)))) : null,
    u.cheats?.length ? el('details.rv-end__cheats', {},
      el('summary', {}, '🐍 파이썬 한 줄 정리 ', el('span.card__meta', {}, '— 프로젝트 때 다시 보기')),
      el('table.cheat', {}, el('tbody', {}, u.cheats.map((c) => el('tr', {}, el('th', {}, c.idea), el('td', {}, el('code', {}, c.code))))))) : null,
    finaleBox);

  fill(root, el('div.read.unitdeck.unitdeck--review', {}, summary, reveal, quizBlock,
    el('section.cv-block.rv-self', { 'data-beat': 'rv-self' }, selfBox, askLine), endBlock));
  drawReveal();
  drawSelf();
  const unsub = ctx.progress.subscribe(() => { drawEnd(); });
  return { destroy: unsub };
}

/** 수업 마지막 — 전체 진도와 못 한 쪽, 학습 기록 복사. 내 프로젝트로 가는 단추는 지금 할 일 줄의 파란 단추 */
function finale(ctx) {
  let done = 0;
  let total = 0;
  const left = [];
  for (const t of TABS) {
    const pr = unitProgress(ctx.progress, t);
    done += pr.done;
    total += pr.total;
    if (pr.done < pr.total) left.push(`${t.unit.no}단원 ${t.icon} ${t.label} ${pr.done}/${pr.total}`);
  }
  return el('section.rv-finale', {},
    el('h3', {}, '🎓 수업을 마쳤어요!'),
    el('p', {}, `전체 ${done} / ${total}쪽을 마쳤어요. `, left.length ? `아직 남은 쪽이 있는 단원: ${left.join(' · ')}` : '모든 쪽의 할 일을 다 했어요. 👏'),
    el('p', {}, '이제 내 주제를 하나 정해서, 배운 순서(수집 → 가공 → 전처리 → 학습 준비 → 기계학습 → 평가)대로 직접 해 볼 차례예요.'),
    el('p.card__meta', {}, '선생님이 기록을 걷으면 [📋 내 학습 기록 복사]를 눌러 복사한 뒤 붙여 넣으세요. 단원별 진도와 처음에 맞힌 문제 수가 함께 들어 있어요.'),
    el('div.rv-finale__go', {},
      recordButton(ctx.progress),
      left.length ? el('button.pill.pill--sm', { type: 'button', onclick: () => document.querySelector('#topnav .tn-course')?.click() }, '📚 목차에서 못 한 쪽 찾기') : null));
}

export const UNIT_SCENES = {
  unitCover: { kind: 'view', mount: unitCover },
  unitReview: { kind: 'view', mount: unitReview },
};

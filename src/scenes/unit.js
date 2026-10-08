/**
 * 🧭 단원 표지 · 📝 단원 정리 — 교과서의 "대단원 도입"과 "대단원 정리"를 화면으로.
 *
 *   표지: 생각 열기(핵심 질문 + 내 생각 고르기) · 핵심 아이디어 · 이 단원을 마치면(할 수 있어요)
 *         · 데이터가 들어올 때 → 나갈 때 · 쪽 목록(목표·시간·진도) · 성취기준 · [시작하기 →]
 *   정리: 1분 요약 · 할 수 있어요 스스로 점검 · 생각 열기 다시 보기 · 확인 문제 3개(틀리면 그 쪽으로)
 *         · 🐍 파이썬 한 줄 정리 · 핵심 용어 · [다음 단원 →]
 *
 * 내용은 모두 course/<단원>.js의 unit에서 가져온다(장면에는 글을 적지 않는다).
 */
import { el, fill } from '../ui/dom.js';
import { TABS, unitPages, pageKind, goPatch, refPatch, subPrefix } from '../app/lessons.js';
import { pageDone, pageCount, canDoDone } from '../app/missions.js';
import { getScene } from './index.js';
import { quizBox } from '../ui/quizBox.js';

/** 시작 화면의 6단계와 같은 흐름 띠 — 지금 단원을 강조 */
export function unitStrip(currentId, go) {
  const units = TABS.filter((t) => t.unit.no > 0);
  return el('ol.ustrip', { 'aria-label': '인공지능 프로젝트 여섯 단계' }, units.map((t) => el('li', {},
    el(`button.ustrip__step${t.id === currentId ? '.is-here' : ''}`, {
      type: 'button', title: `${t.unit.no}단원 ${t.label} — ${t.verb}`, 'aria-current': t.id === currentId ? 'step' : null,
      onclick: go ? () => go(t.id) : null,
    }, el('span.ustrip__no', {}, String(t.unit.no)), el('span.ustrip__icon', {}, t.icon), el('span.ustrip__name', {}, t.label),
    el('span.ustrip__verb', {}, t.verb)))));
}

function kindOf(page) {
  return pageKind(page) ?? (getScene(page.scene).kind === 'step' ? { icon: '👣', name: '단계 실행' } : { icon: '🔎', name: '살펴보기' });
}

function stdList(unit) {
  if (!unit.standards?.length) return null;
  return el('details.ucard.ucard--std', {},
    el('summary', {}, '📐 교육과정 성취기준 (선생님용)'),
    el('ul', {}, unit.standards.map((s) => el('li', {}, el('code', {}, s.code), ' ', s.text, s.subject ? el('span.card__meta', {}, ` (${s.subject})`) : null))));
}

/* ═════════════ 표지 ═════════════ */

function unitCover(root, ctx) {
  const { tab } = ctx.lesson;
  const u = tab.unit;
  const pages = unitPages(tab).filter((it) => it.page.auto !== 'cover');
  const hookBox = el('div.hook');
  const canDoList = el('ul.cando');
  const pageList = el('ol.upages');

  function drawHook() {
    if (!u.hook) { fill(hookBox); return; }
    const mine = ctx.progress.hook(tab.id);
    fill(hookBox,
      el('p.hook__q', {}, u.hook.q),
      el('div.hook__opts', {}, u.hook.options.map((op, i) => el('button.quiz__opt', {
        type: 'button', 'aria-pressed': String(mine === i), 'data-state': mine === i ? 'mine' : null,
        onclick: () => { ctx.progress.setHook(tab.id, i); ctx.check('hook'); drawHook(); },
      }, op))),
      el('p.hook__note', {}, mine === null
        ? '정답을 맞히는 게 아니라 내 생각을 먼저 정해 보는 거예요.'
        : `내 생각: "${u.hook.options[mine]}" — 단원 정리에서 정답을 확인해요. 🔒`));
  }

  function drawLists() {
    listCount.textContent = ` · ${doneCount()}/${pages.length} 완료`;
    heroStart.textContent = startLabel();
    footStart.textContent = startLabel();
    fill(canDoList, (u.canDo ?? []).map((c) => el('li', { 'data-done': canDoDone(ctx.progress, tab, c) ? 'true' : null }, c.text)));
    fill(pageList, pages.map((it) => {
      const ok = pageDone(ctx.progress, tab, it.sub, it.page);
      const cnt = pageCount(ctx.progress, tab, it.sub, it.page);
      const k = kindOf(it.page);
      return el('li', {}, el('button.upage', {
        type: 'button', 'data-done': ok ? 'true' : null,
        onclick: () => ctx.store.set(goPatch(tab.id, it.page.id, it.sub?.id)),
      },
      el('span.upage__label', {}, ok ? '✓' : it.label),
      el('span.upage__main', {},
        el('span.upage__title', {}, subPrefix(it, ' · '), it.page.short && it.page.auto ? it.page.short : it.page.title),
        it.page.objective ? el('span.upage__obj', {}, `🎯 ${it.page.objective}`) : null),
      el('span.upage__meta', {}, `${k.icon} ${k.name}`, it.page.minutes ? ` · ${it.page.minutes}분` : '', cnt.total ? ` · ✋ ${cnt.done}/${cnt.total}` : '')));
    }));
  }

  // 표지를 뺀 이 단원의 쪽 — 머리 칸의 "N쪽"과 목록의 "n/N 완료"가 같은 수를 쓰게
  const doneCount = () => pages.filter((it) => pageDone(ctx.progress, tab, it.sub, it.page)).length;
  const resumeAt = () => (doneCount() > 0 ? pages.find((it) => !pageDone(ctx.progress, tab, it.sub, it.page)) : null);
  const begin = () => {
    ctx.check('begin');
    // 마친 쪽이 있으면 아직 안 끝난 첫 쪽으로(이어서 하기), 아니면 다음 쪽으로
    const todo = resumeAt();
    if (todo) ctx.store.set(goPatch(tab.id, todo.page.id, todo.sub?.id)); else ctx.next();
  };
  const startLabel = () => (resumeAt() ? '이어서 하기 →' : '시작하기 →');
  const listCount = el('span.card__meta');
  const heroStart = el('button.pill.ctrl--primary.unit__start', { type: 'button', onclick: begin });
  const footStart = el('button.pill.ctrl--primary.unit__start', { type: 'button', onclick: begin });
  fill(root, el('div.read.unit', {},
    el('header.unit__hero', {},
      el('div.unit__heroText', {},
        el('p.unit__kicker', {}, `${u.no}단원 · ${tab.icon} ${tab.label}`, tab.verb ? el('strong', {}, ` — ${tab.verb}`) : null,
          u.minutes ? el('span.card__meta', {}, ` · 약 ${u.minutes}분 · ${pages.length}쪽`) : null),
        el('h2.unit__q', {}, `🤔 ${u.question ?? tab.label}`),
        u.bigIdea ? el('p.unit__idea', {}, el('strong', {}, '핵심 아이디어 '), u.bigIdea) : null,
        el('div.unit__heroGo', {}, heroStart, el('span.card__meta', {}, '먼저 아래 🎯 목록과 🤔 생각 열기를 보고 출발해요'))),
      unitStrip(tab.id, (id) => ctx.go(id))),
    el('div.unit__grid', {},
      el('div.unit__col', {},
        el('section.ucard.ucard--goal', {},
          el('h3', {}, '🎯 이 단원을 마치면 할 수 있어요'),
          canDoList,
          el('p.card__meta', {}, '쪽의 ✋ 할 일을 모두 하면 여기에 ✓가 붙어요.')),
        (u.before || u.after) ? el('section.ucard', {},
          el('h3', {}, '📦 데이터는 이렇게 바뀌어요'),
          el('div.flowpair', {},
            el('div.flowpair__box', {}, el('span.tag', {}, '들어올 때'), el('p', {}, u.before ?? '')),
            el('span.flowpair__arrow', { 'aria-hidden': 'true' }, '→'),
            el('div.flowpair__box.flowpair__box--after', {}, el('span.tag.tag--add', {}, '나갈 때'), el('p', {}, u.after ?? '')))) : null,
        u.note ? el('p.callout', {}, '📌 ', u.note) : null,
        stdList(u)),
      el('div.unit__col', {},
        u.hook ? el('section.ucard.ucard--hook', {}, el('h3', {}, '🤔 생각 열기 — 먼저 골라 봐요'), hookBox) : null,
        el('section.ucard', {},
          el('h3', {}, '📋 이 단원의 쪽', listCount),
          pageList,
          el('div.unit__go', {}, footStart))))));
  drawHook();
  drawLists();
  const unsub = ctx.progress.subscribe(() => drawLists());
  return { destroy: unsub };
}

/* ═════════════ 정리 ═════════════ */

function unitReview(root, ctx) {
  const { tab } = ctx.lesson;
  const u = tab.unit;
  const selfBox = el('ul.selfcheck');
  const hookBox = el('div');

  const allTerms = [...new Set(unitPages(tab).flatMap((it) => it.page.terms ?? []))];
  const go = (ref) => ctx.store.set(refPatch(tab, ref));

  function drawSelf() {
    const mine = ctx.progress.self(tab.id);
    fill(selfBox, (u.canDo ?? []).map((c, i) => {
      const pagesOk = canDoDone(ctx.progress, tab, c);
      const v = mine[i];
      return el('li.selfcheck__item', { 'data-v': v ?? null },
        el('span.selfcheck__mark', { title: pagesOk ? '이 목표의 쪽을 모두 마쳤어요' : '아직 마치지 않은 쪽이 있어요' }, pagesOk ? '✓' : '·'),
        el('span.selfcheck__text', {}, c.text),
        el('span.selfcheck__btns', {},
          el('button.pill.pill--sm', { type: 'button', 'aria-pressed': String(v === 'yes'), onclick: () => rate(i, 'yes') }, '😀 할 수 있어요'),
          el('button.pill.pill--sm', { type: 'button', 'aria-pressed': String(v === 'no'), onclick: () => rate(i, 'no') }, '🤔 아직'),
          v === 'no' && c.pages?.[0] ? el('button.pill.pill--sm.selfcheck__go', { type: 'button', onclick: () => go(c.pages[0]) }, '다시 보기 →') : null));
    }));
  }
  function rate(i, v) {
    ctx.progress.setSelf(tab.id, i, v);
    const mine = ctx.progress.self(tab.id);
    if ((u.canDo ?? []).every((_, k) => mine[k])) ctx.check('selfcheck');
    drawSelf();
  }

  function drawHook() {
    if (!u.hook) { fill(hookBox); return; }
    const mine = ctx.progress.hook(tab.id);
    fill(hookBox, el('section.ucard.ucard--hook', {},
      el('h3', {}, '🤔 생각 열기 — 다시 보기'),
      el('p.hook__q', {}, u.hook.q),
      el('p', {}, '처음 내 생각: ', el('strong', {}, mine === null ? '(고르지 않았어요)' : `"${u.hook.options[mine]}"`),
        mine === null ? null : mine === u.hook.answer ? ' ⭕' : ' → 이제는?'),
      el('p.callout.callout--add', {}, '✔ ', el('strong', {}, u.hook.options[u.hook.answer]), ' — ', u.hook.reveal)));
  }

  const nextTab = TABS[TABS.findIndex((t) => t.id === tab.id) + 1];
  fill(root, el('div.read.unit', {},
    el('header.unit__hero', {},
      el('div.unit__heroText', {},
        el('p.unit__kicker', {}, `${u.no}단원 정리 · ${tab.icon} ${tab.label}`, tab.verb ? el('strong', {}, ` — ${tab.verb}`) : null),
        el('h2.unit__q', {}, `📝 ${u.question ?? tab.label}`),
        u.bigIdea ? el('p.unit__idea', {}, el('strong', {}, '핵심 아이디어 '), u.bigIdea) : null),
      unitStrip(tab.id, (id) => ctx.go(id))),
    el('div.unit__grid', {},
      el('div.unit__col', {},
        u.summary?.length ? el('section.ucard.ucard--sum', {},
          el('h3', {}, '⏱ 1분 요약'),
          el('ol.sumlist', {}, u.summary.map((s) => el('li', {}, s)))) : null,
        el('section.ucard.ucard--goal', {},
          el('h3', {}, '✅ 할 수 있어요? — 스스로 점검'),
          selfBox,
          el('p.card__meta', {}, '"🤔 아직"이면 [다시 보기 →]로 그 쪽에 다녀와요. 솔직하게 고를수록 도움이 돼요.')),
        hookBox),
      el('div.unit__col', {},
        u.quiz?.length ? el('section.ucard', {},
          quizBox(u.quiz, {
            title: '❓ 단원 확인 문제',
            saved: ctx.progress.answers(`unit:${tab.id}`),
            onPick: (qi, oi) => ctx.progress.answer(`unit:${tab.id}`, qi, oi),
            onReview: go,
          })) : null,
        u.cheats?.length ? el('section.ucard', {},
          el('h3', {}, '🐍 파이썬 한 줄 정리', el('span.card__meta', {}, ' — 프로젝트 때 다시 찾아보세요')),
          el('table.cheat', {}, el('tbody', {}, u.cheats.map((c) => el('tr', {}, el('th', {}, c.idea), el('td', {}, el('code', {}, c.code))))))) : null,
        allTerms.length ? el('section.ucard', {},
          el('h3', {}, '📖 이 단원의 핵심 용어'),
          el('div.termrow', {}, allTerms.map((t) => el('button.termchip', { type: 'button', onclick: () => ctx.glossary?.open(t) }, t)))) : null,
        nextTab ? el('div.unit__go', {},
          el('button.pill.ctrl--primary', { type: 'button', onclick: () => ctx.go(nextTab.id) }, `다음: ${nextTab.unit.no}단원 ${nextTab.icon} ${nextTab.label} →`)) : null))));
  drawSelf();
  drawHook();
  return {};
}

export const UNIT_SCENES = {
  unitCover: { kind: 'view', mount: unitCover },
  unitReview: { kind: 'view', mount: unitReview },
};

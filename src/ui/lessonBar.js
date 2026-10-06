/**
 * 레슨 막대 — "지금 어디에서, 무엇을 할 수 있게 되려고, 무엇을 하면 되나"를 한눈에.
 *
 *   ┌ 2단원 · 🔍 가공 — 문제 찾기 │ 표지✓  2-1 여부  2-2 개수 … 정리 │        ← 이전  다음 → ┐
 *   │ 2-1 결측치 ① 빈칸인지 확인하기  👣 단계 실행 · 약 5분          │ ✋ 할 일 1/3             │
 *   │ 🎯 표의 칸마다 빈칸인지 True/False로 표시할 수 있다.  💡 왜?   │ ✅ ⏭ 한 단계를 눌러 …    │
 *   └ 학습 요소 [결측치] [True / False]                              │ ☐ ❓ 확인 문제 맞히기    ┘
 *
 * 미션은 학생이 실제로 하면 저절로 ✅가 된다(missions.js). [다음 →]은 막지 않는다 — 다 하면 반짝일 뿐.
 * 마지막 쪽의 [다음 →]은 다음 하위 탭·다음 단원으로 이어 준다.
 */
import { el, fill } from './dom.js';
import { currentLesson, unitPages, pageKind, TABS } from '../app/lessons.js';
import { pageKey } from '../app/progress.js';
import { pageDone } from '../app/missions.js';
import { getScene } from '../scenes/index.js';

/** 🖱(U+1F5B1)는 이모지 표시(U+FE0F)가 없으면 작은 글자로 보인다 */
const emoji = (t) => t.replace(/\u{1F5B1}(?!\uFE0F)/gu, '\u{1F5B1}\uFE0F');

function kindOf(page) {
  const k = pageKind(page);
  if (k) return k;
  return getScene(page.scene).kind === 'step' ? { icon: '👣', name: '단계 실행' } : { icon: '🔎', name: '살펴보기' };
}

export function mountLessonBar(root, store, { progress, missions, player, glossary }) {
  /* ── 위 줄: 단원 · 단계 표시 · 앞뒤 ── */
  const unitChip = el('button.unitchip', { type: 'button', title: '이 단원의 표지로' });
  const stepper = el('ol.stepper', { 'aria-label': '이 단원의 쪽' });
  const foldBtn = el('button.pill.pill--sm.lesson__fold', { type: 'button', onclick: () => store.set({ lessonFold: !store.get().lessonFold }) });
  const prev = el('button.pill.lesson__nav', { type: 'button', onclick: () => { const p = prevPlace(); if (p) store.set(p); } }, '← 이전');
  const next = el('button.pill.ctrl--primary.lesson__nav', { type: 'button', onclick: () => { const p = nextPlace(); if (p) store.set(p); } }, '다음 →');
  const mini = el('span.lesson__mini');

  /* ── 아래: 제목 · 🎯 목표 · 학습 요소 | ✋ 할 일 ── */
  const no = el('span.lesson__no');
  const titleText = el('span');
  const badge = el('span.lesson__badge');
  const title = el('h2.lesson__title', {}, no, titleText, badge);
  const objective = el('span.lesson__objective');
  const whyBtn = el('button.pill.pill--sm.lesson__whybtn', { type: 'button', 'aria-expanded': 'false', onclick: () => toggleWhy() }, '💡 왜 배울까?');
  const goal = el('p.lesson__goal', {}, el('strong.lesson__label', {}, '🎯 목표'), objective, whyBtn);
  const terms = el('div.lesson__terms');
  const why = el('div.lesson__why.callout', { hidden: true });
  const missionHead = el('div.missions__head');
  const missionList = el('ul.missions__list');
  const toast = el('div.lesson__toast', { 'aria-live': 'polite' });
  const missionBox = el('section.missions', { 'aria-label': '할 일' }, missionHead, missionList, toast);
  const askPop = el('div.askpop', { hidden: true, role: 'dialog', 'aria-label': '확인 문제' });

  const body = el('div.lesson__body', {},
    el('div.lesson__main', {}, title, goal, terms, why),
    missionBox);
  fill(root,
    el('div.lesson__head', {}, unitChip, stepper, mini, el('span.topbar__spacer'), foldBtn, el('div.lesson__navs', {}, prev, next)),
    body, askPop);

  function nextPlace() {
    const state = store.get();
    const { tab, sub, index, steps, key } = currentLesson(state);
    if (index < steps.length - 1) return { [key]: index + 1 };
    if (sub) {
      const subs = tab.sub;
      const si = subs.findIndex((x) => x.id === sub.id);
      if (si < subs.length - 1) return { mlTab: subs[si + 1].id, [`step:${tab.id}:${subs[si + 1].id}`]: 0 };
    }
    const ti = TABS.findIndex((t) => t.id === tab.id);
    if (ti < TABS.length - 1) {
      const nt = TABS[ti + 1];
      return nt.sub ? { tab: nt.id, mlTab: nt.sub[0].id, [`step:${nt.id}:${nt.sub[0].id}`]: 0 } : { tab: nt.id, [`step:${nt.id}`]: 0 };
    }
    return null;
  }
  function prevPlace() {
    const { tab, sub, index, key } = currentLesson(store.get());
    if (index > 0) return { [key]: index - 1 };
    if (sub) {
      const si = tab.sub.findIndex((x) => x.id === sub.id);
      if (si > 0) { const ps = tab.sub[si - 1]; return { mlTab: ps.id, [`step:${tab.id}:${ps.id}`]: ps.pages.length - 1 }; }
    }
    return null;
  }

  let whyOpen = false;
  function toggleWhy(force) {
    whyOpen = force ?? !whyOpen;
    why.hidden = !whyOpen;
    whyBtn.setAttribute('aria-expanded', String(whyOpen));
  }

  /* ── ❓ 확인 문제 ── */
  let askOpen = false;
  function drawAsk(page, key) {
    const qk = `ask:${key}`;
    const picked = progress.answers(qk)[0];
    const ask = page.ask;
    fill(askPop,
      el('div.askpop__head', {}, el('strong', {}, '❓ 확인 문제'), el('span.topbar__spacer'),
        el('button.pill.pill--sm', { type: 'button', onclick: () => { askOpen = false; askPop.hidden = true; } }, '닫기 ✕')),
      el('p.askpop__q', {}, ask.q),
      el('div.askpop__opts', {}, ask.options.map((op, oi) => {
        let state = null;
        if (picked !== undefined) { if (oi === ask.answer && picked === oi) state = 'right'; else if (oi === picked) state = 'wrong'; }
        return el('button.quiz__opt', {
          type: 'button', 'data-state': state, 'aria-pressed': String(picked === oi),
          onclick: () => {
            progress.answer(qk, 0, oi);
            missions.emit({ type: 'ask', right: oi === ask.answer });
            drawAsk(page, key);
          },
        }, op);
      })),
      picked !== undefined
        ? el(`p.callout${picked === ask.answer ? '.callout--add' : '.callout--warn'}`, {},
          picked === ask.answer ? ['⭕ 맞았어요! ', ask.why] : '❌ 아직이에요. 그림과 의사코드를 다시 보고 다른 답을 골라 보세요.')
        : null);
  }

  /* ── 그리기 ── */
  let lastSig = '';
  let nudgeAsk = false;
  function draw() {
    const state = store.get();
    const { tab, sub, steps, index, key } = currentLesson(state);
    const page = steps[index];
    const pkey = pageKey(tab.id, sub?.id, page.id);
    const list = unitPages(tab);
    const here = list.find((it) => it.page === page);
    const sig = pkey;
    if (sig !== lastSig) { lastSig = sig; toggleWhy(false); askOpen = false; nudgeAsk = false; }

    // 단원 칩
    fill(unitChip,
      el('span.unitchip__no', {}, tab.unit.no === 0 ? '시작' : `${tab.unit.no}단원`),
      el('span.unitchip__name', {}, `${tab.icon} ${tab.label}`),
      tab.verb ? el('span.unitchip__verb', {}, tab.verb) : null,
      sub && sub.id !== 'review' && sub.name ? el('span.unitchip__sub', { title: sub.question ?? '' }, `› ${sub.name}`, sub.tag ? el('small', {}, ` (${sub.tag})`) : null) : null);
    unitChip.onclick = () => { const first = list[0]; store.set(first.sub ? { mlTab: first.sub.id, [`step:${tab.id}:${first.sub.id}`]: 0 } : { [`step:${tab.id}`]: 0 }); };

    // 단계 표시 줄 — 지금 하위 탭의 쪽만
    fill(stepper, steps.map((p, i) => {
      const it = list.find((x) => x.page === p);
      const done = pageDone(progress, tab, sub, p);
      return el('li', {}, el('button.step', {
        type: 'button',
        'aria-current': i === index ? 'step' : null,
        'data-done': done ? 'true' : null,
        title: `${it?.label ?? ''} ${p.title}${done ? ' ✓ 완료' : ''}`,
        onclick: () => store.set({ [key]: i }),
      }, el('span.step__no', {}, done && i !== index ? '✓' : (it?.label ?? String(i + 1))),
      p.auto ? null : el('span.step__name', {}, p.short || p.title)));
    }));
    // 지금 쪽이 보이게 단계 표시 줄만 옆으로 민다(페이지 전체는 움직이지 않게)
    const cur = stepper.querySelector('[aria-current]')?.parentElement;
    if (cur && (cur.offsetLeft < stepper.scrollLeft || cur.offsetLeft + cur.offsetWidth > stepper.scrollLeft + stepper.clientWidth)) {
      stepper.scrollLeft = Math.max(0, cur.offsetLeft - stepper.clientWidth / 3);
    }

    // 제목 · 목표
    const kind = kindOf(page);
    no.textContent = here?.label && !page.auto ? here.label : '';
    no.hidden = !no.textContent;
    titleText.textContent = page.title;
    fill(badge, `${kind.icon} ${kind.name}`, page.minutes ? ` · 약 ${page.minutes}분` : '',
      page.level === 'challenge' ? el('span.tag.tag--result', {}, '🔥 도전') : null,
      page.level === 'optional' ? el('span.tag', {}, '➕ 더 알아보기') : null);
    objective.textContent = page.objective || page.title;
    fill(terms, page.terms?.length ? [
      el('span.lesson__label', {}, '학습 요소'),
      page.terms.map((t) => el('button.termchip', { type: 'button', title: `📖 용어 사전에서 '${t}' 보기`, onclick: () => glossary?.open(t) }, t)),
    ] : null);
    terms.hidden = !page.terms?.length;
    fill(why, page.why ? el('p', {}, el('strong', {}, '💡 왜? '), page.why) : null, page.more ? el('p', {}, page.more) : null);
    whyBtn.hidden = !page.why && !page.more;

    // ✋ 할 일
    const done = progress.missionsDone(pkey);
    const ms = page.missions ?? [];
    const nDone = ms.filter((_, i) => done[i]).length;
    const all = ms.length > 0 && nDone === ms.length;
    fill(missionHead, el('strong', {}, '✋ 할 일'), el('span.missions__count', { 'data-all': all ? 'true' : null }, all ? `🎉 ${nDone}/${ms.length} 완료!` : `${nDone}/${ms.length}`));
    fill(missionList, ms.map((m, i) => {
      const ok = Boolean(done[i]);
      const text = m.check === 'ask'
        ? el(`button.askbtn${nudgeAsk && !ok ? '.is-nudge' : ''}`, { type: 'button', 'aria-expanded': String(askOpen), onclick: () => { askOpen = !askOpen; askPop.hidden = !askOpen; if (askOpen) drawAsk(page, pkey); } }, m.text)
        : el('span', {}, emoji(m.text));
      return el('li.mission', { 'data-done': ok ? 'true' : null, 'data-i': i },
        el('span.mission__box', { 'aria-hidden': 'true' }, ok ? '✅' : '☐'), text,
        el('span.sr-only', {}, ok ? ' (완료)' : ' (아직)'));
    }));
    missionBox.hidden = !ms.length;
    if (askOpen && page.ask) drawAsk(page, pkey);
    askPop.hidden = !askOpen;

    mini.textContent = `🎯 ${page.objective || page.title}`;
    mini.title = mini.textContent;

    // 앞뒤
    prev.disabled = !prevPlace();
    const np = nextPlace();
    next.disabled = !np;
    next.classList.toggle('is-ready', all);
    if (index < steps.length - 1) next.textContent = '다음 →';
    else if (sub && tab.sub.findIndex((x) => x.id === sub.id) < tab.sub.length - 1) next.textContent = `${tab.sub[tab.sub.findIndex((x) => x.id === sub.id) + 1].name} →`;
    else if (np) { const nt = TABS[TABS.findIndex((t) => t.id === tab.id) + 1]; next.textContent = `${nt.icon} ${nt.label} →`; }
    else next.textContent = '끝!';

    root.classList.toggle('is-folded', Boolean(state.lessonFold));
    foldBtn.textContent = state.lessonFold ? '▾ 목표·할 일 펼치기' : '▴ 접기';
    foldBtn.setAttribute('aria-expanded', String(!state.lessonFold));
  }

  store.subscribe(draw);
  progress.subscribe(() => draw());

  // 미션을 마치면 잠깐 반짝 + 알림
  let toastTimer = null;
  missions.onComplete(({ index: i }) => {
    const li = missionList.querySelector(`[data-i="${i}"]`);
    li?.classList.add('just-done');
    const { tab, sub, steps, index } = currentLesson(store.get());
    const page = steps[index];
    const all = pageDone(progress, tab, sub, page);
    toast.textContent = all ? '🎉 이 쪽의 할 일을 모두 마쳤어요! [다음 →]으로 가요.' : '✅ 할 일 하나 완료!';
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  });

  // 단계 실행이 끝까지 가면 ❓ 확인 문제를 살짝 흔들어 알려 준다
  player.subscribe((v) => {
    if (v.empty || !v.atEnd || nudgeAsk) return;
    const { steps, index } = currentLesson(store.get());
    if (!steps[index].ask) return;
    nudgeAsk = true;
    draw();
  });
}

/**
 * 📚 목차 — 모든 단원의 목표·쪽·내 진도를 한 장에. 쪽을 누르면 그 쪽(기억해 둔 장)으로 간다.
 * (Khan Academy의 단원 목록·Learn Git Branching의 레벨 고르기처럼 "어디까지 했나"가 보이게)
 *
 *   [▶ 이어서 하기 — 2-3 위치]  지금 쪽을 아직 다 하지 않았으면 지금 쪽, 다 했으면 그다음의 아직 못 한 쪽(기억해 둔 장)
 *   단원마다: 생각 열기 질문 · 처음에 맞힌 수 · 할 수 있어요 · 쪽 목록(✓ · ✋ n/m)
 *   👩‍🏫 선생님용(접힘): 단원별 교육과정 성취기준 · 차시 계획(plan.js) · 정보
 */
import { el, fill } from './dom.js';
import { TABS, unitPages, subPrefix, currentLesson, levelTag } from '../app/lessons.js';
import { pageDone, pageCount, unitProgress, canDoDone } from '../app/missions.js';
import { askScore, unitQuizScore, scoreText } from '../app/record.js';
import { visitPatch } from '../app/nav.js';
import { periodRows, pageRange, coursePages } from '../app/plan.js';
import { PRACTICE_URL, REPO_URL, BRANCH } from '../app/links.js';
import { recordButton } from './recordCopy.js';
import { withJosa } from '../core/josa.js';

const placeName = (it) => (/^\d+-\d+$/.test(it.label) ? it.label : `${it.tab.unit.no}단원 ${it.label}`);

export function createCourseDrawer(store, progress, { onReset, flow } = {}) {
  const list = el('div.course');
  const summary = el('span.panel__hint');
  const resumeBtn = el('button.pill.course__resume', { type: 'button' });
  const teacher = el('details.course__teacher');
  const dialog = el('div.modal.modal--wide', { role: 'dialog', 'aria-modal': 'true', 'aria-label': '목차와 진도' });
  const backdrop = el('div.modal__backdrop', { hidden: true }, dialog);
  let lastFocus = null;
  const closeBtn = el('button.pill', { type: 'button', onclick: () => close() }, '닫기 ✕');

  const leave = (patch) => (flow ? flow.leave(patch) : store.set(patch));
  function go(patch) { close(); leave(patch); }

  /** 이어서 할 곳 — 지금 쪽이 남았으면 지금 쪽, 아니면 그 뒤로 아직 못 한 첫 쪽(끝까지 없으면 앞에서부터) */
  function resumeTarget() {
    const all = coursePages();
    const now = currentLesson(store.get());
    const nowPage = now.steps[now.index];
    const last = progress.get().last;
    let at = all.findIndex((it) => it.page === nowPage);
    if (at < 0 && last) at = all.findIndex((it) => it.tab.id === last.tab && it.page.id === last.page && (it.sub?.id ?? null) === (last.sub ?? null));
    const undone = (it) => !pageDone(progress, it.tab, it.sub, it.page);
    const order = at < 0 ? all : [...all.slice(at), ...all.slice(0, at)];
    return order.find(undone) ?? null;
  }

  function drawResume() {
    const it = resumeTarget();
    resumeBtn.hidden = !it;
    if (!it) return;
    const now = currentLesson(store.get());
    const here = it.page === now.steps[now.index];
    fill(resumeBtn, '▶ 이어서 하기', el('small', {}, ` — ${here ? '지금 쪽 ' : ''}${placeName(it)}${it.page.auto ? '' : ` ${it.page.short || it.page.title}`}`));
    resumeBtn.title = `${placeName(it)} ${it.page.title} — 그 쪽에서 보던 장으로 가요`;
    resumeBtn.onclick = () => go(visitPatch(it.tab.id, it.page.id, it.sub?.id));
  }

  function render() {
    const state = store.get();
    const now = currentLesson(state);
    const nowPage = now.steps[now.index];
    let done = 0;
    let total = 0;
    fill(list, TABS.map((tab) => {
      const pr = unitProgress(progress, tab);
      done += pr.done;
      total += pr.total;
      const here = state.tab === tab.id;
      const asks = askScore(progress, tab);
      const quiz = unitQuizScore(progress, tab);
      return el(`section.course__unit${here ? '.is-here' : ''}`, {},
        el('header.course__head', {},
          el('span.course__no', {}, `${tab.unit.no}단원`),
          el('h3', {}, `${tab.icon} ${tab.label}`, tab.verb ? el('small', {}, ` — ${tab.verb}`) : null),
          el('span.course__meter', { style: `--p:${pr.total ? pr.done / pr.total : 0}`, 'aria-label': `${pr.done} / ${pr.total}쪽 완료` }, el('span'), `${pr.done}/${pr.total}`)),
        tab.unit.question ? el('p.course__q', {}, `🤔 ${tab.unit.question}`) : null,
        asks.tried || quiz.tried ? el('p.course__score', {},
          `❓ 쪽 확인 문제 ${scoreText(asks)}`, quiz.total ? ` · 📝 단원 확인 문제 ${scoreText(quiz)}` : '') : null,
        tab.unit.canDo?.length ? el('ul.course__cando', {}, tab.unit.canDo.map((c) => el('li', { 'data-done': canDoDone(progress, tab, c) ? 'true' : null }, c.text))) : null,
        el('ol.course__pages', {}, unitPages(tab).map((it) => {
          const ok = pageDone(progress, tab, it.sub, it.page);
          const cnt = pageCount(progress, tab, it.sub, it.page);
          const isNow = it.page === nowPage;
          return el('li', {}, el('button.course__page', {
            type: 'button', 'data-done': ok ? 'true' : null, 'aria-current': isNow ? 'page' : null,
            onclick: () => go(visitPatch(tab.id, it.page.id, it.sub?.id)),
          },
          el('span.course__label', {}, ok ? '✓' : it.label),
          el('span.course__title', {}, isNow ? el('span.tag.tag--current', {}, '📍 지금') : null, isNow ? ' ' : null,
            subPrefix(it, '[]'), it.page.title, levelTag(it.page) ? ` ${levelTag(it.page)}` : ''),
          el('span.course__obj', {}, it.page.objective ?? ''),
          el('span.course__cnt', {}, cnt.total ? `✋ ${cnt.done}/${cnt.total}` : '')));
        })));
    }));
    summary.textContent = `전체 ${done} / ${total}쪽 완료`;
    drawResume();
  }

  /* ── 👩‍🏫 선생님용 ── */
  function drawTeacher() {
    const rows = periodRows();
    fill(teacher,
      el('summary', {}, '👩‍🏫 선생님용 — 성취기준 · 차시 계획 · 정보'),
      el('div.course__tbody', {},
        el('section.course__tsec', {},
          el('h4', {}, '📐 2022 개정 교육과정 성취기준'),
          TABS.filter((t) => t.unit.standards?.length).map((t) => el('div.course__std', {},
            el('p.course__stdunit', {}, `${t.unit.no}단원 ${t.icon} ${t.label}`),
            el('ul', {}, t.unit.standards.map((s) => el('li', {}, el('code', {}, s.code), ' ', s.text, s.subject ? el('span.card__meta', {}, ` (${s.subject})`) : null)))))),
        el('section.course__tsec', {},
          el('h4', {}, '🗓 차시 계획 — 45분 수업, 쪽 시간 40분 안쪽(5분은 설명·마무리)'),
          el('div.course__tablewrap', {}, el('table.course__plan', {},
            el('thead', {}, el('tr', {}, el('th', {}, '차시'), el('th', {}, '쪽'), el('th', {}, '배우는 것'), el('th', {}, '시간'))),
            el('tbody', {}, rows.map((r) => el('tr', {},
              el('td', {}, `${r.no}`),
              el('td', {}, el('button.course__planlink', {
                type: 'button', title: `${withJosa(placeName(r.pages[0]), '으로/로')} 가기`,
                onclick: () => go(visitPatch(r.pages[0].tab.id, r.pages[0].page.id, r.pages[0].sub?.id, 'start')),
              }, pageRange(r.pages))),
              el('td', {}, r.focus, r.tip ? el('span.course__tip', {}, `💬 ${r.tip}`) : null),
              el('td.course__min', {}, `${r.core}분`, r.minutes !== r.core ? el('small', {}, ` (➕ 포함 ${r.minutes}분)`) : null))))))),
        el('section.course__tsec', {},
          el('h4', {}, 'ℹ 정보'),
          el('p', {}, '데이터: palmerpenguins (CC0, Palmer Station LTER)'),
          el('p', {},
            el('a', { href: './practice/', target: '_blank', rel: 'noopener', title: PRACTICE_URL }, '🕸 크롤링 연습 사이트'), ' · ',
            el('a', { href: `${REPO_URL}/blob/${BRANCH}/REQUIREMENTS.md`, target: '_blank', rel: 'noopener' }, '요구사항 정의서'), ' · ',
            el('a', { href: `${REPO_URL}/blob/${BRANCH}/docs/TEACHER.md`, target: '_blank', rel: 'noopener' }, '교사용 안내서')),
          el('p.card__meta', {}, '발표용 리모컨의 PageDown/PageUp으로 학급 전체를 한 장씩 넘길 수 있어요. 장 칩과 쪽 ▾는 언제나 눌러져요.'))));
  }

  function close() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    lastFocus?.focus?.();
  }
  function open() {
    lastFocus = document.activeElement;
    render();
    if (!teacher.childElementCount) drawTeacher();
    backdrop.hidden = false;
    const here = dialog.querySelector('[aria-current="page"]') ?? dialog.querySelector('.is-here');
    const scroller = dialog.querySelector('.modal__scroll');
    if (scroller) scroller.scrollTop = 0;
    if (here && scroller) scroller.scrollTop = here.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientHeight / 3;
    (resumeBtn.hidden ? closeBtn : resumeBtn).focus();
  }

  fill(dialog,
    el('div.modal__head', {}, el('span.panel__title', {}, '📚 목차와 내 진도'), summary, el('span.course__spacer'),
      resumeBtn,
      recordButton(progress),
      el('button.pill.pill--sm', {
        type: 'button', title: '이 브라우저에 저장된 진도(✅)를 모두 지워요',
        onclick: () => { if (confirm('📋 내 학습 기록은 먼저 복사해 두었나요?\n진도(✅ 표시)와 문제 답, 처음 고른 답 기록까지 모두 지워져요. 한번 지우면 되돌릴 수 없어요.')) { progress.reset(); onReset?.(); render(); } },
      }, '↺ 진도 초기화'),
      closeBtn),
    el('div.modal__scroll', {}, list, teacher),
    el('p.modal__note', {}, '진도는 지금 쓰는 컴퓨터의 이 브라우저에만 저장돼요. 어떤 쪽의 할 일을 모두 하면 그 쪽에 ✓가 붙어요. 건너뛴 할 일은 ☐로 남아요. "처음에 맞힘"은 답을 고쳐 고르기 전, 맨 처음 고른 답으로만 센 개수예요.'));
  document.body.append(backdrop);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => { if (!backdrop.hidden && e.key === 'Escape') close(); });
  return { open, close };
}

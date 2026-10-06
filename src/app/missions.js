/**
 * 미션 자동 체크 — 쪽의 "✋ 할 일"을 학생이 실제로 했을 때 스스로 ✅가 된다.
 * (Codecademy 체크포인트·freeCodeCamp 테스트처럼: 막지는 않고, 했는지를 보여 준다)
 *
 * 미션 { text, check } 의 check 낱말
 *   'visit'        쪽을 열면 끝 (되도록 쓰지 않는다 — 읽기만 하는 쪽에도 손으로 할 일을 준다)
 *   'step:N'       ⏭ 한 단계를 눌러 N번 장면(0부터 센다)까지 가 보기
 *   'end'          단계 실행을 마지막 장면까지
 *   'back'         ⏮ 뒤로를 한 번 이상
 *   'python'       🐍 파이썬 같이 보기를 켜기
 *   'colab'        📒 Colab 단추(링크) 누르기
 *   'quiz'         이 쪽의 문제 상자(quizBox)를 모두 풀기
 *   'right:N'      이 쪽의 문제 상자에서 N개 이상 맞히기
 *   'ask'          ❓ 확인 문제(쪽의 ask)를 맞히기
 *   'act:이름'     장면이 ctx.check('이름')으로 알려 주는 행동(칸 누르기, k 바꾸기 …)
 */
import { pageKey } from './progress.js';
import { unitPages, findPage } from './lessons.js';

/** 낱말 하나가 이번 사건으로 이루어졌는가 */
function satisfied(check, ev) {
  if (check === 'visit') return ev.type === 'visit';
  if (check.startsWith('step:')) return ev.type === 'player' && ev.index >= Number(check.slice(5));
  if (check === 'end') return ev.type === 'player' && ev.atEnd && ev.total > 1;
  if (check === 'back') return ev.type === 'back';
  if (check === 'python') return ev.type === 'python';
  if (check === 'colab') return ev.type === 'colab';
  if (check === 'quiz') return ev.type === 'quiz' && ev.answered >= ev.total;
  if (check.startsWith('right:')) return ev.type === 'quiz' && ev.right >= Number(check.slice(6));
  if (check === 'ask') return ev.type === 'ask' && ev.right;
  if (check.startsWith('act:')) return ev.type === 'act' && ev.name === check.slice(4);
  return false;
}

/** 쪽 하나를 다 했나 — 미션이 모두 ✅ (미션이 없으면 열어 보기만 해도) */
export function pageDone(progress, tab, sub, page) {
  const key = pageKey(tab.id, sub?.id, page.id);
  const ms = page.missions ?? [];
  if (!ms.length) return progress.visited(key);
  const done = progress.missionsDone(key);
  return ms.every((_, i) => done[i]);
}

/** 쪽의 미션 진행 — { done, total } */
export function pageCount(progress, tab, sub, page) {
  const done = progress.missionsDone(pageKey(tab.id, sub?.id, page.id));
  const total = (page.missions ?? []).length;
  return { done: (page.missions ?? []).filter((_, i) => done[i]).length, total };
}

/** 단원(탭) 진행 — { done, total } 쪽 수. sub를 주면 하위 탭만 */
export function unitProgress(progress, tab, subId = null) {
  const list = unitPages(tab).filter((it) => !subId || it.sub?.id === subId);
  return { done: list.filter((it) => pageDone(progress, tab, it.sub, it.page)).length, total: list.length };
}

/** 할 수 있어요 항목이 이루어졌나 — 그 항목의 쪽을 모두 마쳤을 때 */
export function canDoDone(progress, tab, item) {
  const list = item.pages.map((ref) => findPage(tab, ref)).filter(Boolean);
  return list.length > 0 && list.every((it) => pageDone(progress, tab, it.sub, it.page));
}

export function createMissions(progress) {
  let page = null;     // { key, missions }
  const listeners = new Set();

  function fire(ev) {
    if (!page) return;
    const done = progress.missionsDone(page.key);
    page.missions.forEach((m, i) => {
      if (done[i] || !satisfied(m.check, ev)) return;
      if (progress.complete(page.key, i)) for (const fn of listeners) fn({ key: page.key, index: i, mission: m });
    });
  }

  return {
    /** 쪽이 바뀔 때 sceneHost가 부른다 */
    enter(tab, sub, pageDef) {
      page = { key: pageKey(tab.id, sub?.id, pageDef.id), missions: pageDef.missions ?? [] };
      progress.visit(page.key, { tab: tab.id, sub: sub?.id ?? null, page: pageDef.id });
      fire({ type: 'visit' });
    },
    /** 사건 알리기 — 재생기·코드 패널·문제 상자·장면이 부른다 */
    emit: fire,
    act: (name) => fire({ type: 'act', name }),
    /** 미션을 처음 마칠 때마다 (축하 표시용) */
    onComplete(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    currentKey: () => page?.key ?? null,
  };
}

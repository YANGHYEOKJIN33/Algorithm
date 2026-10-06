/**
 * 수업 내용 점검기 — course/ 의 단원·쪽이 약속(lessons.js 머리말)을 지키는지 모두 찾아 알려 준다.
 *
 *   node scripts/check-course.mjs            모든 단원
 *   node scripts/check-course.mjs inspect    한 단원만 (기계학습 하위 탭만: ml:knn,ml:tree)
 *
 * test/site.test.js도 이 함수를 쓴다(문제가 하나라도 있으면 실패).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { TABS, unitPages } from '../src/app/lessons.js';
import { NOTEBOOKS } from '../src/app/notebooks.js';
import { GLOSSARY } from '../src/app/glossary.js';
import { getScene, sceneNames } from '../src/scenes/index.js';

const sceneDir = new URL('../src/scenes/', import.meta.url);
const sceneSrc = readdirSync(sceneDir).filter((f) => f.endsWith('.js'))
  .map((n) => readFileSync(new URL(n, sceneDir), 'utf8')).join('\n');
const TERMS = new Set(GLOSSARY.flatMap((g) => g.items.map((it) => it.term)));
const CHECK = /^(end|back|python|colab|quiz|ask|step:\d+|right:\d+|act:[\w-]+)$/;
const names = new Set(sceneNames());

/** 쪽 하나의 문제 목록 */
function pageProblems(tab, sub, page) {
  const at = `${tab.id}${sub ? `:${sub.id}` : ''}:${page.id}`;
  const out = [];
  const bad = (msg) => out.push(`${at} — ${msg}`);
  if (!page.title) bad('title 없음');
  let def = null;
  if (page.scene.startsWith('python:')) {
    if (!NOTEBOOKS.some((n) => n.id === page.scene.slice(7))) bad(`노트북 없음: ${page.scene}`);
  } else if (!names.has(page.scene)) bad(`장면 없음: ${page.scene}`);
  else def = getScene(page.scene);
  const step = def?.kind === 'step';
  let frames = 0;
  if (step) { try { frames = def.frames({ store: { get: () => ({}) } }).length; } catch { frames = 0; } }

  if (!/수 있다\.$/.test(page.objective ?? '')) bad(`objective는 "~할 수 있다."로 끝나는 한 문장: "${page.objective ?? ''}"`);
  else if (page.objective.length > 70) bad(`objective가 너무 길다(${page.objective.length}자, 70자까지)`);
  if (!page.short || page.short.length > 8) bad(`short(단계 표시 이름) 1~8자: "${page.short ?? ''}"`);
  if (!page.why || page.why.length > 90) bad(`why는 한 문장(90자까지): ${page.why?.length ?? 0}자`);
  const ms = page.missions ?? [];
  if (ms.length < 1 || ms.length > 4) bad(`missions 1~4개(지금 ${ms.length}개)`);
  for (const m of ms) {
    if (!m.text) bad('미션 text 없음');
    else if (m.text.length > 46) bad(`미션 글이 길다(${m.text.length}자, 46자까지): "${m.text}"`);
    if (!CHECK.test(m.check ?? '')) { bad(`미션 check 낱말이 틀렸다: '${m.check}'`); continue; }
    if (m.check.startsWith('act:') && !sceneSrc.includes(`check('${m.check.slice(4)}')`)) bad(`장면이 ctx.check('${m.check.slice(4)}')를 부르지 않는다`);
    if (m.check.startsWith('step:')) {
      const n = Number(m.check.slice(5));
      if (!step) bad(`'${m.check}'는 단계 실행 쪽에서만`);
      else if (n < 1 || n >= frames) bad(`'${m.check}' — 장면은 0~${frames - 1}번(${frames}장)`);
    }
    if (['end', 'back', 'python'].includes(m.check) && !step) bad(`'${m.check}'는 단계 실행 쪽에서만`);
    if (m.check === 'colab' && !page.scene.startsWith('python:') && !def?.notebook) bad("'colab' — 이 쪽에는 Colab 단추가 없다");
    if (m.check === 'ask' && !page.ask) bad("'ask' 미션인데 ask가 없다");
  }
  for (const t of page.terms ?? []) if (!TERMS.has(t)) bad(`용어 사전에 없는 학습 요소 '${t}'`);
  if ((page.terms ?? []).length > 3) bad('학습 요소는 3개까지');
  if (page.ask) {
    const a = page.ask;
    if (!a.q || !a.why || !(a.options?.length >= 2)) bad('ask는 q·options(2개 이상)·why');
    else if (!(a.answer >= 0 && a.answer < a.options.length)) bad('ask 정답 번호가 보기 밖');
  }
  if (!page.auto && !(page.minutes > 0)) bad('minutes 없음');
  if (page.goal || page.todo) bad('옛 goal/todo가 남아 있다 — more·missions로 옮긴다');
  return out;
}

/** 단원 하나의 문제 목록 */
function unitProblems(tab) {
  const out = [];
  const bad = (msg) => out.push(`${tab.id} 단원 — ${msg}`);
  const u = tab.unit;
  const refs = new Set(unitPages(tab).flatMap((it) => [it.page.id, `${it.sub?.id}:${it.page.id}`]));
  if (!Number.isInteger(u.no)) bad('unit.no 없음');
  if (!tab.verb) bad('verb(탭의 동사, 예: 문제 찾기) 없음');
  if (!u.question) bad('unit.question 없음');
  if (!u.bigIdea) bad('unit.bigIdea 없음');
  if (!u.hook || !(u.hook.answer >= 0 && u.hook.answer < (u.hook.options?.length ?? 0)) || !u.hook.reveal) bad('unit.hook { q, options, answer, reveal }');
  if (!(u.canDo?.length >= 2 && u.canDo.length <= 6)) bad('unit.canDo 2~6개');
  for (const c of u.canDo ?? []) {
    if (!/수 있다\.$/.test(c.text)) bad(`canDo는 "~할 수 있다.": "${c.text}"`);
    if (!c.pages?.length || !c.pages.every((r) => refs.has(r))) bad(`canDo.pages에 없는 쪽: ${c.pages}`);
  }
  if (!(u.summary?.length >= 3 && u.summary.length <= 5)) bad('unit.summary(1분 요약) 3~5문장');
  if (!(u.quiz?.length >= 3)) bad('unit.quiz 3문제 이상');
  for (const q of u.quiz ?? []) {
    if (!(q.answer >= 0 && q.answer < q.options.length) || !q.why) bad(`quiz 정답 번호·why: ${q.q}`);
    if (q.page && !refs.has(q.page)) bad(`quiz.page에 없는 쪽: ${q.page}`);
  }
  if (!(u.standards?.length >= 1) || !u.standards.every((s) => /^\[12\S+\]$/.test(s.code) && s.text)) bad('unit.standards [{ code: "[12인기02-01]", text }]');
  if (!u.before || !u.after) bad('unit.before / unit.after 없음');
  if (!(u.minutes > 0)) bad('unit.minutes 없음');
  if (tab.sub) for (const s of tab.sub) if (s.id !== 'review' && !s.tag) out.push(`${tab.id}:${s.id} 하위 탭 — tag(예: 분류 · 지도학습) 없음`);
  return out;
}

/** filter: 'inspect' 또는 'ml:knn,ml:tree' 또는 'ml' */
export function courseProblems(filter = null) {
  const want = filter ? filter.split(',') : null;
  const out = [];
  for (const tab of TABS) {
    const tabWanted = !want || want.some((w) => w === tab.id || w.startsWith(`${tab.id}:`));
    if (!tabWanted) continue;
    const whole = !want || want.includes(tab.id);
    if (whole) out.push(...unitProblems(tab));
    for (const it of unitPages(tab)) {
      if (!whole && !want.includes(`${tab.id}:${it.sub?.id}`)) continue;
      out.push(...pageProblems(tab, it.sub, it.page));
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const list = courseProblems(process.argv[2] ?? null);
  console.log(list.length ? list.join('\n') : '✅ 문제 없음');
  console.log(`\n${list.length}개`);
  process.exitCode = list.length ? 1 : 0;
}

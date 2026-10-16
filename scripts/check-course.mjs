/**
 * 수업 내용 점검기 — course/ 의 단원·쪽이 약속(lessons.js 머리말)을 지키는지 모두 찾아 알려 준다.
 *
 *   node scripts/check-course.mjs            모든 단원
 *   node scripts/check-course.mjs inspect    한 단원만 (기계학습 하위 탭만: ml:knn,ml:tree)
 *
 * test/site.test.js도 이 함수를 쓴다(문제가 하나라도 있으면 실패).
 *
 * 한 장에 한 가지(FINAL_SPEC §5.4)에서 더한 약속
 *   - takeaway(핵심 한 줄): 표지·정리 말고 모든 쪽, 10~60자, "."으로 끝나는 한 문장(1.5 · df.isnull() 의 점은 문장 끝이 아니다)
 *   - setup: 단계 실행 쪽마다 60자까지 · look: 'step:N'·'end' 미션마다 24자까지 · chip: 단계 실행 쪽 act 미션마다 8자까지
 *   - beats: 살펴보기 쪽마다 — id가 겹치지 않고, chip 8 · title 28 · lead 50자까지, show의 id는 장면 소스(하위 폴더 포함)의
 *     data-beat 글자 그대로, checks는 그 쪽 미션 안에서, ask 말고 모든 미션이 꼭 한 장에, 한 장에 check 2개는 허용된 짝만,
 *     한 장에 보이는 덩어리 3개까지(예외: 5-4 영역 색칠 장은 고정 표대로 4개)
 *   - 모든 쪽(pageBeats): 장 3~8개, 읽기 장 4개까지, 어느 장에도 들지 않은 미션 없음
 *   - act:<이름>(begin 말고)은 장면 소스나 src/ui/slideCard.js에 data-act 글자로 있어야 한다(보라 고리가 갈 곳)
 *   - 없어진 화면 틀을 가리키는 말(REMOVED_CHROME)이 course 파일·장면 소스에 없어야 한다
 */
import { readFileSync, readdirSync } from 'node:fs';
import { TABS, unitPages } from '../src/app/lessons.js';
import { NOTEBOOKS } from '../src/app/notebooks.js';
import { GLOSSARY } from '../src/app/glossary.js';
import { getScene, sceneNames } from '../src/scenes/index.js';
import { pageBeats, deckKind } from '../src/app/beats.js';

/** 폴더 아래 .js 파일을 하위 폴더까지 모두 — [{ name, text }] */
function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    if (d.isDirectory()) return jsFiles(new URL(`${d.name}/`, dir)).map((f) => ({ ...f, name: `${d.name}/${f.name}` }));
    return d.name.endsWith('.js') ? [{ name: d.name, text: readFileSync(new URL(d.name, dir), 'utf8') }] : [];
  });
}
const sceneDir = new URL('../src/scenes/', import.meta.url);
const sceneFiles = jsFiles(sceneDir);
const sceneSrc = sceneFiles.map((f) => f.text).join('\n');
const courseFiles = jsFiles(new URL('../src/app/course/', import.meta.url));
const slideSrc = readFileSync(new URL('../src/ui/slideCard.js', import.meta.url), 'utf8');

/** 소스에 글자 그대로 적힌 data-beat / data-act 값 — 'data-act': 'a b' · setAttribute('data-act', 'a') · data-act="a" */
function attrWords(src, attr) {
  const out = new Set();
  const re = new RegExp(`['"]?${attr}['"]?\\s*[:,]\\s*'([^']+)'|${attr}="([^"]+)"`, 'g');
  for (const m of src.matchAll(re)) for (const w of (m[1] ?? m[2]).split(/\s+/)) if (w) out.add(w);
  return out;
}
const BEAT_IDS = attrWords(sceneSrc, 'data-beat');
const ACT_WORDS = attrWords(`${sceneSrc}\n${slideSrc}`, 'data-act');

/** 없어진 화면 틀을 가리키는 말(FINAL_SPEC §4.6) — course 파일과 장면 소스에 남으면 안 된다 */
export const REMOVED_CHROME = /맨 위 탭|레슨 막대|오른쪽 위 ✋|할 일 상자|단계 표시 줄|💡 왜 배울까|할 일 맨 아래/;

/** 한 장에 보이는 덩어리는 3개까지 — 단, 아래 장은 FINAL_SPEC §4.4의 고정 표가 4개로 정했다 */
const SHOW_LIMIT_EXCEPT = new Set(['ml:knn:idea#region']);   // 5-4 영역 색칠: knn-k · knn-region · knn-chart · knn-side

/** 두 check를 한 장에 둘 수 있는 짝(FINAL_SPEC §1.3) */
const pairOk = (cs) => cs.length <= 1
  || (cs.length === 2 && ((cs.includes('quiz') && cs.some((c) => /^right:\d+$/.test(c)))
    || (cs.includes('act:flow-open') && cs.includes('act:flow-all'))));

/**
 * 한 문장인가 — 소수점(1.5)·이름 사이 점(df.isnull())·말줄임은 문장 끝으로 치지 않는다.
 * 문장 끝 부호([.?!] 뒤에 빈칸이나 글 끝)가 맨 끝 "." 하나뿐이어야 한다.
 */
export function oneSentence(text) {
  const t = String(text ?? '').trim();
  if (!t.endsWith('.')) return false;
  const masked = t.replace(/(?<=[\w)\]])\.(?=[\w(])/g, '·').replace(/\.{2,}|…/g, '·');
  return (masked.match(/[.?!](?=\s|$)/g) ?? []).length === 1;
}
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
    if (m.check.startsWith('act:') && !new RegExp(`check\\('${m.check.slice(4)}'\\)`).test(sceneSrc)) bad(`장면이 ctx.check('${m.check.slice(4)}')를 부르지 않는다`);
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
  out.push(...flowProblems(tab, sub, page, bad));
  return out;
}

/** 한 장에 한 가지(FINAL_SPEC §4.1·§5.4) — 핵심 한 줄·데이터 한 줄·볼 곳·장 칩·살펴보기 쪽의 장 차례 */
function flowProblems(tab, sub, page, bad) {
  const kind = deckKind(page);
  const ms = page.missions ?? [];
  const checks = new Set(ms.map((m) => m.check));
  if (!page.auto) {
    const t = page.takeaway;
    if (!t) bad('takeaway(핵심 한 줄) 없음');
    else if (t.length < 10 || t.length > 60) bad(`takeaway는 10~60자(지금 ${t.length}자): "${t}"`);
    else if (!oneSentence(t)) bad(`takeaway는 "."으로 끝나는 한 문장: "${t}"`);
  }
  if (kind === 'step') {
    if (!page.setup) bad('setup(📦 이 쪽에서 쓰는 데이터) 없음');
    else if (page.setup.length > 60) bad(`setup은 60자까지(지금 ${page.setup.length}자): "${page.setup}"`);
  }
  for (const m of ms) {
    const c = m.check ?? '';
    if (/^(step:\d+|end)$/.test(c)) {
      if (!m.look) bad(`'${c}' 미션에 look(👀 볼 곳) 없음`);
      else if (m.look.length > 24) bad(`look은 24자까지(지금 ${m.look.length}자): "${m.look}"`);
    }
    if (c.startsWith('act:') && kind === 'step' && !m.chip) bad(`'${c}' 미션에 chip(장 칩 이름) 없음 — 단계 실행 쪽의 act 미션`);
    if (m.chip && m.chip.length > 8) bad(`chip은 8자까지(지금 ${m.chip.length}자): "${m.chip}"`);
    if (c.startsWith('act:') && c !== 'act:begin' && !ACT_WORDS.has(c.slice(4))) bad(`'${c}' — 장면 소스나 slideCard에 data-act="${c.slice(4)}"가 없다(보라 고리가 갈 곳)`);
  }

  if (kind === 'view') {
    const list = page.beats;
    if (!Array.isArray(list) || !list.length) bad('beats(살펴보기 쪽의 장 차례) 없음');
    else {
      const ids = new Set();
      for (const b of list) {
        const at = `장 '${b.id}'`;
        if (!b.id) bad('beats에 id 없는 장');
        else if (ids.has(b.id)) bad(`${at} — id가 겹친다`);
        ids.add(b.id);
        if (!b.chip || b.chip.length > 8) bad(`${at} — chip 1~8자: "${b.chip ?? ''}"`);
        if (!b.title || b.title.length > 28) bad(`${at} — title 1~28자(지금 ${b.title?.length ?? 0}자): "${b.title ?? ''}"`);
        if (b.lead && b.lead.length > 50) bad(`${at} — lead는 50자까지(지금 ${b.lead.length}자)`);
        if (b.show !== null && !Array.isArray(b.show)) bad(`${at} — show는 [data-beat id] 또는 null`);
        for (const id of b.show ?? []) if (!BEAT_IDS.has(id)) bad(`${at} — show의 '${id}'가 장면 소스의 data-beat에 없다`);
        const key = `${tab.id}${sub ? `:${sub.id}` : ''}:${page.id}#${b.id}`;
        if ((b.show ?? []).length > 3 && !SHOW_LIMIT_EXCEPT.has(key)) bad(`${at} — 한 장에 보이는 덩어리는 3개까지(지금 ${b.show.length}개)`);
        for (const c of b.checks ?? []) {
          if (!checks.has(c)) bad(`${at} — checks의 '${c}'가 이 쪽 미션에 없다`);
          if (c === 'ask') bad(`${at} — 'ask'는 적지 않는다(확인 장이 저절로 맡는다)`);
        }
        if (!pairOk(b.checks ?? [])) bad(`${at} — 한 장의 checks는 1~2개, 둘은 quiz+right:N 또는 act:flow-open+act:flow-all 짝만: ${b.checks}`);
      }
      // 미션마다 꼭 한 장에만
      for (const c of checks) {
        if (c === 'ask') continue;
        const n = list.filter((b) => (b.checks ?? []).includes(c)).length;
        if (n !== 1) bad(`미션 '${c}'가 장 ${n}개에 들어 있다(꼭 한 장에만)`);
      }
    }
  }

  // 만들어진 장 차례(beats.js) 전체로 다시 확인
  const deck = pageBeats(tab, sub, page);
  if (deck.length < 3 || deck.length > 8) bad(`장이 3~8개여야 한다(지금 ${deck.length}개: ${deck.map((b) => b.chip).join(' · ')})`);
  const reads = deck.filter((b) => b.kind === 'read').length;
  if (reads > 4) bad(`읽기 장은 4개까지(지금 ${reads}개)`);
  if (deck.some((b) => b.id === 'rest')) bad(`어느 장에도 들지 않은 미션이 있다: ${deck.find((b) => b.id === 'rest').checks}`);
  for (const c of checks) {
    const n = deck.filter((b) => b.checks.includes(c)).length;
    if (n !== 1) bad(`장 차례에서 미션 '${c}'가 ${n}개 장에 있다`);
  }
  for (const b of deck) if (!pairOk(b.checks.filter((c) => c !== 'ask'))) bad(`장 '${b.id}' — checks ${b.checks}`);
  return [];
}

/** 없어진 화면 틀을 가리키는 말이 course 파일·장면 소스에 남았는가 */
export function removedChromeProblems() {
  const out = [];
  const scan = (files, dir) => {
    for (const f of files) {
      f.text.split('\n').forEach((line, i) => {
        const m = line.match(REMOVED_CHROME);
        if (m) out.push(`${dir}${f.name}:${i + 1} — 없어진 화면 틀을 가리키는 말 '${m[0]}'(FINAL_SPEC §4.6)`);
      });
    }
  };
  scan(courseFiles, 'src/app/course/');
  scan(sceneFiles, 'src/scenes/');
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
  // 정답 자리가 한쪽(예: 늘 가운데)에 몰리면 내용을 몰라도 맞힐 수 있다
  const answers = [...unitPages(tab).map((it) => it.page.ask?.answer), ...(u.quiz ?? []).map((q) => q.answer)].filter((a) => a !== undefined);
  if (answers.length >= 4) {
    const most = Math.max(...[0, 1, 2, 3].map((k) => answers.filter((a) => a === k).length));
    if (most / answers.length > 0.6) bad(`정답 자리가 한쪽에 몰렸다(ask·quiz 정답 번호 ${answers.join('')}) — 보기 순서를 섞어 고르게`);
  }
  if ((u.quiz ?? []).length >= 3 && new Set(u.quiz.map((q) => q.answer)).size === 1) bad('단원 확인 문제의 정답 자리가 모두 같다');
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
  if (!want) out.push(...removedChromeProblems());
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const list = courseProblems(process.argv[2] ?? null);
  console.log(list.length ? list.join('\n') : '✅ 문제 없음');
  console.log(`\n${list.length}개`);
  process.exitCode = list.length ? 1 : 0;
}

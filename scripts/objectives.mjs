/**
 * 교사용 학습 목표표 — docs/OBJECTIVES.md 를 수업 내용(src/app/course/*.js)에서 만든다.
 * `npm run build`가 함께 만들고, 테스트가 디스크의 파일이 지금 내용과 같은지 확인한다.
 */
import { TABS, unitPages } from '../src/app/lessons.js';
import { periodRows, pageRange } from '../src/app/plan.js';

const cell = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

function unitSection(tab) {
  const u = tab.unit;
  const head = `## ${u.no}단원 ${tab.icon} ${tab.label} — ${tab.verb}`;
  const pages = unitPages(tab);
  const lines = [
    head,
    '',
    `- **생각 열기**: ${u.question}`,
    `- **핵심 아이디어**: ${u.bigIdea}`,
    `- **데이터**: ${u.before} → ${u.after}`,
    `- **시간**: 약 ${u.minutes}분 · ${pages.length}쪽`,
    `- **성취기준**: ${(u.standards ?? []).map((s) => `${s.code} ${s.text}${s.subject ? ` (${s.subject})` : ''}`).join(' / ')}`,
    '',
    '**이 단원을 마치면 (할 수 있어요)**',
    '',
    ...(u.canDo ?? []).map((c) => `- ${c.text}`),
    '',
    '| 쪽 | 제목 | 🎯 학습 목표 | 학습 요소 | ✋ 할 일 (하면 저절로 ✅) | 시간 |',
    '|---|---|---|---|---|---|',
    ...pages.map((it) => {
      const p = it.page;
      const sub = it.sub && it.sub.id !== 'review' && !p.auto ? `[${it.sub.name}] ` : '';
      const ms = (p.missions ?? []).map((m) => (m.check === 'ask' && p.ask ? `❓ ${p.ask.q}` : m.text));
      return `| ${it.label} | ${cell(sub + p.title)}${p.level === 'challenge' ? ' 🔥' : ''}${p.level === 'optional' ? ' ➕' : ''} | ${cell(p.objective)} | ${cell((p.terms ?? []).join(', '))} | ${ms.map(cell).join('<br>')} | ${p.minutes ?? ''}분 |`;
    }),
    '',
    '**1분 요약**',
    '',
    ...(u.summary ?? []).map((s, i) => `${i + 1}. ${s}`),
    '',
    '**단원 확인 문제**',
    '',
    ...(u.quiz ?? []).map((q, i) => `${i + 1}. ${q.q} — 정답: **${q.options[q.answer]}** (${q.why})`),
    '',
  ];
  return lines.join('\n');
}

/** 차시표 — docs/TEACHER.md의 표시 사이와 OBJECTIVES.md 맨 위에 같은 표가 들어간다 */
export function planMarkdown() {
  const rows = periodRows();
  const last = rows.at(-1);
  return [
    '| 차시 | 쪽 | 배우는 것 | 쪽 시간 | 수업 팁 |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.no}${r.project ? '~' : ''} | ${pageRange(r.pages)} | ${cell(r.focus)} | ${r.minutes}분${r.core !== r.minutes ? ` (➕ 빼면 ${r.core}분)` : ''} | ${cell(r.tip ?? '')} |`),
    '',
    `쪽 시간의 합은 모두 ${rows.reduce((s, r) => s + r.minutes, 0)}분이고, 한 차시는 40분을 넘지 않게 묶었습니다(5분은 설명·마무리).`
      + ` ${last.no}차시부터는 프로젝트입니다.`,
  ].join('\n');
}

export function objectivesMarkdown() {
  return [
    '# 학습 목표표 (교사용)',
    '',
    '> 이 파일은 `npm run build`가 수업 내용(`src/app/course/*.js`)에서 만들어요. 직접 고치지 말고 그 파일을 고친 뒤 다시 만드세요.',
    '>',
    '> 쪽마다 🎯 학습 목표(~할 수 있다)·학습 요소·✋ 할 일이 있고, 학생이 할 일을 실제로 하면 화면에서 저절로 ✅가 됩니다.',
    '> 단원마다 맨 앞에 🧭 표지(생각 열기·할 수 있어요·쪽 목록), 맨 뒤에 📝 정리(1분 요약·스스로 점검·확인 문제)가 붙습니다.',
    '> 🔥 = 도전(수학이 많은 쪽), ➕ = 더 알아보기(선택).',
    '',
    '| 단원 | 동사 | 생각 열기 | 쪽 | 시간 |',
    '|---|---|---|---|---|',
    ...TABS.map((t) => `| ${t.unit.no}단원 ${t.icon} ${t.label} | ${t.verb} | ${cell(t.unit.question)} | ${unitPages(t).length} | ${t.unit.minutes}분 |`),
    '',
    '## 차시 계획 (45분 수업)',
    '',
    planMarkdown(),
    '',
    ...TABS.map(unitSection),
  ].join('\n');
}

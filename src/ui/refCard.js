/**
 * 📖 근거 카드 — 확인 문제 왼쪽에 "그 문제를 배운 쪽"의 핵심을 펼쳐 둔다.
 * 단원 정리·6-3 이해 확인처럼 앞 쪽의 내용을 묻는 문제에서, 그 쪽으로 옮겨 가지 않고 좌우를 견주며 풀게 한다.
 *
 *   refCard(tab, ref)   ref = '쪽id' · '하위탭:쪽id'(단원 정리) 또는 { tab, page, sub }(6-3)
 *   → 쪽 번호·제목 · 핵심 한 줄(takeaway) · 이 쪽의 데이터(setup) · 🎯 목표 ·
 *     단계 실행 쪽이면 의사코드 읽기 모드(줄마다 설명) · 💡 자세한 설명(접힘)
 */
import { el } from './dom.js';
import { TABS, findPage } from '../app/lessons.js';
import { getScene } from '../scenes/index.js';
import { readView } from './codePanel.js';

/** ref → { tab, it }  (it = unitPages 항목: { sub, page, label }) */
export function resolveRef(tab, ref) {
  if (!ref) return null;
  if (typeof ref === 'string') {
    const it = tab ? findPage(tab, ref) : null;
    return it ? { tab, it } : null;
  }
  const t = TABS.find((x) => x.id === ref.tab);
  if (!t) return null;
  const it = findPage(t, ref.sub ? `${ref.sub}:${ref.page}` : ref.page);
  return it ? { tab: t, it } : null;
}

export function refCard(tab, ref) {
  const r = resolveRef(tab, ref);
  if (!r) return el('aside.ref.ref--empty', {}, el('p.ref__kicker', {}, '📖 근거'), el('p', {}, '이 문제는 지금까지 배운 내용 전체에서 생각해 봐요.'));
  const { tab: t, it } = r;
  const p = it.page;
  let def = null;
  try { def = getScene(p.scene); } catch { def = null; }
  const step = def?.kind === 'step' && Array.isArray(def.pseudo) && def.pseudo.length;
  return el('aside.ref', { 'aria-label': '근거 — 이 문제를 배운 쪽' },
    el('p.ref__kicker', {}, `📖 근거 · ${t.unit.no}단원 ${t.icon} ${t.label} · ${it.label}`),
    el('h3.ref__title', {}, p.title),
    p.takeaway ? el('p.ref__take', {}, el('span.ref__take-tag', {}, '핵심 한 줄'), ' ', p.takeaway) : null,
    p.setup ? el('p.ref__setup', {}, `📦 ${p.setup}`) : null,
    p.objective ? el('p.ref__goal', {}, `🎯 ${p.objective}`) : null,
    step ? el('div.ref__code', {}, el('p.ref__sub', {}, `📝 이 쪽의 의사코드 — ${def.pseudo.length}줄`), readView({ pseudo: def.pseudo })) : null,
    p.more ? el('details.ref__more', {}, el('summary', {}, '💡 자세한 설명 펼치기'), el('p', {}, p.more)) : null);
}

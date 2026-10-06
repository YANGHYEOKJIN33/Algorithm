/**
 * 🏁 시작 — 의사코드 읽는 법: "가장 무거운 펭귄 찾기"
 * ← (넣기) · 반복 · 만약 · 들여쓰기를 가장 작은 예로 익히고, 사이트의 단계 실행 사용법도 함께 익힌다.
 */
import { pick } from './data/practice.js';

export const MAX_IDS = [1, 3, 153, 8, 154, 277];

export const PSEUDO = [
  { code: '최고 ← 첫 번째 펭귄의 몸무게', note: '← 는 "오른쪽 값을 왼쪽 상자(변수)에 넣는다"는 뜻이에요. 일단 첫 펭귄을 최고로 정해 둬요.' },
  { code: '반복: 나머지 펭귄 p를 하나씩', note: '반복은 같은 일을 되풀이해요. 아래로 들여 쓴 줄들이 "반복 안에서" 할 일이에요.' },
  { code: '    만약 p의 몸무게 > 최고 이면', note: '만약은 조건이에요. 조건이 맞을 때만 그 아래(더 들여 쓴) 줄을 실행해요.' },
  { code: '        최고 ← p의 몸무게', note: '더 무거운 펭귄을 만나면 상자 속 값을 새 값으로 바꿔요. 옛 값은 사라져요.' },
  { code: '최고를 알려 준다', note: '반복이 다 끝나면(들여쓰기가 끝난 줄) 상자에 남은 값이 답이에요.' },
];

export const PYTHON = [
  'best = weights[0]',
  'for w in weights[1:]:',
  '    if w > best:',
  '        best = w',
  'print(best)',
];

export function maxFrames() {
  const items = pick(MAX_IDS, ['번호', '종', '몸무게']).rows.map((r) => ({ id: r.번호, label: r.종, w: r.몸무게 }));
  const frames = [];
  let best = null;
  let bestId = null;
  const snap = (extra) => frames.push({ items, best, bestId, focus: null, cmp: null, ...extra });

  best = items[0].w; bestId = items[0].id;
  snap({ line: 1, icon: '📦', focus: items[0].id, say: `'최고' 상자에 첫 펭귄(${items[0].id}번)의 몸무게 ${best}g을 넣었어요.` });
  for (const p of items.slice(1)) {
    snap({ line: 2, icon: '🔁', focus: p.id, say: `다음 펭귄 ${p.id}번(${p.w}g)을 볼 차례예요.` });
    const bigger = p.w > best;
    snap({ line: 3, icon: bigger ? '✅' : '✖️', focus: p.id, cmp: bigger,
      say: `${p.w} > ${best} ? → ${bigger ? '참! 더 무거워요.' : '거짓. 최고는 그대로예요.'}` });
    if (bigger) {
      best = p.w; bestId = p.id;
      snap({ line: 4, icon: '🔄', focus: p.id, say: `'최고' 상자의 값을 ${best}g으로 바꿨어요.` });
    }
  }
  snap({ line: 5, icon: '🏆', done: true, say: `반복이 끝났어요. 가장 무거운 펭귄은 ${bestId}번, ${best}g이에요!` });
  return frames;
}

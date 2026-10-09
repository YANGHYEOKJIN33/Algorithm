/**
 * 조사 고르기 — 앞말의 끝소리(받침)에 맞춰 을/를·이/가·은/는·으로/로·이에요/예요를 붙인다.
 * 장면 설명(say)이 "노드 0를", "'턱끈'예요"처럼 틀리지 않게 하려고 쓴다.
 *   josa('턱끈', '이에요/예요') → '이에요'     josa(3, '을/를') → '을'(삼)     josa('수컷', '으로/로') → '으로'
 */

// 숫자를 읽을 때의 끝소리 받침 — 0 영(ㅇ) 1 일(ㄹ) 2 이 3 삼(ㅁ) 4 사 5 오 6 육(ㄱ) 7 칠(ㄹ) 8 팔(ㄹ) 9 구
const DIGIT = { 0: 21, 1: 8, 2: 0, 3: 16, 4: 0, 5: 0, 6: 1, 7: 8, 8: 8, 9: 0 };
const RIEUL = 8;   // ㄹ 받침 — "으로/로"에서는 받침이 없는 것처럼 '로'

/** 끝소리 받침 번호(0 = 받침 없음) */
function finalOf(word) {
  const t = String(word).replace(/[\s'"’”)\]»>%°]+$/u, '');
  const ch = t.at(-1) ?? '';
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
  if (/[0-9]/.test(ch)) return DIGIT[ch];
  if (/[lmn]/i.test(ch)) return /l/i.test(ch) ? RIEUL : 4;
  return 0;
}

/** pair = '받침 있을 때/없을 때' */
export function josa(word, pair) {
  const [withF, without] = pair.split('/');
  const f = finalOf(word);
  if (withF === '으로') return f === 0 || f === RIEUL ? without : withF;
  return f === 0 ? without : withF;
}

/** 말 + 조사 */
export const withJosa = (word, pair) => `${word}${josa(word, pair)}`;

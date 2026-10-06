/**
 * 씨앗(seed)이 있는 난수 — 같은 씨앗이면 언제나 같은 순서로 섞인다.
 * 화면을 되감거나 다시 열어도 "무작위" 결과가 바뀌지 않아야 학생이 따라갈 수 있다.
 * (파이썬의 random_state=42와 같은 생각)
 */
export function createRandom(seed = 42) {
  let a = seed >>> 0;
  return function next() {
    // mulberry32
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 피셔-예이츠 섞기 — 원본은 그대로 두고 섞인 새 배열을 돌려준다 */
export function shuffle(items, seed = 42) {
  const rand = createRandom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

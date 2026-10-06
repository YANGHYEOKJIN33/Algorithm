/**
 * 연습용 펭귄 데이터 — 크롤링 연습 사이트(practice/)와 모든 수업이 함께 쓴다.
 *
 * 원본(penguins.js)에 "수업용 함정" 세 가지를 일부러 더했다.
 * 학생은 크롤링으로 이 데이터를 모은 뒤, 가공·전처리 수업에서 함정을 하나씩 찾아 고친다.
 *   ① 빈칸   — 원본에 있던 빈칸(결측치) + 일부러 지운 칸 하나
 *   ② 이상치 — 3200g을 8200g으로 잘못 적은 칸 하나
 *   ③ 겹친 행 — 쪽을 넘길 때 같은 펭귄이 두 번 실린 행 하나
 * 바꾼 내용은 CHANGES·DUPLICATE_ID에 모두 적어 두고, 연습 사이트 아래에도 공개한다.
 */
import { COLUMNS, ORIGINAL } from './penguins.js';

export { COLUMNS };

/** 수업을 위해 원본에서 바꾼 값 (출처를 흐리지 않도록 숨기지 않는다) */
export const CHANGES = [
  { 번호: 7, 열: '부리길이', 원래: 38.9, 바꾼값: null, 이유: '빈칸 — 측정값이 기록되지 않은 경우' },
  { 번호: 13, 열: '몸무게', 원래: 3200, 바꾼값: 8200, 이유: '이상치 — 숫자 3을 8로 잘못 적은 경우' },
];

/** 1쪽 마지막 줄과 2쪽 첫 줄에 같은 펭귄이 두 번 실린다 (겹친 행) */
export const DUPLICATE_ID = 50;

/** 연습 사이트 한 쪽에 싣는 줄 수 */
export const PAGE_SIZE = 50;

/** 숫자로 된 열 */
export const NUMERIC = ['부리길이', '부리깊이', '날개길이', '몸무게'];

/** 종 이름 — 순서가 곧 색 순서(아델리=1번 색, 턱끈=2번 색, 젠투=3번 색) */
export const SPECIES = ['아델리', '턱끈', '젠투'];

/** 배열 한 줄을 { 번호, 종, … } 객체로 */
export function toRecord(row) {
  const rec = {};
  COLUMNS.forEach((c, i) => { rec[c] = row[i]; });
  return rec;
}

/** 원본 344마리 (값을 바꾸지 않은 것) */
export function originalRecords() {
  return ORIGINAL.map(toRecord);
}

/** 수업용 함정을 더한 345줄 (겹친 행 하나 포함) */
export function practiceRecords() {
  const out = [];
  for (const row of ORIGINAL) {
    const rec = toRecord(row);
    for (const ch of CHANGES) {
      if (ch.번호 === rec.번호) rec[ch.열] = ch.바꾼값;
    }
    out.push(rec);
    if (rec.번호 === DUPLICATE_ID) out.push({ ...rec });
  }
  return out;
}

/**
 * 연습 사이트의 쪽 나누기. 1쪽은 1~50번, 2쪽은 겹친 50번으로 시작한다.
 * (쪽을 넘길 때 앞 쪽 마지막 줄이 한 번 더 실리는, 실제 사이트에서 흔한 일을 흉내 낸 것)
 */
export function practicePages() {
  const recs = practiceRecords();
  const pages = [];
  for (let i = 0; i < recs.length; i += PAGE_SIZE) pages.push(recs.slice(i, i + PAGE_SIZE));
  return pages;
}

/** 번호로 연습 데이터의 한 줄 찾기 (겹친 행이 있어도 첫 번째) */
export function byId(id) {
  const rec = practiceRecords().find((r) => r.번호 === id);
  if (!rec) throw new Error(`번호 ${id}인 펭귄이 없습니다`);
  return rec;
}

/** 번호 목록 → 필요한 열만 뽑은 작은 표 { columns, rows } */
export function pick(ids, columns) {
  return {
    columns: [...columns],
    rows: ids.map((id) => {
      const rec = byId(id);
      const row = {};
      for (const c of columns) row[c] = rec[c];
      return row;
    }),
  };
}

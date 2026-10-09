/**
 * 차시 계획 — 45분 수업 한 차시에 쪽 시간의 합이 40분을 넘지 않게 쪽을 차례대로 묶는다(5분은 교사 설명·마무리용).
 * 쪽 시간은 course/*.js의 minutes를 그대로 더한다(표지 2분·정리 5분 포함). docs/OBJECTIVES.md와
 * docs/TEACHER.md의 차시표를 `npm run build`가 이 목록에서 만든다.
 *
 *  from   그 차시가 시작하는 쪽 — '1-4' 같은 쪽 번호, 또는 '2-표지'·'5-정리'. 다음 차시의 from 바로 앞 쪽까지가 한 차시.
 *  focus  그 차시에 학생이 배우는 것(짧게)
 *  tip    교사용 한마디(선택)
 *  project true면 마지막 차시 — 그 뒤로 프로젝트가 이어진다
 */
import { TABS, unitPages } from './lessons.js';

export const PERIODS = [
  { from: '0-1', focus: '인공지능 프로젝트 6단계 지도 · 화면 사용법 · 펭귄 표와 의사코드 읽기',
    tip: '0-1은 화면에 띄워 함께 보고, 0-3 화면 둘러보기를 꼭 먼저 하게 하세요. 이후 모든 쪽이 같은 틀입니다.' },
  { from: '1-표지', focus: 'HTML 표 구조 · 크롤링 단계 실행 · 크롤링 예절',
    tip: '남는 시간에 1-4의 📒 Colab을 열어 구글 로그인·드라이브에 사본 저장까지 해 두면 다음 차시가 빨라집니다.' },
  { from: '1-4', focus: '🐍 첫 Colab 크롤링 · 결측치 여부·개수·위치',
    tip: '첫 Colab 차시 — 로그인·사본 저장·한글 글꼴 셀에 5~10분이 더 걸립니다. 늦으면 2-3을 다음 차시로 미루세요.' },
  { from: '2-4', focus: '사분위수·IQR 울타리 · 상자그림으로 이상치 찾기 · 🐍 Colab' },
  { from: '3-표지', focus: '핵심 속성 고르기 · 결측치를 지우거나 채우기 · 글자를 숫자로' },
  { from: '3-7', focus: '🐍 전처리 Colab · 표 합치기(concat·merge)' },
  { from: '4-3', focus: '훈련/테스트 나누기 · 🐍 Colab · 지도·비지도·강화학습',
    tip: '➕ 5-2 강화학습은 선택 쪽입니다. 시간이 없으면 건너뛰어도 5단원 목표에는 지장이 없습니다.' },
  { from: '5-3', focus: '분류·회귀·군집 고르기 · k-최근접 이웃(거리·다수결) · 🐍 Colab' },
  { from: '5-7', focus: '의사결정 트리(불순도가 가장 낮은 질문) · 🐍 Colab' },
  { from: '5-10', focus: '선형 회귀(오차를 줄이는 직선) · 🐍 Colab',
    tip: '🔥 5-11 최소제곱법 계산은 도전 쪽입니다. 수학이 부담되면 그림만 보고 5-12 Colab으로 넘어가도 됩니다.' },
  { from: '5-13', focus: 'k-평균(배정 → 중심 이동 → 멈춤) · 🐍 Colab · 5단원 정리' },
  { from: '6-표지', focus: '정확도로 모델 평가 · 틀린 예 고쳐 보기 · 전 과정 정리 · 이해 확인 10문제' },
  { from: '6-4', focus: '프로젝트 계획 · 6단원 정리 → 📒 Colab 09 프로젝트 틀로 진행 · 발표', project: true,
    tip: '이 차시부터 프로젝트입니다. 모둠 구성·주제 정하기 → Colab 09 → 발표까지 보통 3~4차시를 더 잡습니다.' },
];

/** 쪽 번호 열쇠 — '1-4' / '2-표지' / '0-정리' */
export function pageKey(it) {
  return /^\d+-\d+$/.test(it.label) ? it.label : `${it.tab.unit.no}-${it.label}`;
}

/** 모든 쪽을 수업 순서대로 — [{ tab, sub, page, label, key }] */
export function coursePages() {
  return TABS.flatMap((t) => unitPages(t)).map((it) => ({ ...it, key: pageKey(it) }));
}

/** 차시마다 쪽 묶음과 시간 — [{ no, focus, tip, pages, minutes, core }] (core = ➕ 선택 쪽을 뺀 시간) */
export function periodRows() {
  const all = coursePages();
  const starts = PERIODS.map((p) => all.findIndex((it) => it.key === p.from));
  return PERIODS.map((p, i) => {
    const pages = all.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : all.length);
    const minutes = pages.reduce((s, it) => s + (it.page.minutes ?? 0), 0);
    const core = pages.reduce((s, it) => s + (it.page.level === 'optional' ? 0 : it.page.minutes ?? 0), 0);
    return { no: i + 1, ...p, pages, minutes, core, start: starts[i] };
  });
}

/** '1-4 ~ 1단원 정리, 2단원 표지 ~ 2-3' 처럼 단원마다 처음~끝 */
export function pageRange(pages) {
  const name = (it) => (/^\d+-\d+$/.test(it.label) ? it.label : `${it.tab.unit.no}단원 ${it.label}`);
  const groups = [];
  for (const it of pages) {
    const g = groups.at(-1);
    if (g && g.tab === it.tab) g.list.push(it);
    else groups.push({ tab: it.tab, list: [it] });
  }
  return groups.map((g) => (g.list.length === 1 ? name(g.list[0]) : `${name(g.list[0])} ~ ${name(g.list.at(-1))}`)).join(', ');
}

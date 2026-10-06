/** 첫 방문 안내 — 문서 대신 말풍선 3장으로 사용법을 알려 준다 */
import { el, fill } from './dom.js';

const SEEN_KEY = 'ai-data-lab:seen-guide';

const STEPS = [
  {
    emoji: '🐧',
    title: '펭귄 데이터 하나로 인공지능을 처음부터 끝까지',
    body: '남극 펭귄 344마리의 관측 기록을 웹에서 모으고(수집), 빈칸과 이상한 값을 찾고(가공), 다듬고(전처리), 나눠서(학습 준비), 종을 맞히는 인공지능을 만들어요(기계학습).',
  },
  {
    emoji: '🗂️',
    title: '맨 위 탭을 왼쪽부터 차례로',
    body: '1 시작 → 2 수집 → 3 가공 → 4 전처리 → 5 학습 준비 → 6 기계학습 → 7 프로젝트 순서예요. 쪽마다 📘 배울 것과 ✋ 해 볼 것이 적혀 있고, [다음 →]을 누르면 다음 쪽·다음 탭으로 이어져요.',
  },
  {
    emoji: '👣',
    title: '의사코드를 한 줄씩, 그림이 함께 움직여요',
    body: '⏭ 한 단계를 누를 때마다 의사코드 한 줄이 실행되고, 표·그래프·자료구조(리스트·사전)가 그에 맞춰 바뀌어요. ⏮ 뒤로로 다시 볼 수 있어요. 파이썬은 "🐍 파이썬 같이 보기"와 📒 Colab 실습에서 만나요.',
  },
];

export function createOnboarding() {
  const card = el('div.guide__card', { role: 'dialog', 'aria-modal': 'true', 'aria-label': '사용 안내' });
  const backdrop = el('div.modal__backdrop', { hidden: true }, card);
  document.body.append(backdrop);
  let step = 0;

  function render() {
    const s = STEPS[step];
    fill(card,
      el('div.guide__dots', {}, STEPS.map((_, i) => el(`span.guide__dot${i === step ? '.guide__dot--on' : ''}`))),
      el('div.guide__emoji', {}, s.emoji),
      el('h2.guide__title', {}, s.title),
      el('p.guide__body', {}, s.body),
      el('div.guide__actions', {},
        el('button.pill', { type: 'button', onclick: close }, '건너뛰기'),
        el('span.topbar__spacer'),
        step > 0 ? el('button.pill', { type: 'button', onclick: () => { step -= 1; render(); } }, '이전') : null,
        el('button.pill.ctrl--primary', { type: 'button', onclick: () => { if (step === STEPS.length - 1) close(); else { step += 1; render(); } } },
          step === STEPS.length - 1 ? '시작하기' : '다음')));
  }
  function close() {
    backdrop.hidden = true;
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* 무시 */ }
  }
  function open() { step = 0; render(); backdrop.hidden = false; card.querySelector('.ctrl--primary')?.focus(); }
  document.addEventListener('keydown', (e) => { if (!backdrop.hidden && e.key === 'Escape') close(); });

  return {
    open,
    maybeShow() {
      let seen = false;
      try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch { seen = false; }
      if (!seen) open();
    },
  };
}

/** 첫 방문 안내 — 문서 대신 말풍선 3장으로 사용법을 알려 준다 */
import { el, fill } from './dom.js';

const SEEN_KEY = 'ai-data-lab:seen-guide';

const STEPS = [
  {
    emoji: '🐧',
    title: '처음 보는 펭귄의 종을 맞히는 인공지능을 직접 만들어요',
    body: '웹에서 펭귄 기록을 모으고(1 수집) → 문제를 찾고(2 가공) → 고치고(3 전처리) → 합치고 나누고(4 학습 준비) → 학습시키고(5 기계학습) → 정확도를 재요(6 평가·프로젝트). 맨 위 탭이 이 순서예요.',
  },
  {
    emoji: '🎯',
    title: '쪽마다 🎯 목표와 ✋ 할 일이 있어요',
    body: '🎯 목표는 "이 쪽을 마치면 할 수 있는 것"이에요. ✋ 할 일을 직접 해 보면 저절로 ✅가 되고, ❓ 확인 문제로 이해했는지 확인해요. 단원 처음에는 🧭 표지(무엇을 배우나), 끝에는 📝 정리(1분 요약·확인 문제)가 있어요.',
  },
  {
    emoji: '👣',
    title: '파이썬을 몰라도 돼요 — 의사코드를 한 줄씩',
    body: '⏭ 한 단계를 누를 때마다 의사코드 한 줄이 실행되고, 표·그래프·자료구조(리스트·사전)가 그에 맞춰 바뀌어요. 파이썬은 "🐍 파이썬 같이 보기"와 📒 Colab 실습에서 ▶만 누르면 돼요.',
  },
];

export function createOnboarding({ onTour } = {}) {
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
        onTour ? el('button.pill', { type: 'button', onclick: () => { close(); onTour(); } }, '🖥 화면 사용법 자세히') : null,
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

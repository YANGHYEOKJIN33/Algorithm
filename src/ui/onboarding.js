/** 첫 방문 안내 — 문서 대신 말풍선 3장으로 사용법을 알려 준다 */
import { el, fill } from './dom.js';

const SEEN_KEY = 'ai-data-lab:seen-guide';

const STEPS = [
  {
    emoji: '🐧',
    title: '처음 보는 펭귄의 종을 맞히는 인공지능을 직접 만들어요',
    body: '먼저 웹에서 펭귄 기록을 모으고(1 수집), 기록에 어떤 문제가 있는지 찾아요(2 가공). 찾은 문제를 고친 뒤(3 전처리) 표를 합치고 나눠요(4 학습 준비). 그다음 모델을 학습시키고(5 기계학습) 정확도를 재 보지요(6 평가·프로젝트). 맨 위 탭이 바로 이 순서예요.',
  },
  {
    emoji: '🎯',
    title: '쪽마다 🎯 목표와 ✋ 할 일이 있어요',
    body: '🎯 목표에는 이 쪽을 마치고 나면 할 수 있게 되는 일이 적혀 있어요. ✋ 할 일을 직접 하면 저절로 ✅ 표시가 붙고, ❓ 확인 문제로 제대로 이해했는지 점검해요. 단원 맨 앞 🧭 표지에서는 무엇을 배울지 미리 보고, 맨 끝 📝 정리에서는 1분 요약을 읽고 확인 문제를 풀어요.',
  },
  {
    emoji: '👣',
    title: '파이썬을 몰라도 괜찮아요. 의사코드를 한 줄씩 따라가요',
    body: '⏭ 한 단계를 누를 때마다 의사코드가 한 줄씩 실행되고, 그에 맞춰 표와 그래프, 리스트·사전 같은 자료구조가 바뀌어요. 파이썬 코드는 "🐍 파이썬 같이 보기"로 나란히 볼 수 있고, 📒 Colab 실습에서는 ▶만 누르면 실행돼요.',
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

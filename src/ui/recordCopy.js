/**
 * [📋 내 학습 기록 복사] 단추 — 학습 기록 글을 클립보드에 넣는다.
 * 클립보드가 막힌 브라우저(학교 PC 보안 설정 등)에서는 글 상자를 펼쳐 직접 골라 복사하게 한다.
 */
import { el } from './dom.js';
import { recordText } from '../app/record.js';

export function recordButton(progress, { label = '📋 내 학습 기록 복사' } = {}) {
  const box = el('textarea.recordbox', { readonly: true, rows: 8, hidden: true, 'aria-label': '내 학습 기록 글' });
  const btn = el('button.pill.pill--sm', {
    type: 'button',
    title: '단원별 쪽 진도와 처음에 맞힌 문제 수, 스스로 점검한 결과를 글로 복사해요. 학급 설문지나 과제 칸에 붙여 넣으면 돼요.',
    onclick: async () => {
      const text = recordText(progress);
      box.value = text;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = '✅ 복사했어요. 이제 붙여 넣기만 하면 돼요';
        box.hidden = true;
      } catch {
        btn.textContent = '아래 글을 직접 선택해서 복사해 주세요';
        box.hidden = false;
        box.focus();
        box.select();
      }
      setTimeout(() => { btn.textContent = label; }, 2400);
    },
  }, label);
  return el('span.recordcopy', {}, btn, box);
}

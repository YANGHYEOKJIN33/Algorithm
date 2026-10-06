/**
 * 자료구조 그림 조각 — 파이썬 리스트 [ ], 사전 { }, 변수 상자, 계산표.
 * 학생이 파이썬을 몰라도 "상자에 무엇이 들어 있는지"가 보이게 그린다.
 */
import { el } from '../ui/dom.js';

/**
 * 리스트 — [ 칸, 칸, … ] 와 칸 아래 자리 번호(0부터)
 * items: [{ key, html|text, cls }]
 */
export function pyList(name, items, { empty = '비어 있어요', note = null, showIndex = true, vertical = false } = {}) {
  return el(`div.pylist${vertical ? '.pylist--v' : ''}`, {},
    el('div.pylist__name', {}, name, note ? el('span.pylist__note', {}, note) : null),
    el('div.pylist__body', {},
      el('span.pylist__br', { 'aria-hidden': 'true' }, '['),
      items.length === 0 ? el('span.pylist__empty', {}, empty) : null,
      items.map((it, i) => el(`div.pylist__item${it.cls ? `.${it.cls.split(' ').join('.')}` : ''}`, { 'data-flip': it.key ?? null, 'data-enter': 'right' },
        el('div.pylist__val', {}, it.content ?? it.text),
        showIndex ? el('div.pylist__idx', {}, String(i)) : null)),
      el('span.pylist__br', { 'aria-hidden': 'true' }, ']'),
    ),
  );
}

/** 사전 — { 열쇠: 값, … } */
export function pyDict(name, entries, { empty = '비어 있어요', hot = null, note = null } = {}) {
  return el('div.pydict', {},
    el('div.pydict__name', {}, name, note ? el('span.pylist__note', {}, note) : null),
    el('div.pydict__body', {},
      el('span.pylist__br', {}, '{'),
      entries.length === 0 ? el('span.pylist__empty', {}, empty) : null,
      entries.map(([k, v]) => el(`div.pydict__row${hot !== null && k === hot ? '.is-hot' : ''}`, { 'data-flip': `dict-${k}`, 'data-enter': 'up' },
        el('span.pydict__k', {}, typeof k === 'string' ? `'${k}'` : String(k)),
        el('span.pydict__colon', {}, ':'),
        el('span.pydict__v', {}, String(v)))),
      el('span.pylist__br', {}, '}'),
    ),
  );
}

/** 변수 상자 — 이름표가 붙은 상자 하나 */
export function varBox(name, value, { hot = false, sub = null } = {}) {
  return el(`div.varbox${hot ? '.is-hot' : ''}`, {},
    el('div.varbox__name', {}, name),
    el('div.varbox__val', {}, value === null || value === undefined ? '—' : String(value)),
    sub ? el('div.varbox__sub', {}, sub) : null,
  );
}

/** 계산표 — [이름, 값, 강조?] 줄 목록 */
export function calcTable(title, rows) {
  return el('div.calc', {},
    title ? el('div.calc__title', {}, title) : null,
    el('dl.calc__list', {}, rows.map(([k, v, hot]) => el(`div.calc__row${hot ? '.is-hot' : ''}${v === null || v === undefined ? '.is-empty' : ''}`, {},
      el('dt', {}, k),
      el('dd', {}, v === null || v === undefined ? '?' : v)))),
  );
}

/** 작은 세기 카드들 */
export function counters(items) {
  return el('div.counters', {}, items.map(([label, value, tone]) => el(`div.counter${tone ? `.counter--${tone}` : ''}`, {},
    el('span.counter__label', {}, label),
    el('span.counter__value', {}, String(value)))));
}

/** 계산표를 가로로 납작하게 — 이름 위, 값 아래 (높이가 좁은 칸에 쓴다) */
export function calcGrid(rows) {
  return el('div.calcgrid', {}, rows.map(([k, v, hot]) => el(`div.calcgrid__cell${hot ? '.is-hot' : ''}${v === null || v === undefined ? '.is-empty' : ''}`, {},
    el('span.calcgrid__k', {}, k),
    el('span.calcgrid__v', {}, v === null || v === undefined ? '?' : v))));
}

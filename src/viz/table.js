/**
 * 데이터 표(데이터프레임) 그리기 — 판다스가 보여 주는 모양 그대로: 왼쪽에 인덱스, 위에 열 이름.
 * 빈칸은 NaN(흐린 기울임)으로 쓴다. 행마다 data-flip을 달아 지워지거나 움직일 때 미끄러지게 한다.
 */
import { el } from '../ui/dom.js';
import { isMissing, fmt } from '../core/stats.js';

/**
 * @param {object} o
 *   columns, rows
 *   index(row, i)      왼쪽 인덱스 글자 (기본: 줄 순서 i). null이면 인덱스 칸 없음
 *   cell(row, col, i)  칸 글자 (기본: 값, 빈칸은 NaN)
 *   cellClass(row, col, i)  칸에 붙일 클래스
 *   rowClass(row, i)   행에 붙일 클래스
 *   colClass(col)      열 머리·칸에 붙일 클래스
 *   key(row, i)        FLIP용 고유 id
 *   foot               표 아래에 붙일 행(요소 배열)
 *   caption
 */
export function dataTable(o) {
  const { columns, rows } = o;
  const index = o.index === undefined ? (row, i) => String(i) : o.index;
  const cellText = o.cell ?? ((row, col) => (isMissing(row[col]) ? 'NaN' : fmt(row[col], 3)));
  const head = el('tr', {},
    index ? el('th.dtable__idx', { scope: 'col' }, '') : null,
    columns.map((c) => el(`th${o.colClass?.(c) ? `.${o.colClass(c).split(' ').join('.')}` : ''}`, { scope: 'col' }, c)));
  const body = rows.map((row, i) => {
    const rc = o.rowClass?.(row, i) ?? '';
    return el(`tr${rc ? `.${rc.split(' ').filter(Boolean).join('.')}` : ''}`, { 'data-flip': o.key ? o.key(row, i) : null },
      index ? el('th.dtable__idx', { scope: 'row' }, index(row, i)) : null,
      columns.map((c) => {
        const cls = [isMissing(row[c]) ? 'is-nan' : '', o.cellClass?.(row, c, i) ?? '', o.colClass?.(c) ?? ''].join(' ').trim();
        return el(`td${cls ? `.${cls.split(/\s+/).join('.')}` : ''}`, {}, cellText(row, c, i));
      }));
  });
  return el('table.dtable', {},
    o.caption ? el('caption', {}, o.caption) : null,
    el('thead', {}, head),
    el('tbody', {}, body),
    o.foot ? el('tfoot', {}, o.foot) : null,
  );
}

/**
 * 🧩 학습 준비 — 세로로 이어 붙이기(concat) · 열쇠로 옆에 붙이기(merge) · 훈련/테스트 분할
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import * as PR from '../core/prepare.js';
import { dataTable } from '../viz/table.js';
import { pyList, counters } from '../viz/bits.js';

const NB = '04_merge_split';

/* ═════════════ 세로로 이어 붙이기 ═════════════ */

const concat = {
  kind: 'step',
  pseudo: PR.CONCAT_PSEUDO,
  python: PR.CONCAT_PYTHON,
  notebook: NB,
  stageTitle: '표1 (1쪽) ⬅ 표2 (2쪽)',
  stageHint: '같은 열끼리 줄을 맞춰 아래에 붙여요',
  nodata: true,
  frames: () => PR.concatFrames(),
  mount({ stage }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const idxOf = (r) => String(r._i);
        const result = dataTable({
          columns: f.columns, rows: f.result, index: idxOf, key: (r) => r._k,
          rowClass: (r) => [r._k === f.focus ? 'is-row' : '', r._from === 2 ? 'is-from2' : ''].join(' '),
        });
        const waiting = f.waiting.length ? dataTable({
          columns: f.columns, rows: f.waiting, index: idxOf, key: (r) => r._k,
          rowClass: (r) => (r._k === f.focus ? 'is-row' : ''),
        }) : el('div.placeholder', {}, '표2의 행을 모두 옮겼어요.');
        const dupIdx = !f.renumbered && f.result.length > 3;
        fill(stage, el('div.duo', {},
          el('div.duo__col', {},
            el('div.webx__cap', {}, `새 표 — ${f.result.length}행 ${dupIdx ? '(인덱스가 겹쳐요!)' : f.renumbered ? '(인덱스 새로 매김 ✅)' : ''}`),
            result),
          el('div.duo__arrow', { 'aria-hidden': 'true' }, '⬅'),
          el('div.duo__col', {}, el('div.webx__cap', {}, '표2 — 아직 옮기지 않은 행'), waiting),
          el('div.duo__col.duo__col--grow', {},
            counters([['새 표의 행', f.result.length, 'add'], ['남은 행', f.waiting.length]]),
            el('p.panel__hint', {}, '주황 줄 = 2쪽에서 온 행. 인덱스(왼쪽 회색)가 0, 1, 2, 0, 1, 2로 겹치면 나중에 "인덱스 1"이 어느 행인지 헷갈려요. 그래서 ignore_index=True로 새로 매겨요.'))));
        flip(stage);
      },
    };
  },
};

/* ═════════════ 열쇠로 옆에 붙이기 ═════════════ */

const merge = {
  kind: 'step',
  pseudo: PR.MERGE_PSEUDO,
  python: PR.MERGE_PYTHON,
  notebook: NB,
  stageTitle: '측정표  🔗  판정표 — 열쇠는 번호',
  stageHint: '파랑 = 지금 보는 행 · 초록 = 짝을 찾음',
  dataTitle: '새 표 pd.merge(측정표, 판정표, on="번호")',
  rows: ['1.05fr', '0.95fr'],
  frames: () => PR.mergeFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const matchedL = new Set(f.result.map((r) => `L${r.번호}`));
        const matchedR = new Set(f.result.map((r) => `R${r.번호}`));
        const left = dataTable({
          columns: f.leftColumns, rows: f.left, index: (r) => String(r._i),
          rowClass: (r) => [r._k === f.focusL ? 'is-row' : '', matchedL.has(r._k) ? 'is-ok' : '', f.skipped.includes(r._k) ? 'is-gone' : ''].join(' '),
          colClass: (c) => (c === '번호' ? 'is-key' : ''),
        });
        const right = dataTable({
          columns: f.rightColumns, rows: f.right, index: (r) => String(r._i),
          rowClass: (r) => [r._k === f.focusR ? 'is-row' : '', matchedR.has(r._k) ? 'is-ok' : ''].join(' '),
          colClass: (c) => (c === '번호' ? 'is-key' : ''),
        });
        const focusRow = f.left.find((r) => r._k === f.focusL);
        fill(stage, el('div.duo', {},
          el('div.duo__col', {}, el('div.webx__cap', {}, '측정표 (부리·날개)'), left),
          el('div.mergelink', {},
            focusRow ? el(`div.mergelink__badge${f.matched === true ? '.is-ok' : f.matched === false ? '.is-no' : ''}`, {},
              `번호 ${focusRow.번호}`, el('br'), f.matched === true ? '🔗 짝 찾음' : f.matched === false ? '✖ 짝 없음' : '🔎 찾는 중') : el('span.duo__arrow', {}, '🔗')),
          el('div.duo__col', {}, el('div.webx__cap', {}, '판정표 (종) — 순서가 달라요'), right)));
        fill(data, f.result.length
          ? dataTable({ columns: f.columns, rows: f.result, key: (r) => r._k, rowClass: (r, i) => (i === f.result.length - 1 && f.line === 4 ? 'is-new' : '') })
          : el('p.panel__hint', {}, '두 표에 모두 있는 번호를 찾으면 한 줄로 이어 여기에 넣어요.'));
        flip(data);
      },
    };
  },
};

/* ═════════════ 훈련 / 테스트 분할 ═════════════ */

const split = {
  kind: 'step',
  pseudo: PR.SPLIT_PSEUDO,
  python: PR.SPLIT_PYTHON,
  notebook: NB,
  stageTitle: '표 df',
  stageHint: '파랑 열 = X(입력) · 주황 열 = y(정답)',
  dataTitle: '훈련 데이터 | 테스트 데이터',
  rows: ['1.2fr', '0.8fr'],
  frames: () => PR.splitFrames(),
  mount({ stage, data }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const byK = new Map(f.rows.map((r) => [r._k, r]));
        const rows = f.order.map((k) => byK.get(k));
        const isX = (c) => (f.xy && (c === '부리길이' || c === '날개길이'));
        const isY = (c) => (f.xy === 'xy' && c === '종');
        const t = dataTable({
          columns: f.columns, rows, index: (r) => String(r._i), key: (r) => r._k,
          colClass: (c) => (isX(c) ? 'is-x' : isY(c) ? 'is-y' : c === '번호' && f.xy ? 'is-dimcol' : ''),
          rowClass: (r) => (f.part[r._k] === 'train' ? 'is-train' : f.part[r._k] === 'test' ? 'is-test' : ''),
        });
        fill(stage, el('div.duo', {},
          el('div.duo__col', {}, t),
          el('div.duo__col.duo__col--grow', {},
            el('div.splitkey', {},
              el('span.tag.tag--current', {}, 'X = 입력(문제)'), el('span.tag.tag--result', {}, 'y = 정답'),
              el('span.tag.tag--add', {}, '📘 훈련 80%'), el('span.tag.tag--warn', {}, '📝 테스트 20%')),
            el('p.panel__hint', {}, '왼쪽 회색 인덱스는 원래 자리예요. 섞어도 각 행의 X와 y는 함께 움직여요(짝이 깨지지 않아요).'))));
        flip(stage);
        const chip = (r, cls) => ({ key: `c${r._k}`, cls, content: `${r.번호}번 (${r.부리길이}, ${r.날개길이}) → ${r.종}` });
        const train = rows.filter((r) => f.part[r._k] === 'train');
        const test = rows.filter((r) => f.part[r._k] === 'test');
        fill(data, el('div.splitbox', {},
          el('div.splitbox__col.is-train', {}, pyList(`훈련 데이터 ${train.length}행`, train.map((r) => chip(r, 'is-new')), { showIndex: false, empty: '아직 없어요' })),
          el('div.splitbox__col.is-test', {}, pyList(`테스트 데이터 ${test.length}행`, test.map((r) => chip(r, 'is-hot')), { showIndex: false, empty: '아직 없어요' }))));
        flip(data);
      },
    };
  },
};

export const READY_SCENES = { concat, merge, split };

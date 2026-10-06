/**
 * 🧩 학습 준비 — 세로로 이어 붙이기(concat) · 열쇠로 옆에 붙이기(merge) · 훈련/테스트 분할
 *
 * 화면의 표는 보기 쉽게 몇 마리만 골라 보여 준다. 실제 줄 수(345 → 344 → 341 → 272 / 69)는
 * 장면마다 작은 글로 함께 적는다(Colab 04번 노트북의 결과와 같다).
 *
 * 미션 신호: ctx.check('merge-left') — how='left'로 바꿔 보기, ctx.check('no-shuffle') — 섞지 않으면? 눌러 보기
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import * as PR from '../core/prepare.js';
import { dataTable } from '../viz/table.js';
import { pyList, counters } from '../viz/bits.js';

const NB = '04_merge_split';

/** 실제 데이터의 줄 수 흐름 — scripts/build.mjs(cleanRecords)와 04번 노트북 결과로 확인한 값 */
const LINEAGE = [
  ['크롤링', '345줄'],
  ['겹친 행 삭제', '344'],
  ['이상치·빈 줄 삭제', '341'],
  ['8 : 2로 나누기', '훈련 272 / 테스트 69'],
];

/** 받침이 있으면 '을', 없으면 '를' — '턱끈을', '아델리를' */
const eulReul = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? '을' : '를'; };

function lineageStrip(cap) {
  const [first, ...rest] = LINEAGE;
  return el('div', {},
    el('div.webx__cap', {}, '📏 실제 데이터의 줄 수', cap ? el('span.webx__note', {}, ` — ${cap}`) : null),
    el('div.netline', {},
      el('span.netline__box', {}, `${first[0]} ${first[1]}`),
      rest.map(([how, n]) => [
        el('span.netline__arrow', { 'aria-hidden': 'true' }, '→', el('small', {}, how)),
        el('span.netline__box', {}, n),
      ])));
}

/* ═════════════ 세로로 이어 붙이기 ═════════════ */

const concat = {
  kind: 'step',
  pseudo: PR.CONCAT_PSEUDO,
  python: PR.CONCAT_PYTHON,
  notebook: NB,
  stageTitle: '내 표 (1쪽) ⬅ 친구 표 (2쪽)',
  stageHint: '같은 열끼리 줄을 맞춰 아래에 붙여요',
  nodata: true,
  frames: () => PR.concatFrames(),
  mount({ stage }) {
    const flip = createFlip();
    return {
      render(v) {
        const f = v.frame;
        const idxOf = (r) => String(r._i);
        const seen = new Map();
        for (const r of f.result) seen.set(r._i, (seen.get(r._i) ?? 0) + 1);
        const dup = !f.renumbered && [...seen.values()].some((n) => n > 1);
        const result = dataTable({
          columns: f.columns, rows: f.result, index: idxOf, key: (r) => r._k,
          rowClass: (r) => [r._k === f.focus ? 'is-row' : '', r._from === 2 ? 'is-from2' : ''].join(' '),
        });
        // 겹친 인덱스를 빨갛게 — 0, 1, 2, 0, 1, 2가 눈에 띄게
        if (dup) {
          result.querySelectorAll('tbody th.dtable__idx').forEach((th, i) => {
            if (seen.get(f.result[i]._i) > 1) { th.style.color = 'var(--warn)'; th.style.fontWeight = '700'; }
          });
        }
        const waiting = f.waiting.length ? dataTable({
          columns: f.columns, rows: f.waiting, index: idxOf, key: (r) => r._k,
          rowClass: (r) => (r._k === f.focus ? 'is-row' : ''),
        }) : el('div.placeholder', {}, '친구 표의 행을 모두 옮겼어요.');
        const allMoved = f.waiting.length === 0;
        const one = f.result.filter((r) => r._i === 1).map((r) => `${r.번호}번`);
        const status = f.renumbered
          ? el('p.callout.callout--add', {}, '✅ ignore_index=True — 인덱스를 0부터 새로 매겨서 이제 "인덱스 1"은 한 행뿐이에요.')
          : allMoved && dup
            ? el('p.callout.callout--warn', {}, `⚠ 인덱스 0, 1, 2가 두 번씩 있어요! "인덱스 1"은 ${one.join('일까요, ')}일까요? → ignore_index=True로 새로 매겨요.`)
            : el('p.panel__hint', {}, '주황 줄 = 친구 표에서 온 행. 인덱스(왼쪽 회색)는 표마다 0부터 세던 번호를 그대로 들고 와요.');
        fill(stage, el('div.duo', {},
          el('div.duo__col', {},
            el('div.webx__cap', {}, `새 표 — ${f.result.length}행 ${dup ? '(인덱스가 겹쳐요!)' : f.renumbered ? '(인덱스 새로 매김 ✅)' : '(내 표에서 시작)'}`),
            result),
          el('div.duo__arrow', { 'aria-hidden': 'true' }, '⬅'),
          el('div.duo__col', {}, el('div.webx__cap', {}, '친구 표 — 아직 옮기지 않은 행'), waiting),
          el('div.duo__col.duo__col--grow', {},
            el('p.callout', {}, '👫 친구와 쪽을 나눠 크롤링했더니 파일이 두 개가 됐어요. 열 이름이 같으니 위아래로 이어 붙여 한 표로 만들어요.'),
            counters([['새 표의 행', f.result.length, 'add'], ['남은 행', f.waiting.length]]),
            status,
            el('p.panel__hint', {}, '🔎 보기 쉽게 쪽마다 3마리만 보여 줘요. Colab 실습에서는 7쪽(50줄씩, 마지막 쪽 45줄)을 이어 붙여 345줄을 만들어요.'))));
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
  mount({ stage, data, dataTools }, ctx) {
    const flip = createFlip();
    let how = 'inner';
    let last = null;
    const seg = el('div.seg', { role: 'group', 'aria-label': '합치는 방법' },
      el('button', { type: 'button', 'aria-pressed': 'true', onclick: () => setHow('inner') }, '기본 (inner)'),
      el('button', { type: 'button', 'aria-pressed': 'false', onclick: () => setHow('left') }, "how='left'라면?"));
    fill(dataTools, seg);
    function setHow(h) {
      how = h;
      seg.children[0].setAttribute('aria-pressed', String(how === 'inner'));
      seg.children[1].setAttribute('aria-pressed', String(how === 'left'));
      if (how === 'left') ctx?.check('merge-left');
      if (last) draw(last);
    }

    function draw(v) {
      const f = v.frame;
      const left = how === 'left';
      const matchedL = new Set(f.result.map((r) => `L${r.번호}`));
      const matchedR = new Set(f.result.map((r) => `R${r.번호}`));
      const leftT = dataTable({
        columns: f.leftColumns, rows: f.left, index: (r) => String(r._i),
        rowClass: (r) => [r._k === f.focusL ? 'is-row' : '', matchedL.has(r._k) ? 'is-ok' : '',
          f.skipped.includes(r._k) ? (left ? 'is-warn' : 'is-gone') : ''].join(' '),
        colClass: (c) => (c === '번호' ? 'is-key' : ''),
      });
      const rightT = dataTable({
        columns: f.rightColumns, rows: f.right, index: (r) => String(r._i),
        rowClass: (r) => [r._k === f.focusR ? 'is-row' : '', matchedR.has(r._k) ? 'is-ok' : ''].join(' '),
        colClass: (c) => (c === '번호' ? 'is-key' : ''),
      });
      const focusRow = f.left.find((r) => r._k === f.focusL);
      const gone = f.left.filter((r) => f.skipped.includes(r._k)).map((r) => `${r.번호}번`);
      const lonely = f.right.filter((r) => !matchedR.has(r._k)).map((r) => `${r.번호}번`);
      const status = f.matched === false && focusRow
        ? el('p.callout.callout--warn', {}, left
          ? `✖ ${focusRow.번호}번은 판정표에 짝이 없어요. how='left'라면 측정값은 남기고 종 칸을 빈칸(NaN)으로 둬요.`
          : `✖ ${focusRow.번호}번은 판정표에 짝이 없어요. 기본(inner)은 이 행을 새 표에 넣지 않아요.`)
        : f.done
          ? el('p.callout.callout--add', {}, `🧾 측정표 ${f.left.length}줄 · 판정표 ${f.right.length}줄 → 새 표 ${left ? f.left.length : f.result.length}줄`, el('br'),
            left ? `how='left': ${gone.join('·')}은 남고 종이 NaN, 판정표에만 있던 ${lonely.join('·')}은 빠져요.`
              : `inner: 짝이 없는 ${gone.join('·')}(측정표)과 ${lonely.join('·')}(판정표)은 빠져요.`)
          : el('p.panel__hint', {}, '판정표는 순서가 뒤섞여 있어요. 그래도 번호(열쇠)만 같으면 같은 펭귄이에요.');
      fill(stage, el('div.duo', {},
        el('div.duo__col', {}, el('div.webx__cap', {}, '측정표 (부리·날개)'), leftT),
        el('div.mergelink', {},
          focusRow ? el(`div.mergelink__badge${f.matched === true ? '.is-ok' : f.matched === false ? '.is-no' : ''}`, {},
            `번호 ${focusRow.번호}`, el('br'), f.matched === true ? '🔗 짝 찾음' : f.matched === false ? '✖ 짝 없음' : '🔎 찾는 중') : el('span.duo__arrow', {}, '🔗')),
        el('div.duo__col', {}, el('div.webx__cap', {}, '판정표 (종) — 순서가 달라요'), rightT),
        el('div.duo__col.duo__col--grow', {},
          el('p.callout', {}, '📨 종 판정은 연구팀이 다른 파일(판정표)로 보내 줬어요. 측정값과 종(정답)이 한 줄에 있어야 지도학습을 할 수 있어요.'),
          status,
          el('p.panel__hint', {}, '🔎 보기 쉽게 6마리씩만 보여 줘요. Colab 실습에서는 측정표 341줄과 판정표 338줄을 합쳐 338줄(inner)이 돼요.'))));

      let rows = f.result;
      if (left) {
        // how='left' — 지금까지 살펴본 측정표의 행을 모두 남기고, 짝이 없으면 종을 NaN으로
        const byNo = new Map(f.result.map((r) => [r.번호, r]));
        rows = f.left.filter((a) => matchedL.has(a._k) || f.skipped.includes(a._k))
          .map((a) => byNo.get(a.번호) ?? { _k: `M${a.번호}`, ...Object.fromEntries(f.columns.map((c) => [c, c in a ? a[c] : null])), _nan: true });
      }
      fill(data, rows.length
        ? el('div', {},
          left ? el('p.panel__hint', {}, "how='left'라면: 측정표의 행을 모두 남기고, 짝이 없는 칸은 NaN으로 채워요. (Colab: 341줄, 종이 빈 행 3)") : null,
          dataTable({ columns: f.columns, rows, key: (r) => r._k,
            rowClass: (r, i) => (r._nan ? 'is-warn' : i === rows.length - 1 && f.line === 4 ? 'is-new' : '') }))
        : el('p.panel__hint', {}, '두 표에 모두 있는 번호를 찾으면 한 줄로 이어 여기에 넣어요.'));
      flip(data);
    }

    return {
      render(v) { last = v; draw(v); },
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
  mount({ stage, data, stageTools }, ctx) {
    const flip = createFlip();
    let noShuffle = false;
    let last = null;
    const btn = el('button.pill.pill--sm', { type: 'button', 'aria-pressed': 'false', onclick: () => {
      noShuffle = !noShuffle;
      btn.setAttribute('aria-pressed', String(noShuffle));
      if (noShuffle) ctx?.check('no-shuffle');
      if (last) draw(last);
    } }, '🤔 섞지 않으면?');
    fill(stageTools, btn);

    /** 섞지 않고 위에서부터 자르면 — 종마다 몇 마리씩 가나 */
    function unshuffled(f) {
      const nTest = Math.round(f.rows.length * PR.SPLIT_TEST_SIZE);
      const count = (list) => {
        const m = new Map();
        for (const r of list) m.set(r.종, (m.get(r.종) ?? 0) + 1);
        return [...m].map(([sp, n]) => `${sp} ${n}`).join(' · ');
      };
      const train = f.rows.slice(0, f.rows.length - nTest);
      const test = f.rows.slice(f.rows.length - nTest);
      const missing = [...new Set(test.map((r) => r.종))].filter((sp) => !train.some((r) => r.종 === sp));
      return el('div.callout.callout--warn', {},
        el('strong', {}, `🤔 섞지 않고 위에서 ${train.length}행을 떼면`), el('br'),
        `📘 훈련: ${count(train)}`, el('br'),
        `📝 테스트: ${count(test)}`, el('br'),
        missing.length ? `→ 모델이 ${missing.join('·')}${eulReul(missing.at(-1))} 한 번도 못 보고 시험을 봐요!` : '→ 종이 고르게 나뉘지 않아요.');
    }

    function draw(v) {
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
          el('p.panel__hint', {}, '🏷 종(y)은 보기 쉽게 글자로 보여 줘요. 3단원처럼 숫자(아델리 0 · 턱끈 1 · 젠투 2)로 바꿔 둬도 나누는 방법은 같아요. 섞어도 행마다 X와 y는 함께 움직여요(왼쪽 회색 인덱스 = 원래 자리).'),
          noShuffle ? unshuffled(f) : el('p.callout', {}, '📘 80%로 공부하고 📝 20%로 시험 봐요 — 공부한 문제로 시험 보지 않기! 왜 먼저 섞을까요? 위 [🤔 섞지 않으면?]을 눌러 보세요.'),
          lineageStrip(`화면에는 그중 ${f.rows.length}마리만 보여 줘요`))));
      flip(stage);
      const chip = (r, cls) => ({ key: `c${r._k}`, cls, content: `${r.번호}번 (${r.부리길이}, ${r.날개길이}) → ${r.종}` });
      const train = rows.filter((r) => f.part[r._k] === 'train');
      const test = rows.filter((r) => f.part[r._k] === 'test');
      fill(data,
        el('div.splitbox', {},
          el('div.splitbox__col.is-train', {}, pyList(`훈련 데이터 ${train.length}행`, train.map((r) => chip(r, 'is-new')), { showIndex: false, empty: '아직 없어요' })),
          el('div.splitbox__col.is-test', {}, pyList(`테스트 데이터 ${test.length}행`, test.map((r) => chip(r, 'is-hot')), { showIndex: false, empty: '아직 없어요' }))));
      flip(data);
    }

    return {
      render(v) { last = v; draw(v); },
    };
  },
};

export const READY_SCENES = { concat, merge, split };

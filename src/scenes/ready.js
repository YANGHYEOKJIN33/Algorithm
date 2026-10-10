/**
 * 🧩 학습 준비 — 세로로 이어 붙이기(concat) · 열쇠로 옆에 붙이기(merge) · 훈련/테스트 분할
 *
 * 화면의 표는 보기 쉽게 몇 마리만 골라 보여 준다. 실제 줄 수(345 → 344 → 341 → 번호로 합쳐도 341 → 272 / 69)는
 * 장면마다 작은 글로 함께 적는다(Colab 04번 노트북의 결과와 같다).
 *
 * 4-1·4-2는 "🔁 만약에 — 데이터가 여러 파일로 온다면" 연습이다(1단원은 7쪽을 한 표로 모았다). 무대 옆에 그 띠를 늘 보여 준다.
 * 4-3에서 3단원의 깨끗한 341줄로 돌아온다(Colab에서는 번호로 합친 341줄을 그대로 나눈다).
 *
 * 미션 신호: ctx.check('merge-left') — "짝 없는 행도 남기기"로 바꿔 보기, ctx.check('no-shuffle') — 섞지 않으면? 눌러 보기
 */
import { el, fill } from '../ui/dom.js';
import { createFlip } from '../ui/flip.js';
import * as PR from '../core/prepare.js';
import { dataTable } from '../viz/table.js';
import { pyList, counters } from '../viz/bits.js';

const NB = '04_merge_split';

/** 실제 데이터의 줄 수 흐름 — scripts/build.mjs(cleanRecords·mergeParts)와 04번 노트북 결과로 확인한 값 */
const LINEAGE = [
  ['크롤링', '345줄'],
  ['겹친 행 삭제', '344'],
  ['이상치·빈 줄 삭제', '341'],
  ['번호로 합치기', '341'],
  ['8 : 2로 나누기', '훈련 272 / 테스트 69'],
];

/** 표의 행 높이를 줄인다(칸 위아래 여백만) — 720px 화면에서도 표 전체가 칸 안에 들어오게 */
function tight(table, pad = '1px') {
  table.querySelectorAll('th, td').forEach((c) => { c.style.paddingTop = pad; c.style.paddingBottom = pad; });
  return table;
}

/** 🔁 만약에 띠 — 4-1·4-2가 "여러 파일로 온다면"을 연습하는 장면임을 늘 보이게 한다 */
function whatIfBand(text) {
  return el('p.callout', { style: 'border-color:var(--result); background:var(--result-bg); margin:0' },
    el('strong', {}, '🔁 만약에 — 데이터가 여러 파일로 온다면'), el('br'), text);
}

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
          ? el('p.callout.callout--add', {}, '✅ 인덱스 새로 매기기: 0부터 다시 매겼더니 이제 "인덱스 1"은 한 행뿐이에요.')
          : allMoved && dup
            ? el('p.callout.callout--warn', {}, `⚠ 인덱스 0, 1, 2가 두 번씩 있어요! "인덱스 1"은 ${one.join('일까요, ')}일까요? 그래서 인덱스를 0부터 새로 매겨요.`)
            : el('p.panel__hint', {}, '주황 줄은 친구 표에서 온 행이에요. 왼쪽 회색 인덱스는 표마다 0부터 세던 번호를 그대로 가져와요.');
        fill(stage, el('div.duo', {},
          el('div.duo__col', {},
            el('div.webx__cap', {}, `새 표 — ${f.result.length}행 ${dup ? '(인덱스가 겹쳐요!)' : f.renumbered ? '(인덱스 새로 매김 ✅)' : '(내 표에서 시작)'}`),
            result),
          el('div.duo__arrow', { 'aria-hidden': 'true' }, '⬅'),
          el('div.duo__col', {}, el('div.webx__cap', {}, '친구 표 — 아직 옮기지 않은 행'), waiting),
          el('div.duo__col.duo__col--grow', {},
            whatIfBand('1단원에서는 크롤러 하나가 7쪽을 한 표로 모았어요. 그런데 친구와 쪽을 나눠 모았다면 파일이 두 개 생겨요. 두 표는 열 이름이 같으니 위아래로 이어 붙여 한 표로 만들어요.'),
            counters([['새 표의 행', f.result.length, 'add'], ['남은 행', f.waiting.length]]),
            status,
            el('p.panel__hint', {}, '🔎 보기 쉽게 쪽마다 3마리만 보여 줘요. Colab 실습에서는 7쪽을 모두 이어 붙여 345줄을 만들어요. 한 쪽에 50줄씩이고, 마지막 쪽만 45줄이에요.'))));
        flip(stage);
      },
    };
  },
};

/* ═════════════ 열쇠로 옆에 붙이기 ═════════════ */

/** 합치는 방법 — 쪽에 들어올 때마다 기본('inner')에서 시작한다. 바꾸면 장면 목록을 그 방법으로 다시 만든다. */
let mergeHow = 'inner';
const MERGE_TITLE = { inner: '새 표 (번호로 짝지은 결과)', left: '새 표 (짝 없는 행도 남긴 결과)' };

const merge = {
  kind: 'step',
  pseudo: PR.MERGE_PSEUDO,
  python: PR.MERGE_PYTHON,
  notebook: NB,
  stageTitle: '측정표  🔗  판정표 — 열쇠는 번호',
  stageHint: '파랑 = 지금 보는 행 · 초록 = 짝 찾음 · 빨강 = 짝 없음',
  dataTitle: MERGE_TITLE.inner,
  rows: ['1.05fr', '0.95fr'],
  frames: () => PR.mergeFrames({ how: mergeHow }),
  mount({ stage, data, dataTools }, ctx) {
    mergeHow = 'inner';
    const flip = createFlip();
    const titleEl = data.parentElement?.querySelector('.panel__title');
    const seg = el('div.seg', { role: 'group', 'aria-label': '짝 없는 행을 어떻게 할까' },
      el('button', { type: 'button', 'aria-pressed': 'true', onclick: () => setHow('inner') }, '짝 있는 행만 (기본)'),
      el('button', { type: 'button', 'aria-pressed': 'false', onclick: () => setHow('left') }, '짝 없는 행도 남기기'));
    fill(dataTools, seg);
    function setHow(h) {
      if (h === mergeHow) return;
      mergeHow = h;
      seg.children[0].setAttribute('aria-pressed', String(h === 'inner'));
      seg.children[1].setAttribute('aria-pressed', String(h === 'left'));
      if (titleEl) titleEl.textContent = MERGE_TITLE[h];
      if (h === 'left') ctx?.check('merge-left');
      // 같은 자리에서 장면 목록만 바꾼다 — 두 방법의 장면 수가 같아서 보던 단계가 그대로 이어진다
      const at = ctx?.player?.view().index ?? 0;
      ctx?.player?.load(PR.mergeFrames({ how: h }), at);
    }

    return {
      render(v) {
        const f = v.frame;
        const keep = f.how === 'left';
        const paired = f.result.filter((r) => !r._nan);
        const matchedL = new Set(paired.map((r) => `L${r.번호}`));
        const matchedR = new Set(paired.map((r) => `R${r.번호}`));
        const leftT = tight(dataTable({
          columns: f.leftColumns, rows: f.left, index: (r) => String(r._i),
          rowClass: (r) => [r._k === f.focusL ? 'is-row' : '', matchedL.has(r._k) ? 'is-ok' : '',
            f.skipped.includes(r._k) ? (keep ? 'is-warn' : 'is-gone') : ''].join(' '),
          colClass: (c) => (c === '번호' ? 'is-key' : ''),
        }), '2px');
        const rightT = tight(dataTable({
          columns: f.rightColumns, rows: f.right, index: (r) => String(r._i),
          rowClass: (r) => [r._k === f.focusR ? 'is-row' : '', matchedR.has(r._k) ? 'is-ok' : ''].join(' '),
          colClass: (c) => (c === '번호' ? 'is-key' : ''),
        }), '2px');
        const focusRow = f.left.find((r) => r._k === f.focusL);
        const gone = f.left.filter((r) => f.skipped.includes(r._k)).map((r) => `${r.번호}번`);
        const lonely = f.right.filter((r) => !matchedR.has(r._k)).map((r) => `${r.번호}번`);
        const status = f.matched === false && focusRow
          ? el('p.callout.callout--warn', {}, keep
            ? `✖ ${focusRow.번호}번은 판정표에 짝이 없어요. "짝 없는 행도 남기기"를 골랐으니 측정값은 남기고 종 칸을 빈칸(NaN)으로 둬요.`
            : `✖ ${focusRow.번호}번은 판정표에 짝이 없어요. 기본인 '짝 있는 행만'에서는 이 행을 새 표에 넣지 않아요.`)
          : f.done
            ? el('p.callout.callout--add', {}, `🧾 측정표 ${f.left.length}줄 · 판정표 ${f.right.length}줄 → 새 표 ${f.result.length}줄`, el('br'),
              keep ? `짝 없는 행도 남기기: ${gone.join('·')}은 남고 종이 빈칸(NaN), 판정표에만 있던 ${lonely.join('·')}은 빠져요.`
                : `짝 있는 행만: 짝이 없는 ${gone.join('·')}(측정표)과 ${lonely.join('·')}(판정표)은 빠져요.`)
            : el('p.panel__hint', {}, '판정표는 순서가 뒤섞여 있어요. 그래도 열쇠인 번호만 같으면 같은 펭귄이에요.');
        fill(stage, el('div.duo', {},
          el('div.duo__col', {}, el('div.webx__cap', {}, '측정표 파일 — 종 칸이 없어요'), leftT),
          el('div.mergelink', {},
            focusRow ? el(`div.mergelink__badge${f.matched === true ? '.is-ok' : f.matched === false ? '.is-no' : ''}`, {},
              `번호 ${focusRow.번호}`, el('br'), f.matched === true ? '🔗 짝 찾음' : f.matched === false ? '✖ 짝 없음' : '🔎 찾는 중') : el('span.duo__arrow', {}, '🔗')),
          el('div.duo__col', {}, el('div.webx__cap', {}, '판정표 파일 — 순서가 달라요'), rightT),
          el('div.duo__col.duo__col--grow', {},
            whatIfBand('측정은 관측팀이, 종 판정은 연구팀이 맡는 바람에 파일이 둘로 나뉘어 왔다면? 지도학습을 하려면 측정값과 종(정답)이 한 줄에 있어야 해요.'),
            status,
            el('p.panel__hint', {}, '🔎 100번은 종 판정이 아직 오지 않은 펭귄이고, 4번은 측정값이 모두 비어서 3단원에서 지운 펭귄이에요. Colab의 두 파일은 341줄씩인데, 모두 짝을 찾아 341줄이 돼요.'))));

        const rows = f.result;
        // 방법 설명은 표 옆에 — 6줄이 되어도 720px 화면에서 표가 잘리지 않게
        const howNote = keep
          ? el('p.callout.callout--warn', { style: 'margin:0' }, '🕳️ 짝 없는 행도 남기기: 측정표의 행을 모두 남기고, 짝이 없는 종 칸은 빈칸(NaN)으로 둬요.')
          : el('p.callout', { style: 'margin:0' }, '🔗 짝 있는 행만(기본): 두 표에 모두 있는 번호만 새 표에 넣어요. 오른쪽 위 [짝 없는 행도 남기기]를 눌러 결과를 견줘 보세요.');
        fill(data, el('div.duo', {},
          el('div.duo__col', {}, rows.length
            ? tight(dataTable({ columns: f.columns, rows, key: (r) => r._k,
              rowClass: (r, i) => (r._nan ? 'is-warn' : i === rows.length - 1 && f.line === 4 ? 'is-new' : '') }), '2px')
            : el('p.panel__hint', {}, '두 표에 모두 있는 번호를 찾으면, 한 줄로 이어서 여기에 넣어요.')),
          el('div.duo__col.duo__col--grow', {}, howNote)));
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
  stageTitle: '깨끗한 표 — 341줄 가운데 10마리',
  stageHint: '파랑 열 = X(입력) · 주황 열 = y(정답)',
  dataTitle: '훈련 데이터 | 테스트 데이터',
  rows: ['1.25fr', '0.75fr'],   // 10행 표(행 높이를 줄임)와 훈련·테스트 상자가 720px 화면에서도 모두 보이게
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
      const t = tight(dataTable({
        columns: f.columns, rows, index: (r) => String(r._i), key: (r) => r._k,
        colClass: (c) => (isX(c) ? 'is-x' : isY(c) ? 'is-y' : c === '번호' && f.xy ? 'is-dimcol' : ''),
        rowClass: (r) => (f.part[r._k] === 'train' ? 'is-train' : f.part[r._k] === 'test' ? 'is-test' : ''),
      }));
      fill(stage, el('div.duo', {},
        el('div.duo__col', {}, t),
        el('div.duo__col.duo__col--grow', {},
          el('div.splitkey', {},
            el('span.tag.tag--current', {}, 'X = 입력(문제)'), el('span.tag.tag--result', {}, 'y = 정답'),
            el('span.tag.tag--add', {}, '📘 훈련 80%'), el('span.tag.tag--warn', {}, '📝 테스트 20%')),
          el('p.panel__hint', {}, '🟦 3-1에서 고른 속성 4개 가운데 화면에는 부리길이와 날개길이만 보여 줘요. Colab에서는 4개를 다 써요. 🏷 종(y)은 보기 쉽게 글자로 두었어요. 3단원처럼 숫자로 바꿔 둬도 나누는 방법은 같아요. 행을 섞어도 X와 y는 한 행에 붙어 함께 움직여요. 왼쪽 회색 인덱스는 원래 자리를 알려 줘요.'),
          noShuffle ? unshuffled(f) : el('p.callout', {}, '📘 80%로 공부하고 📝 20%로 시험을 봐요. 공부한 문제를 시험에 그대로 내지 않는 거예요! 그런데 왜 먼저 섞을까요? 위의 [🤔 섞지 않으면?]을 눌러 보세요.'),
          lineageStrip(`화면에는 그 가운데 ${f.rows.length}마리만 보여 줘요`))));
      flip(stage);
      const chip = (r, cls) => ({ key: `c${r._k}`, cls, content: `${r.번호}번 (${r.부리길이}, ${r.날개길이}) → ${r.종}` });
      const train = rows.filter((r) => f.part[r._k] === 'train');
      const test = rows.filter((r) => f.part[r._k] === 'test');
      fill(data,
        el('div.splitbox', { style: '--fs-sm: var(--fs-xs); grid-template-columns: 1.75fr 1fr' },   // 작은 글씨·넓은 훈련 칸 — 훈련 8행이 세 줄 안에 들어오게
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

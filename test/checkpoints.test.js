/** Colab 실습 점검표·상자그림 견주기·크롤링 파이썬 — 사이트 글과 실제 파이썬 결과가 어긋나지 않는지 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOTEBOOKS } from '../src/app/notebooks.js';
import { boxFrames, allWeightStats, BOX_PYTHON } from '../src/core/inspect.js';
import { OUTLIER_IDS, CRAWL_COLUMNS } from '../src/core/data/sets.js';
import * as CR from '../src/core/crawl.js';

test('노트북마다 선생님께 보여 줄 결과(check)가 있다 — 🐍 실습 점검표 세 번째 칸', () => {
  for (const nb of NOTEBOOKS) {
    assert.equal(typeof nb.check, 'string', `${nb.id}에 check가 없다`);
    assert.ok(nb.check.trim().length > 0, `${nb.id}의 check가 비었다`);
    assert.ok(nb.check.length <= 60, `${nb.id}의 check가 너무 길다(${nb.check.length}자)`);
  }
});

test('상자그림 — Colab 02의 13마리 셀이 사이트 그림과 같은 펭귄·같은 사분위수를 쓴다', () => {
  const nb = NOTEBOOKS.find((n) => n.id === '02_missing_outlier');
  const cell = nb.cells.find((c) => c.type === 'code' && /plt\.boxplot\(small\)/.test(c.code));
  assert.ok(cell, '13마리 상자그림 셀이 없다');
  const ids = JSON.parse(cell.code.match(/ids = (\[[^\]]+\])/)[1]);
  assert.deepEqual(ids, OUTLIER_IDS);
  const st = boxFrames().at(-1).stats;
  for (const [q, v] of [['0.25', st.q1], ['0.50', st.q2], ['0.75', st.q3]]) {
    assert.match(cell.out, new RegExp(`${q}\\s+${v}\\.0`), `실행 결과 예시의 ${q} 값`);
  }
  assert.ok(BOX_PYTHON.some((l) => /isin\(ids\)/.test(l)), '사이트의 파이썬 같이 보기도 13마리를 고른다');
});

test('상자그림 — 345줄 전체 값은 사이트 그림과 다르다(판다스·matplotlib 값)', () => {
  const all = allWeightStats();
  assert.equal(all.n, 343);
  assert.deepEqual([all.q1, all.q2, all.q3], [3550, 4050, 4762.5]);
  assert.deepEqual([all.whiskerLow, all.whiskerHigh], [2700, 6300]);
  assert.deepEqual(all.outliers, [8200]);
  const end = boxFrames().at(-1);
  assert.deepEqual(end.compare, all);
  assert.match(end.say, /13마리/);
  assert.match(end.say, /3550 ~ 4762\.5/);
});

test('크롤링 파이썬 — 열 이름을 제목 줄 <th>에서 가져온다(진짜 연습 사이트는 9열)', () => {
  assert.equal(CR.PSEUDO.length, CR.PYTHON.length);
  const line = CR.PYTHON.find((l) => l.includes('pd.DataFrame('));
  assert.match(line, /columns=\[th\.text for th in trs\[0\]\.find_all\('th'\)\]/);
  assert.ok(!CRAWL_COLUMNS.some((c) => line.includes(`'${c}'`)), '미니 관측소의 4열 이름을 박아 두지 않는다');
});

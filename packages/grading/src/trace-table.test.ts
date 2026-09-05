/**
 * `trace-table` 채점 (D187 ⑱). 재는 것 넷 — **부분 점수** · **이월** · **분할 일치** ·
 * 닫힌 낱말(있나/없다).
 *
 * 표본은 `java-learning.md` §12.5 의 로그인 격자다: 열은 「`user` 가 가리키는 상자」·
 * 「`role` 이 있나」이고, 시간은 줄 번호이며, `user` 는 재조회에서 다른 상자를 가리키게 된다.
 */
import { describe, expect, test } from 'vitest';

import { cellKey, gradeTrace, type TraceGradeInput } from './trace-table.js';

const ROWS = ['r78', 'r82', 'r87', 'r90', 'r94', 'r106'];

/** 상자 열 — 78 에서 A, 90 에서 B. 사이는 값이 안 바뀌므로 이월이다. */
const boxCells = () => ROWS.map((r, i) => ({
  r, c: 'c_user',
  v: (i < 3
    ? { t: 'box' as const, label: 'A', accept: ['A'] }
    : { t: 'box' as const, label: 'B', accept: ['B'] }),
  carry: i === 0 || i === 3 ? null : (ROWS[i - 1] as string),
}));

/** 있나 열 — 94 에서 생긴다. */
const hasCells = () => ROWS.map((r, i) => ({
  r, c: 'c_role',
  v: { t: 'bool' as const, v: i >= 4 },
  carry: i === 0 || i === 4 ? null : (ROWS[i - 1] as string),
}));

const item: TraceGradeInput = {
  cols: [
    { k: 'c_user', axis: 'obj', t: 'user 가 가리키는 상자' },
    { k: 'c_role', axis: 'var', t: 'role 이 있나' },
  ],
  rows: ROWS.map((k, i) => ({ k, line: [78, 82, 87, 90, 94, 106][i] as number, t: `line ${k}` })),
  cells: [...boxCells(), ...hasCells()],
  hidden: ['r78|c_user', 'r90|c_user', 'r78|c_role', 'r94|c_role'],
  ok: '90 줄에서 user 가 다른 상자를 가리키게 됩니다.',
  rule: '규칙 — 참조는 상자를 가리킬 뿐 상자를 들고 있지 않습니다.',
};

/** 예측 모드가 묻는 네 칸의 정답 한 벌. */
const right = {
  'r78|c_user': 'A', 'r90|c_user': 'B', 'r78|c_role': '없음', 'r94|c_role': '있음',
};

describe('예측 모드 — 바뀐 칸만 묻는다', () => {
  test('묻는 칸은 hidden 넷뿐이고 다 맞으면 통과다', () => {
    const v = gradeTrace(item, right);
    expect(v).toMatchObject({ ok: true, asked: 4, correct: 4, pct: 100 });
    expect(v.misses).toEqual([]);
    expect(v.okText).toBe(item.ok);
  });

  test('한 칸만 틀리면 부분 점수다 — 0 이 아니다', () => {
    const v = gradeTrace(item, { ...right, 'r94|c_role': '없음' });
    expect(v.ok).toBe(false);
    expect(v.correct).toBe(3);
    expect(v.pct).toBe(75);
    expect(v.misses[0]?.kind).toBe('value');
    expect(v.misses[0]?.key).toBe(cellKey('r94', 'c_role'));
  });

  test('빈 칸은 사유가 blank 다 — 「틀렸다」가 아니라 「안 적었다」', () => {
    const v = gradeTrace(item, { ...right, 'r90|c_user': '  ' });
    expect(v.misses[0]?.kind).toBe('blank');
  });

  test('hidden 이 비면 격자 전부를 묻는다', () => {
    const all = gradeTrace({ ...item, hidden: [] }, right);
    expect(all.asked).toBe(item.cells.length);
  });
});

describe('분할 일치 — 상자 이름은 글자가 아니다', () => {
  test('A·B 대신 1·2 로 써도 맞다', () => {
    const v = gradeTrace(item, { ...right, 'r78|c_user': '1', 'r90|c_user': '2' });
    expect(v.ok).toBe(true);
  });

  test('다른 상자를 앞에서 쓴 이름으로 부르면 틀린다', () => {
    const v = gradeTrace(item, { ...right, 'r90|c_user': 'A' });
    expect(v.ok).toBe(false);
    expect(v.misses[0]?.kind).toBe('reused');
    expect(v.misses[0]?.text).toContain('A');
  });
});

describe('이월 — 앞 칸이 뒤 칸의 기댓값을 정한다', () => {
  /** 안 바뀐 칸까지 전부 묻는 격자. 이월이 여기서 돈다. */
  const askAll: TraceGradeInput = { ...item, hidden: [] };

  test('값이 안 바뀐 칸은 앞 칸에 쓴 이름 그대로여야 한다', () => {
    const mine: Record<string, string> = {};
    for (const [i, r] of ROWS.entries()) {
      mine[cellKey(r, 'c_user')] = i < 3 ? '상자1' : '상자2';
      mine[cellKey(r, 'c_role')] = i >= 4 ? 'o' : 'x';
    }
    expect(gradeTrace(askAll, mine).ok).toBe(true);
  });

  test('첫 칸을 다르게 부른 사람이 판 전체를 잃지 않는다 — 이월이 그 이름을 따라간다', () => {
    const mine: Record<string, string> = {};
    for (const [i, r] of ROWS.entries()) {
      mine[cellKey(r, 'c_user')] = i < 3 ? 'Z' : 'B';
      mine[cellKey(r, 'c_role')] = i >= 4 ? '있음' : '없음';
    }
    const v = gradeTrace(askAll, mine);
    expect(v.ok).toBe(true);
    expect(v.pct).toBe(100);
  });

  test('이월 칸에서 이름이 흔들리면 그 칸만 틀린다 — 사유가 carry 다', () => {
    const mine: Record<string, string> = {};
    for (const [i, r] of ROWS.entries()) {
      mine[cellKey(r, 'c_user')] = i === 1 ? 'B' : i < 3 ? 'A' : 'B';
      mine[cellKey(r, 'c_role')] = i >= 4 ? '있음' : '없음';
    }
    const v = gradeTrace(askAll, mine);
    expect(v.ok).toBe(false);
    const carry = v.misses.find((m) => m.kind === 'carry');
    expect(carry?.key).toBe(cellKey('r82', 'c_user'));
    // 한 칸이 흔들려도 나머지는 남는다.
    expect(v.correct).toBeGreaterThan(v.asked / 2);
  });
});

describe('닫힌 낱말 — 있나 열', () => {
  test('참·거짓 표기는 언어에 안 매인다', () => {
    for (const yes of ['있음', 'o', 'YES', 'true', '1']) {
      expect(gradeTrace(item, { ...right, 'r94|c_role': yes }).ok).toBe(true);
    }
    for (const no of ['없음', 'x', 'no', 'false', '0', '-']) {
      expect(gradeTrace(item, { ...right, 'r78|c_role': no }).ok).toBe(true);
    }
  });

  test('반대 표기는 틀린다', () => {
    expect(gradeTrace(item, { ...right, 'r94|c_role': '없음' }).ok).toBe(false);
  });
});

describe('값 칸 — 0부 사다리의 시간축', () => {
  const ladder: TraceGradeInput = {
    cols: [{ k: 'c_v', axis: 'var', t: '값' }],
    rows: [{ k: 's0', line: null, t: '7 / 2' }, { k: 's1', line: null, t: '3' }],
    cells: [
      { r: 's0', c: 'c_v', v: { t: 'string', v: '7 / 2' }, carry: null },
      { r: 's1', c: 'c_v', v: { t: 'int', v: '3' }, carry: null },
    ],
    hidden: ['s1|c_v'],
    ok: 'a 는 3 입니다.',
    rule: '규칙 — 정수끼리 나누면 정수가 남습니다.',
  };

  test('정수는 표기를 봐준다 — `+03` 도 3 이다', () => {
    expect(gradeTrace(ladder, { 's1|c_v': '+03' }).ok).toBe(true);
  });

  test('3.0 은 3 이 아니다 — 종류가 답의 일부다', () => {
    expect(gradeTrace(ladder, { 's1|c_v': '3.0' }).ok).toBe(false);
  });
});

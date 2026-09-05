import { describe, expect, it } from 'vitest';

import {
  gradeValue, normalizeFloat, normalizeInt, MISS_MESSAGE_KEY,
  type FundGradeInput,
} from './fundamentals.js';

/** 자바의 `int a = 7 / 2;`. `siblings`·`ideal`·`fold` 는 생성기가 실제로 싣는 모양 그대로다. */
const intDivJava: FundGradeInput = {
  expected: { t: 'int', v: '3' },
  spell: { yes: 'true', no: 'false' },
  siblings: [{ lang: 'py', name: 'Python', value: { t: 'float', v: '3.5' } }],
  ideal: { t: 'float', v: '3.5' },
  fold: [{ code: '7 / 2', type: 'int / int' }, { code: '3', type: 'int' }],
};

/** 자바의 `double x = 0.1 + 0.2;`. */
const floatAdd: FundGradeInput = {
  expected: { t: 'float', v: '0.30000000000000004' },
  spell: { yes: 'true', no: 'false' },
  siblings: [],
  ideal: { t: 'float', v: '0.3' },
  fold: [{ code: '0.1 + 0.2', type: 'double + double' }],
};

const pyBool: FundGradeInput = {
  expected: { t: 'bool', v: true },
  spell: { yes: 'True', no: 'False' },
  siblings: [],
  ideal: null,
  fold: [],
};

const overflowRust: FundGradeInput = {
  expected: { t: 'event', name: 'panic', accept: ['panic', 'trap', 'crash', 'overflow'] },
  spell: { yes: 'true', no: 'false' },
  siblings: [{ lang: 'java', name: 'Java', value: { t: 'int', v: '-2147483648' } }],
  ideal: { t: 'int', v: '2147483648' },
  fold: [],
};

describe('정규화 — 오타는 봐주고 오해는 안 봐준다', () => {
  it('앞뒤 공백·자릿수 구분자·접미사를 걷어낸다', () => {
    expect(normalizeInt('  3 ')).toBe('3');
    expect(normalizeInt('1_000')).toBe('1000');
    expect(normalizeInt('3L')).toBe('3');
    expect(normalizeInt('+007')).toBe('7');
    expect(normalizeInt('42i32')).toBe('42');
  });

  it('소수점이 있으면 정수로 안 읽는다 — 종류가 다르다', () => {
    expect(normalizeInt('3.0')).toBeNull();
    expect(normalizeInt('삼')).toBeNull();
  });

  it('실수는 파싱해서 double 로 본다', () => {
    expect(normalizeFloat('3.5')).toBe(3.5);
    expect(normalizeFloat('1.5f')).toBe(1.5);
    expect(normalizeFloat('.5')).toBe(0.5);
    expect(normalizeFloat('3.')).toBe(3);
    expect(normalizeFloat('1e3')).toBe(1000);
    expect(normalizeFloat('Infinity')).toBe(Infinity);
    expect(normalizeFloat('-inf')).toBe(-Infinity);
  });
});

describe('실수는 엡실론이 아니라 비트로 견준다', () => {
  it('마지막 한 자리를 틀려도 같은 double 이면 정답이다', () => {
    expect(gradeValue(floatAdd, '0.30000000000000004').ok).toBe(true);
    expect(gradeValue(floatAdd, '0.30000000000000005').ok).toBe(true);
  });

  it('0.3 은 다른 double 이라 오답이고, 진단이 「수학의 답」이다', () => {
    const v = gradeValue(floatAdd, '0.3');
    expect(v.ok).toBe(false);
    expect(v.miss).toBe('ideal-math');
    expect(v.diagKey).toBe(MISS_MESSAGE_KEY['ideal-math']);
  });

  it('한 자리를 더 틀리면 다른 double 이라 오답이다', () => {
    expect(gradeValue(floatAdd, '0.3000000000000001').ok).toBe(false);
  });
});

describe('오답 분류 — 「당신이 적은 그것이 참이 되는 조건」', () => {
  it('3 은 정답이다', () => {
    const v = gradeValue(intDivJava, ' 3 ');
    expect(v).toMatchObject({ ok: true, pct: 100, miss: null, normalized: '3' });
    // 정답이면 기계의 걸음을 안 편다 — 펼 것이 없다.
    expect(v.fold).toEqual([]);
  });

  it('3.5 는 파이썬에서 참이다 — 형제에서 언어를 찾아 낸다', () => {
    const v = gradeValue(intDivJava, '3.5');
    expect(v.miss).toBe('other-language');
    expect(v.trueIn).toBe('Python');
    expect(v.fold).toHaveLength(2);
  });

  it('3.0 은 값은 같고 종류가 다르다', () => {
    expect(gradeValue(intDivJava, '3.0').miss).toBe('type-drift');
  });

  it('4 는 버릴 자리에서 반올림한 것이다', () => {
    expect(gradeValue(intDivJava, '4').miss).toBe('rounding');
  });

  it('-3 은 부호만 다르다', () => {
    expect(gradeValue(intDivJava, '-3').miss).toBe('sign');
  });

  it('빈칸과 못 읽는 글이 갈린다', () => {
    expect(gradeValue(intDivJava, '   ').miss).toBe('blank');
    expect(gradeValue(intDivJava, '몰라요').miss).toBe('unknown');
  });
});

describe('참·거짓은 그 언어의 표기 하나만 정답이다', () => {
  it('파이썬은 True 만 받는다', () => {
    expect(gradeValue(pyBool, 'True').ok).toBe(true);
  });

  it('true 는 오답이고 진단이 「표기」다 — 파이썬에서 그것은 값이 아니라 이름이다', () => {
    const v = gradeValue(pyBool, 'true');
    expect(v.ok).toBe(false);
    expect(v.miss).toBe('spelling');
  });

  it('참도 거짓도 아닌 글은 못 읽은 것이다', () => {
    expect(gradeValue(pyBool, '참').miss).toBe('unparsable');
  });
});

describe('값이 아니라 사건이 일어나는 자리', () => {
  it('이름과 별칭을 대소문자 없이 받는다', () => {
    expect(gradeValue(overflowRust, 'panic').ok).toBe(true);
    expect(gradeValue(overflowRust, ' Overflow ').ok).toBe(true);
  });

  it('감긴 값을 적으면 자바에서 참이라고 말한다', () => {
    const v = gradeValue(overflowRust, '-2147483648');
    expect(v.miss).toBe('other-language');
    expect(v.trueIn).toBe('Java');
  });
});

// ───────── 언어 안의 진단 (D186 ③ㄷ · 문서 §13) ─────────

/** `int n = 2 + 3 * 4;` — 열 언어가 전부 14 라 형제가 비고 진단이 「한 글자 다른 판」에서 온다. */
const precMulAdd: FundGradeInput = {
  expected: { t: 'int', v: '14' },
  spell: { yes: 'true', no: 'false' },
  siblings: [],
  ideal: null,
  fold: [{ code: '2 + 3 * 4', type: 'int' }],
  variants: [{ code: ['int n = (2 + 3) * 4;'], from: '2 + 3 * 4', to: '(2 + 3) * 4', value: { t: 'int', v: '20' } }],
};

/** `Integer a = 128; ... a == b;` — 명세가 답을 안 정하고, 127 이었으면 정해진다. */
const boxedEqJava: FundGradeInput = {
  expected: { t: 'unspecified', name: 'unspecified', accept: ['unspecified', '미정'] },
  spell: { yes: 'true', no: 'false' },
  siblings: [],
  ideal: null,
  fold: [],
  langAlt: [{ code: ['Integer a = 127;'], from: '128', to: '127', value: { t: 'bool', v: true } }],
};

/** 진단 재료가 하나도 없는 판. **있으면 안 되는 모양이지만 채점기는 그것도 말해야 한다.** */
const bare: FundGradeInput = {
  expected: { t: 'int', v: '7' },
  spell: { yes: 'true', no: 'false' },
  siblings: [],
  ideal: null,
  fold: [{ code: '7', type: 'int' }],
};

describe('언어 안의 진단 — 다른 판 · 다른 규칙', () => {
  it('한 글자 다른 식의 답을 적으면 그 식을 되비친다', () => {
    const v = gradeValue(precMulAdd, '20');
    expect(v.miss).toBe('other-form');
    expect(v.diagKey).toBe(MISS_MESSAGE_KEY['other-form']);
    expect(v.alt).toMatchObject({ from: '2 + 3 * 4', to: '(2 + 3) * 4' });
  });

  it('같은 언어의 다른 규칙에서 참인 답이면 그 규칙을 되비친다', () => {
    const v = gradeValue(boxedEqJava, 'true');
    expect(v.miss).toBe('other-rule');
    expect(v.alt).toMatchObject({ from: '128', to: '127' });
  });

  it('「답이 없다」 둘은 이름과 별칭으로 받는다', () => {
    expect(gradeValue(boxedEqJava, 'unspecified').ok).toBe(true);
    expect(gradeValue(boxedEqJava, ' 미정 ').ok).toBe(true);
    const compile: FundGradeInput = {
      ...bare,
      expected: { t: 'compile-error', name: 'compile error', accept: ['compile error', '컴파일 오류'] },
    };
    expect(gradeValue(compile, 'Compile Error').ok).toBe(true);
  });

  it('형제가 있으면 형제가 먼저다 — 언어 밖이 언어 안보다 앞이다', () => {
    const both: FundGradeInput = {
      ...precMulAdd,
      siblings: [{ lang: 'py', name: 'Python', value: { t: 'int', v: '20' } }],
    };
    expect(gradeValue(both, '20').miss).toBe('other-language');
  });

  it('재료가 아예 없으면 「없다」고 말한다 — `unknown` 과 갈라 둔다 (D186 ④)', () => {
    expect(gradeValue(bare, '9').miss).toBe('no-diagnosis');
    expect(gradeValue(bare, '9').diagKey).toBe('fund.missNoDiagnosis');
    // 재료가 있는데 안 걸린 것은 여전히 `unknown` 이다.
    expect(gradeValue(precMulAdd, '9').miss).toBe('unknown');
  });
});

describe('참·거짓의 오답은 표기 문제와 답 문제를 가른다', () => {
  const floatEqJava: FundGradeInput = {
    expected: { t: 'bool', v: false },
    spell: { yes: 'true', no: 'false' },
    siblings: [],
    ideal: null,
    fold: [],
    variants: [{
      code: ['boolean b = 0.5 + 0.25 == 0.75;'],
      from: '0.1 + 0.2 == 0.3', to: '0.5 + 0.25 == 0.75', value: { t: 'bool', v: true },
    }],
  };

  it('이 언어의 표기로 반대 값을 적으면 표기가 아니라 **답**이 틀린 것이다', () => {
    const v = gradeValue(floatEqJava, 'true');
    expect(v.miss).toBe('other-form');
    expect(v.alt?.to).toBe('0.5 + 0.25 == 0.75');
  });

  it('다른 언어의 표기를 쓰면 그때가 표기 문제다', () => {
    expect(gradeValue(floatEqJava, 'False').miss).toBe('spelling');
  });

  it('참도 거짓도 아닌 글은 못 읽은 것이다', () => {
    expect(gradeValue(floatEqJava, '아마도').miss).toBe('unparsable');
  });

  it('SQL 은 참·거짓을 1·0 으로 적는다 — 형제를 볼 때만 표기를 봐준다', () => {
    const sqlEq: FundGradeInput = {
      expected: { t: 'bool', v: true },
      spell: { yes: '1', no: '0' },
      siblings: [{ lang: 'java', name: 'Java', value: { t: 'bool', v: false } }],
      ideal: null,
      fold: [],
    };
    expect(gradeValue(sqlEq, '1').ok).toBe(true);
    expect(gradeValue(sqlEq, 'true').miss).toBe('spelling');
    // `false` 는 이 언어의 표기가 아니지만 **자바의 답**이라 형제가 먼저 걸린다.
    expect(gradeValue(sqlEq, '0').miss).toBe('other-language');
  });
});

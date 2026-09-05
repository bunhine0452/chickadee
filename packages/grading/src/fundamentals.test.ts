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

import { describe, expect, it } from 'vitest';

import {
  buildAllValueItems, buildValueItems, FUND_DIALECTS, FUND_LANGS, type FundLang, type FundValue,
} from './fundamentals.js';

/** 그 언어의 그 식 하나. 없으면 시험이 여기서 죽는다. */
function item(lang: FundLang, exprId: string) {
  const found = buildValueItems(lang).items.find((x) => x.id === `${exprId}:${lang}`);
  if (found === undefined) throw new Error(`${exprId}:${lang} 이 안 나왔다`);
  return found;
}

const val = (v: FundValue): string => (v.t === 'event' ? v.name : v.t === 'bool' ? String(v.v) : v.v);

describe('열 언어의 기계 규칙', () => {
  it('언어마다 dialect 가 하나씩 있고 lang 이 자기 키와 같다', () => {
    expect(FUND_LANGS).toHaveLength(10);
    for (const lang of FUND_LANGS) expect(FUND_DIALECTS[lang].lang).toBe(lang);
  });

  it('실측한 행은 셋이고 나머지는 명세를 읽고 적은 것이다', () => {
    const measured = FUND_LANGS.filter((l) => FUND_DIALECTS[l].verified === 'measured');
    expect(measured).toEqual(['py', 'ts', 'sql']);
  });
});

describe('int-div — `7 / 2`', () => {
  it('정수가 남는 언어는 3 이다', () => {
    for (const lang of ['java', 'c', 'cpp', 'csharp', 'go', 'rs', 'swift', 'sql'] as const) {
      expect(item(lang, 'int-div').expected).toEqual({ t: 'int', v: '3' });
    }
  });

  it('나눗셈이 실수가 되는 언어는 3.5 다', () => {
    for (const lang of ['py', 'ts'] as const) {
      expect(item(lang, 'int-div').expected).toEqual({ t: 'float', v: '3.5' });
    }
  });

  it('자바 판은 자바 코드로 보이고 라벨이 int 다', () => {
    const java = item('java', 'int-div');
    expect(java.code).toEqual(['int a = 7 / 2;']);
    expect(java.target).toEqual({ name: 'a', declared: 'int' });
  });

  it('자바 판이 파이썬의 답을 형제로 들고 있다 — 진단이 여기서 나온다', () => {
    const sibs = item('java', 'int-div').siblings;
    const py = sibs.find((s) => s.lang === 'py');
    expect(py?.value).toEqual({ t: 'float', v: '3.5' });
    // 답이 같은 언어는 형제에 안 담는다 — 진단이 될 게 없다.
    expect(sibs.some((s) => s.lang === 'c')).toBe(false);
  });

  it('기계의 걸음이 타입까지 보인다', () => {
    expect(item('java', 'int-div').fold).toEqual([
      { code: '7 / 2', type: 'int / int' },
      { code: '3', type: 'int' },
    ]);
  });
});

describe('mod-neg — `-7 % 2`', () => {
  it('파이썬만 1 이고 나머지 아홉은 -1 이다', () => {
    const ones = FUND_LANGS.filter((l) => val(item(l, 'mod-neg').expected) === '1');
    expect(ones).toEqual(['py']);
    for (const lang of FUND_LANGS.filter((l) => l !== 'py')) {
      expect(val(item(lang, 'mod-neg').expected)).toBe('-1');
    }
  });
});

describe('float-add — `0.1 + 0.2`', () => {
  it('아홉 언어가 같은 double 을 낸다', () => {
    for (const lang of FUND_LANGS.filter((l) => l !== 'sql')) {
      expect(item(lang, 'float-add').expected).toEqual({ t: 'float', v: '0.30000000000000004' });
    }
  });

  it('SQL 은 사유를 달고 빠진다 — 셸이 15자리로 줄여 찍는다', () => {
    const out = buildValueItems('sql');
    expect(out.items.some((x) => x.id.startsWith('float-add'))).toBe(false);
    expect(out.dropped.map((d) => d.exprId)).toContain('float-add');
    expect(out.dropped.find((d) => d.exprId === 'float-add')?.reason).toMatch(/15자리/u);
  });

  it('수학의 답 0.3 을 ideal 로 들고 있다', () => {
    expect(item('java', 'float-add').ideal).toEqual({ t: 'float', v: '0.3' });
  });

  it('적은 값이 실제 double 과 같다 — 카탈로그가 손으로 적은 자릿수가 맞나', () => {
    const v = Number(item('java', 'float-add').expected.t === 'float'
      ? (item('java', 'float-add').expected as { v: string }).v
      : NaN);
    expect(v).toBe(0.1 + 0.2);
    expect(v).not.toBe(0.3);
  });
});

describe('int-overflow — `2147483647 + 1`', () => {
  it('답이 넷으로 갈린다 — 감기 · 안 넘침 · 미정의 · 중단', () => {
    expect(val(item('java', 'int-overflow').expected)).toBe('-2147483648');
    expect(val(item('csharp', 'int-overflow').expected)).toBe('-2147483648');
    expect(val(item('go', 'int-overflow').expected)).toBe('2147483648');
    expect(val(item('py', 'int-overflow').expected)).toBe('2147483648');
    expect(val(item('c', 'int-overflow').expected)).toBe('undefined behavior');
    expect(val(item('rs', 'int-overflow').expected)).toBe('panic');
  });

  it('두 줄이고 물음은 둘째 줄이다 — 리터럴로 쓰면 Go·Rust 가 컴파일에서 막는다', () => {
    const go = item('go', 'int-overflow');
    expect(go.code).toEqual(['a := 2147483647', 'b := a + 1']);
    expect(go.focus).toBe(1);
  });

  it('SQL 은 두 줄 선언이 없어 빠진다', () => {
    expect(buildValueItems('sql').dropped.map((d) => d.exprId)).toContain('int-overflow');
  });
});

describe('생성의 계약', () => {
  it('같은 언어에 두 번 부르면 같은 문항이다 (04 §9 결정성)', () => {
    expect(buildValueItems('java')).toEqual(buildValueItems('java'));
  });

  it('id 가 열 언어에 걸쳐 유일하다', () => {
    const ids = buildAllValueItems().map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('열 언어에서 38장이 서고 SQL 만 둘을 못 낸다', () => {
    expect(buildAllValueItems()).toHaveLength(38);
    expect(buildValueItems('sql').items).toHaveLength(2);
  });

  it('개념 id 가 실재하는 네임스페이스를 가리킨다', () => {
    for (const x of buildAllValueItems()) {
      expect(x.conceptId).toMatch(/^(?:java|py|ts|common|cs)\/[a-z-]+$/u);
    }
  });
});

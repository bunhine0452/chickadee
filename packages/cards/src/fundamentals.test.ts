/**
 * 카탈로그의 시험. 세 가지를 잰다 —
 *   ① **값이 맞나** (열 언어의 갈림이 실제로 그 갈림인가)
 *   ② **재고가 규칙을 만족하나** (축마다 식 셋 이상 · 개념마다 식 둘 이상 · 진단 100%)
 *   ③ **사전과 안 어긋나나** — 자바 0부 사전의 꼬리 주석(`// 7 / 2 -> 3 (int)`)과 카탈로그의
 *      값을 맞댄다. 카탈로그를 손으로 적은 대가를 여기서 치른다.
 */
import { bundledFiles } from '@chickadee/dictionary';
import { describe, expect, it } from 'vitest';

import {
  buildAllValueItems, buildValueItems, fundCensus, fundConceptId, planFundRetry,
  valueText, FUND_AXES, FUND_DIALECTS, FUND_LANGS,
  type FundAxis, type FundLang, type FundValue,
} from './fundamentals.js';

/** 그 언어의 그 식 하나. 없으면 시험이 여기서 죽는다. */
function item(lang: FundLang, exprId: string) {
  const found = buildValueItems(lang).items.find((x) => x.id === `${exprId}:${lang}`);
  if (found === undefined) throw new Error(`${exprId}:${lang} 이 안 나왔다`);
  return found;
}

const val = (v: FundValue): string => valueText(v);

describe('열 언어의 기계 규칙', () => {
  it('언어마다 dialect 가 하나씩 있고 lang 이 자기 키와 같다', () => {
    expect(FUND_LANGS).toHaveLength(10);
    for (const lang of FUND_LANGS) expect(FUND_DIALECTS[lang].lang).toBe(lang);
  });

  it('실측한 행은 셋이고 나머지 다섯은 명세를 읽고 적은 것이다', () => {
    const measured = FUND_LANGS.filter((l) => FUND_DIALECTS[l].verified === 'measured');
    expect(measured).toEqual(['py', 'ts', 'sql']);
    // 「명세」인 행은 착수 전에 실제 툴체인으로 다시 재야 한다 (문서 §10).
    const spec = FUND_LANGS.filter((l) => FUND_DIALECTS[l].verified === 'spec');
    expect(spec).toEqual(['c', 'cpp', 'java', 'csharp', 'rs', 'go', 'swift']);
  });
});

describe('축 1 정수', () => {
  it('int-div — 정수가 남는 언어는 3, 나눗셈이 실수가 되는 둘은 3.5', () => {
    for (const lang of ['java', 'c', 'cpp', 'csharp', 'go', 'rs', 'swift', 'sql'] as const) {
      expect(item(lang, 'int-div').expected).toEqual({ t: 'int', v: '3' });
    }
    for (const lang of ['py', 'ts'] as const) {
      expect(item(lang, 'int-div').expected).toEqual({ t: 'float', v: '3.5' });
    }
  });

  it('int-div — 자바 판은 자바 코드로 보이고 파이썬의 답을 형제로 든다', () => {
    const java = item('java', 'int-div');
    expect(java.code).toEqual(['int a = 7 / 2;']);
    expect(java.target).toEqual({ name: 'a', declared: 'int' });
    expect(java.siblings.map((s) => s.lang)).toContain('py');
    expect(java.siblings.find((s) => s.lang === 'py')?.value).toEqual({ t: 'float', v: '3.5' });
  });

  it('int-div — 파이썬만 몫 나눗셈이 다른 판이다 (`/` ↔ `//`)', () => {
    expect(item('py', 'int-div').variants[0]).toMatchObject({ from: '7 / 2', to: '7 // 2' });
    expect(item('java', 'int-div').variants[0]).toMatchObject({ to: '7 / 2.0' });
  });

  it('mod-neg — 파이썬만 1 이고 나머지 아홉은 -1 이다', () => {
    expect(val(item('py', 'mod-neg').expected)).toBe('1');
    for (const lang of FUND_LANGS.filter((l) => l !== 'py')) {
      expect(val(item(lang, 'mod-neg').expected)).toBe('-1');
    }
  });

  it('int-overflow — 답이 넷으로 갈린다 (감기 · 안 넘침 · 미정의 · 중단)', () => {
    expect(val(item('java', 'int-overflow').expected)).toBe('-2147483648');
    expect(val(item('c', 'int-overflow').expected)).toBe('undefined behavior');
    expect(val(item('rs', 'int-overflow').expected)).toBe('panic');
    expect(val(item('go', 'int-overflow').expected)).toBe('2147483648');
  });

  it('int-overflow — 리터럴로 쓰면 Go·Rust 가 컴파일에서 막아 변수를 한 번 거친다', () => {
    expect(item('go', 'int-overflow').code).toHaveLength(2);
    expect(item('go', 'int-overflow').focus).toBe(1);
    // SQL 은 문장 잇기가 없어 한 줄로 접힌다 — 대신 상수 접기 오류가 없다.
    expect(item('sql', 'int-overflow').code).toEqual(['SELECT 2147483647 + 1 AS b;']);
  });

  it('int-overflow — 스위프트는 감는 연산자가 따로 있다 (`+` ↔ `&+`)', () => {
    expect(item('swift', 'int-overflow').langAlt[0]).toMatchObject({ from: '+ 1', to: '&+ 1' });
  });

  it('shift-31 — TS 는 수가 double 인데 비트 연산만 32칸으로 내려간다', () => {
    expect(val(item('ts', 'shift-31').expected)).toBe('-2147483648');
    expect(val(item('py', 'shift-31').expected)).toBe('2147483648');
    expect(val(item('sql', 'shift-31').expected)).toBe('2147483648');
    expect(val(item('c', 'shift-31').expected)).toBe('undefined behavior');
  });
});

describe('축 2 실수', () => {
  it('float-add — 아홉 언어가 같은 double 을 내고 SQL 은 사유를 달고 빠진다', () => {
    for (const lang of FUND_LANGS.filter((l) => l !== 'sql')) {
      expect(item(lang, 'float-add').expected).toEqual({ t: 'float', v: '0.30000000000000004' });
    }
    const drop = buildValueItems('sql').dropped.find((d) => d.exprId === 'float-add');
    expect(drop?.reason).toContain('15자리');
  });

  it('float-add — 적은 자릿수가 실제 double 과 같다 (손으로 적은 값의 검산)', () => {
    expect(Number(val(item('java', 'float-add').expected))).toBe(0.1 + 0.2);
  });

  it('float-add — 열 언어가 같은 답이라 진단이 「한 글자 다른 판」에서 나온다', () => {
    const x = item('java', 'float-add');
    expect(x.siblings).toHaveLength(0);
    expect(x.diagnosis).toBe('variants');
    expect(x.variants[0]?.value).toEqual({ t: 'float', v: '0.75' });
  });

  it('float-div-zero — 파이썬은 예외, SQL 은 NULL, 나머지 여덟은 Infinity', () => {
    expect(val(item('py', 'float-div-zero').expected)).toBe('ZeroDivisionError');
    expect(val(item('sql', 'float-div-zero').expected)).toBe('NULL');
    expect(val(item('go', 'float-div-zero').expected)).toBe('Infinity');
  });
});

describe('축 3 문자 — 길이를 무엇으로 세나', () => {
  it('같은 글자 하나에 답이 넷이다 (코드 단위 · 바이트 · 코드포인트 · 글자)', () => {
    expect(val(item('java', 'text-len').expected)).toBe('2');
    expect(val(item('go', 'text-len').expected)).toBe('4');
    expect(val(item('py', 'text-len').expected)).toBe('1');
    expect(val(item('swift', 'text-len').expected)).toBe('1');
  });

  it('ASCII 세 글자로 바꾼 판은 열 언어가 전부 3 이다 — 갈리는 것은 담는 방식이다', () => {
    for (const lang of FUND_LANGS) {
      expect(val(item(lang, 'text-len').variants[0]?.value ?? { t: 'int', v: '' })).toBe('3');
    }
  });

  it('str-plus-num — 이어 붙나 · 수로 바꾸나 · 예외인가 · 컴파일이 막나 · 포인터 셈인가', () => {
    expect(item('java', 'str-plus-num').expected).toEqual({ t: 'string', v: '12' });
    expect(val(item('sql', 'str-plus-num').expected)).toBe('3');
    expect(val(item('py', 'str-plus-num').expected)).toBe('TypeError');
    expect(item('go', 'str-plus-num').expected.t).toBe('compile-error');
    expect(item('c', 'str-plus-num').expected.t).toBe('unspecified');
  });

  it('text-index — 스위프트만 사유를 달고 빠지고, Go 는 글자가 아니라 바이트를 준다', () => {
    expect(buildValueItems('swift').dropped.find((d) => d.exprId === 'text-index')?.reason)
      .toContain('인덱스 타입');
    expect(val(item('go', 'text-index').expected)).toBe('98');
    expect(item('java', 'text-index').expected).toEqual({ t: 'string', v: 'b' });
  });
});

describe('축 4~8 — 갈림이 실제로 갈리나', () => {
  it('not-zero — 러스트의 `!` 는 비트 뒤집기라 -1 이다', () => {
    expect(val(item('rs', 'not-zero').expected)).toBe('-1');
    expect(val(item('c', 'not-zero').expected)).toBe('1');
    expect(item('py', 'not-zero').code).toEqual(['b = not 0']);
    expect(item('java', 'not-zero').expected.t).toBe('compile-error');
  });

  it('prec-shift-add — Go·Swift 만 `<<` 가 `+` 보다 먼저다', () => {
    for (const lang of ['go', 'swift'] as const) expect(val(item(lang, 'prec-shift-add').expected)).toBe('17');
    for (const lang of ['java', 'c', 'ts', 'py', 'sql', 'rs'] as const) {
      expect(val(item(lang, 'prec-shift-add').expected)).toBe('24');
    }
  });

  it('prec-cmp-chain — 사슬(파이썬) · 접힘(C·TS·SQL) · 오류(다섯)', () => {
    expect(item('py', 'prec-cmp-chain').variants[0]).toMatchObject({ to: '1 < 2 < 0' });
    expect(item('py', 'prec-cmp-chain').variants[0]?.value).toEqual({ t: 'bool', v: false });
    expect(item('ts', 'prec-cmp-chain').variants[0]?.value).toEqual({ t: 'bool', v: false });
    expect(item('java', 'prec-cmp-chain').expected.t).toBe('compile-error');
  });

  it('str-times-int — 파이썬은 되풀이하고 TS·SQL 은 수로 바꾼다', () => {
    expect(item('py', 'str-times-int').expected).toEqual({ t: 'string', v: '55' });
    expect(val(item('ts', 'str-times-int').expected)).toBe('10');
    expect(val(item('sql', 'str-times-int').expected)).toBe('10');
  });

  it('post-inc — Go 는 문장뿐이고 파이썬·러스트·스위프트에는 아예 없다', () => {
    expect(val(item('java', 'post-inc').expected)).toBe('1');
    expect(item('java', 'post-inc').variants[0]).toMatchObject({ from: 'n++', to: '++n' });
    for (const lang of ['go', 'py', 'rs', 'swift'] as const) {
      expect(item(lang, 'post-inc').expected.t).toBe('compile-error');
    }
  });

  it('boxed-eq — 자바는 명세가 답을 안 정한다 (JLS 5.1.7)', () => {
    expect(item('java', 'boxed-eq').expected.t).toBe('unspecified');
    expect(item('java', 'boxed-eq').langAlt[0]).toMatchObject({ from: '128', to: '127' });
    expect(item('csharp', 'boxed-eq').expected).toEqual({ t: 'bool', v: false });
    expect(buildValueItems('ts').dropped.find((d) => d.exprId === 'boxed-eq')).toBeDefined();
  });

  it('null-eq — SQL 만 모름이고, `IS NULL` 이 그 언어 안의 다른 규칙이다', () => {
    expect(val(item('sql', 'null-eq').expected)).toBe('NULL');
    expect(item('sql', 'null-eq').langAlt[0]).toMatchObject({ from: '= NULL', to: 'IS NULL' });
    expect(item('java', 'null-eq').expected).toEqual({ t: 'bool', v: true });
  });

  it('loose-eq — JS 만 조용히 맞추고 SQL 은 **안 맞춘다** (실측)', () => {
    expect(item('ts', 'loose-eq').expected).toEqual({ t: 'bool', v: true });
    expect(item('ts', 'loose-eq').variants[0]).toMatchObject({ from: '0 == ', to: '0 === ' });
    expect(item('sql', 'loose-eq').expected).toEqual({ t: 'bool', v: false });
    expect(item('py', 'loose-eq').expected).toEqual({ t: 'bool', v: false });
  });

  it('null-not-in — SQL 하나뿐이고 `NOT EXISTS` 가 그 안의 다른 규칙이다', () => {
    expect(val(item('sql', 'null-not-in').expected)).toBe('NULL');
    expect(item('sql', 'null-not-in').langAlt[0]).toMatchObject({ from: 'NOT IN', to: 'NOT EXISTS' });
    expect(buildValueItems('java').dropped.find((d) => d.exprId === 'null-not-in')).toBeDefined();
  });
});

describe('재고 — 규칙이 실제로 서나', () => {
  const census = fundCensus();

  it('열 언어에서 249장이 선다 (넷이던 식을 스물일곱으로 늘렸다)', () => {
    expect(buildAllValueItems()).toHaveLength(249);
    expect(census.total).toBe(249);
  });

  it('id 가 열 언어에 걸쳐 유일하다', () => {
    const ids = buildAllValueItems().map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('같은 언어에 두 번 부르면 같은 문항이다 (04 §9 결정성)', () => {
    expect(buildValueItems('java')).toEqual(buildValueItems('java'));
  });

  it('개념 id 가 실재하는 네임스페이스를 가리킨다', () => {
    for (const x of buildAllValueItems()) {
      expect(x.conceptId).toMatch(/^(?:java|py|ts|sql|common|cs)\/[a-z-]+$/u);
      if (x.machineId !== null) expect(x.machineId).toMatch(/^cs\/[a-z-]+$/u);
    }
  });

  it('축마다 식이 셋 이상이다 — **SQL 의 축 7 하나만 빈다**', () => {
    const gaps: string[] = [];
    for (const L of census.langs) {
      for (const axis of FUND_AXES) {
        if (L.byAxis[axis] < 3) gaps.push(`${L.lang}/${axis}=${L.byAxis[axis]}`);
      }
    }
    // SQL 에 대입이 없는 것(README §8)과 스위프트가 정수 색인을 안 받는 것은 **사실**이고
    // 사유가 `dropped` 에 남는다. 그 둘 말고 빈 자리가 생기면 여기서 걸린다.
    expect(gaps.sort()).toEqual(['sql/assignment=0', 'sql/float=2', 'swift/text=2']);
  });

  it('개념마다 식이 둘 이상이다 — 재출제가 「다른 식」이 되는 조건 (D187 ②)', () => {
    expect(census.singletons).toEqual([]);
  });

  it('오답마다 진단이 계산된다 — 진단 없는 판이 0장이다 (D186 ③ㄷ)', () => {
    expect(census.diagnosis.none).toBe(0);
    for (const x of buildAllValueItems()) {
      expect(x.siblings.length + x.variants.length + x.langAlt.length).toBeGreaterThan(0);
    }
  });

  it('다른 판은 코드가 실제로 다르다 — 값만 다른 「판」은 진단이 아니라 거짓말이다', () => {
    for (const x of buildAllValueItems()) {
      for (const a of [...x.variants, ...x.langAlt]) {
        expect(a.code.join('\n')).not.toBe(x.code.join('\n'));
        expect(JSON.stringify(a.value)).not.toBe(JSON.stringify(x.expected));
      }
    }
  });

  it('못 낸 식에는 사유가 있다 (04 전제)', () => {
    for (const lang of FUND_LANGS) {
      for (const d of buildValueItems(lang).dropped) expect(d.reason.length).toBeGreaterThan(5);
    }
  });
});

describe('재출제 — 다른 식 같은 개념 (D187 ②)', () => {
  it('같은 개념의 다른 식을 고른다', () => {
    const next = planFundRetry('java', 'int-div:java');
    expect(next.sameExpr).toBe(false);
    expect(next.item.conceptId).toBe(item('java', 'int-div').conceptId);
    expect(next.item.id).not.toBe('int-div:java');
  });

  it('오늘 이미 본 식은 뒤로 민다 — 난수를 안 쓰므로 순서가 재현된다', () => {
    const first = planFundRetry('java', 'int-div:java').item.id;
    const second = planFundRetry('java', 'int-div:java', [first]).item.id;
    expect(second).not.toBe(first);
    expect(planFundRetry('java', 'int-div:java', [first]).item.id).toBe(second);
  });

  it('식이 하나뿐이면 같은 식이고 **그 사실을 판정란이 말한다**', () => {
    // 지금 카탈로그에는 그런 개념이 없다. 그래도 규칙은 서 있어야 하므로 계약으로 남긴다.
    expect(fundCensus().singletons).toEqual([]);
    const only = planFundRetry('sql', 'null-not-in:sql');
    expect(only.item.conceptId).toBe('sql/comparison');
    expect(only.sameExpr).toBe(false);
  });
});

describe('사전과 안 어긋나나 — 자바 0부 꼬리 주석의 검산', () => {
  /** `// 7 / 2 -> 3 (int)` · `// avg -> 3.5 (double)` */
  const TAIL = /\/\/\s*(.+?)\s*->\s*([^(]+?)\s*(?:\(([^)]*)\))?\s*"?\s*$/u;
  const norm = (s: string): string => s.replace(/\s+/gu, ' ').trim();

  /**
   * 사전이 값을 든 자리 — `식 → 값`.
   *
   * **왼쪽이 식인 주석만** 받는다. `double d = 7 / 2;  // d -> 3.0` 처럼 왼쪽이 이름이면
   * 그 값은 식이 아니라 **선언 타입**이 정한 것이라(`7 / 2` 는 3 이고 담기면서 3.0 이 된다)
   * 식 하나에 값 둘이 붙는다. 그 자리를 억지로 끌어오면 검산이 아니라 거짓 경보가 된다.
   */
  function dictValues(): Map<string, string> {
    const out = new Map<string, string>();
    for (const { text } of bundledFiles('java')) {
      for (const line of text.split('\n')) {
        const m = TAIL.exec(line);
        if (m === null) continue;
        const [, lhs = '', value = ''] = m;
        const key = norm(lhs);
        if (key === '' || /^[A-Za-z_]\w*$/u.test(key)) continue;
        out.set(key, norm(value));
      }
    }
    return out;
  }

  it('사전이 값을 든 꼬리 주석을 실제로 들고 있다', () => {
    expect(dictValues().size).toBeGreaterThan(20);
  });

  it('같은 식을 둘 다 들고 있으면 값이 같다', () => {
    const dict = dictValues();
    const checked: string[] = [];
    for (const x of buildValueItems('java').items) {
      for (const [expr, value] of [
        [x.fold[0]?.code ?? '', valueText(x.expected)] as const,
        ...x.variants.map((a) => [a.to, valueText(a.value)] as const),
      ]) {
        const want = dict.get(norm(expr));
        if (want === undefined) continue;
        checked.push(`${expr} -> ${value}`);
        expect(`${expr} -> ${want}`).toBe(`${expr} -> ${value}`);
      }
    }
    // 겹치는 자리가 사라지면(사전이 바뀌면) 이 시험이 조용히 아무것도 안 재게 된다.
    expect(checked.length).toBeGreaterThanOrEqual(3);
  });
});

describe('개념 anchor', () => {
  it('축 여덟이 언어마다 실재하는 개념에 걸린다', () => {
    const axes: FundAxis[] = [...FUND_AXES];
    for (const axis of axes) {
      expect(fundConceptId(axis, 'go')).toMatch(/^(?:common|cs)\//u);
      expect(fundConceptId(axis, 'java')).toMatch(/^(?:java|common|cs)\//u);
    }
    expect(fundConceptId('integer', 'java')).toBe('java/integer-limit');
    expect(fundConceptId('assignment', 'sql')).toBe('common/variable-binding');
  });
});

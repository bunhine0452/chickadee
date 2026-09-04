/**
 * 로케일 풀기 (D118). 여기서 지키는 것은 셋이다 —
 *   ① 스칼라 문자열은 `ko` 다. 기존 57 YAML 이 한 글자도 안 바뀌고 통과하는 근거가 이것이다.
 *   ② `en` 이 없으면 `ko` 를 낸다. 화면에 빈 칸을 그리지 않는다.
 *   ③ 폴백한 자리를 개념에 남긴다. 화면이 그것으로 한 줄을 낸다.
 */
import { describe, expect, test } from 'vitest';

import { loadDict } from './load.js';
import { resolveConcept } from './resolve.js';
import { conceptSourceSchema, textOf, type SourceConcept } from './schema.js';

function source(patch: Record<string, unknown>): SourceConcept {
  return conceptSourceSchema.parse({
    schema: 1,
    id: 'ts/x',
    name: { ko: '테스트', en: 'test' },
    difficulty: 1,
    dict: {
      one_liner: { ko: '한 줄', en: 'One line' },
      why: { ko: '왜', en: 'Why' },
    },
    rule: '규칙',
    ok: '맞습니다',
    ...patch,
  });
}

describe('스칼라는 ko 다', () => {
  test('문자열 하나짜리 개념은 ko 로도 en 으로도 같은 글을 낸다', () => {
    const src = source({ rule: '규칙' });
    expect(resolveConcept(src, 'ko').rule).toBe('규칙');
    expect(resolveConcept(src, 'en').rule).toBe('규칙');
  });

  test('스칼라만 있는 개념을 en 으로 열면 폴백으로 잡힌다', () => {
    expect(resolveConcept(source({}), 'en').untranslated).toContain('rule');
  });
});

describe('{ ko, en }', () => {
  const src = source({
    rule: { ko: '규칙', en: 'The rule' },
    ok: { ko: '맞습니다', en: 'That holds' },
    misconceptions: [{ ko: '오해', en: 'A misreading' }, '번역 전'],
  });

  test('ko 로 열면 ko 를 낸다', () => {
    const c = resolveConcept(src, 'ko');
    expect(c.rule).toBe('규칙');
    expect(c.misconceptions).toEqual(['오해', '번역 전']);
    expect(c.untranslated).toBeUndefined();
  });

  test('en 으로 열면 en 을 내고, 없는 자리만 ko 로 메운다', () => {
    const c = resolveConcept(src, 'en');
    expect(c.rule).toBe('The rule');
    expect(c.misconceptions).toEqual(['A misreading', '번역 전']);
    expect(c.untranslated).toContain('misconceptions[1]');
    expect(c.untranslated).not.toContain('rule');
  });

  test('빈 문자열은 번역이 아니다 — ko 로 폴백한다', () => {
    const c = resolveConcept(source({ rule: { ko: '규칙', en: '' } }), 'en');
    expect(c.rule).toBe('규칙');
    expect(c.untranslated).toContain('rule');
  });
});

describe('폴백 자국', () => {
  test('한글이 없는 값은 번역할 것이 없으므로 세지 않는다', () => {
    // 빈칸형 오답은 혼동 쌍의 코드 토큰이다. 그것까지 세면 다 번역된 개념도 미번역이 된다.
    const c = resolveConcept(source({ rule: { ko: '규칙', en: 'The rule' }, ok: '?.' }), 'en');
    expect(c.untranslated).toBeUndefined();
    expect(c.ok).toBe('?.');
  });

  test('name 은 두 언어를 다 들고 남는다 — 원장의 두 열로 갈라진다', () => {
    const c = resolveConcept(source({}), 'en');
    expect(c.name).toEqual({ ko: '테스트', en: 'test' });
  });
});

describe('textOf', () => {
  test('ko 는 폴백이 아니다', () => {
    expect(textOf({ ko: '가', en: 'a' }, 'ko')).toEqual({ text: '가', fellBack: false });
  });

  test('en 이 없으면 폴백이라고 말한다', () => {
    expect(textOf('가', 'en')).toEqual({ text: '가', fellBack: true });
  });
});

describe('번들 사전', () => {
  test('en 으로 열어도 개념 수가 같다 — 폴백이 개념을 떨어뜨리지 않는다', () => {
    const ko = loadDict({ dependencies: ['react'] });
    const en = loadDict({ dependencies: ['react'], locale: 'en' });
    expect(en.problems).toEqual([]);
    expect(en.concepts.size).toBe(ko.concepts.size);
    expect(en.locale).toBe('en');
  });

  test('개념 이름은 en 으로 열어도 두 언어가 다 남는다', () => {
    const en = loadDict({ dependencies: ['react'], locale: 'en' });
    const optional = en.concepts.get('ts/optional-chaining');
    expect(optional?.name).toEqual({ ko: '옵셔널 체이닝', en: 'Optional chaining' });
  });

  test('산문은 아직 ko 뿐이라 en 으로 열면 폴백이 잡힌다 (P3 번역 전)', () => {
    const en = loadDict({ dependencies: ['react'], locale: 'en' });
    const optional = en.concepts.get('ts/optional-chaining');
    expect(optional?.untranslated).toContain('dict.one_liner');
    expect(optional?.dict.one_liner).toBe(
      loadDict({ dependencies: ['react'] }).concepts.get('ts/optional-chaining')?.dict.one_liner,
    );
  });
});

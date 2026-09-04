/**
 * 린트 규칙 자체 (03 §4.3). 번들 사전이 통과하는지는 `dict.test.ts` 가 보고,
 * 여기서는 **규칙이 진짜 위반을 잡는지**를 본다 — 안 잡는 규칙은 통과를 거짓말로 만든다.
 */
import { describe, expect, test } from 'vitest';

import { lintDict } from './lint.js';
import { resolveConcept } from './resolve.js';
import { conceptSourceSchema, type SourceConcept } from './schema.js';
import type { Dict } from './load.js';

/** 문장 하나만 갈아 끼우는 최소 개념. 나머지는 스키마 기본값이 채운다. */
function conceptWith(patch: Partial<SourceConcept>): SourceConcept {
  return conceptSourceSchema.parse({
    schema: 1,
    id: 'ts/x',
    name: { ko: '테스트', en: 'test' },
    difficulty: 1,
    dict: { one_liner: '한 줄', why: '왜' },
    rule: '규칙',
    ok: '맞습니다',
    queries: [{ grammars: ['typescript'], file: 'x.scm' }],
    ...patch,
  }) as SourceConcept;
}

const dictOf = (concept: SourceConcept): Dict => ({
  locale: 'ko',
  langs: new Map(),
  concepts: new Map([[concept.id, resolveConcept(concept, 'ko')]]),
  sources: new Map([[concept.id, concept]]),
  queries: new Map(),
  problems: [],
});

const rulesOf = (concept: SourceConcept): string[] =>
  lintDict(dictOf(concept)).map((i) => i.rule);

describe('josa', () => {
  test('변수 뒤에 조사를 직접 쓰면 잡는다', () => {
    expect(rulesOf(conceptWith({ rule: '{{pick.1}} 은 배열입니다.' }))).toContain('josa-filter');
  });

  test('태그를 사이에 껴도 잡는다 — 그러지 않으면 규칙을 우회하는 법이 된다', () => {
    expect(rulesOf(conceptWith({ rule: '<code>{{pick.1}}</code> 은 배열입니다.' })))
      .toContain('josa-filter');
  });

  test('값 없이 조사만 내면 잡는다 — 명사가 통째로 빠진다', () => {
    const bad = conceptWith({
      result: { label: 'ㄱ', value: '{{pick.2|josa:이,가}} 돌려준 것', note: 'ㄴ' },
    });
    expect(rulesOf(bad)).toContain('josa-without-value');
  });

  test('앞에서 값을 냈으면 통과한다', () => {
    const ok = conceptWith({
      result: { label: 'ㄱ', value: '{{pick.2}}{{pick.2|josa:이,가}} 돌려준 것', note: 'ㄴ' },
    });
    expect(rulesOf(ok)).not.toContain('josa-without-value');
  });

  test('`|code` 로 값을 내도 통과한다', () => {
    const ok = conceptWith({ rule: '{{pick.1|code}}{{pick.1|josa:은,는}} 배열입니다.' });
    expect(rulesOf(ok)).not.toContain('josa-without-value');
  });

  test('같은 이름이 아니면 값을 낸 것이 아니다', () => {
    const bad = conceptWith({ rule: '{{pick.1}} 뒤에 {{pick.2|josa:은,는}} 붙습니다.' });
    expect(rulesOf(bad)).toContain('josa-without-value');
  });
});

describe('진단 문구', () => {
  test('「틀렸」류는 판정이지 진단이 아니다 (정본 §3-2)', () => {
    expect(rulesOf(conceptWith({ rule: '그건 틀렸습니다.' })))
      .toContain('diagnosis-not-verdict');
  });
});

describe('언어별 검사 (D118)', () => {
  test('조사 규칙은 ko 에만 건다 — 영어에 걸면 언제나 통과하는 죽은 규칙이 된다', () => {
    const bad = conceptWith({ rule: { ko: '{{pick.1}}{{pick.1|josa:은,는}} 배열입니다.', en: '{{pick.1}} is an array.' } });
    expect(rulesOf(bad)).not.toContain('josa-filter');
  });

  test('ko 쪽 조사 실수는 en 이 있어도 그대로 잡는다', () => {
    const bad = conceptWith({ rule: { ko: '{{pick.1}} 은 배열입니다.', en: '{{pick.1}} is an array.' } });
    expect(rulesOf(bad)).toContain('josa-filter');
  });

  test('en 의 판정 낱말을 잡는다 — 한국어 목록만 걸면 en 은 아무것도 안 걸린다', () => {
    const bad = conceptWith({ rule: { ko: '규칙', en: "That is wrong." } });
    expect(rulesOf(bad)).toContain('diagnosis-not-verdict');
  });

  test('en 의 템플릿 변수도 본다', () => {
    const bad = conceptWith({ rule: { ko: '규칙', en: 'See {{nope}}.' } });
    expect(rulesOf(bad).filter((r) => r === 'template-variable')).toHaveLength(1);
  });

  test('en 의 허용 밖 태그도 본다 — 렌더는 언어를 가리지 않는다 (06 §4.2)', () => {
    const bad = conceptWith({ rule: { ko: '규칙', en: '<script>x</script>' } });
    expect(rulesOf(bad)).toContain('html-tag');
  });

  test('어느 언어에서 걸렸는지 자리 이름에 남는다', () => {
    const issues = lintDict(dictOf(conceptWith({ rule: { ko: '규칙', en: 'It failed.' } })));
    expect(issues.find((i) => i.rule === 'diagnosis-not-verdict')?.detail).toContain('rule.en');
  });
});

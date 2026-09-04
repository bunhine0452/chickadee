/**
 * 린트 규칙 자체 (03 §4.3). 번들 사전이 통과하는지는 `dict.test.ts` 가 보고,
 * 여기서는 **규칙이 진짜 위반을 잡는지**를 본다 — 안 잡는 규칙은 통과를 거짓말로 만든다.
 */
import { describe, expect, test } from 'vitest';

import { authoringDebt, lintDict, type DebtCheck } from './lint.js';
import { resolveConcept } from './resolve.js';
import { conceptSourceSchema, langMetaSchema, type LangMeta, type SourceConcept } from './schema.js';
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

describe('사전 저작 부채 (D145)', () => {
  /** `essential` 하나짜리 언어. 부채 표는 `_lang.yaml` 을 봐야 대상이 정해진다. */
  const langWith = (essential: string[]): LangMeta => langMetaSchema.parse({
    lang: 'ts',
    version: '0.0.0',
    grammars: ['typescript'],
    grammar_abi: { typescript: 14 },
    extensions: { typescript: ['.ts'] },
    thin_threshold: { min_files: 1, min_sites: 1, small_repo_files: 1 },
    diag_default: { point: '짚은 자리', blank: '넣은 것' },
    essential,
  });

  const debtOf = (concept: SourceConcept, scm: string, essential = [concept.id]): DebtCheck[] =>
    authoringDebt({
      ...dictOf(concept),
      langs: new Map([['ts', langWith(essential)]]),
      queries: new Map([[`${concept.id}::typescript`, scm]]),
    });

  const check = (checks: DebtCheck[], rule: string): DebtCheck =>
    checks.find((c) => c.rule === rule) as DebtCheck;

  test('빈칸형이 없으면 부채고, 사유를 적으면 갚은 것으로 센다', () => {
    const bare = conceptWith({});
    expect(check(debtOf(bare, '(identifier) @site'), 'blank-or-reason').met).toBe(0);
    const excused = conceptWith({ no_hole_reason: '이 문법에는 지울 수 있는 토큰이 없다' });
    expect(check(debtOf(excused, '(identifier) @site'), 'blank-or-reason').met).toBe(1);
  });

  test('사유가 낡으면 린트가 잡는다 — 표는 초록인데 이유가 거짓말이 된다', () => {
    const filled = conceptWith({
      grammars: ['typescript'],
      confusions: [],
      no_hole_reason: '이 문법에는 지울 수 있는 토큰이 없다',
      blank: [{ q: '무엇이 들어가나요?', options: [{ t: '??' }, { t: '||' }, { t: '&&' }, { t: '?.' }] }],
    });
    const dict = {
      ...dictOf(filled),
      queries: new Map([[`${filled.id}::typescript`, '(identifier) @hole']]),
    };
    expect(lintDict(dict).map((i) => i.rule)).toContain('no-hole-reason-stale');
  });

  test('지목형은 후보가 셋에 못 미치면 부채다 — 정답 1 + 오답 3 이 안 나온다', () => {
    const point = { q: '짚어 보세요', answer: 'pick.1' };
    const thin = conceptWith({ grammars: ['typescript'], point: [point] });
    expect(check(debtOf(thin, '(a) @pick.1 (b) @pick.2'), 'point-picks').met).toBe(0);
    expect(check(debtOf(thin, '(a) @pick.1 (b) @pick.2 (c) @pick.3'), 'point-picks').met).toBe(1);
  });

  test('essential 의 why_gate 를 센다', () => {
    expect(check(debtOf(conceptWith({}), ''), 'why-gate').met).toBe(0);
  });

  describe('0장 누설 (D138)', () => {
    const leaky = (oneLiner: string, token: string): SourceConcept => conceptWith({
      grammars: ['typescript'],
      dict: { one_liner: oneLiner, why: '왜', trace: [] },
      point: [{ q: '짚어 보세요', answer: 'pick.1' }],
      examples: [{ code: 'x', expect: { sites: 1, picks: { 1: token } } }],
    });
    const scm = '(a) @pick.1 (b) @pick.2 (c) @pick.3';

    test('one_liner 가 정답 토큰을 그대로 내면 걸린다', () => {
      const c = check(debtOf(leaky('<code>const</code> 는 이름에 값을 묶는다.', 'const'), scm), 'zero-one-liner');
      expect(c.total).toBe(1);
      expect(c.gaps).toEqual(['ts/x(const)']);
    });

    test('안 내면 통과한다', () => {
      expect(check(debtOf(leaky('이름 하나에 값을 묶는다.', 'const'), scm), 'zero-one-liner').met).toBe(1);
    });

    test('문장 끝 마침표는 토큰이 아니다 — 아니면 `.` 이 정답인 개념은 영영 못 지나간다', () => {
      expect(check(debtOf(leaky('안에서 그 이름의 값을 꺼낸다.', '.'), scm), 'zero-one-liner').met).toBe(1);
      expect(check(debtOf(leaky('<code>a.b</code> 로 꺼낸다', '.'), scm), 'zero-one-liner').met).toBe(0);
    });

    test('낱말 안에 묻힌 글자는 누설이 아니다', () => {
      expect(check(debtOf(leaky('previous 값을 받아 새 값을 돌려준다', 'prev'), scm), 'zero-one-liner').met).toBe(1);
    });

    // D150 으로 대상이 「0장 후보(깊이 ≤ 2)」에서 **`essential` 전량**이 됐다 — 「먼저 읽기」가
    // 겹 0 인 모든 개념에서 펴지므로 깊이로 좁히면 린트가 화면보다 좁아진다. 깊이가 깊어도
    // `essential` 이면 대상이고, `essential` 밖이면 아니다.
    test('선행이 깊어도 essential 이면 대상이다 (D150)', () => {
      const root = conceptWith({ id: 'ts/root' });
      const mid = conceptWith({ id: 'ts/mid', prereq: ['ts/root'] });
      const top = conceptWith({ id: 'ts/top', prereq: ['ts/mid'] });
      const far = leaky('<code>const</code> 를 쓴다', 'const');
      const dict: Dict = {
        locale: 'ko',
        langs: new Map([['ts', langWith(['ts/root', 'ts/mid', 'ts/top', 'ts/x'])]]),
        concepts: new Map(),
        sources: new Map([
          ['ts/root', root], ['ts/mid', mid], ['ts/top', top],
          ['ts/x', { ...far, prereq: ['ts/top'] }],
        ]),
        queries: new Map([['ts/x::typescript', scm]]),
        problems: [],
      };
      const c = check(authoringDebt(dict), 'zero-one-liner');
      expect(c.total).toBe(1);
      expect(c.gaps).toEqual(['ts/x(const)']);
    });

    test('essential 밖이면 대상이 아니다', () => {
      const far = leaky('<code>const</code> 를 쓴다', 'const');
      const dict: Dict = {
        locale: 'ko',
        langs: new Map([['ts', langWith(['ts/root'])]]),
        concepts: new Map(),
        sources: new Map([['ts/root', conceptWith({ id: 'ts/root' })], ['ts/x', far]]),
        queries: new Map([['ts/x::typescript', scm]]),
        problems: [],
      };
      expect(check(authoringDebt(dict), 'zero-one-liner').gaps).toEqual([]);
    });
  });
});

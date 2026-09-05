/**
 * `build` 형식의 카탈로그 (D187 ① · `fundamentals.md` §2).
 *
 * 여기서 재는 것은 **판이 서는가**이지 채점이 아니다 — 채점은 실행이 필요해
 * `packages/grading/src/build.test.ts` 가 진짜 프로세스로 본다.
 */
import { describe, expect, it } from 'vitest';

import { BUILD_LANGS, buildBuildItems, buildConcepts, wantText } from './build.js';
import { FUND_DIALECTS } from './fundamentals.js';

describe('러너가 든 언어에서만 선다', () => {
  it('셋뿐이다 — 나머지 일곱은 이 형식을 안 낸다', () => {
    expect([...BUILD_LANGS]).toEqual(['py', 'ts', 'java']);
  });

  for (const lang of BUILD_LANGS) {
    it(`${lang} 는 여섯 판을 낸다`, () => {
      const items = buildBuildItems(lang);
      expect(items.length).toBe(6);
      expect(new Set(items.map((i) => i.id)).size).toBe(6);
    });
  }
});

describe('물음과 기댓값', () => {
  it('참·거짓은 **그 언어의 표기**로 보인다 — 파이썬만 대문자다', () => {
    const py = buildBuildItems('py').find((i) => i.taskId === 'truth-from-numbers');
    const java = buildBuildItems('java').find((i) => i.taskId === 'truth-from-numbers');
    expect(py?.want).toBe('True');
    expect(java?.want).toBe('true');
  });

  it('기댓값의 라벨이 물음 안에 들어간다', () => {
    for (const item of buildBuildItems('py')) {
      expect(item.q, item.id).toContain(item.want);
    }
  });

  it('판마다 반드시 쓸 토막이 둘이고 물음의 힌트가 그것을 말한다', () => {
    for (const item of buildBuildItems('ts')) {
      expect(item.must.length, item.id).toBe(2);
      for (const token of item.must) expect(item.hint, item.id).toContain(token);
    }
  });

  it('참·거짓 표기는 규칙표에서 온다 — 판이 따로 안 적는다', () => {
    for (const lang of BUILD_LANGS) {
      for (const item of buildBuildItems(lang)) {
        expect(item.spell).toEqual(FUND_DIALECTS[lang].spell);
      }
    }
  });

  it('값 하나를 라벨로 옮긴다', () => {
    const spell = { yes: 'true', no: 'false' };
    expect(wantText({ t: 'int', v: '3' }, spell)).toBe('3');
    expect(wantText({ t: 'float', v: '3.5' }, spell)).toBe('3.5');
    expect(wantText({ t: 'bool', v: false }, spell)).toBe('false');
  });
});

describe('굽히는 0부 개념', () => {
  it('여덟이고 전부 보편 개념이다 — 언어마다 복제되지 않는다', () => {
    const ids = buildConcepts();
    expect(ids.length).toBe(8);
    for (const id of ids) expect(id).toMatch(/^(common|cs)\//u);
  });

  it('셋은 실수·넘침·변환이다 — 0부가 가장 자주 틀리는 자리 (fundamentals.md §5)', () => {
    const ids = buildConcepts();
    expect(ids).toContain('cs/floating-point');
    expect(ids).toContain('cs/integer-overflow');
    expect(ids).toContain('cs/type-conversion');
  });
});

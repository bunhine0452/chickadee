/**
 * 인제스트 기본값 (03 §1.3 · D12 · D60 · D122).
 *
 * 목록 자체는 상수라 잴 것이 없다. 재는 것은 **사용자가 더하는 글롭의 검사기**다 —
 * 잘못된 한 줄이 인제스트 전체를 세우거나, 더 나쁘게는 반대로 돌게 한다.
 */
import { describe, expect, test } from 'vitest';

import { globProblem, parseGlobs } from './ingest-defaults.js';

describe('제외 글롭 검사 (D122)', () => {
  test('평범한 글롭은 통과한다', () => {
    for (const p of ['docs/**', '*.snap', 'src/generated/**/*.ts', 'a/{b,c}/**', 'x[0-9].ts']) {
      expect(globProblem(p)).toBeNull();
    }
  });

  test('빈 줄은 문제가 아니다 — 파싱이 버린다', () => {
    expect(globProblem('   ')).toBeNull();
    expect(parseGlobs('a/**\n\n  \nb/**\n')).toEqual(['a/**', 'b/**']);
  });

  test('부정은 막는다 — 제외 목록에서 오히려 포함시킨다', () => {
    expect(globProblem('!src/keep.ts')).toBe('negation');
  });

  test('역슬래시는 글롭이 아니라 Windows 경로 구분자다', () => {
    expect(globProblem('src\\gen')).toBe('backslash');
  });

  test('절대 경로는 리포 상대 경로와 안 맞는다', () => {
    expect(globProblem('/etc/passwd')).toBe('absolute');
    expect(globProblem('C:/Users')).toBe('absolute');
  });

  test('짝이 안 맞는 괄호는 파서를 던지게 해 인제스트 전체를 세운다', () => {
    expect(globProblem('a[0-9')).toBe('unbalanced');
    expect(globProblem('a{b,c')).toBe('unbalanced');
    expect(globProblem('a]b')).toBe('unbalanced');
  });
});

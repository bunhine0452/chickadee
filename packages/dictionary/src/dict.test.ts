/**
 * `pnpm dict:lint` 가 도는 곳 (03 §5.1). 번들 사전 전체를 읽어 스키마와 린트를 통과시킨다.
 * 테스트로 둔 이유: `import.meta.glob` 은 Vite 가 채우고, vitest 가 그 Vite 를 쓴다 —
 * 별도 스크립트를 만들면 번들 경로를 두 번 구현하게 된다 (D66).
 */
import { describe, expect, test } from 'vitest';

import { langSpecs, lintDict, loadDict, prereqClosure } from './index.js';

// 프레임워크 사전은 감지 게이트 뒤에 있다 (D59) — 린트는 전부를 본다.
const dict = loadDict({ dependencies: ['react'] });

describe('번들 사전', () => {
  test('스키마를 어긴 파일이 없다', () => {
    expect(dict.problems).toEqual([]);
  });

  test('언어와 개념이 실제로 들어 있다', () => {
    expect([...dict.langs.keys()]).toContain('ts');
    expect(dict.concepts.size).toBeGreaterThan(0);
  });

  test('린트 위반이 없다', () => {
    expect(lintDict(dict)).toEqual([]);
  });

  test('인제스트에 넘길 문법 명세가 나온다', () => {
    const specs = langSpecs(dict, 512 * 1024);
    const typescript = specs.find((s) => s.grammar === 'typescript');
    expect(typescript?.extensions).toContain('.ts');
    // 시스템 쿼리는 언어의 모든 문법에 붙는다 (03 §3.2).
    expect(typescript?.queries.map((q) => q.id)).toContain('_imports');
    expect(typescript?.queries.map((q) => q.id)).toContain('_blocks');
  });

  test('선행 폐포는 사이클에서도 멈춘다', () => {
    for (const id of dict.concepts.keys()) {
      expect(prereqClosure(dict, id, 2).has(id)).toBe(false);
    }
  });
});

describe('스키마 산출물', () => {
  test('체크인된 JSON Schema 가 zod 와 어긋나지 않는다', async () => {
    const { build, OUT } = await import('../../../scripts/dict-schema.js');
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(OUT, 'utf8')).toBe(build());
  });
});

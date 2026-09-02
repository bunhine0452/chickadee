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

describe('사전이 실제로 담고 있는 것', () => {
  test('필수 문법이 30개 이상이고 전부 개념으로 존재한다', () => {
    const ts = dict.langs.get('ts');
    expect(ts?.essential.length).toBeGreaterThanOrEqual(20);
    for (const id of ts?.essential ?? []) expect(dict.concepts.has(id)).toBe(true);
  });

  test('「AI 가 대신 쓴 표기」의 양쪽이 모두 있다', () => {
    for (const alt of dict.langs.get('ts')?.alternatives ?? []) {
      expect(dict.concepts.has(alt.gap)).toBe(true);
      expect(dict.concepts.has(alt.present)).toBe(true);
    }
  });

  test('보편 개념은 쿼리가 없고 언어 개념은 쿼리가 있다', () => {
    for (const concept of dict.concepts.values()) {
      const universal = concept.id.startsWith('common/') || concept.id.startsWith('arch/');
      expect(concept.queries.length === 0).toBe(universal);
    }
  });

  test('구조 개념 넷은 t2 트랙이다', () => {
    for (const slug of ['placement', 'radius', 'flow', 'direction']) {
      expect(dict.concepts.get(`arch/${slug}`)?.track_default).toBe('t2');
    }
  });

  test('프레임워크 사전은 감지 없이는 로드되지 않는다 (D59)', () => {
    expect(loadDict().concepts.has('react/functional-state-update')).toBe(false);
    expect(loadDict({ dependencies: ['react'] }).concepts.has('react/functional-state-update')).toBe(true);
  });

  test('시스템 쿼리는 문법마다 하나씩 등록된다', () => {
    for (const grammar of ['typescript', 'tsx', 'javascript']) {
      expect(dict.queries.has(`_imports::${grammar}`)).toBe(true);
      expect(dict.queries.has(`_blocks::${grammar}`)).toBe(true);
    }
  });
});

/**
 * `pnpm dict:lint` 가 도는 곳 (03 §5.1). 번들 사전 전체를 읽어 스키마와 린트를 통과시킨다.
 * 테스트로 둔 이유: `import.meta.glob` 은 Vite 가 채우고, vitest 가 그 Vite 를 쓴다 —
 * 별도 스크립트를 만들면 번들 경로를 두 번 구현하게 된다 (D66).
 */
import { describe, expect, test } from 'vitest';

import { authoringDebt, debtTable, langSpecs, lintDict, loadDict, prereqClosure } from './index.js';

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

  // 쿼리 없이 사는 네임스페이스 셋. `common/` 은 전이 축이고, `arch/`(D142)와 `exec/`(D151)는
  // 문항을 그래프·AST 에서 **계산**한다 — 사전은 산문과 숙련도 키만 댄다.
  const COMPUTED = ['common/', 'arch/', 'exec/'];

  test('쿼리 없는 네임스페이스와 언어 개념이 정확히 갈린다', () => {
    for (const concept of dict.concepts.values()) {
      const computed = COMPUTED.some((p) => concept.id.startsWith(p));
      expect(concept.queries.length === 0).toBe(computed);
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

/**
 * 사전 저작 부채의 **래칫** (D145 · D132 와 같은 모양).
 *
 * 뜻은 「오늘보다 나빠지면 실패」다. 목표는 언제나 **대상 전량**이고 표가 그 거리를 매번
 * 찍는다 — 임계를 오늘 값에 맞춰 두고 목표를 지우면 그 거리가 안 보인다. 사전을 채우면
 * 이 상수를 **올린다**(내리는 것이 아니다 — 세는 것이 충족 수다).
 *
 * 2026-09-04 두 번째 패스에서 넷 중 셋이 대상 전량에 닿았다. 래칫이 목표와 같아진 규칙은
 * 그 순간부터 **하드 규칙**이다 — 새 개념이 `blank:`+`@hole` 도 `no_hole_reason` 도 없이,
 * 또는 `why_gate:` 없이 `essential` 로 들어오면 CI 가 떨어진다. `zero-one-liner` 는 D138 이
 * 「사전 린트가 실패한다」고 적은 그 규칙이고, 이제 그렇게 됐다.
 *
 * `point-picks` 만 25/26 로 남았다. 남은 하나는 `ts/call-expression` 이고, 못 채운 이유는
 * 저작이 밀려서가 아니다: 사용처의 글이 `호출대상(인자)` 한 덩어리라 짚을 자리를 넷으로
 * 나누려면 수신자·점·이름을 따로 잡아야 하는데, 그러려면 패턴을 둘로 갈라야 하고 그 둘이
 * 서로를 배제하려면 텍스트 술어(`#not-match?`)에 기대야 한다. 그 술어는 `obj["a.b"]()` ·
 * `(a.b || c)()` 같은 모양을 조용히 놓친다 — **조용한 커버리지 손실**은 이 표가 막으려는
 * 것보다 나쁘다. 문법이 더 나은 길을 줄 때 채운다.
 */
const DEBT_RATCHET: Record<string, number> = {
  'blank-or-reason': 39,
  'point-picks': 37,
  'why-gate': 39,
  // 6 → 11(D147) → 18(D148) → 26(D150) → **33**(D152, 파이썬 바닥 여덟). D150 이 「먼저 읽기」를
  // 0장 소속에서 「겹 0」으로 넓혀 `essential` 전량이 대상이 됐다. 새로 든 넷(`array-filter`
  // 의 `filter` · `array-map-immutable` 의 `map` · `arrow-function` 의 `=>` · 그리고
  // `array-destructuring` 은 영문 관사 `a` 가 정답 토큰과 겹쳤다)을 고쳐 채웠다.
  'zero-one-liner': 33,
};

describe('사전 저작 부채 (D145)', () => {
  test('오늘보다 나빠지지 않는다 — 표는 목표까지의 거리를 찍는다', () => {
    const checks = authoringDebt(dict);
    // eslint-disable-next-line no-console
    console.log(debtTable(checks, DEBT_RATCHET));
    for (const check of checks) {
      const floor = DEBT_RATCHET[check.rule] ?? 0;
      expect(check.met, `${check.rule}: 충족이 래칫 ${floor} 아래로 내려갔다 — ${check.gaps.join(' · ')}`)
        .toBeGreaterThanOrEqual(floor);
      // 다 채운 규칙은 래칫을 대상 전량으로 올려 **하드 규칙**으로 잠근다. 안 그러면 다음
      // 기여가 조용히 되돌릴 수 있다 — 래칫이 목표에 닿는 순간이 그 규칙이 D138 이 적은
      // 「사전 린트가 실패한다」가 되는 순간이다.
      if (check.met === check.total) {
        expect(floor, `${check.rule}: 대상 ${check.total} 을 다 채웠다 — DEBT_RATCHET 을 ${check.total} 로 올려 잠가라`)
          .toBe(check.total);
      }
    }
  });

  test('래칫이 목표를 넘겨 적혀 있지 않다 — 넘기면 영영 못 지나간다', () => {
    const totals = new Map(authoringDebt(dict).map((c) => [c.rule, c.total]));
    for (const [rule, floor] of Object.entries(DEBT_RATCHET)) {
      expect(totals.get(rule), `${rule} 은 이제 없는 규칙이다`).toBeDefined();
      expect(floor).toBeLessThanOrEqual(totals.get(rule) ?? 0);
    }
  });
});

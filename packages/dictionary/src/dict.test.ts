/**
 * `pnpm dict:lint` 가 도는 곳 (03 §5.1). 번들 사전 전체를 읽어 스키마와 린트를 통과시킨다.
 * 테스트로 둔 이유: `import.meta.glob` 은 Vite 가 채우고, vitest 가 그 Vite 를 쓴다 —
 * 별도 스크립트를 만들면 번들 경로를 두 번 구현하게 된다 (D66).
 */
import { describe, expect, test } from 'vitest';

import {
  authoringDebt, debtTable, isComputed, langSpecs, lintDict, loadDict, prereqClosure,
} from './index.js';

// 프레임워크 사전은 감지 게이트 뒤에 있다 (D59) — 린트는 전부를 본다.
// 프레임워크 사전 둘을 **켜고** 검사한다. 감지에 걸리지 않으면 `react/`·`spring/` 이 아예
// 로드되지 않아 CI 가 그 사전을 한 번도 안 본다 — 린트·부채·참조 검사가 전부 조용히 비껴간다.
// `spring/` 은 `package.json` 이 아니라 **빌드 매니페스트 원문**으로 감지된다 (D176).
//
// **주의**: `java/` 개념 여섯이 `spring/` 을 `prereq` 로 가리킨다 (D176 의 빌림 · D177).
// 스프링이 없는 자바 리포에서 그 선행은 로드되지 않은 id 를 가리키게 되고, `prereqClosure`
// 는 없는 id 를 조용히 건너뛴다. 그래도 되는 이유는 `prereq` 가 **문법 이해의 선행**이지
// 잠금이 아니기 때문이지만, `cs/`(언제나 로드된다)와 달리 이쪽은 조건부라 여기서 명시한다.
const dict = loadDict({
  dependencies: ['react'],
  manifests: { 'build.gradle': "implementation 'org.springframework.boot:spring-boot-starter-web'" },
});

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

  test('쿼리 없는 네임스페이스와 언어 개념이 정확히 갈린다', () => {
    // 접두어 목록은 `schema.ts` 의 `COMPUTED_NAMESPACES` 하나다 (D157 §7).
    for (const concept of dict.concepts.values()) {
      expect(concept.queries.length === 0).toBe(isComputed(concept.id));
    }
  });

  /**
   * `cs/` 는 문법 아래의 기계다 (D157 · D167). 껍데기가 `exec/order.yaml` 과 같아야
   * 새 트랙도 새 `card.kind` 도 마이그레이션도 안 생긴다 — 하나라도 어긋나면 그 값이
   * 어딘가에서 갈라진다.
   */
  test('cs/ 개념은 전부 exec/ 와 같은 껍데기다 (D157 ①)', () => {
    const cs = [...dict.concepts.values()].filter((c) => c.id.startsWith('cs/'));
    // 43 → **45** (D187 ⑥ — `operator-precedence`·`type-conversion`). 0부의 축 5·6 이
    // 43장 안에 답이 없어서 낸 둘이고, 같은 판에서 제안된 `truthiness` 는 기계가 아니라
    // 언어 설계라 `common/` 으로 갔다 (D187 ⑤).
    expect(cs.length).toBeGreaterThanOrEqual(45);
    for (const concept of cs) {
      expect(concept.universal, concept.id).toBeNull();
      expect(concept.grammars, concept.id).toEqual([]);
      expect(concept.queries, concept.id).toEqual([]);
      expect(concept.track_default, concept.id).toBe('t0');
      expect(concept.essential, concept.id).toBe(false);
      // 문항은 뜻 고르기 하나뿐이다 — 지목형은 짚을 자리가, 빈칸형은 뚫을 구멍이 있어야 한다.
      expect(concept.meaning.length, concept.id).toBeGreaterThan(0);
      expect(concept.point, concept.id).toEqual([]);
      expect(concept.blank, concept.id).toEqual([]);
    }
  });

  /**
   * 사용처 빌림 (D157 ②). `cs/` 는 자기 캡처가 없으므로 **자기를 `prereq` 로 가리키는
   * 언어 개념의 창**에 얹힌다. 빌려 줄 언어 개념이 하나도 없는 `cs/` 는 그 리포에서 안 뜨고
   * 그것이 맞다 — 가비지 컬렉션을 C 만 쓰는 사용자에게 안 가르치는 것과 같다.
   *
   * 여기서 잡는 것은 **빌려 준다고 적어 놓고 빌려 줄 창이 없는** 경우다: 가리키는 쪽이
   * 전부 쿼리 없는 개념이면 얹힐 자리가 영영 안 생긴다.
   */
  test('cs/ 를 가리키는 언어 개념은 빌려 줄 창이 있다 (D157 ②)', () => {
    const lenders = new Map<string, string[]>();
    for (const concept of dict.concepts.values()) {
      if (isComputed(concept.id)) continue; // cs/ 안에서의 선행은 빌림이 아니다
      for (const ref of concept.prereq) {
        if (ref.startsWith('cs/')) lenders.set(ref, [...(lenders.get(ref) ?? []), concept.id]);
      }
    }
    expect(lenders.size).toBeGreaterThan(0);
    for (const [csId, ids] of lenders) {
      expect(dict.concepts.has(csId), csId).toBe(true);
      // 빌려 주는 쪽 중 적어도 하나는 캡처가 있어야 얹힐 창이 생긴다.
      const withSites = ids.filter((id) => (dict.concepts.get(id)?.queries.length ?? 0) > 0);
      expect(withSites.length, `${csId} ← ${ids.join(' · ')}`).toBeGreaterThan(0);
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

  /**
   * 조건부 선행 (D176 · D177). `java/` 여섯이 `spring/*` 을 `prereq` 로 가리키는데
   * 프레임워크 사전은 감지 게이트 뒤에 있다 — 스프링이 아닌 자바 리포에서 그 id 는 로드된
   * 사전에 **없다**. 사다리 2단의 아래층 목록은 못 찾은 id 를 그 id 그대로 한 줄로 그리므로
   * (`packages/cards/src/payload.ts` 의 `prereqOf`), 로더가 걸러야 화면에 안 샌다.
   *
   * 지우는 것이 아니라 거르는 것이다 — 아래 둘째 단언이 그 자리다.
   */
  test('로드 안 된 사전을 가리키는 선행은 떨어진다 (D176)', () => {
    const withoutSpring = loadDict();
    expect(withoutSpring.concepts.has('spring/proxy-and-aop')).toBe(false);
    const bare = withoutSpring.concepts.get('java/annotation');
    expect(bare?.prereq).not.toContain('spring/proxy-and-aop');
    for (const concept of withoutSpring.concepts.values()) {
      for (const ref of [...concept.prereq, ...concept.confusions]) {
        expect(withoutSpring.concepts.has(ref), `${concept.id} → ${ref}`).toBe(true);
      }
    }
    // 스프링 리포에서는 그대로 걸린다.
    expect(dict.concepts.get('java/annotation')?.prereq).toContain('spring/proxy-and-aop');
    // 원문은 안 건드린다 — 린트의 `reference-exists` 가 오타를 잡는 자리가 거기다.
    expect(withoutSpring.sources.get('java/annotation')?.prereq).toContain('spring/proxy-and-aop');
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
/**
 * 2026-09-05 — 73 → 76 → **104**(`blank-or-reason`·`why-gate`) · 67 → 87 → **100**(`point-picks`) ·
 * 65 → 68 → **95**(`zero-one-liner`). 마지막 올림은 SQL 0부 여덟 + `sql/self-join` 이 든 뒤의 실측이다.
 *
 * **이 상수는 합류 시점에 한 번 더 올려야 한다.** 0부 저작(java·ts·py·sql)이 병렬로 도는
 * 중이라 대상 수가 분 단위로 움직이고, 「다 채운 규칙은 래칫을 대상 전량으로 올려 잠근다」는
 * 하드 규칙이라 **대상보다 작은 어떤 값도 실패한다.** 즉 어느 한 세션도 이 값을 확정할 수
 * 없다 — 사전이 멈춘 뒤 표가 찍는 `충족/대상` 을 그대로 옮겨 적는 것이 유일한 방법이다.
 */
const DEBT_RATCHET: Record<string, number> = {
  // 39 → 42(java 셋) → 44(sql 둘) → 49(java 여덟) → 50(sql/comparison) → 52(css 둘)
  // → 65(D166, java 관문 0 과 OOP 축 열셋) → **73**(D177, 정식 자바 코스 3부의 자바 개념 여덟).
  // → **104**(D187 — 0부 「값과 식」: java 14 신설+5 갱신 · ts 11 · sql 9 · common 3 · cs 2. 첫 물결 합류 시점의
  //   `충족/대상` 을 그대로 옮겼다 — 병렬 저작 중엔 어느 세션도 확정할 수 없어서 오케스트레이터가 잠근다).
  'blank-or-reason': 104,
  'point-picks': 100,
  'why-gate': 104,
  // 6 → 11(D147) → 18(D148) → 26(D150) → **33**(D152, 파이썬 바닥 여덟). D150 이 「먼저 읽기」를
  // 0장 소속에서 「겹 0」으로 넓혀 `essential` 전량이 대상이 됐다. 새로 든 넷(`array-filter`
  // 의 `filter` · `array-map-immutable` 의 `map` · `arrow-function` 의 `=>` · 그리고
  // `array-destructuring` 은 영문 관사 `a` 가 정답 토큰과 겹쳤다)을 고쳐 채웠다.
  // 33 → 36(java 바닥 셋) → 38(sql 바닥 둘) → 42(java 바닥 여덟 완성) → 57(D166) → **65**(D177).
  'zero-one-liner': 95,
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

/**
 * 자바의 부 배치 (D177 · D190). 정본은 `docs/curriculum/java.md` §2·§1.5 다.
 */
import type { PartAssignment } from '../curriculum.js';

/**
 * 자바의 부 배치 (D177 · `docs/curriculum/java.md` §2).
 *
 * **사전에 필드를 늘리지 않은 이유**는 이것이 개념의 성질이 아니라 **코스의 결정**이기
 * 때문이다. 같은 `java/lambda` 가 자바를 처음 배우는 사람에게는 2부이고 코틀린을 아는
 * 사람에게는 건너뛸 것이다 — 사전은 그 판단을 모른다. 반면 최소 예제와 문항은 개념마다
 * 다르므로 사전(`examples[]`)에 남는다. 두 번 물어서 갈라 둔 자리다.
 *
 * **0부가 앞에 붙었다** (java.md §1.5). 목록은 `_lang.yaml` 의 `essential` 순서를 그대로
 * 옮긴 것이고, 0·1·2부를 이으면 `essential` 전량이 된다 — 시험이 그것을 대조한다.
 *
 * 3부는 비어 있지 않다 — `spring/` 15개(D176)가 그 자리이고, 목록은 그 사전이 로드된
 * 리포에서만 채워진다. 스프링이 아닌 자바 리포에서는 3부가 0판이고 코스는 2부에서
 * 기능 챕터로 넘어간다.
 */
export const JAVA_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 — 축 A~H (java.md §1.5.1). 열아홉 판 중 열일곱이
    // `essential` 이고, `java/string-concat`·`java/autoboxing` 둘은 0부의 `essential`
    // 상한 열둘 때문에 밖에 있다. 둘은 이 목록에도 안 든다 — 이 상수는 `essential` 과
    // 한 글자도 어긋나면 안 되고, 그 대조를 시험이 한다.
    part: 0,
    concepts: [
      'java/value-bits', 'java/variable-declaration', 'java/integer-limit',
      'java/floating-type', 'java/float-inexact',
      'java/string-literal', 'java/text-length',
      'java/boolean-literal', 'java/boolean-only-condition',
      'java/arithmetic', 'java/operator-precedence',
      'java/implicit-conversion', 'java/explicit-conversion',
      'java/assignment', 'java/reference-binding',
      'java/comparison', 'java/reference-equality',
    ],
  },
  {
    part: 1,
    concepts: [
      'java/class-declaration', 'java/if-statement', 'java/method-declaration',
      'java/return-statement', 'java/array', 'java/for-loop', 'java/for-each', 'java/import',
    ],
  },
  {
    part: 2,
    concepts: [
      'java/access-modifier', 'java/field-declaration', 'java/new-expression', 'java/constructor',
      'java/static', 'java/null', 'java/collection-generic', 'java/interface',
      'java/inheritance-override', 'java/abstract-class', 'java/generic-bound',
      'java/equals-hashcode', 'java/lambda', 'java/stream-pipeline', 'java/try-catch',
      'java/annotation',
    ],
  },
  {
    part: 3,
    concepts: [
      'spring/component-scan', 'spring/bean-and-container', 'spring/dependency-injection',
      'spring/bean-lifecycle', 'spring/configuration-binding', 'spring/proxy-and-aop',
      'spring/transaction-propagation', 'spring/connection-and-tx-boundary',
      'spring/request-dispatch', 'spring/controller-mapping', 'spring/filter-vs-interceptor',
      'spring/bean-validation', 'spring/exception-handler', 'spring/repository-pattern',
      'spring/persistence-mapping',
    ],
  },
];

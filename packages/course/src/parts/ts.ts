/**
 * TS 의 부 배치 (D190). 정본은 `docs/curriculum/ts.md` §1.5.4·§3·§4 다 — `_lang.yaml` 의 `essential` 을
 * 0·1·2부 순서 그대로 옮긴 것이고, 시험이 그것을 대조한다. 3부(`react/`)는 아직 비어 있다.
 */
import type { PartAssignment } from '../curriculum.js';

export const TS_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 21판 (ts.md §1.5.4)
    part: 0,
    concepts: [
      'ts/const-declaration',
      'ts/number-literal',
      'ts/value-bits',
      'ts/string-literal',
      'ts/text-length',
      'ts/boolean-literal',
      'ts/comparison',
      'ts/loose-equality',
      'ts/arithmetic',
      'ts/integer-division',
      'ts/undefined-null',
      'ts/float-inexact',
      'ts/template-literal',
      'ts/number-is-double',
      'ts/truthy-falsy',
      'ts/operator-precedence',
      'ts/conditional-ternary',
      'ts/implicit-conversion',
      'ts/explicit-conversion',
      'ts/reassignment',
      'ts/reference-sharing',
    ],
  },
  {
    // 1부 「흐름과 묶기」
    part: 1,
    concepts: [
      'ts/if-statement',
      'ts/while-loop',
      'ts/function-declaration',
      'ts/return-statement',
      'ts/property-access',
      'ts/call-expression',
      'ts/arrow-function',
      'ts/array-basics',
      'ts/array-destructuring',
      'ts/object-destructuring',
      'ts/try-catch',
      'ts/for-of',
    ],
  },
  {
    // 2부 「타입과 객체」
    part: 2,
    concepts: [
      'ts/object-spread',
      'ts/optional-chaining',
      'ts/nullish-coalescing',
      'ts/array-map-immutable',
      'ts/array-filter',
      'ts/array-method-chain',
      'ts/async-await',
      'ts/generics',
    ],
  },
  {
    // 3부 — `react/` 가 한 장뿐이라 아직 목록이 없다
    part: 3,
    concepts: [],
  },
];

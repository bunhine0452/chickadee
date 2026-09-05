/**
 * 파이썬의 부 배치 (D190). 정본은 `docs/curriculum/py.md` §1.5.4·§3·§4 다. 2부는 아직 저작 전이라 비어 있다 —
 * 이 목록은 `_lang.yaml` 의 `essential` 과 한 글자도 어긋나면 안 되고, 시험이 그것을 대조한다.
 */
import type { PartAssignment } from '../curriculum.js';

export const PY_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 18판 (py.md §1.5.4)
    part: 0,
    concepts: [
      'py/assignment',
      'py/number-literal',
      'py/value-bits',
      'py/integer-limit',
      'py/string-literal',
      'py/text-length',
      'py/arithmetic',
      'py/f-string',
      'py/integer-division',
      'py/float-inexact',
      'py/boolean-literal',
      'py/operator-precedence',
      'py/explicit-conversion',
      'py/truthiness',
      'py/bool-op-value',
      'py/implicit-conversion',
      'py/comparison',
      'py/is-identity',
    ],
  },
  {
    // 1부 「흐름과 묶기」 — 아홉 중 여섯이 저작됐다
    part: 1,
    concepts: [
      'py/if-statement',
      'py/list-literal',
      'py/reference-binding',
      'py/while-loop',
      'py/function-definition',
      'py/return-statement',
    ],
  },
  {
    // 2부 — 저작 전
    part: 2,
    concepts: [],
  },
  {
    // 3부 — 프레임워크 사전이 없다
    part: 3,
    concepts: [],
  },
];

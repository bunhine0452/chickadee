/**
 * 파이썬의 부 배치 (D190). 정본은 `docs/curriculum/py.md` §1.5.4(0·1·2부의 표)·§3·§4 다.
 * 3부는 프레임워크 사전(`pyapp/`·`pyweb/` — §3.2)이 아직 없어 비어 있다.
 *
 * 이 목록은 `_lang.yaml` 의 `essential` 과 한 글자도 어긋나면 안 되고, 시험이 그것을 대조한다.
 * 부 안의 순서도 그쪽과 같다 — 「얇은 판을 셋 이상 잇대지 않는다」가 그 순서를 정했다.
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
    // 1부 「흐름과 묶기」 10판
    part: 1,
    concepts: [
      'py/if-statement',
      'py/list-literal',
      'py/reference-binding',
      'py/none-value',
      'py/for-in',
      'py/while-loop',
      'py/function-definition',
      'py/call-expression',
      'py/return-statement',
      'py/import',
    ],
  },
  {
    // 2부 「자료구조와 객체」 14판
    part: 2,
    concepts: [
      'py/attribute-access',
      'py/dict-literal',
      'py/index-access',
      'py/tuple-unpacking',
      'py/set-and-membership',
      'py/list-append',
      'py/lambda',
      'py/list-comprehension',
      'py/type-hint',
      'py/default-argument',
      'py/class-definition',
      'py/try-except',
      'py/with-statement',
      'py/decorator',
    ],
  },
  {
    // 3부 — 프레임워크 사전이 없다
    part: 3,
    concepts: [],
  },
];

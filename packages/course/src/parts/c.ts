/**
 * C 의 부 배치 (D190). 정본은 `docs/curriculum/c.md` §0.1(0부) · §0.6(사슬) · §2~§4 다.
 *
 * 부 이름은 교재가 아니라 **무엇을 읽게 되나**다(c.md §0.6) — 0부 한 줄 안의 값 · 1부 한 함수 ·
 * 2부 한 파일. 문서의 3부 「빌드와 규격」 아홉은 **2부 끝에 잇는다**: 이 등록부의 3부 자리는
 * 프레임워크 사전(`spring/` 같은)의 전량이거나 비어 있어야 한다는 것이 `parts/index.test.ts` 의
 * 규약이고, C 에는 프레임워크 사전이 없다.
 *
 * 목록은 `dictionary/c/_lang.yaml` 의 `essential` 을 그대로 옮긴 것이고, 0·1·2부를 이으면
 * `essential` 전량이 된다 — 시험이 그것을 대조한다.
 *
 * 사용자 리포 열에 사람이 쓴 `.c` 가 0장이라(c.md §0.7) 이 코스는 리포 없이 열리면 전부
 * 사전 예제이고 사유는 `no-files` 다(D190 ④). `pedagogy.md` §13 ④ 는 C 를 코스가 아니라
 * 「기계 설명」으로 두는 쪽을 권했다 — 사용자가 열 언어 전부를 요청해 코스로 세웠고, 그 권고는
 * 등록부에 남긴다.
 */
import type { PartAssignment } from '../curriculum.js';

export const C_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 — c.md §0.1 열둘. 축 순서는 G·A·B·C·D·E·H·F 다(§0.1 표 그대로).
    part: 0,
    concepts: [
      'c/declaration', 'c/assignment',
      'c/number-literal', 'c/integer-type', 'c/overflow',
      'c/float-type',
      'c/char-literal',
      'c/truthiness',
      'c/arithmetic', 'c/comparison', 'c/operator-precedence',
      'c/conversion',
    ],
  },
  {
    // 1부 「문과 흐름」 — 한 함수 안 (c.md §0.6).
    part: 1,
    concepts: [
      'c/if-statement', 'c/while-loop', 'c/for-loop',
      'c/function-definition', 'c/function-call', 'c/return-statement',
      'c/string-literal', 'c/array-declaration',
    ],
  },
  {
    // 2부 「포인터와 메모리」 아홉 + 「빌드와 규격」 아홉 — 한 파일에서 한 프로젝트로.
    part: 2,
    concepts: [
      'c/pointer-declaration', 'c/address-of', 'c/dereference', 'c/null-check',
      'c/sizeof', 'c/struct-definition', 'c/member-access', 'c/array-decay', 'c/malloc-free',
      'c/header-include', 'c/function-prototype', 'c/const', 'c/typedef',
      'c/macro-define', 'c/conditional-compilation', 'c/function-pointer',
      'c/static-storage', 'c/undefined-behavior',
    ],
  },
  {
    // 3부 — 프레임워크 사전이 없다.
    part: 3,
    concepts: [],
  },
];

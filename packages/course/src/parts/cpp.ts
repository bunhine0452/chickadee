/**
 * C++ 의 부 배치 (D190). 정본은 `docs/curriculum/cpp.md` §0.1 · §2 · §3 · §4 다.
 *
 * **부는 교재 축이고 이 언어에서는 그 축이 한쪽으로만 돈다.** 사용자 리포에 `.cpp`·`.cc`·
 * `.cxx`·`.hpp`·`.hh` 가 **0장**이라(cpp.md §0.7) 0~2부가 전부 합성 예제다. 3부는
 * 「내 코드 중심」인데 내 코드가 없고 C++ 프레임워크 사전도 없어서 **빈 목록**이다 —
 * `./index.test.ts` 가 3부를 「그 언어 프레임워크 사전 전량이거나 비어 있다」로 대조한다.
 *
 * 절 → 부 대응은 이렇다.
 *   0부 §0.1 열셋 · 1부 §2 기초 여덟 중 0부가 안 가져간 셋 · 2부 §3 중심 14 + §4 심화 여덟.
 * `cpp.md` §0.6 이 그린 네 부(값과 식 · 문과 표준 라이브러리 · 객체와 소유 · 일반화)와
 * 다르다 — 그 표는 3부에 `lambda`·`template-function`·`operator-overload`·`virtual-override`
 * 넷을 놓는데, 3부 자리는 프레임워크 사전의 것이라 넷이 2부 끝으로 내려왔다.
 *
 * **목록은 `_lang.yaml` 의 `essential` 순서를 한 글자도 안 어긋나게 옮긴 것**이고
 * 0·1·2부를 이으면 `essential` 전량이 된다 — 시험이 그것을 대조한다.
 */
import type { PartAssignment } from '../curriculum.js';

export const CPP_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 열셋 (cpp.md §0.1). 일곱이 신규이고 여섯은 §2·§3 에서
    // 올려 온 것이라(§0.4), README §12 규약 8 의 「0부 신규 essential 열둘」 안이다.
    part: 0,
    concepts: [
      'cpp/variable-declaration', 'cpp/assignment',
      'cpp/integer-type', 'cpp/overflow',
      'cpp/float-type', 'cpp/char-and-byte',
      'cpp/boolean-literal', 'cpp/arithmetic',
      'cpp/comparison', 'cpp/operator-precedence',
      'cpp/conversion', 'cpp/auto', 'cpp/reference-binding',
    ],
  },
  {
    // 1부 「문」 — §2 기초 여덟 중 0부가 안 가져간 셋. 셋뿐인 것이 0부가 값 축을
    // 통째로 가져간 결과다 (cpp.md §2 머리말).
    part: 1,
    concepts: ['cpp/if-statement', 'cpp/function-definition', 'cpp/return-statement'],
  },
  {
    // 2부 「객체와 소유」 — §3 중심 14(§0.4 가 `auto` 를 0부로 올렸다) + §4 심화 여덟.
    part: 2,
    concepts: [
      'cpp/namespace-qualification', 'cpp/std-string', 'cpp/std-vector', 'cpp/range-for',
      'cpp/reference-parameter', 'cpp/const-qualifier', 'cpp/class-definition',
      'cpp/constructor', 'cpp/destructor', 'cpp/smart-pointer', 'cpp/move',
      'cpp/stream-output', 'cpp/exception-handling', 'cpp/enum-class',
      'cpp/lambda', 'cpp/template-function', 'cpp/operator-overload', 'cpp/virtual-override',
      'cpp/new-delete', 'cpp/rule-of-five', 'cpp/structured-binding', 'cpp/std-optional',
    ],
  },
  {
    // 3부 — C++ 프레임워크 사전이 없다. 자바가 `spring/` 15를 놓은 자리(D176)가 비어 있고,
    // 코스는 2부에서 기능 챕터로 넘어간다.
    part: 3,
    concepts: [],
  },
];

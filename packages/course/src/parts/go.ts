/**
 * Go 의 부 배치 (D190). 정본은 `docs/curriculum/go.md` §0.1(0부) · §2(1부) · §3·§4(2부) 다.
 *
 * **목록은 `dictionary/go/_lang.yaml` 의 `essential` 순서를 그대로 옮긴 것**이고, 0·1·2부를
 * 이으면 `essential` 전량이 된다 — `./index.test.ts` 가 그것을 대조한다.
 *
 * 문서와 어긋난 자리가 둘이다.
 *
 * **① `essential` 이 25 가 아니라 33 이다.** `go.md` §0.5 는 §4 심화 여덟을 `essential`
 * 밖에 두고 25 로 셌다. 그런데 그 여덟이 2부에 들어가고, 이 상수는 `essential` 과 한 글자도
 * 어긋나면 안 되므로(위 시험) 여덟도 `essential` 이어야 한다. 대가는 0장 적재량이 24 에서
 * 32 로 느는 것인데, 상한은 D184 로 폐지됐으므로 잘릴 판이 없다.
 *
 * **② 2부 뒤쪽 여덟의 순서를 바꿨다.** `go.md` §4 차례(㉕~㉜)대로 두면 끝에 goroutine(39곳) ·
 * channel-select(73곳) · generics(13곳) 셋이 잇달아 얇아져 `_lang.yaml` 의 배열 규칙
 * (「얇은 판을 셋 이상 잇대지 않는다」)을 어긴다. 두꺼운 둘(nil-interface 495곳 ·
 * error-wrap 808곳)을 사이에 끼웠다.
 *
 * **3부는 비어 있다** — Go 에는 `spring/` 에 해당하는 프레임워크 네임스페이스가 없고,
 * `net/http`·chi·gin 중 무엇을 덮을지가 아직 결정거리다(`go.md` §0.5). 코스는 2부 끝에서
 * 곧장 기능 챕터로 넘어간다.
 */
import type { PartAssignment } from '../curriculum.js';

export const GO_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 — 축 여덟 (go.md §0.1). 어긋남 판을 따로 안 세워서
    // 공통 축 여덟이 그대로 여덟 판이다 (README §8 의 상한 12 안).
    part: 0,
    concepts: [
      'go/integer-literal', 'go/float-literal', 'go/text-literal', 'go/boolean-literal',
      'go/operator-precedence', 'go/type-conversion', 'go/assignment', 'go/equality',
    ],
  },
  {
    // 1부 「흐름과 묶기」 — 바닥 여덟 중 0부로 안 올라간 다섯 (go.md §2 · §0.5).
    part: 1,
    concepts: [
      'go/short-var-decl', 'go/if-statement', 'go/for-loop',
      'go/func-declaration', 'go/return-multi',
    ],
  },
  {
    // 2부 — §3 중심 남은 열둘 + §4 심화 여덟.
    part: 2,
    concepts: [
      'go/call-expression', 'go/selector', 'go/struct-type', 'go/slice', 'go/append',
      'go/map-type', 'go/range-loop', 'go/nil', 'go/pointer', 'go/method-receiver',
      'go/func-literal', 'go/error-check',
      'go/defer', 'go/package-visibility', 'go/interface-implicit', 'go/nil-interface',
      'go/goroutine', 'go/error-wrap', 'go/channel-select', 'go/generics',
    ],
  },
  {
    // 3부 — 프레임워크 사전이 없다 (go.md §0.5).
    part: 3,
    concepts: [],
  },
];

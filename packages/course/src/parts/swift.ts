/**
 * Swift 의 부 배치 (D190). 정본은 `docs/curriculum/swift.md` §0.1(0부 여덟) · §2(1부 넷) ·
 * §3·§4(2부 스물다섯) 이고, 0부가 §2 에서 넷을 가져간 근거는 §0.5 의 겹침 표다.
 *
 * 목록은 `dictionary/swift/_lang.yaml` 의 `essential` 순서를 그대로 옮긴 것이다 —
 * 0·1·2부를 이으면 `essential` 전량이고 순서도 같다. `./index.test.ts` 가 그것을 대조한다.
 *
 * **3부는 비어 있다.** Swift 의 3부는 `swiftui/` 프레임워크 사전인데 그 네임스페이스는 아직
 * 한 장도 없다(swift.md §0.5 「3부를 어떻게 채울지는 안 정했다」). `@State`·`body`·수식어 사슬
 * 같은 프레임워크 관습이 그 자리이고, 언어 기능인 `swift/property-wrapper`·
 * `swift/result-builder`·`swift/some-any` 셋은 `swift/` 에 남아 2부의 끝을 맡는다.
 */
import type { PartAssignment } from '../curriculum.js';

export const SWIFT_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 — 축 여덟 (swift.md §0.1). 신규 `essential` 여덟은
    // README §12 규약 8 의 상한 열둘 안이다.
    part: 0,
    concepts: [
      'swift/integer-literal', 'swift/float-literal', 'swift/text-literal',
      'swift/boolean-literal', 'swift/operator-precedence', 'swift/type-conversion',
      'swift/assignment', 'swift/equality',
    ],
  },
  {
    // 1부 「흐름과 묶기」 — 값 층위 넷을 0부가 가져가서 흐름을 나누는 문 넷만 남았다.
    part: 1,
    concepts: [
      'swift/if-statement', 'swift/for-in-loop', 'swift/function-declaration',
      'swift/return-statement',
    ],
  },
  {
    // 2부 「Swift 의 타입」 — §3 중심 열다섯 + §4 심화 열.
    part: 2,
    concepts: [
      'swift/string-interpolation', 'swift/array-subscript', 'swift/while-repeat',
      'swift/optional-type', 'swift/if-let', 'swift/guard-let', 'swift/nil-coalescing',
      'swift/optional-chaining', 'swift/force-unwrap', 'swift/closure-trailing',
      'swift/map-filter', 'swift/struct-declaration', 'swift/mutating-method',
      'swift/protocol-conformance', 'swift/enum-associated-value',
      'swift/switch-exhaustive', 'swift/extension', 'swift/throws-try', 'swift/async-await',
      'swift/generics', 'swift/some-any', 'swift/arc-weak', 'swift/capture-list',
      'swift/property-wrapper', 'swift/result-builder',
    ],
  },
  {
    // 3부 프레임워크 — `swiftui/` 사전이 서면 채운다.
    part: 3,
    concepts: [],
  },
];

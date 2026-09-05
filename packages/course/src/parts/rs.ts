/**
 * Rust 의 부 배치 (D190). 정본은 `docs/curriculum/rs.md` §0.1(0부 열하나) · §0.6(사슬) · §2~§4 다.
 *
 * 목록은 `dictionary/rs/_lang.yaml` 의 `essential` 순서를 그대로 옮긴 것이고, 0·1·2부를 이으면
 * `essential` 전량이 된다 — `parts/index.test.ts` 가 그것을 대조한다.
 *
 * **2부의 첫 판이 `rs/move` 다** (rs.md §0.3 · D187 ⑰) — 그 선행에 `cs/undefined-behavior` 가
 * 걸려 있어 「왜 거부되나」보다 「거부 안 하면 무슨 일이 나나」가 먼저 온다(Brown 실험판 4.1).
 *
 * rs.md §0.6 이 3부로 적은 아홉(`iterator-adapters` … `unsafe-block`)은 여기 **2부 끝**에 있다.
 * 등록부의 3부는 프레임워크 사전(`spring/` 같은 별도 네임스페이스)의 자리이고(`parts/index.test.ts`
 * 「3부는 그 언어 프레임워크 사전 전량이거나 비어 있다」), Rust 에는 아직 그것(`tauri/`)이 없다.
 */
import type { PartAssignment } from '../curriculum.js';

export const RS_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 — rs.md §0.1 의 열하나. Rust 의 0부는 감춰진 것을 드러내는 일이
    // 아니라 **이미 드러나 있는 것을 읽는 법**이다(폭이 이름에, 변환이 `as` 라는 낱말로).
    part: 0,
    concepts: [
      'rs/let-binding', 'rs/integer-type', 'rs/mut-binding', 'rs/arithmetic', 'rs/overflow',
      'rs/boolean-literal', 'rs/float-type', 'rs/comparison', 'rs/char-and-byte', 'rs/cast-as',
      'rs/operator-precedence',
    ],
  },
  {
    // 1부 「문과 흐름」 — rs.md §0.6 의 일곱.
    part: 1,
    concepts: [
      'rs/function-item', 'rs/if-expression', 'rs/tail-expression', 'rs/string-literal', 'rs/vec',
      'rs/for-in', 'rs/format-macro',
    ],
  },
  {
    // 2부 「소유권과 타입」 열넷 + rs.md §0.6 의 「3부」 아홉.
    part: 2,
    concepts: [
      'rs/move', 'rs/borrow-shared', 'rs/clone', 'rs/borrow-mut', 'rs/string-vs-str',
      'rs/struct-item', 'rs/impl-method', 'rs/enum-item', 'rs/match', 'rs/option', 'rs/result',
      'rs/question-mark', 'rs/module-visibility', 'rs/closure-capture',
      'rs/iterator-adapters', 'rs/async-await', 'rs/trait-item', 'rs/impl-trait-for',
      'rs/generic-bounds', 'rs/lifetime-annotation', 'rs/smart-pointer', 'rs/shared-thread-state',
      'rs/unsafe-block',
    ],
  },
  {
    // 3부 — 프레임워크 사전이 없다. `tauri/` 가 서면 그 전량이 여기 온다 (rust-axis §5 R10).
    part: 3,
    concepts: [],
  },
];

/**
 * C# 의 부 배치 (D190). 정본은 `docs/curriculum/csharp.md` §0.1(0부) · §2(1부) ·
 * §3·§4(2부)이고, 목록은 `dictionary/csharp/_lang.yaml` 의 `essential` 순서를 한 글자도
 * 어긋나지 않게 옮긴 것이다 — `./index.test.ts` 가 그 대조를 한다.
 *
 * **1부가 셋인 것이 이 언어의 사실이다** (`csharp.md` §0.5). C# 에는 자유 함수가 없어
 * 「문」의 바닥이 `if`·메서드 선언·`return` 셋뿐이고, §2 의 바닥 여덟 중 나머지 다섯은
 * 값 층위라 0부가 가져갔다.
 *
 * **3부는 비어 있다.** ASP.NET Core 쪽 네임스페이스(`aspnet/` 같은 것)가 아직 없어서
 * (`csharp.md` §0.5) 코스는 2부 끝에서 곧장 기능 챕터로 넘어간다 — 자바의 `spring/` 15장에
 * 대응하는 자리가 다음 물결의 몫이다.
 */
import type { PartAssignment } from '../curriculum.js';

export const CSHARP_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「이 언어의 값과 식」 — 공통 축 여덟 (README §8 · csharp.md §0.1).
    // 어긋남 판은 따로 안 세웠다. C# 의 어긋남 넷(`checked` · `decimal` · 값/참조 타입 ·
    // `==` 가 타입마다)이 전부 축 안에서 표현된다.
    part: 0,
    concepts: [
      'csharp/integer-literal', 'csharp/float-literal', 'csharp/text-literal',
      'csharp/boolean-literal', 'csharp/operator-precedence', 'csharp/type-conversion',
      'csharp/assignment', 'csharp/equality',
    ],
  },
  {
    // 1부 「흐름과 묶기」 — 자유 함수가 없어 문의 바닥이 셋뿐이다 (csharp.md §2).
    part: 1,
    concepts: [
      'csharp/if-statement', 'csharp/method-declaration', 'csharp/return-statement',
    ],
  },
  {
    // 2부 「C# 의 타입과 흐름」 — §3 중심 열넷 + §4 심화 열.
    // 순서는 `_lang.yaml` 의 배열 규칙(얇은 판을 셋 이상 잇대지 않는다)이 정했다.
    part: 2,
    concepts: [
      'csharp/class-declaration', 'csharp/member-access', 'csharp/method-call',
      'csharp/property', 'csharp/interpolated-string', 'csharp/value-vs-reference',
      'csharp/record', 'csharp/while-loop', 'csharp/nullable-reference',
      'csharp/null-coalescing', 'csharp/null-conditional', 'csharp/conditional-ternary',
      'csharp/try-catch', 'csharp/list', 'csharp/foreach-loop', 'csharp/interface',
      'csharp/lambda', 'csharp/linq-where', 'csharp/linq-select', 'csharp/generics',
      'csharp/deferred-execution', 'csharp/using-disposable', 'csharp/async-await',
      'csharp/switch-expression',
    ],
  },
  {
    // 3부 프레임워크 — 사전이 없다 (csharp.md §0.5).
    part: 3,
    concepts: [],
  },
];

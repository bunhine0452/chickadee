/**
 * 기초 문항 — 값 적기 (`docs/program/fundamentals.md` §5).
 *
 * 이 영역의 문구는 **진단**이다. 진단문을 개념마다 저작하지 않는다는 것이 그 형식의 결정이고
 * (D187 ⑤), 그래서 여기 있는 것은 **틀의 열두 줄**이다 — 무엇이 채워지는지는 카탈로그가
 * 계산한다(`siblings`·`variants`·`langAlt`).
 *
 * 두 줄이 다른 열보다 중요하다.
 *   - `fund.missNoDiagnosis` — **댈 것이 없을 때 없다고 말한다** (D186 ④). 이 줄이 없으면
 *     화면은 그냥 「틀렸습니다」로 닫히고, 학습자는 앱이 답을 알면서 안 알려 준다고 읽는다.
 *   - `fund.retrySameExpr` — 재출제가 같은 식일 때 그 사실을 말한다 (D187 ②). 숨기면
 *     답을 외운 것이 이해로 계산된다.
 */
export const fund = {
  // ───────── 오답 분류 열둘 (`MISS_MESSAGE_KEY`) ─────────
  'fund.missBlank': '아직 아무것도 안 적었습니다. 모르겠으면 「모르겠어요」를 눌러도 됩니다 — 벌점은 없습니다.',
  'fund.missUnparsable': '적으신 「{{answer}}」를 값으로 읽지 못했습니다. 이 자리는 {{declared}} 값 하나입니다.',
  'fund.missTypeDrift': '값은 맞는데 종류가 다릅니다. 이 자리는 {{declared}} 이고, 적으신 것은 소수점이 있는 값입니다.',
  'fund.missIdealMath': '수학의 답을 적으셨습니다. 어느 언어도 그 값을 내지 않습니다 — 기계가 밟는 걸음이 아래에 있습니다.',
  'fund.missOtherLanguage': '{{lang}}에서는 그 답이 맞습니다. 여기서는 {{lang}}가 아니라 이 언어의 규칙이 답을 정합니다.',
  'fund.missOtherForm': '`{{from}}` 를 `{{to}}` 로 바꾼 식의 답입니다. 지금 판의 식은 그것이 아닙니다.',
  'fund.missOtherRule': '같은 언어의 다른 규칙에서는 그 답이 맞습니다 — `{{from}}` 대신 `{{to}}` 였다면.',
  'fund.missNoDiagnosis': '왜 그 답이 나왔는지 저희가 계산하지 못했습니다. 이 식에는 견줄 자리가 없습니다 — 기계의 걸음만 폅니다.',
  'fund.missRounding': '버리는 자리에서 반올림하셨습니다. 이 연산은 반올림하지 않고 버립니다.',
  'fund.missSign': '부호만 다릅니다. 나머지의 부호를 어느 쪽이 정하는지가 언어마다 다릅니다.',
  'fund.missSpelling': '이 언어에서 참·거짓은 `{{yes}}` 와 `{{no}}` 로 적습니다. 적으신 글자는 여기서 값이 아닙니다.',
  'fund.missUnknown': '어디에도 안 걸렸습니다. 기계가 밟은 걸음을 폅니다.',

  'fund.meaningIsValue': '값이 계산되는 개념이라 고르기가 아니라 값 적기로 냅니다.',

  // ───────── 정직성 (D186 ④) ─────────
  'fund.retrySameExpr': '이 개념에는 식이 하나뿐이라 같은 식을 다시 냅니다.',
  'fund.retryOtherExpr': '같은 개념의 다른 식입니다.',
  'fund.dropped': '{{lang}}에서는 이 식을 안 냅니다 — {{reason}}',
  'fund.verifiedSpec': '이 언어의 값은 명세를 읽고 적은 것이고 아직 실제 툴체인으로 안 재 봤습니다.',

  // ───────── 「답이 없다」 둘 ─────────
  'fund.compileError': '이 식은 컴파일이 안 됩니다.',
  'fund.unspecified': '명세가 답을 정해 두지 않았습니다. 구현이 정하고, 구현이 바뀌면 답도 바뀝니다.',
} as const;

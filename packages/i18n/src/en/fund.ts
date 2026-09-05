/** `ko/fund.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). */
export const fund: Record<string, string> = {
  'fund.missBlank': 'Nothing written yet. Pressing "I don’t know" is fine — it costs no points.',
  'fund.missUnparsable': 'We could not read "{{answer}}" as a value. This slot holds one {{declared}}.',
  'fund.missTypeDrift': 'Right value, wrong kind. This slot is {{declared}}, and what you wrote has a decimal point.',
  'fund.missIdealMath': 'That is the answer in maths. No language here produces it — the machine’s steps are below.',
  'fund.missOtherLanguage': 'In {{lang}} that answer is right. Here the rule that decides is this language’s, not {{lang}}’s.',
  'fund.missOtherForm': 'That is the answer with `{{from}}` changed to `{{to}}`. The expression on this plate is not that one.',
  'fund.missOtherRule': 'Under a different rule of the same language that answer is right — if it were `{{to}}` instead of `{{from}}`.',
  'fund.missNoDiagnosis': 'We could not work out where that answer came from. This expression has nothing to compare against — only the machine’s steps follow.',
  'fund.missRounding': 'You rounded where the value is thrown away. This operation truncates, it does not round.',
  'fund.missSign': 'Only the sign differs. Which side decides the sign of a remainder is a per-language rule.',
  'fund.missSpelling': 'In this language true and false are written `{{yes}}` and `{{no}}`. What you wrote is not a value here.',
  'fund.missUnknown': 'Nothing matched. Here are the steps the machine took.',

  'fund.meaningIsValue': 'The value here is computed, so this is written out rather than picked from four.',

  'fund.retrySameExpr': 'This concept has only one expression, so the same one comes back.',
  'fund.retryOtherExpr': 'A different expression for the same concept.',
  'fund.dropped': 'This expression is not offered in {{lang}} — {{reason}}',
  'fund.verifiedSpec': 'The values for this language were read off the specification and have not been run on a real toolchain yet.',

  'fund.compileError': 'This expression does not compile.',
  'fund.unspecified': 'The specification does not fix an answer. The implementation decides, and a different implementation may answer differently.',
};

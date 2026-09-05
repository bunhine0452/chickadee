/** `ko/grading.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). 조사 필터는 쓰지 않는다. */
export const grading: Record<string, string> = {
  'grading.dictResult': 'The value after line {{focus}}',

  'grading.promptHeader': 'Around line {{focus}} of {{file}}.',
  'grading.promptConcept': 'The grammar I am learning: {{name}} ({{token}})',
  'grading.promptStuck': 'Where I am stuck: {{stuck}}',
  'grading.promptStuckEmpty': '(left blank)',
  'grading.promptNoAnswer': 'I have not picked an answer yet.',
  'grading.promptCorrectButWhy': 'I got it right, but I cannot explain why on my own.',
  'grading.promptWrongPick': 'I picked “{{label}}” and got it wrong.',
  'grading.promptAsk':
    'Explain it the way you would to someone who just started programming, using the code '
    + 'above as the example rather than a different one.',
  'grading.noFileName': '(no file name)',

  'grading.appealTrailingComma': 'Trailing comma in an argument list',
  'grading.appealArrowBraces': 'Braces in an arrow body — `x => x + 1` and `x => { return x + 1 }`',
  'grading.appealReturnParens': 'Parentheses after `return`',
  'grading.appealSelfClosing': 'Closing a childless JSX tag as `<X />`',
  'grading.appealJsxQuote': 'Quotes in a JSX attribute — `type="text"` and `type={\'text\'}`',

  'grading.whyHelpNineMinutes':
    'One line is enough. It is not graded. It cannot be skipped either — if your head does '
    + 'not switch on here, the nine minutes before it were typing practice.',
  'grading.whyNotCode': 'Say it in words rather than copying the code',
  'grading.whyChars': '{{n}} / {{min}} characters',

  'grading.cappedNote':
    'More than half of what you picked did not change — narrow the scope',
  'grading.foldedNote': 'A folded folder — the question is not about the files inside',
  'grading.unchangedNote': 'Not changed in this commit.',

  'grading.flowSeat': '#{{n}}',
  'grading.flowMissed': 'The answer path has it at {{seat}}, but it is missing.',
  'grading.flowFound': 'The answer path has it at {{seat}}.',
  'grading.flowWrong':
    'This card is not on the path. The pair on either side of it counts as wrong.',

  'grading.directionBoth': 'both ways',
  'grading.directionNone': 'unrelated',
  'grading.directionOneWay': '{{label}} — {{user}} is the side that imports.',
  'grading.directionBothNote': 'Both ways — they import each other. That is a cycle.',
  'grading.directionNoneNote': 'Unrelated — there is no import between them.',
  'grading.roleNote': 'This folder belongs to the «{{label}}» row.',
  // ───────── Course grading (D164) ─────────
  'grading.stageHopPartial': 'The whole order must be right to pass — {{pct}}% so far.',
  'grading.stageCallerPartial': 'Pick every caller and no non-caller to pass.',
  'grading.stageReasonWrong': 'Right place, different reason.',
  'grading.stagePatchOk': 'Same meaning as the reference.',
  'grading.stagePatchDiffer': 'The edited line differs from the reference — {{reason}}',
  'grading.stagePatchNoLine': 'The line to edit is empty.',
  'grading.stagePlaceOk': 'That place works too — after the line that makes it, before the line that uses it.',
  'grading.stagePlaceBeforeDecl': '«{{name}}» does not exist there yet — line {{line}} creates it.',
  'grading.stagePlaceAfterUse': 'Line {{line}} already uses «{{name}}» — it must come before that.',
  'grading.stagePlaceOff': 'It compiles, but the meaning changes — the original place is after line {{line}}.',
  'grading.stageLinks': 'link check {{ok}}/{{n}}',
  'grading.stageLinkMissing': 'A link is broken — «{{name}}» is not in your answer.',
  'grading.stageHandoff': 'Not graded. Copy the prompt and take it with you.',
  'grading.handoffMine': 'My code:',
  'grading.handoffOriginal': 'Original {{file}} from line {{from}}:',
  'grading.stageWrongShape': 'This answer shape does not fit the card.',
  // Stage 4/5 judged by running (D180)
  'grading.stageNoTests': 'Not graded — no test in this repo can judge this question. It does not count toward passing.',
  'grading.stageNoRunner': 'Not graded — this machine cannot run the code. It does not count toward passing.',
  'grading.stageRunPassed': '{{n}} test(s) passed.',
  'grading.stageRunPassedOffSpec': '{{n}} test(s) passed — written differently from the original, same behaviour.',
  'grading.stageRunFailed': '{{n}} test(s) failed.',
  'grading.stageRunFailedAt': '{{test}} — {{message}}',
  'grading.stageRunTimeout': 'Did not finish in time — look for a loop that never ends.',
  'grading.stageRunError': 'Did not build — start with the compile error.',

  // Two formats (D187 ⑱) — the diagnosis is computed from the material's own facts.
  'grading.orderMissWhy': 'Reversed — {{second}} comes after {{first}}. {{fact}}.',
  'grading.orderMissUnknown': 'That pair is not in the answer — {{a}} then {{b}}.',
  'grading.orderMissEmpty': 'Nothing was stacked.',
  'grading.traceBlank': 'Line {{row}}, column "{{col}}" is empty.',
  'grading.traceValue': 'Line {{row}}, column "{{col}}" — you wrote {{mine}}.',
  'grading.traceCarry': 'Line {{row}}, column "{{col}}" did not change since line {{from}} — it should still be {{want}}, but you wrote {{mine}}.',
  'grading.traceReused': 'Line {{row}}, column "{{col}}" is where the box changes — {{mine}} is a name you already used.',
  'grading.traceEmpty': 'No cell was filled.',
};

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
};

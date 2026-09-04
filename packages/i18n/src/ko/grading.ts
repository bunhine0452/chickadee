/**
 * 채점 피드백 — packages/grading (t0 오답 · t1 줄 판정 · t2 티어).
 *
 * 키 이름은 `화면.자리` 다. `ko` 가 키 집합의 정본이고 `en/grading.ts` 가 따라온다 (D117).
 * **이 파일은 그 영역을 맡은 세션만 고친다** — 카탈로그를 영역별로 가른 이유가 그것이다.
 *
 * 사전 3층의 앞 두 라벨(`card.dictOneLiner`·`card.dictWhy`)은 여기 없다 — 카드 생성기와
 * 사다리가 같은 문구를 쓰므로 `cards.ts` 의 키 하나를 나눠 쓴다.
 */
export const grading = {
  // ───────── 1단 · 사전 3층 ─────────
  'grading.dictResult': '{{focus}}행 뒤의 값',

  // ───────── 4단 · 프롬프트 (06 §3.3 · D8) ─────────
  // 골든이 이 다섯 줄의 순서와 글자를 박제한다 — `__golden__/prompt/*.json`.
  'grading.promptHeader': '파일 {{file}} {{focus}}행 근처입니다.',
  'grading.promptConcept': '배우려는 문법: {{name}} ({{token}})',
  'grading.promptStuck': '제가 막힌 지점: {{stuck}}',
  'grading.promptStuckEmpty': '(비어 있음)',
  'grading.promptNoAnswer': '아직 답을 고르지 못했습니다.',
  'grading.promptCorrectButWhy': '문제는 맞혔지만, 왜 그런지는 스스로 설명하지 못하겠습니다.',
  'grading.promptWrongPick': '문제에서 「{{label}}」 를 골라 틀렸습니다.',
  'grading.promptAsk':
    '프로그래밍을 막 시작한 사람에게 설명하듯, 다른 예제 말고 위 코드 그대로를 예로 들어 알려주세요.',
  'grading.noFileName': '(파일 이름 없음)',

  // ───────── T1 이의 · 정규화 카탈로그 (04 §5) ─────────
  'grading.appealTrailingComma': '인자 목록의 후행 쉼표',
  'grading.appealArrowBraces': '화살표 본문의 중괄호 — `x => x + 1` 과 `x => { return x + 1 }`',
  'grading.appealReturnParens': '`return` 뒤의 괄호',
  'grading.appealSelfClosing': '자식 없는 JSX 태그를 `<X />` 로 닫기',
  'grading.appealJsxQuote': 'JSX 속성값의 따옴표 — `type="text"` 와 `type={\'text\'}`',

  // ───────── T1 왜 게이트 (04 §6) ─────────
  // 문항 자체는 카드가 굽는다 — `t1.whyQuestion` 을 `cards.ts` 와 나눠 쓴다.
  'grading.whyHelpNineMinutes':
    '한 줄이면 됩니다. 채점하지 않습니다. 다만 건너뛸 수는 없습니다 — '
    + '여기서 뇌가 안 켜지면 앞의 9분은 타자 연습이 됩니다.',
  'grading.whyNotCode': '코드를 그대로 옮기지 말고 말로 써 주세요',
  'grading.whyChars': '{{n}} / {{min}}자',

  // ───────── T2 판정 문장 ─────────
  'grading.cappedNote': '고른 것 중 절반 이상이 안 바뀐 파일 — 범위를 좁혀 보세요',
  'grading.foldedNote': '접힌 폴더 — 안쪽 파일을 묻는 문제가 아님',
  'grading.unchangedNote': '이번 커밋에서는 바뀌지 않은 파일입니다.',

  'grading.flowSeat': '{{n}}번째',
  'grading.flowMissed': '정답 경로의 {{seat}}인데 빠졌습니다.',
  'grading.flowFound': '정답 경로의 {{seat}}입니다.',
  'grading.flowWrong': '이 경로에 없는 카드입니다. 이 카드가 낀 자리의 쌍은 오답으로 셉니다.',

  'grading.directionBoth': '양쪽',
  'grading.directionNone': '무관',
  // 파일 이름 뒤에 조사를 붙이지 않는다 — `QuantityStepper.tsx` 의 받침 판정이 읽는 소리와
  // 어긋난다. 조사가 붙지 않는 자리로 문장을 짜서 그 부류의 오차를 없앤다.
  'grading.directionOneWay': '{{label}} — 가져다 쓰는 쪽이 {{user}} 입니다.',
  'grading.directionBothNote': '양쪽 — 서로 가져다 씁니다. 순환입니다.',
  'grading.directionNoneNote': '무관 — 둘 사이에 import 가 없습니다.',

  // D142 — 폴더 역할 4지의 정답 문장. 보기 라벨이 곧 지도의 층 이름이다.
  'grading.roleNote': '이 폴더는 «{{label}}» 층입니다.',
} as const;

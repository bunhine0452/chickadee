/**
 * 작은 문제 층과 `build` 형식 — screens/course/DrillPlate (D186 ⑧ · D187 ①).
 *
 * 문구는 **평문**이다 (정본 §6). 학습자가 여기서 읽는 것은 「내가 쓴 프로그램을 진짜로
 * 돌려 봤고 케이스마다 이렇게 나왔다」이고, 그 자리에 은유가 끼면 실행 결과인지 비유인지가
 * 흐려진다.
 *
 * **러너가 없다는 말은 잘못했다는 말이 아니다.** 그 판을 채점에서 뺀다는 사실만 알리고
 * 설치를 권하지 않는다 (정본 §5 ① · D186 ④).
 */
export const drill = {
  // ───────── 판 머리 ─────────
  'drill.title': '작은 문제',
  'drill.buildTitle': '식 만들기',
  'drill.source': '우리가 쓴 문제 <b>{{id}}</b>',
  'drill.needs': '이 문제가 딛는 것 — {{ids}}',
  'drill.langNote': '{{lang}} 로 풉니다.',

  // ───────── 코드 창 ─────────
  'drill.editorLabel': '답을 쓰는 코드 창',
  'drill.exprLabel': '식을 쓰는 칸',
  'drill.starterHere': '여기에 답을 쓰세요',

  // ───────── 케이스 표 ─────────
  'drill.caseTable': '케이스마다 입력을 넣고 나온 글을 견줍니다.',
  'drill.caseNo': '{{n}}번',
  'drill.colCase': '케이스',
  'drill.colIn': '넣는 것',
  'drill.colWant': '나와야 하는 것',
  'drill.colGot': '나온 것',
  'drill.colMark': '판정',
  'drill.markPass': '맞음',
  'drill.markFail': '다름',
  'drill.markTimeout': '안 끝남',
  'drill.markSkipped': '안 돌림',
  'drill.markIdle': '아직',
  'drill.blankOut': '(아무것도 안 나옴)',

  // ───────── 동작 ─────────
  'drill.run': '실행',
  'drill.again': '다시 실행',
  'drill.running': '돌리는 중입니다…',
  'drill.hint': '코드를 쓰고 실행하면 케이스마다 채점합니다.',
  'drill.hintNext': '다음 판으로 넘어갑니다.',

  // ───────── 상태 ─────────
  'drill.passed': '케이스 {{n}}개 전부 통과했습니다.',
  'drill.failed': '{{failed}}개 다르고 {{passed}}개 맞았습니다.',
  'drill.compileError': '이 언어의 문법이 아닙니다 — 돌려 보지도 못했습니다.',
  'drill.timeout': '상한 안에 안 끝났습니다. 반복이 안 끝나는 자리가 있는지 보세요.',
  'drill.took': '{{ms}}ms 걸렸습니다.',
  'drill.logLabel': '실행이 남긴 글',
  'drill.none': '이 컴퓨터에서는 이 판을 채점하지 않습니다.',
  'drill.noneHint': '설치를 권하지 않습니다. 다른 언어로 같은 문제를 풀 수 있어요.',

  // 러너를 못 켠 이유는 `run.reason.toolchainMissing*` 가 이미 가지고 있다 — 언어마다
  // 다른 문장이어야 하고(D186 ④) 그 셋이 그 자리에 있으므로 여기서 겹쳐 두지 않는다.

  // ───────── 안 낸 문제 ─────────
  'drill.dropLang': '{{lang}} 로는 안 내는 문제입니다.',
  'drill.dropNeeds': '아직 안 배운 것이 있습니다 — {{ids}}',

  // ───────── `build` 형식의 물음 여섯 ─────────
  'drill.buildToFraction': '7과 2로 <b>{{want}}</b> 가 나오는 식을 쓰세요.',
  'drill.buildToWhole': '7과 2로 <b>{{want}}</b> 가 나오는 식을 쓰세요. 소수점 아래는 버립니다.',
  'drill.buildNegRemainder': '−7과 2로 <b>{{want}}</b> 가 나오는 식을 쓰세요. 나머지의 부호는 나누는 수를 따릅니다.',
  'drill.buildInexactSum': '0.1과 0.2로 <b>{{want}}</b> 가 나오는 식을 쓰세요.',
  'drill.buildPast32Bits': '2147483647과 1로 <b>{{want}}</b> 가 나오는 식을 쓰세요. 32비트에는 안 들어가는 값입니다.',
  'drill.buildTruthFromNumbers': '7과 2로 <b>{{want}}</b> 가 나오는 식을 쓰세요.',
  'drill.buildHint': '{{must}} 를 쓴 식 하나. 답을 그대로 적으면 안 됩니다.',
  'drill.buildWant': '나와야 하는 값 — <b>{{want}}</b>',
  'drill.buildPrinted': '당신의 식이 찍은 것 — <b>{{printed}}</b>',

  // ───────── `build` 오답 진단 ─────────
  'drill.buildMissBlank': '아직 아무것도 안 적었습니다.',
  'drill.buildMissLiteral': '값을 그대로 적었습니다. 묻는 것은 <b>그 값이 나오는 식</b>이에요 — 주어진 수로 만들어야 합니다.',
  'drill.buildMissToken': '주어진 수를 안 썼습니다 — {{ids}}. 그 수들로 만드는 것이 이 문제입니다.',
  'drill.buildMissCompile': '이 언어의 문법이 아니라 돌려 보지 못했습니다.',
  'drill.buildMissCrashed': '식이 값을 안 내고 <b>사건</b>을 냈습니다. 그것도 답 중 하나지만 이 문제가 묻는 것은 아니에요.',
  'drill.buildMissTimeout': '상한 안에 안 끝났습니다.',
  'drill.buildMissValue': '식은 돌았는데 나온 값이 다릅니다.',
} as const;

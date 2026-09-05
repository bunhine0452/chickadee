/**
 * 실행 러너 — components/run (D175).
 *
 * 문구는 **평문**이다 (정본 §6 개정 — 인쇄소 은유를 UI 에서 걷었다). 학습자가 여기서
 * 읽는 것은 「내 코드를 진짜로 돌려 봤고 그 결과가 이렇다」이고, 그 자리에 은유가 끼면
 * 실행 결과인지 비유인지가 흐려진다.
 *
 * 러너가 없다는 말은 **잘못했다는 말이 아니다.** 4·5단을 채점에서 뺀다는 사실만 알리고
 * 설치를 권하지 않는다 (정본 §5 ①).
 */
export const run = {
  'run.title': '테스트 실행',
  'run.start': '테스트 실행',
  'run.again': '다시 실행',

  // ───────── 상태 넷 ─────────
  'run.running': '실행 중입니다…',
  'run.runningHint': '테스트를 돌리고 있습니다.',
  'run.runningFirst': '작업본을 만들고 처음부터 컴파일하고 있습니다…',
  'run.runningFirstHint': '이 리포의 첫 실행이라 몇 분 걸릴 수 있습니다. 기다린 시간은 오늘 학습 시간에 넣지 않습니다.',
  'run.passed': '테스트 {{n}}개 전부 통과했습니다.',
  'run.failed': '{{failed}}개 실패, {{passed}}개 통과했습니다.',
  'run.error': '테스트를 돌리지 못했습니다.',
  'run.errorHint': '컴파일이 안 됐거나, 테스트 작업이 없거나, 받아 둔 의존성이 모자랍니다.',
  'run.timeout': '{{sec}}초 안에 끝나지 않아 중단했습니다.',
  'run.timeoutHint': '무한 반복이 아닌지 보고 다시 실행해 보세요.',
  'run.none': '이 컴퓨터에서는 4·5단을 채점하지 않습니다.',
  'run.noneHint': '읽기·추적·예측까지로 통과를 판정합니다.',

  // ───────── 배포본 내려받기 동의 (한 번만 묻는다) ─────────
  'run.askDownload': '{{name}} 배포본을 한 번 내려받아야 합니다.',
  'run.askDownloadWhy': '이 리포가 쓰는 빌드 도구가 이 컴퓨터에 아직 없습니다. 받는 것은 이번 한 번이고, 테스트 자체는 네트워크를 끄고 돌립니다.',
  'run.askYes': '내려받고 실행',
  'run.askNo': '받지 않기',
  'run.askNoResult': '받지 않았습니다. 4·5단은 채점에서 뺍니다.',

  // ───────── 러너를 못 켠 이유 ─────────
  'run.reason.noJdk': 'JDK 를 찾지 못했습니다.',
  'run.reason.noGradleWrapper': '이 리포에 Gradle 래퍼(gradlew)가 없습니다.',
  'run.reason.unsupportedLang': '이 언어를 돌리는 러너가 아직 없습니다.',
  'run.reason.notDetected': '아직 확인하지 않았습니다.',

  // ───────── 곁들이 ─────────
  'run.detected': 'JDK {{jdk}} · Gradle {{gradle}}',
  'run.detectedJdk': 'JDK {{jdk}}',
  'run.took': '{{sec}}초 걸렸습니다.',
  'run.offline': '네트워크를 끄고 임시 사본에서 돌렸습니다. 원본 파일은 그대로입니다.',
  'run.downloaded': 'Gradle 배포본을 내려받았습니다. 다음 실행부터는 받지 않습니다.',
  'run.failures': '실패한 테스트',
  'run.logShow': '실행 기록 보기',
  'run.logLabel': '실행 기록',
} as const;

/**
 * 자바 어댑터 — 첫 러너 (D175 · 정본 §5).
 *
 * 하는 일 셋뿐이다. **탐지**(JDK 와 Gradle 래퍼가 이 컴퓨터에 있는가) · **인자**(무엇을
 * 어떤 상한으로 돌리는가) · **읽기**(실행기가 뱉은 것에서 통과·실패·메시지를 뽑는가).
 * 프로세스도 파일 복사도 Rust 가 한다 (`t3_run`).
 *
 * 결과를 XML 로 읽지 않고 **출력 한 줄**로 읽는다. `build/test-results/**` 를 읽으려면
 * 임의 경로 읽기가 IPC 에 열려야 하는데(06 §4.3), 초기화 스크립트 한 장이면 같은 사실이
 * 이미 열려 있는 stdout 으로 나온다. 그 스크립트는 작업본에만 놓이고 원본 리포는 못 본다.
 */
import { ipc, IpcError } from '@chickadee/ipc-client';

import { emptyResult, tailLog } from './runner.js';
import type { RunResult, RunSpec, RunnerProbe } from './runner.js';

const PROPS = 'gradle/wrapper/gradle-wrapper.properties';
const INIT = 'chickadee-run.gradle';
const MARK = '##CHICKADEE##';

/** 탐지가 본 래퍼 이름. Windows 는 `gradlew.bat` 이고 그때만 값이 다르다. */
const wrappers = new Map<string, string>();
/** 탐지가 읽은 Gradle 버전. 배포본이 받아져 있는지 보는 데 쓴다. */
const versions = new Map<string, string>();

/**
 * 복사 규칙이 떨어뜨려도 반드시 가져올 것. **실측에서 걸렸다** — Flutter 가 만든
 * `android/.gitignore` 는 `/gradlew` 와 `gradle-wrapper.jar` 를 무시하므로, `.gitignore`
 * 를 따르는 복사만으로는 래퍼가 작업본에 없고 `RUN_SPAWN` 이 난다.
 */
const KEEP = [
  'gradlew',
  'gradlew.bat',
  'gradle/wrapper/gradle-wrapper.jar',
  'gradle/wrapper/gradle-wrapper.properties',
];

/**
 * 실행기가 던지는 초기화 스크립트. `afterTest` 한 줄이 XML 파일 한 벌을 대신한다.
 *
 * `ignoreFailures` 는 실패한 테스트가 있어도 Gradle 이 0 으로 끝나게 한다 — 통과·실패를
 * 세는 것은 우리이고, 종료 코드는 「빌드 자체가 섰는가」에만 쓴다. `upToDateWhen { false }`
 * 는 같은 답안을 두 번 내도 테스트가 다시 돌게 한다(안 그러면 둘째 실행이 빈 출력이다).
 */
const INIT_GRADLE = [
  '// Chickadee (D175). 임시 작업본에만 놓인다 — 원본 리포는 이 파일을 모른다.',
  'allprojects {',
  '  tasks.withType(Test).configureEach {',
  '    ignoreFailures = true',
  '    outputs.upToDateWhen { false }',
  '    testLogging { showStandardStreams = false }',
  '    afterTest { desc, result ->',
  '      def ex = result.exceptions',
  "      def m = ex ? ex[0].toString().split('\\n')[0] : ''",
  `      println '${MARK}|' + result.resultType + '|' + desc.className + '|' + desc.name + '|' + m`,
  '    }',
  '  }',
  '}',
  '',
].join('\n');

/**
 * Gradle 이 자기 배포본을 푸는 자리, 홈 디렉터리 상대. 없으면 래퍼가 그것을 **내려받는다**
 * — 그 시점은 Gradle 이 시작하기 전이라 `--offline` 이 닿지 않는다. 그래서 실행 전에
 * 여기를 보고, 없으면 시작하지 않고 사람에게 묻는다 (사용자 결정 · D175).
 *
 * 해시 하위 디렉터리까지는 안 본다 — 이 디렉터리가 있다는 것은 적어도 한 번 받아 봤다는
 * 뜻이고, 반쯤 받다 만 것은 래퍼가 스스로 다시 맞춘다.
 */
export function distPath(gradle: string): string {
  return `.gradle/wrapper/dists/gradle-${gradle}-bin`;
}

/**
 * 네트워크를 끄는 인자들. `--offline` 은 의존성 해석을, `auto-download=false` 는
 * 툴체인 JDK 내려받기를 막는다. `--no-daemon` 은 실행이 끝나면 JVM 이 남지 않게 한다.
 *
 * 래퍼 자신의 배포본 내려받기는 `--offline` 이 닿지 않는 자리라 인자가 아니라 `needs`
 * 로 막는다(`distPath`) — 허락을 받기 전에는 시작조차 하지 않는다.
 */
const ARGS = [
  '--offline',
  '--no-daemon',
  '--console=plain',
  '-Dorg.gradle.java.installations.auto-download=false',
  '-Dorg.gradle.configuration-cache=false',
  '--init-script',
  INIT,
  'test',
];

/** 리포 안의 파일 하나가 있는지만 본다. 없으면 `readLines` 가 던진다. */
async function has(rootPath: string, relPath: string): Promise<boolean> {
  try {
    await ipc.file.readLines({ rootPath, relPath, from: 1, to: 1 });
    return true;
  } catch {
    return false;
  }
}

/** `distributionUrl=…/gradle-8.7-bin.zip` 에서 `8.7`. 못 읽으면 버전 없이 진행한다. */
export function gradleVersion(props: string): string | undefined {
  return /gradle-(\d[\w.-]*?)-(?:bin|all)\.zip/.exec(props)?.[1];
}

/** `openjdk version "21.0.4"` 에서 `21.0.4`. 맥의 빈 껍데기는 이 줄을 못 낸다. */
export function jdkVersion(out: string): string | undefined {
  return /version "([^"]+)"/.exec(out)?.[1];
}

export async function detectJava(rootPath: string): Promise<RunnerProbe> {
  const wrapper = (await has(rootPath, 'gradlew'))
    ? 'gradlew'
    : (await has(rootPath, 'gradlew.bat'))
      ? 'gradlew.bat'
      : null;
  if (!wrapper) return { ok: false, reason: 'no-gradle-wrapper' };
  wrappers.set(rootPath, wrapper);

  // `exactOptionalPropertyTypes` 라 없는 값은 키 자체를 빼야 한다.
  let found: { gradle?: string } = {};
  try {
    const chunk = await ipc.file.readLines({ rootPath, relPath: PROPS, from: 1, to: 20 });
    const gradle = gradleVersion(chunk.lines.join('\n'));
    found = gradle === undefined ? {} : { gradle };
    if (gradle !== undefined) versions.set(rootPath, gradle);
  } catch {
    found = {};
  }

  // 빈 작업본에서 `java -version` 하나. 복사도 안 하고 리포도 안 본다.
  try {
    const out = await ipc.t3.run({
      rootPath: '',
      workId: 'probe',
      needs: [],
      keep: [],
      files: [],
      program: 'java',
      args: ['-version'],
      env: [],
      timeoutMs: 20_000,
    });
    // `java -version` 은 stderr 로 쓴다. 맥에는 JDK 가 없어도 `/usr/bin/java` 가 있고,
    // 그 껍데기는 0 이 아닌 코드로 「Java 를 찾을 수 없다」를 낸다 — 버전 줄이 없다.
    const jdk = jdkVersion(`${out.stderr}\n${out.stdout}`);
    if (!jdk) return { ok: false, reason: 'no-jdk', ...found };
    return { ok: true, jdk, ...found };
  } catch (e) {
    // 프로그램 자체가 없는 컴퓨터 — 이것도 사실이지 사고가 아니다.
    if (e instanceof IpcError && e.code === 'RUN_SPAWN') {
      return { ok: false, reason: 'no-jdk', ...found };
    }
    throw e;
  }
}

export interface TestLine {
  result: string;
  test: string;
  message: string;
}

/** `##CHICKADEE##|SUCCESS|com.x.FooTest|logs_in|` 한 줄씩. */
export function readMarks(text: string): TestLine[] {
  const out: TestLine[] = [];
  for (const line of text.split('\n')) {
    const at = line.indexOf(MARK);
    if (at < 0) continue;
    const [result = '', cls = '', name = '', ...rest] = line.slice(at + MARK.length + 1).split('|');
    out.push({ result, test: `${cls}.${name}`, message: rest.join('|').trim() });
  }
  return out;
}

/** 출력에서 표시줄을 걷어 낸 나머지 — 사람이 읽을 로그. */
export function plainLog(text: string): string {
  return text
    .split('\n')
    .filter((l) => !l.includes(MARK))
    .join('\n')
    .trim();
}

export async function runJava(spec: RunSpec, rootPath: string): Promise<RunResult> {
  const wrapper = wrappers.get(rootPath) ?? 'gradlew';
  const gradle = versions.get(rootPath);
  // 허락을 받았거나 버전을 못 읽었으면 막을 근거가 없다 — 그때는 그냥 돌린다.
  const needs = spec.allowDownload === true || gradle === undefined ? [] : [distPath(gradle)];
  let out;
  try {
    out = await ipc.t3.run({
      rootPath,
      workId: `repo-${spec.repoId}`,
      needs,
      keep: KEEP,
      files: [
        ...spec.files.map((f): [string, string] => [f.path, f.text]),
        ...spec.tests.map((f): [string, string] => [f.path, f.text]),
        [INIT, INIT_GRADLE],
      ],
      program: `./${wrapper}`,
      args: ARGS,
      env: [],
      timeoutMs: spec.timeoutMs,
    });
  } catch (e) {
    const why = e instanceof IpcError ? `${e.code}: ${e.message}` : String(e);
    // 실행기가 **시작조차 못 했으면** 오답이 아니다 — 판정이 「테스트가 이긴다」라서
    // (D180) `error` 는 학습자의 답을 틀렸다고 세는 값이다. 아무것도 안 잰 것은 `no-runner`.
    if (e instanceof IpcError && e.code === 'RUN_SPAWN') return emptyResult('no-runner', why);
    return emptyResult('error', why);
  }

  if (out.missing.length > 0) {
    // 아직 안 물었다. 이 단은 답을 받기 전까지 게이트 밖이다.
    return { ...emptyResult('no-runner'), askDownload: { name: `Gradle ${gradle ?? ''}`.trim() } };
  }

  const both = `${out.stdout}\n${out.stderr}`;
  const marks = readMarks(both);
  const log = tailLog(plainLog(both));
  const passed = marks.filter((m) => m.result === 'SUCCESS').length;
  const failures = marks
    .filter((m) => m.result === 'FAILURE')
    .map((m) => ({ test: m.test, message: m.message }));

  if (out.timedOut) {
    return { status: 'timeout', passed, failed: failures.length, failures, log, durationMs: out.durationMs };
  }
  if (marks.length === 0) {
    // 한 줄도 안 나왔으면 테스트가 돌지 못한 것이다. **그 이유가 어디에 있느냐로 갈린다** —
    // 판정이 「테스트가 이긴다」라 `error` 는 답을 틀렸다고 세는 값이기 때문이다 (D180).
    // 컴파일 실패는 답 안에 있으니 `error` 이고, 캐시에 없는 의존성과 없는 `test` 태스크는
    // 이 컴퓨터·이 리포의 사정이니 `no-runner` 다.
    const status = cannotHost(both) ? 'no-runner' : 'error';
    return { ...emptyResult(status, log, out.durationMs) };
  }
  const status = failures.length > 0 ? 'failed' : 'passed';
  return { status, passed, failed: failures.length, failures, log, durationMs: out.durationMs };
}

/**
 * 이 컴퓨터·이 리포가 실행을 **못 받쳐 준다**고 로그가 말하는가.
 *
 * 학습자의 답과 무관한 사정만 여기 든다 — 오프라인이라 못 받은 의존성, `test` 태스크가
 * 없는 프로젝트, 자바 자체의 부재. 컴파일 오류는 여기 없다: 그것은 답 안에 있다.
 */
export function cannotHost(log: string): boolean {
  return /No cached version of|Could not resolve all|Task 'test' not found|Unable to locate a Java Runtime|No matching (?:toolchains|Java installation)/.test(
    log,
  );
}

/** 로그가 배포본을 내려받았다고 말하는가 — 허락을 받은 뒤의 첫 회에만 나온다. */
export function sawDownload(log: string): boolean {
  return /Downloading https?:\/\//.test(log);
}

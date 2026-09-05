/**
 * 4·5단을 **실제로 실행해** 판정한다 (D175 · 정본 §2·§5).
 *
 * 왜 실행인가: 스프링은 애너테이션이 런타임에 하는 일이 내용의 전부다. `@Transactional`
 * 이 붙은 소스와 안 붙은 소스는 AST 로 노드 하나 차이이고, 그 한 노드가 만드는 프록시와
 * 롤백은 돌려 봐야 드러난다. 정적 판정만으로 5단을 채점하면 재는 것이 이해가 아니라
 * 필사가 된다.
 *
 * 이 파일은 **계약과 갈래**만 가진다. 언어마다의 탐지·인자·출력 읽기는 어댑터가 갖고
 * (`java-runner.ts`), 프로세스 자체는 Rust 한 겹이다 (`t3_run`). 언어가 늘어날 때
 * 늘어나는 쪽이 TS 여야 Rust 예산이 언어 수에 비례해 무너지지 않는다 (01 §1.1).
 */
import type { RepoId } from '@chickadee/ipc-client';

import { detectJava, runJava } from './java-runner.js';
import { detectSql, runSql, type SqlCase, type SqlDialect } from './sql-runner.js';
import { runStdin, STDIN_LANGS, type StdinCase, type StdinLang } from './stdin-runner.js';

/**
 * 러너가 아는 언어. **방언·툴체인마다 하나**이지 언어마다 하나가 아니다 (정본 §5) —
 * `sql` 은 sqlite 하나이고, `py`·`ts`·`java` 는 표준 입력 러너가 각자의 툴체인으로 든다
 * (D186 ⑧). `java` 가 둘에 걸치는 이유는 물음이 다르기 때문이다: 리포의 5단은 Gradle 로
 * 테스트를 돌리고, 0부 뒤의 작은 문제는 `javac`+`java` 로 프로그램 한 장을 돌린다.
 */
export type RunLang = 'java' | 'sql' | 'py' | 'ts';
/**
 * `compile-error` 는 표준 입력 러너가 낸 값이다 (D186 ⑧). `error` 와 갈라 둔 이유는
 * 화면이 할 말이 다르기 때문이다 — `error` 는 「돌리지 못했다」이고 `compile-error` 는
 * **답 안에 이유가 있다**. 자바 러너의 `error` 도 컴파일 실패였지만(D175) 그때는 게이트에
 * 이름이 없었고, 이제 이름이 있으므로 그 자리는 그대로 두고 새 층만 이 값을 쓴다.
 */
export type RunStatus = 'passed' | 'failed' | 'error' | 'no-runner' | 'timeout' | 'compile-error';

/**
 * 러너를 못 켠 이유. 화면 문구는 `run.reason.*` 키로 붙는다 (평문, 정본 §6).
 *
 * `dialect-*` 는 SQL 에서 처음 생긴 갈래다 — **러너는 언어마다 하나가 아니라 방언마다
 * 하나**이고(정본 §5), 이 앱이 든 것은 sqlite 하나다. 표본 리포의 MySQL 덤프는 여기서
 * 안 돈다는 사실을 화면이 그대로 말해야 한다 (D186 ④).
 */
export type RunnerReason =
  | 'no-jdk'
  | 'no-gradle-wrapper'
  | 'unsupported-lang'
  | 'not-detected'
  | 'dialect-unsupported'
  | 'no-fixture-db'
  /**
   * 표준 입력 러너가 낸 갈래 셋 (D186 ⑧ ④). 언어마다 다른 값인 이유는 화면이 「러너 없음」
   * 대신 **어느 언어가 이 컴퓨터에 없는지**를 말해야 해서다. 하나로 접으면 파이썬은 되는데
   * 자바가 없는 컴퓨터에서 두 사실이 같은 문장이 된다.
   */
  | 'toolchain-missing:py'
  | 'toolchain-missing:ts'
  | 'toolchain-missing:java';

export interface RunSpec {
  repoId: RepoId;
  lang: RunLang;
  /** 학습자 답안. 임시 작업본에 덮어쓴다 — 원본 리포는 읽기만 한다. */
  files: { path: string; text: string }[];
  /** 판정용 테스트. 답안과 같은 자리에 함께 놓인다. */
  tests: { path: string; text: string }[];
  timeoutMs: number;
  /**
   * 빌드 도구가 자기 배포본을 한 번 내려받는 것을 허락했는가 (사용자 결정 · D175).
   * 기본은 **거짓**이다 — 허락 없이 네트워크를 쓰지 않고, 대신 `askDownload` 로 묻는다.
   */
  allowDownload?: boolean;
  /** `lang: 'sql'` 일 때의 방언. 이 앱이 든 것은 하나다 (정본 §5). */
  dialect?: SqlDialect;
  /** `lang: 'sql'` 일 때 데이터베이스를 세우는 문장들 — 스키마와 시드. */
  db?: string[];
  /** `lang: 'sql'` 일 때 판정할 문항들. 하나가 쿼리 하나와 기대 표 하나다. */
  cases?: SqlCase[];
  /**
   * `lang: 'py' | 'ts' | 'java'` 를 **표준 입력 러너**로 돌릴 때의 재료 (D186 ⑧).
   *
   * 이 갈래는 `repoId` 도 `files` 도 `tests` 도 안 본다 — 프로그램 한 장과 케이스뿐이다.
   * 그래서 `runTests` 는 이 필드가 있는지부터 본다: 같은 `lang: 'java'` 라도 리포의 5단과
   * 0부 뒤의 작은 문제는 다른 러너로 간다.
   */
  stdin?: { source: string; cases: readonly StdinCase[] };
}

/**
 * 기본 상한 **180초**, 작업본을 처음 만드는 회만 **600초** (사용자 결정 · D175).
 *
 * 스프링 첫 빌드는 분 단위라 180초로는 첫 회가 늘 끊긴다. 반대로 매 판을 10분씩 열어 두면
 * 하루 15분 예산이 뜻을 잃는다. Rust 의 600초는 **방벽이지 기본값이 아니다** — 여기 값이
 * 그 아래에 있는 한 방벽은 안 보인다.
 */
export const RUN_TIMEOUT_MS = 180_000;
export const FIRST_RUN_TIMEOUT_MS = 600_000;

export interface RunFailure {
  /** `클래스.메서드`. 어댑터가 실행기 출력에서 그대로 읽어 온다. */
  test: string;
  message: string;
}

export interface RunResult {
  status: RunStatus;
  passed: number;
  failed: number;
  failures: RunFailure[];
  /**
   * 러너가 없거나 방언이 안 맞을 때의 사유. `status === 'no-runner'` 일 때만 실린다 —
   * 화면이 「러너 없음」 대신 **왜 없는지**를 말해야 한다 (D186 ④).
   */
  reason?: RunnerReason;
  /** 상한을 넘으면 **뒤를 남기고** 앞을 자른다 — 실패 원인은 끝에 있다. */
  log: string;
  durationMs: number;
  /**
   * 「배포본을 한 번 내려받아야 합니다」를 물어야 한다 (D175). 이때 `status` 는
   * `no-runner` 다 — 답을 받기 전까지 그 단은 게이트 밖이고, 아무것도 오답이 되지 않는다.
   */
  askDownload?: { name: string };
}

export interface RunnerProbe {
  ok: boolean;
  reason?: RunnerReason;
  jdk?: string;
  gradle?: string;
  /** SQL 러너가 켜졌을 때 어느 방언인지. 화면이 「sqlite 로 돌린 결과」라고 말할 근거다. */
  dialect?: SqlDialect;
  /** 표준 입력 러너가 본 툴체인의 첫 줄 — `Python 3.13.12` · `v26.7.0` (D186 ⑧). */
  tool?: string;
}

/** 화면과 원장에 담기는 로그 상한. Rust 가 이미 스트림당 128 KiB 에서 자른다. */
export const MAX_LOG = 20_000;

export function tailLog(text: string, cap = MAX_LOG): string {
  return text.length <= cap ? text : `…${text.slice(text.length - cap)}`;
}

/**
 * 탐지가 남긴 것. `runTests` 는 `RepoId` 만 받는데 러너에게는 경로가 필요하고, 경로를
 * 아는 것은 `detectRunner` 를 부른 화면이다 — 그래서 탐지가 성공한 리포만 실행된다.
 * 「탐지되면 켜고 없으면 그 단을 게이트에서 뺀다」(정본 §5 ①)가 이 자료구조다.
 */
const known = new Map<RepoId, { rootPath: string; probe: RunnerProbe }>();

export function rememberRunner(repoId: RepoId, rootPath: string, probe: RunnerProbe): void {
  known.set(repoId, { rootPath, probe });
}

export function knownRunner(repoId: RepoId): { rootPath: string; probe: RunnerProbe } | undefined {
  return known.get(repoId);
}

export function forgetRunners(): void {
  known.clear();
}

/** 실행 없이 답할 수 있는 결과 하나 — 셀 것이 없을 때의 기본값. */
export function emptyResult(status: RunStatus, reason?: RunnerReason | string, durationMs = 0): RunResult {
  // 자바 쪽은 이 자리에 로그를 넘겨 왔고 SQL 쪽은 사유를 넘긴다 — 둘 다 사람이 읽는
  // 한 줄이라 로그에 싣고, 아는 사유면 `reason` 으로도 올린다.
  const known = REASONS.has(reason as RunnerReason);
  return {
    status,
    passed: 0,
    failed: 0,
    failures: [],
    log: known ? '' : reason ?? '',
    durationMs,
    ...(known ? { reason: reason as RunnerReason } : {}),
  };
}

const REASONS = new Set<RunnerReason>([
  'no-jdk', 'no-gradle-wrapper', 'unsupported-lang', 'not-detected',
  'dialect-unsupported', 'no-fixture-db',
  'toolchain-missing:py', 'toolchain-missing:ts', 'toolchain-missing:java',
]);

/**
 * 리포 하나에 러너가 있는지 본다. **없는 것은 오류가 아니다** — 4·5단을 게이트에서
 * 빼라는 신호이고, 설치를 강요하지 않는다 (정본 §5 ①).
 */
export async function detectRunner(
  repoId: RepoId,
  rootPath: string,
  lang: RunLang = 'java',
): Promise<RunnerProbe> {
  const probe = lang === 'sql' ? await detectSql() : await detectJava(rootPath);
  rememberRunner(repoId, rootPath, probe);
  return probe;
}

/**
 * 답안과 테스트를 임시 작업본에 놓고 돌린다. 먼저 `detectRunner` 를 통과한 리포에서만
 * 돈다 — 그 전에 부르면 `no-runner` 다.
 */
export async function runTests(spec: RunSpec): Promise<RunResult> {
  if (spec.lang === 'sql') return runSql(spec);
  // 재료가 「프로그램 한 장 + 케이스」면 표준 입력 러너다 (D186 ⑧). `lang` 보다 이것이
  // 먼저인 이유는 자바가 두 러너에 걸쳐 있어서다.
  if (spec.stdin !== undefined) {
    if (!(STDIN_LANGS as readonly string[]).includes(spec.lang)) {
      return emptyResult('no-runner', 'unsupported-lang');
    }
    return runStdin({
      lang: spec.lang as StdinLang,
      source: spec.stdin.source,
      cases: spec.stdin.cases,
      timeoutMs: spec.timeoutMs,
    });
  }
  if (spec.lang !== 'java') return emptyResult('no-runner', 'unsupported-lang');
  const seen = known.get(spec.repoId);
  if (!seen?.probe.ok) return emptyResult('no-runner');
  return runJava(spec, seen.rootPath);
}

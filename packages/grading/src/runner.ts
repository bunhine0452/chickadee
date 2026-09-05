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

export type RunStatus = 'passed' | 'failed' | 'error' | 'no-runner' | 'timeout';

/** 러너를 못 켠 이유. 화면 문구는 `run.reason.*` 키로 붙는다 (평문, 정본 §6). */
export type RunnerReason = 'no-jdk' | 'no-gradle-wrapper' | 'unsupported-lang' | 'not-detected';

export interface RunSpec {
  repoId: RepoId;
  lang: 'java';
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
export function emptyResult(status: RunStatus, log = '', durationMs = 0): RunResult {
  return { status, passed: 0, failed: 0, failures: [], log, durationMs };
}

/**
 * 리포 하나에 러너가 있는지 본다. **없는 것은 오류가 아니다** — 4·5단을 게이트에서
 * 빼라는 신호이고, 설치를 강요하지 않는다 (정본 §5 ①).
 */
export async function detectRunner(repoId: RepoId, rootPath: string): Promise<RunnerProbe> {
  const probe = await detectJava(rootPath);
  rememberRunner(repoId, rootPath, probe);
  return probe;
}

/**
 * 답안과 테스트를 임시 작업본에 놓고 돌린다. 먼저 `detectRunner` 를 통과한 리포에서만
 * 돈다 — 그 전에 부르면 `no-runner` 다.
 */
export async function runTests(spec: RunSpec): Promise<RunResult> {
  if (spec.lang !== 'java') return emptyResult('no-runner');
  const seen = known.get(spec.repoId);
  if (!seen?.probe.ok) return emptyResult('no-runner');
  return runJava(spec, seen.rootPath);
}

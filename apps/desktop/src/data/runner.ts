/**
 * 화면이 보는 실행 상태 (D175).
 *
 * 판정과 프로세스는 아래에 있다 — `@chickadee/grading` 의 `runTests` 가 돌리고, 그 아래
 * Rust `t3_run` 이 임시 작업본에서 프로세스를 띄운다. 여기가 더하는 것은 **화면이 그릴 수
 * 있는 모양 하나**와 러너를 리포마다 한 번만 찾는 기억뿐이다.
 *
 * 「러너 없음」은 실패가 아니다. 4·5단을 챕터 통과 게이트에서 뺀다는 신호이고, 화면은
 * 그 사실을 말하되 설치를 권하지 않는다 (정본 §5 ①).
 */
import type { MessageKey } from '@chickadee/i18n';
import {
  detectRunner, FIRST_RUN_TIMEOUT_MS, runTests, RUN_TIMEOUT_MS, sawDownload,
  type RunFailure, type RunResult, type RunSpec, type RunnerProbe, type RunnerReason,
} from '@chickadee/grading';
import { ipc, log } from '@chickadee/ipc-client';
import type { RepoId } from '@chickadee/ipc-client';

export type RunView =
  | { kind: 'idle' }
  /** `first` 면 작업본을 만들고 전체를 컴파일하는 회다 — 분 단위로 걸린다. */
  | { kind: 'running'; first: boolean }
  /** 배포본을 한 번 받아도 되는지 묻는 자리. 답을 받기 전까지 그 단은 게이트 밖이다. */
  | { kind: 'ask-download'; name: string }
  | { kind: 'passed'; passed: number; durationMs: number; log: string; downloaded: boolean }
  | {
      kind: 'failed'; passed: number; failed: number; failures: RunFailure[];
      durationMs: number; log: string; downloaded: boolean;
    }
  | { kind: 'error'; log: string; downloaded: boolean }
  | { kind: 'timeout'; durationMs: number; log: string; downloaded: boolean }
  | { kind: 'no-runner'; reason: RunnerReason };

const REASON: Record<RunnerReason, MessageKey> = {
  'no-jdk': 'run.reason.noJdk',
  'no-gradle-wrapper': 'run.reason.noGradleWrapper',
  'unsupported-lang': 'run.reason.unsupportedLang',
  'not-detected': 'run.reason.notDetected',
  'dialect-unsupported': 'run.reason.dialectUnsupported',
  'no-fixture-db': 'run.reason.noFixtureDb',
};

export function reasonKey(reason: RunnerReason): MessageKey {
  return REASON[reason];
}

/**
 * 「배포본을 받아도 된다」는 사용자의 답 (D175). `settings` 한 곳이 진실이라는 규칙은
 * 그대로 따르되(01 §7) `Settings` 타입은 넓히지 않는다 — `saveEditorAssist` 가 이미 쓰는
 * 같은 방식으로 자기 키 하나를 쓴다.
 */
const DOWNLOAD_KEY = 'runner.allowDownload';

let allowed: boolean | undefined;

export async function loadDownloadConsent(): Promise<boolean> {
  if (allowed !== undefined) return allowed;
  try {
    const rows = await ipc.store.query('settings.get_all', {});
    const row = rows.find((r) => r.key === DOWNLOAD_KEY);
    allowed = row === undefined ? false : JSON.parse(row.value_json) === true;
  } catch {
    allowed = false;
  }
  return allowed;
}

/** 「예」는 남긴다 — 다시 묻지 않는다. 「아니오」는 남기지 않는다: 마음이 바뀔 수 있다. */
export async function setDownloadConsent(yes: boolean, now = Date.now()): Promise<void> {
  allowed = yes;
  if (!yes) return;
  await ipc.store
    .exec('settings.set', { key: DOWNLOAD_KEY, valueJson: JSON.stringify(true), updatedAt: now })
    .catch(() => log.warn('러너 내려받기 동의를 저장하지 못했다'));
}

export function forgetDownloadConsent(): void {
  allowed = undefined;
}

/** 작업본을 이미 만들어 본 리포. 첫 회만 상한을 600초로 연다. */
const built = new Set<RepoId>();

export function timeoutFor(repoId: RepoId): number {
  return built.has(repoId) ? RUN_TIMEOUT_MS : FIRST_RUN_TIMEOUT_MS;
}

export function isFirstRun(repoId: RepoId): boolean {
  return !built.has(repoId);
}

export function forgetBuilt(): void {
  built.clear();
}

/** 리포마다 한 번만 찾는다 — 탐지도 프로세스 하나라 매 문항마다 부를 것이 아니다. */
const probes = new Map<RepoId, Promise<RunnerProbe>>();

export function ensureRunner(repoId: RepoId, rootPath: string): Promise<RunnerProbe> {
  const seen = probes.get(repoId);
  if (seen) return seen;
  const asking = detectRunner(repoId, rootPath);
  probes.set(repoId, asking);
  return asking;
}

/** 테스트와 「전부 지우기」 뒤에 기억을 놓는다. */
export function forgetProbes(): void {
  probes.clear();
}

export function viewOf(result: RunResult, probe?: RunnerProbe): RunView {
  // 배포본을 내려받았으면 화면이 그 사실을 말한다 — 「네트워크는 끈다」의 유일한 예외이고
  // (`gradlew` 가 Gradle 을 시작하기 전에 받는다) 조용히 넘기면 약속이 거짓말이 된다.
  const downloaded = sawDownload(result.log);
  switch (result.status) {
    case 'passed':
      return {
        kind: 'passed', passed: result.passed, durationMs: result.durationMs, log: result.log, downloaded,
      };
    case 'failed':
      return {
        kind: 'failed',
        passed: result.passed,
        failed: result.failed,
        failures: result.failures,
        durationMs: result.durationMs,
        log: result.log,
        downloaded,
      };
    case 'timeout':
      return { kind: 'timeout', durationMs: result.durationMs, log: result.log, downloaded };
    case 'no-runner':
      if (result.askDownload) return { kind: 'ask-download', name: result.askDownload.name };
      return { kind: 'no-runner', reason: probe?.reason ?? 'not-detected' };
    default:
      return { kind: 'error', log: result.log, downloaded };
  }
}

/**
 * 한 번의 실행. 탐지가 먼저 돌고, 러너가 없으면 프로세스를 아예 띄우지 않는다.
 * 던지지 않는다 — 화면이 죽는 것보다 「못 쟀다」가 정확하다.
 */
export async function runStage(spec: RunSpec, rootPath: string): Promise<RunView> {
  let probe: RunnerProbe;
  try {
    probe = await ensureRunner(spec.repoId, rootPath);
  } catch {
    return { kind: 'no-runner', reason: 'not-detected' };
  }
  if (!probe.ok) return { kind: 'no-runner', reason: probe.reason ?? 'not-detected' };

  const allowDownload = await loadDownloadConsent();
  const view = viewOf(
    await runTests({ ...spec, allowDownload, timeoutMs: spec.timeoutMs || timeoutFor(spec.repoId) }),
    probe,
  );
  // 돌아 본 리포는 작업본이 서 있다 — 다음 회부터 상한이 180초다. 물음에서 멈춘 회는 세지
  // 않는다: 아무것도 안 만들었다.
  if (view.kind !== 'ask-download' && view.kind !== 'no-runner') built.add(spec.repoId);
  return view;
}

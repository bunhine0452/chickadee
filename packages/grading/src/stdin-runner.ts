/**
 * 표준 입력 러너 — 셋째 러너 (D186 ⑧ · D187 ① · 정본 §5).
 *
 * 0부는 값을 **적게** 한다. 이 층은 그 값이 필요한 **다섯 줄짜리 프로그램**을 실제로 쓰게
 * 하고 돌려서 본다. 백준 1000번대가 하는 일과 자리가 같되 문제는 우리 것이다 — 대회
 * 사이트의 지문도 케이스도 복제하지 않는다(리포는 MIT).
 *
 * 자바·sqlite 어댑터와 같은 자리를 맡는다 — **탐지**·**인자**·**읽기**. 다른 것은 넷이다.
 *
 * ① **리포가 없다.** 자바 러너는 학습자 리포를 복사해 그 안에 답안을 떨어뜨렸다. 여기는
 *    파일 한 장이 전부이고 그것을 학습자가 방금 썼다. `repoId` 도 `rootPath` 도 안 쓴다.
 * ② **동의 게이트가 없다.** D175 규칙 ① 은 **내려받을 것이 있을 때**의 규칙이다. 여기서
 *    내려받는 것은 없다 — 이미 깔린 `python3`·`node`·`javac` 를 부를 뿐이라 물을 것이
 *    없다. 대신 남는 게이트가 하나 있다: **툴체인**. 없으면 `no-runner` 이고 화면이
 *    어느 언어가 없는지 말한다 (`toolchain-missing:*` · D186 ④).
 * ③ **상한이 5초다.** 컴파일이 언어당 한 번뿐이고 프로그램이 다섯 줄이라, 안 끝나는 것은
 *    느린 것이 아니라 반복이 안 끝나는 것이다. Rust 가 5초에서 깎는다.
 * ④ **판정이 「글자 비교」다.** 실행이 곧 답이라 AST 도 사다리도 안 탄다 (D180 을 이 층으로:
 *    「테스트가 이긴다」가 「나온 글이 이긴다」가 된다). 봐주는 것은 **줄 끝 공백과 마지막
 *    빈 줄** 둘뿐이다 — 채점기가 그보다 너그러우면 「출력 형식을 맞춘다」를 안 가르치게 되고,
 *    그보다 엄하면 편집기가 붙인 개행 하나로 맞는 답이 틀린다.
 *
 * 언어 셋의 사실은 **이 저장소에서 실측했다** (2026-09-05).
 *
 * | 언어 | 컴파일 걸음 | 실행 | 한 케이스 왕복 |
 * |---|---|---|---|
 * | `py` | `python3 -m py_compile main.py` | `python3 main.py` | 16~17 ms |
 * | `ts` | **없다** | `node main.ts` (Node 26 의 타입 벗기기) | 56~58 ms |
 * | `java` | `javac Main.java` | `java -cp . Main` | **미검증 — 이 컴퓨터에 JDK 가 없다** |
 *
 * `ts` 에 컴파일 걸음이 없는 이유도 실측이다: `node --check` 는 타입 표기를 못 읽어
 * `const a: number = 1` 을 문법 오류로 만든다(종료 코드 1). 그래서 문법 오류는 첫 실행의
 * stderr 에 실린 Node 의 코드(`ERR_*_TYPESCRIPT_SYNTAX`·`SyntaxError`)로 가른다.
 *
 * 맥의 `/usr/bin/javac` 는 JDK 없이도 있는 **빈 껍데기**라 「파일이 있나」로는 못 가린다.
 * 그래서 탐지가 `javac -version`·`java -version` 을 실제로 돌려 **종료 코드**를 본다 —
 * 이 저장소에서 둘 다 1 이다(`Unable to locate a Java Runtime`).
 */
import { ipc, IpcError } from '@chickadee/ipc-client';
import type { StepSpec } from '@chickadee/ipc-client';

import { emptyResult, tailLog } from './runner.js';
import type { RunResult, RunnerProbe, RunnerReason } from './runner.js';

/** 표준 입력 러너가 아는 언어 셋. 방언이 아니라 **툴체인마다 하나**다 (정본 §5). */
export const STDIN_LANGS = ['py', 'ts', 'java'] as const;
export type StdinLang = (typeof STDIN_LANGS)[number];

/** 기본 상한. Rust 가 5초에서 깎으므로 이 값이 그 아래에 있는 한 방벽은 안 보인다. */
export const STDIN_TIMEOUT_MS = 5_000;
/**
 * 한 판에서 돌리는 케이스 상한. Rust 의 걸음 상한이 16 이고 컴파일 걸음이 하나 나가므로
 * 12 면 넉넉하다 — 문제 하나의 케이스는 셋에서 다섯이다.
 */
export const MAX_STDIN_CASES = 12;

/** 툴체인이 없다는 사유. 언어마다 다른 값이라 화면이 **어느 언어**인지 말할 수 있다. */
export const TOOLCHAIN_MISSING: Readonly<Record<StdinLang, RunnerReason>> = {
  py: 'toolchain-missing:py',
  ts: 'toolchain-missing:ts',
  java: 'toolchain-missing:java',
};

export interface StdinCase {
  /** 화면과 실패 목록에 실리는 이름. */
  name: string;
  stdin: string;
  stdout: string;
}

export interface StdinRunSpec {
  lang: StdinLang;
  /** 학습자가 쓴 프로그램 한 장. */
  source: string;
  cases: readonly StdinCase[];
  timeoutMs?: number;
}

/** 케이스 하나의 결과. 판이 「입력 · 기대 · 실제 · 판정」 표를 이것으로 그린다. */
export interface CaseOut {
  name: string;
  stdin: string;
  expected: string;
  actual: string;
  /** 프로그램이 남긴 오류 글. 비어 있지 않으면 실패의 이유가 값이 아니라 이것이다. */
  stderr: string;
  status: 'passed' | 'failed' | 'timeout' | 'skipped';
  durationMs: number;
}

export interface StdinResult extends RunResult {
  cases: CaseOut[];
}

interface Cmd {
  program: string;
  args: readonly string[];
}

interface Adapter {
  /** 학습자의 코드가 앉을 파일 이름. */
  file: string;
  /** 이 컴퓨터에 있는지 보는 걸음들. **전부 0 으로 끝나야** 켜진다. */
  probe: readonly Cmd[];
  /** 컴파일·문법 검사 걸음. 없는 언어는 `null` 이고 그때는 {@link SYNTAX} 가 대신 본다. */
  compile: Cmd | null;
  run: Cmd;
  env: readonly (readonly [string, string])[];
}

/**
 * 언어 셋의 인자. **여기가 언어 지식의 전부**이고 Rust 는 한 줄도 모른다 — 러너가 언어마다
 * 늘어날 때 늘어나는 쪽이 TS 여야 예산이 언어 수에 비례해 안 무너진다 (D175 의 근거 그대로).
 */
const ADAPTERS: Readonly<Record<StdinLang, Adapter>> = {
  py: {
    file: 'main.py',
    probe: [{ program: 'python3', args: ['--version'] }],
    compile: { program: 'python3', args: ['-m', 'py_compile', 'main.py'] },
    run: { program: 'python3', args: ['main.py'] },
    // 찌꺼기를 안 남긴다. 작업 디렉터리는 어차피 지워지지만 케이스마다 다시 쓸 이유가 없다.
    env: [['PYTHONDONTWRITEBYTECODE', '1'], ['PYTHONIOENCODING', 'utf-8']],
  },
  ts: {
    file: 'main.ts',
    probe: [{ program: 'node', args: ['--version'] }],
    compile: null,
    run: { program: 'node', args: ['main.ts'] },
    env: [],
  },
  java: {
    file: 'Main.java',
    // 껍데기 `javac` 가 있는 컴퓨터가 있다 — 둘 다 돌려 종료 코드로 가른다.
    probe: [
      { program: 'javac', args: ['-version'] },
      { program: 'java', args: ['-version'] },
    ],
    compile: { program: 'javac', args: ['Main.java'] },
    run: { program: 'java', args: ['-cp', '.', 'Main'] },
    env: [],
  },
};

/** 컴파일 걸음이 없는 언어에서 「이건 문법 오류다」를 말하는 표시. Node 실측. */
const SYNTAX = /ERR_INVALID_TYPESCRIPT_SYNTAX|ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX|SyntaxError/;

/**
 * 견줄 수 있는 글자로. **봐주는 것은 둘뿐이다** — 줄 끝의 공백과 마지막의 빈 줄.
 * `\r\n` 도 `\n` 으로 맞춘다: 편집기가 넣은 것이지 사람이 적은 것이 아니다.
 */
export function normalizeOut(text: string): string {
  return text
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/u, ''))
    .join('\n')
    .replace(/\n+$/u, '');
}

export function sameOut(want: string, got: string): boolean {
  return normalizeOut(want) === normalizeOut(got);
}

/** 사람이 읽는 한 줄. 무엇을 기대했고 무엇이 나왔는지만 말한다. */
export function outMessage(want: string, got: string): string {
  const w = normalizeOut(want);
  const g = normalizeOut(got);
  if (g === '') return `아무것도 안 나왔습니다. 기대한 것은 ${JSON.stringify(w)} 입니다.`;
  return `기대한 것은 ${JSON.stringify(w)}, 나온 것은 ${JSON.stringify(g)} 입니다.`;
}

/** 오류 글의 **마지막 뜻있는 줄**. 파이썬도 자바도 진짜 이유를 끝에 적는다. */
export function lastLine(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  return lines[lines.length - 1] ?? '';
}

/** 탐지는 프로세스 하나라 언어마다 한 번만 한다. */
const probes = new Map<StdinLang, Promise<RunnerProbe>>();

export function forgetStdinProbes(): void {
  probes.clear();
}

async function probeOnce(lang: StdinLang): Promise<RunnerProbe> {
  const a = ADAPTERS[lang];
  const steps: StepSpec[] = a.probe.map((c) => ({
    program: c.program,
    args: [...c.args],
    feed: '',
    mustPass: true,
  }));
  try {
    const out = await ipc.stdin.run({ files: [], steps, env: [], timeoutMs: STDIN_TIMEOUT_MS });
    const ok =
      out.spawnFailed === null &&
      out.steps.length === steps.length &&
      out.steps.every((s) => s.code === 0);
    if (!ok) return { ok: false, reason: TOOLCHAIN_MISSING[lang] };
    // 버전 줄은 stdout 에 오기도 stderr 에 오기도 한다 — `java -version` 이 stderr 다.
    const said = out.steps.map((s) => `${s.stdout}${s.stderr}`).join(' ');
    const tool = lastLine(said.split('\n')[0] ?? '');
    return tool === '' ? { ok: true } : { ok: true, tool };
  } catch {
    // 엔진을 못 연 것도 「이 컴퓨터에서는 못 돌린다」다 — 사고가 아니라 사실이다.
    return { ok: false, reason: TOOLCHAIN_MISSING[lang] };
  }
}

/**
 * 이 컴퓨터에서 이 언어를 돌릴 수 있는가. **없는 것은 오류가 아니다** — 그 판을 게이트에서
 * 뺀다는 신호이고 설치를 강요하지 않는다 (정본 §5 ①).
 */
export function detectStdin(lang: StdinLang): Promise<RunnerProbe> {
  const seen = probes.get(lang);
  if (seen) return seen;
  const asking = probeOnce(lang);
  probes.set(lang, asking);
  return asking;
}

const skipped = (c: StdinCase): CaseOut => ({
  name: c.name, stdin: c.stdin, expected: c.stdout, actual: '', stderr: '',
  status: 'skipped', durationMs: 0,
});

const empty = (status: RunResult['status'], reason: RunnerReason | string, cases: CaseOut[], ms = 0): StdinResult =>
  ({ ...emptyResult(status, reason, ms), cases });

/**
 * 프로그램 한 장을 케이스마다 돌려 본다. 컴파일이 있는 언어는 **한 번만** 컴파일한다 —
 * 걸음을 한 호출에 실어 보내는 이유가 그것이다.
 */
export async function runStdin(spec: StdinRunSpec): Promise<StdinResult> {
  const a = ADAPTERS[spec.lang];
  const cases = spec.cases.slice(0, MAX_STDIN_CASES);
  if (cases.length === 0) return empty('no-runner', 'not-detected', []);

  const probe = await detectStdin(spec.lang);
  if (!probe.ok) {
    return empty('no-runner', probe.reason ?? TOOLCHAIN_MISSING[spec.lang], cases.map(skipped));
  }

  const steps: StepSpec[] = [];
  if (a.compile !== null) {
    steps.push({ program: a.compile.program, args: [...a.compile.args], feed: '', mustPass: true });
  }
  for (const c of cases) {
    steps.push({ program: a.run.program, args: [...a.run.args], feed: c.stdin, mustPass: false });
  }

  const began = Date.now();
  let out;
  try {
    out = await ipc.stdin.run({
      files: [[a.file, spec.source]],
      steps,
      env: a.env.map((e) => [e[0], e[1]] as [string, string]),
      timeoutMs: spec.timeoutMs ?? STDIN_TIMEOUT_MS,
    });
  } catch (e) {
    const why = e instanceof IpcError ? `${e.code}: ${e.message}` : String(e);
    return empty('no-runner', why, cases.map(skipped), Date.now() - began);
  }
  const durationMs = Date.now() - began;

  if (out.spawnFailed !== null) {
    return empty('no-runner', TOOLCHAIN_MISSING[spec.lang], cases.map(skipped), durationMs);
  }

  // ── 컴파일 ──
  const at = a.compile === null ? 0 : 1;
  if (a.compile !== null) {
    const c = out.steps[0];
    if (c === undefined) {
      return empty('no-runner', TOOLCHAIN_MISSING[spec.lang], cases.map(skipped), durationMs);
    }
    if (c.timedOut || c.code !== 0) {
      const log = tailLog(`${c.stderr}\n${c.stdout}`.trim());
      return { ...empty('compile-error', log, cases.map(skipped), durationMs), log };
    }
  }

  // ── 케이스 ──
  const done: CaseOut[] = [];
  const failures: { test: string; message: string }[] = [];
  const notes: string[] = [];
  let passed = 0;
  let timedOut = false;

  for (const [i, c] of cases.entries()) {
    const step = out.steps[at + i];
    if (step === undefined) {
      // 앞 케이스가 상한에 걸려 뒤가 안 돌았다. 안 잰 것을 오답이라고 하지 않는다.
      done.push(skipped(c));
      continue;
    }
    if (step.timedOut) {
      timedOut = true;
      done.push({ ...skipped(c), status: 'timeout', durationMs: step.durationMs });
      failures.push({ test: c.name, message: '상한 안에 끝나지 않았습니다.' });
      continue;
    }
    // 컴파일 걸음이 없는 언어의 문법 오류는 여기서 드러난다 — 첫 케이스에서 코드가
    // 안 돌았고 그 이유를 실행기가 문법이라고 말한 경우다.
    if (a.compile === null && i === 0 && step.code !== 0 && step.stdout.trim() === '' && SYNTAX.test(step.stderr)) {
      const log = tailLog(step.stderr.trim());
      return { ...empty('compile-error', log, cases.map(skipped), durationMs), log };
    }
    const one: CaseOut = {
      name: c.name, stdin: c.stdin, expected: c.stdout, actual: step.stdout,
      stderr: step.stderr, status: 'passed', durationMs: step.durationMs,
    };
    if (step.code !== 0) {
      one.status = 'failed';
      const why = lastLine(step.stderr);
      failures.push({ test: c.name, message: why === '' ? '프로그램이 멈췄습니다.' : `프로그램이 멈췄습니다 — ${why}` });
    } else if (sameOut(c.stdout, step.stdout)) {
      passed += 1;
    } else {
      one.status = 'failed';
      failures.push({ test: c.name, message: outMessage(c.stdout, step.stdout) });
    }
    if (one.status === 'failed') notes.push(`${c.name}: ${failures[failures.length - 1]?.message ?? ''}`);
    done.push(one);
  }

  const log = tailLog(notes.join('\n'));
  const status = timedOut ? 'timeout' : failures.length > 0 ? 'failed' : 'passed';
  return { status, passed, failed: failures.length, failures, log, durationMs, cases: done };
}

/**
 * 표준 입력 러너의 약속 (D186 ⑧).
 *
 * `stdin_run` 을 **진짜 프로세스로** 대신한다 — `sql-runner.test.ts` 가 `better-sqlite3` 로
 * 한 것과 같은 수법이다. 가짜 출력을 돌려주는 대역으로는 이 층의 핵심인 「파이썬이 실제로
 * 이 글자를 찍나」를 한 줄도 못 잰다. 대신 여기 대역은 Rust `run_steps` 와 **같은 계약**을
 * 지킨다: 걸음마다 하나 · `mustPass` 실패와 시간 초과에서 멈춤 · 못 시작하면 `spawnFailed`.
 * Rust 쪽 계약(상한을 못 올린다 · 프로세스 그룹 · 바이트 상한)은
 * `apps/desktop/src-tauri/tests/stdin.rs` 가 따로 증명한다.
 *
 * **자바는 대본이다.** 이 컴퓨터에 JDK 가 없다(`java -version` 이 1 로 끝난다). 그래서
 * `javac`·`java` 만 `SCRIPTED` 로 갈아 끼워 컴파일 실패·통과·예외의 갈래를 밟고, 파이썬과
 * 노드는 진짜로 돌린다.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

interface StepSpec { program: string; args: string[]; feed: string; mustPass: boolean }
interface StdinSpec {
  files: [string, string][];
  steps: StepSpec[];
  env: [string, string][];
  timeoutMs: number;
}
interface StepOut {
  code: number | null; stdout: string; stderr: string;
  truncated: boolean; timedOut: boolean; durationMs: number;
}

/** 프로그램 이름 → 대본. 여기 든 것은 안 띄우고 대본이 답한다. */
const SCRIPTED = new Map<string, (step: StepSpec) => StepOut | null>();

/** 걸음마다의 실측. 왕복 시간 보고가 여기서 나온다. */
export const timings: { program: string; ms: number }[] = [];

const MAX_MS = 5_000;

function stepOut(over: Partial<StepOut>): StepOut {
  return { code: 0, stdout: '', stderr: '', truncated: false, timedOut: false, durationMs: 0, ...over };
}

/** Rust `chickadee_app_lib::stdin::run_steps` 와 같은 계약. */
function runSteps(spec: StdinSpec): unknown {
  const dir = mkdtempSync(join(tmpdir(), 'chickadee-drill-'));
  try {
    for (const [rel, text] of spec.files) writeFileSync(join(dir, rel), text, 'utf8');
    const steps: StepOut[] = [];
    let spawnFailed: number | null = null;
    for (const [i, step] of spec.steps.entries()) {
      const script = SCRIPTED.get(step.program);
      let out: StepOut;
      if (script !== undefined) {
        const said = script(step);
        if (said === null) {
          spawnFailed = i;
          break;
        }
        out = said;
      } else {
        const began = performance.now();
        const r = spawnSync(step.program, step.args, {
          cwd: dir, input: step.feed, encoding: 'utf8',
          timeout: Math.min(spec.timeoutMs, MAX_MS),
          env: { ...process.env, ...Object.fromEntries(spec.env) },
        });
        const ms = Math.round(performance.now() - began);
        if (r.error !== undefined && (r.error as NodeJS.ErrnoException).code === 'ENOENT') {
          spawnFailed = i;
          break;
        }
        out = stepOut({
          code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '',
          timedOut: r.signal !== null, durationMs: ms,
        });
      }
      timings.push({ program: step.program, ms: out.durationMs });
      const halt = out.timedOut || (step.mustPass && out.code !== 0);
      steps.push(out);
      if (halt) break;
    }
    return { steps, spawnFailed };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: { stdin: { run: (spec: StdinSpec) => Promise.resolve(runSteps(spec)) } },
  IpcError: class extends Error {},
}));

const {
  detectStdin, forgetStdinProbes, normalizeOut, outMessage, runStdin, sameOut, lastLine,
} = await import('./stdin-runner.js');

beforeEach(() => {
  forgetStdinProbes();
  SCRIPTED.clear();
});

/** 이 컴퓨터에 없을 수도 있는 것은 건너뛴다 — 그 사실 자체가 러너가 답할 수 있는 값이다. */
const has = (program: string, args: string[]): boolean =>
  spawnSync(program, args, { encoding: 'utf8' }).status === 0;
const HAS_PY = has('python3', ['--version']);
const HAS_NODE = has('node', ['--version']);

describe('나온 글을 견주는 규칙 — 봐주는 것은 둘뿐', () => {
  it('줄 끝 공백과 마지막 빈 줄은 봐준다', () => {
    expect(sameOut('3\n', '3')).toBe(true);
    expect(sameOut('3\n', '3\n\n\n')).toBe(true);
    expect(sameOut('3 \n', '3\n')).toBe(true);
    expect(sameOut('3\r\n', '3\n')).toBe(true);
  });

  it('줄 사이의 빈 줄과 줄 안의 공백은 안 봐준다', () => {
    expect(sameOut('3\n1\n', '3\n\n1\n')).toBe(false);
    expect(sameOut('3 1\n', '31\n')).toBe(false);
    expect(sameOut('3\n1\n', '1\n3\n')).toBe(false);
  });

  it('빈 출력과 개행 하나는 같다 — 아무것도 안 찍는 것이 정답인 케이스가 있다', () => {
    expect(normalizeOut('\n')).toBe('');
    expect(sameOut('', '\n')).toBe(true);
  });

  it('무엇을 기대했고 무엇이 나왔는지 한 줄로 말한다', () => {
    expect(outMessage('7\n', '')).toContain('아무것도 안 나왔습니다');
    expect(outMessage('7\n', '8\n')).toContain('"8"');
  });

  it('오류 글의 마지막 뜻있는 줄을 뽑는다 — 파이썬도 자바도 이유를 끝에 적는다', () => {
    expect(lastLine('Traceback…\n  line 2\nNameError: name is not defined\n'))
      .toBe('NameError: name is not defined');
    expect(lastLine('')).toBe('');
  });
});

describe.runIf(HAS_PY)('파이썬 — 진짜로 돈다', () => {
  const CASES = [
    { name: '1번', stdin: '3 4\n', stdout: '7\n' },
    { name: '2번', stdin: '-7 2\n', stdout: '-5\n' },
    { name: '3번', stdin: '0 0\n', stdout: '0\n' },
  ];
  const GOOD = 'import sys\na, b = sys.stdin.read().split()\nprint(int(a) + int(b))\n';

  it('탐지가 켜지고 버전을 들고 온다', async () => {
    const probe = await detectStdin('py');
    expect(probe.ok).toBe(true);
    expect(probe.tool).toMatch(/Python/u);
  });

  it('케이스 셋을 다 통과한다', async () => {
    const r = await runStdin({ lang: 'py', source: GOOD, cases: CASES });
    expect(r.status).toBe('passed');
    expect(r.passed).toBe(3);
    expect(r.cases.map((c) => c.status)).toEqual(['passed', 'passed', 'passed']);
  });

  it('케이스 하나가 다르면 그 케이스만 틀린다 — 나머지는 계속 돈다', async () => {
    // 음수를 못 읽는 답: 앞의 `-` 를 떼고 더한다.
    const bad = 'import sys\na, b = sys.stdin.read().split()\nprint(abs(int(a)) + int(b))\n';
    const r = await runStdin({ lang: 'py', source: bad, cases: CASES });
    expect(r.status).toBe('failed');
    expect(r.cases.map((c) => c.status)).toEqual(['passed', 'failed', 'passed']);
    expect(r.failures[0]?.message).toContain('"9"');
  });

  it('문법 오류는 오답이 아니라 compile-error 다 — 케이스가 하나도 안 돈다', async () => {
    const r = await runStdin({ lang: 'py', source: 'print(1\n', cases: CASES });
    expect(r.status).toBe('compile-error');
    expect(r.log).toMatch(/SyntaxError/u);
    expect(r.cases.every((c) => c.status === 'skipped')).toBe(true);
  });

  it('돌다가 멈추면 그 케이스가 실패하고 이유가 실린다', async () => {
    const r = await runStdin({ lang: 'py', source: 'import sys\nprint(nope)\n', cases: CASES });
    expect(r.status).toBe('failed');
    expect(r.failures[0]?.message).toContain('NameError');
  });

  it('안 끝나면 상한에서 끊기고 뒤 케이스는 안 돈다', async () => {
    const r = await runStdin({
      lang: 'py',
      source: 'while True:\n    pass\n',
      cases: CASES,
      timeoutMs: 400,
    });
    expect(r.status).toBe('timeout');
    expect(r.cases[0]?.status).toBe('timeout');
    expect(r.cases[1]?.status).toBe('skipped');
  }, 20_000);
});

describe.runIf(HAS_NODE)('타입스크립트 — node 가 타입을 벗기고 돈다', () => {
  const CASES = [
    { name: '1번', stdin: '3 4\n', stdout: '7\n' },
    { name: '2번', stdin: '-7 2\n', stdout: '-5\n' },
    { name: '3번', stdin: '10 -3\n', stdout: '7\n' },
  ];
  const GOOD = [
    "import { readFileSync } from 'node:fs';",
    "const data: string = readFileSync(0, 'utf8');",
    'const [a, b] = data.split(/\\s+/).filter(Boolean).map(Number);',
    'console.log((a ?? 0) + (b ?? 0));',
    '',
  ].join('\n');

  it('탐지가 켜진다', async () => {
    expect((await detectStdin('ts')).ok).toBe(true);
  });

  it('타입 표기가 있어도 그대로 돈다 — 이 층에 tsc 가 없는 근거다', async () => {
    const r = await runStdin({ lang: 'ts', source: GOOD, cases: CASES });
    expect(r.status).toBe('passed');
    expect(r.passed).toBe(3);
  });

  it('문법 오류는 compile-error 다 — 컴파일 걸음이 없어도 갈린다', async () => {
    const r = await runStdin({ lang: 'ts', source: 'const a: number = ;\n', cases: CASES });
    expect(r.status).toBe('compile-error');
    expect(r.cases.every((c) => c.status === 'skipped')).toBe(true);
  });

  it('node 가 못 받는 타입 문법도 compile-error 다', async () => {
    const r = await runStdin({ lang: 'ts', source: 'enum E { A }\nconsole.log(E.A);\n', cases: CASES });
    expect(r.status).toBe('compile-error');
  });
});

describe('자바 — 대본 (이 컴퓨터에 JDK 가 없다)', () => {
  const CASES = [
    { name: '1번', stdin: '3 4\n', stdout: '7\n' },
    { name: '2번', stdin: '10 -3\n', stdout: '7\n' },
  ];
  const SRC = 'public class Main { }';

  /** JDK 가 있는 컴퓨터 — 탐지 둘이 0 으로 끝난다. */
  function jdkPresent(compile: number, run: (feed: string) => StepOut): void {
    SCRIPTED.set('javac', (step) =>
      step.args[0] === '-version'
        ? stepOut({ stderr: 'javac 21.0.4\n' })
        : stepOut({ code: compile, stderr: compile === 0 ? '' : 'Main.java:1: error: \';\' expected\n' }));
    SCRIPTED.set('java', (step) =>
      step.args[0] === '-version' ? stepOut({ stderr: 'openjdk version "21.0.4"\n' }) : run(step.feed));
  }

  it('JDK 가 없으면 no-runner 이고 어느 언어인지 말한다', async () => {
    SCRIPTED.set('javac', () => null);
    SCRIPTED.set('java', () => null);
    const r = await runStdin({ lang: 'java', source: SRC, cases: CASES });
    expect(r.status).toBe('no-runner');
    expect(r.reason).toBe('toolchain-missing:java');
    expect(r.cases.every((c) => c.status === 'skipped')).toBe(true);
  });

  it('맥의 빈 껍데기 javac 도 걸린다 — 있는데 0 으로 안 끝난다', async () => {
    SCRIPTED.set('javac', () => stepOut({ code: 1, stderr: 'Unable to locate a Java Runtime.\n' }));
    SCRIPTED.set('java', () => stepOut({ code: 1, stderr: 'Unable to locate a Java Runtime.\n' }));
    const r = await runStdin({ lang: 'java', source: SRC, cases: CASES });
    expect(r.reason).toBe('toolchain-missing:java');
  });

  it('컴파일이 실패하면 케이스가 하나도 안 돈다', async () => {
    jdkPresent(1, () => stepOut({ stdout: '7\n' }));
    const r = await runStdin({ lang: 'java', source: SRC, cases: CASES });
    expect(r.status).toBe('compile-error');
    expect(r.log).toContain('error');
  });

  it('컴파일은 한 번이고 케이스마다 실행이 한 번이다', async () => {
    const feeds: string[] = [];
    jdkPresent(0, (feed) => {
      feeds.push(feed);
      return stepOut({ stdout: '7\n' });
    });
    const r = await runStdin({ lang: 'java', source: SRC, cases: CASES });
    expect(r.status).toBe('passed');
    expect(feeds).toEqual(['3 4\n', '10 -3\n']);
  });
});

describe('케이스가 없으면 아무것도 안 띄운다', () => {
  it('빈 케이스는 no-runner 다 — 잰 것이 없으므로 오답도 아니다', async () => {
    const r = await runStdin({ lang: 'py', source: 'print(1)\n', cases: [] });
    expect(r.status).toBe('no-runner');
    expect(r.cases).toEqual([]);
  });
});

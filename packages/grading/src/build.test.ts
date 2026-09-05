/**
 * `build` 형식의 채점 (D187 ① · `fundamentals.md` §2).
 *
 * 이 형식이 유보였던 이유가 「인정 집합은 반드시 불완전하다」였으므로, 이 시험이 실제로
 * 증명해야 하는 것은 **인정 집합이 없다**는 것이다 — 같은 값을 내는 서로 다른 식이 전부
 * 통과해야 한다. 그래서 파이썬과 노드를 **진짜로** 돌린다 (`stdin-runner.test.ts` 와 같은 대역).
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

interface StepSpec { program: string; args: string[]; feed: string; mustPass: boolean }
interface StdinSpec { files: [string, string][]; steps: StepSpec[]; env: [string, string][]; timeoutMs: number }

function runSteps(spec: StdinSpec): unknown {
  const dir = mkdtempSync(join(tmpdir(), 'chickadee-build-'));
  try {
    for (const [rel, text] of spec.files) writeFileSync(join(dir, rel), text, 'utf8');
    const steps: unknown[] = [];
    for (const [i, step] of spec.steps.entries()) {
      const r = spawnSync(step.program, step.args, {
        cwd: dir, input: step.feed, encoding: 'utf8',
        timeout: Math.min(spec.timeoutMs, 5_000),
        env: { ...process.env, ...Object.fromEntries(spec.env) },
      });
      if (r.error !== undefined && (r.error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { steps, spawnFailed: i };
      }
      const out = {
        code: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '',
        truncated: false, timedOut: r.signal !== null, durationMs: 0,
      };
      steps.push(out);
      if (out.timedOut || (step.mustPass && out.code !== 0)) break;
    }
    return { steps, spawnFailed: null };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: { stdin: { run: (spec: StdinSpec) => Promise.resolve(runSteps(spec)) } },
  IpcError: class extends Error {},
}));

const { checkExpr, gradeBuild, usesToken, wrapExpr } = await import('./build.js');
const { forgetStdinProbes } = await import('./stdin-runner.js');

beforeEach(() => {
  forgetStdinProbes();
});

const HAS_PY = spawnSync('python3', ['--version'], { encoding: 'utf8' }).status === 0;
const HAS_NODE = spawnSync('node', ['--version'], { encoding: 'utf8' }).status === 0;

const PY = { lang: 'py' as const, spell: { yes: 'True', no: 'False' } };
const TS = { lang: 'ts' as const, spell: { yes: 'true', no: 'false' } };
const half = { ...PY, expected: { t: 'float' as const, v: '3.5' }, must: ['7', '2'] };

describe('토막이 낱말로 들어 있나', () => {
  it('`7` 이 `27` 이나 `x7` 에 걸리지 않는다', () => {
    expect(usesToken('27 / 2', '7')).toBe(false);
    expect(usesToken('x7 + 1', '7')).toBe(false);
    expect(usesToken('7 / 2.0', '7')).toBe(true);
    expect(usesToken('(7) / 2', '7')).toBe(true);
  });

  it('소수 토막도 통째로 본다', () => {
    expect(usesToken('0.15 + 0.2', '0.1')).toBe(false);
    expect(usesToken('0.1 + 0.2', '0.1')).toBe(true);
  });
});

describe('실행 앞의 문 셋 — 순수하다', () => {
  it('빈칸', () => {
    expect(checkExpr(half, '   ')?.miss).toBe('blank');
  });

  it('값을 그대로 적으면 막는다 — 실행하면 통과해 버리는 자리다', () => {
    for (const literal of ['3.5', '  3.5  ', '3', '-7', '0x10', "'ab'", 'True']) {
      expect(checkExpr(half, literal)?.miss, literal).toBe('literal');
    }
  });

  it('주어진 수를 안 쓰면 막고 무엇이 빠졌는지 말한다', () => {
    const gate = checkExpr(half, '14 / 4.0');
    expect(gate?.miss).toBe('missing-token');
    expect(gate?.missing).toEqual(['7', '2']);
  });

  it('식이면 통과시킨다 — 여기서 모양을 더 안 따진다', () => {
    expect(checkExpr(half, '7 / 2.0')).toBeNull();
    expect(checkExpr(half, 'float(7) / 2')).toBeNull();
  });
});

describe('식을 프로그램으로 감싼다', () => {
  it('언어마다 찍는 자리가 다르다', () => {
    expect(wrapExpr('py', '7 / 2')).toBe('print(7 / 2)\n');
    expect(wrapExpr('ts', '7 / 2')).toBe('console.log(7 / 2);\n');
    expect(wrapExpr('java', '7 / 2.0')).toContain('System.out.println(7 / 2.0);');
  });
});

describe.runIf(HAS_PY)('파이썬 — 인정 집합이 없다', () => {
  it('같은 값을 내는 서로 다른 식이 전부 통과한다', async () => {
    for (const expr of ['7 / 2', '7 / 2.0', 'float(7) / 2', '7 * 1.0 / 2']) {
      const v = await gradeBuild(half, expr);
      expect(v.ok, expr).toBe(true);
      expect(v.printed, expr).toBe('3.5');
    }
  }, 20_000);

  it('버림 몫은 다른 답이다 — 종류가 아니라 값이 다르다', async () => {
    const v = await gradeBuild(half, '7 // 2');
    expect(v.ok).toBe(false);
    expect(v.miss).toBe('value');
    expect(v.printed).toBe('3');
  });

  it('실수는 비트로 견준다 — `0.3` 은 안 통과하고 긴 쪽이 통과한다', async () => {
    const item = { ...PY, expected: { t: 'float' as const, v: '0.30000000000000004' }, must: ['0.1', '0.2'] };
    const ok = await gradeBuild(item, '0.1 + 0.2');
    expect(ok.ok).toBe(true);
    const no = await gradeBuild(item, '0.1 + 0.2 - 0.00000000000000004');
    expect(no.ok).toBe(false);
  }, 20_000);

  it('참·거짓은 그 언어의 표기 하나만 정답이다', async () => {
    const item = { ...PY, expected: { t: 'bool' as const, v: true }, must: ['7', '2'] };
    const v = await gradeBuild(item, '7 % 2 == 1');
    expect(v.ok).toBe(true);
    expect(v.printed).toBe('True');
  });

  it('문법이 아니면 compile-error 이고 값이 틀린 것과 갈린다', async () => {
    const v = await gradeBuild(half, '7 / / 2');
    expect(v.miss).toBe('compile-error');
    expect(v.printed).toBeNull();
  });

  it('식이 값을 안 내고 사건을 내면 `crashed` 다', async () => {
    const v = await gradeBuild({ ...half, must: ['7', '2'] }, '7 / (2 - 2)');
    expect(v.miss).toBe('crashed');
    expect(v.log).toContain('ZeroDivisionError');
  });

  it('넘침 없는 언어에서는 32비트 너머가 그냥 나온다', async () => {
    const item = {
      ...PY, expected: { t: 'int' as const, v: '2147483648' }, must: ['2147483647', '1'],
    };
    const v = await gradeBuild(item, '2147483647 + 1');
    expect(v.ok).toBe(true);
  });
});

describe.runIf(HAS_NODE)('타입스크립트', () => {
  it('실수 나눗셈이 기본이라 `7 / 2` 가 그대로 3.5 다', async () => {
    const v = await gradeBuild({ ...TS, expected: { t: 'float', v: '3.5' }, must: ['7', '2'] }, '7 / 2');
    expect(v.ok).toBe(true);
  });

  it('버림 몫은 손으로 만들어야 한다 — 0부가 가르친 그 차이다', async () => {
    const item = { ...TS, expected: { t: 'int' as const, v: '3' }, must: ['7', '2'] };
    expect((await gradeBuild(item, '7 / 2')).ok).toBe(false);
    expect((await gradeBuild(item, 'Math.trunc(7 / 2)')).ok).toBe(true);
  }, 20_000);

  it('내림 나머지는 고쳐 써야 맞는다', async () => {
    const item = { ...TS, expected: { t: 'int' as const, v: '1' }, must: ['7', '2'] };
    expect((await gradeBuild(item, '-7 % 2')).ok).toBe(false);
    expect((await gradeBuild(item, '((-7 % 2) + 2) % 2')).ok).toBe(true);
  }, 20_000);
});

describe('러너가 없으면 오답이 아니다', () => {
  it('툴체인이 없으면 사유만 실리고 miss 가 없다', async () => {
    const v = await gradeBuild({ ...PY, lang: 'java', expected: { t: 'int', v: '3' }, must: ['7', '2'] }, '7 / 2');
    // 이 저장소에는 JDK 가 없다. 있으면 통과하고, 없으면 게이트 밖이다 — 둘 다 오답은 아니다.
    if (v.reason !== null) {
      expect(v.reason).toBe('toolchain-missing:java');
      expect(v.miss).toBeNull();
    } else {
      expect(v.ok).toBe(true);
    }
  }, 20_000);
});

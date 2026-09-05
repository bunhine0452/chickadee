/**
 * 실행 러너의 약속 (D175 · 정본 §5). **JDK 가 없는 기계에서도 전부 돈다** — 여기서
 * `t3_run` 은 가짜이고, 진짜 프로세스가 지키는 것(원본 불변 · 타임아웃 · 출력 상한)은
 * Rust 쪽 `apps/desktop/src-tauri/tests/proc.rs` 가 따로 증명한다.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Spec = {
  rootPath: string;
  workId: string;
  needs: string[];
  keep: string[];
  files: [string, string][];
  program: string;
  args: string[];
  timeoutMs: number;
};

/** 리포에 있는 파일 (경로 → 첫 줄들). 없는 경로는 `readLines` 가 던진다. */
let onDisk: Record<string, string[]> = {};
/** `t3_run` 이 받은 것과 돌려줄 것. */
let seen: Spec[] = [];
let reply: (spec: Spec) => {
  code: number | null;
  stdout: string;
  stderr: string;
  workDir: string;
  missing: string[];
  truncated: boolean;
  timedOut: boolean;
  durationMs: number;
};

class FakeIpcError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    file: {
      readLines: ({ relPath }: { relPath: string }) => {
        const lines = onDisk[relPath];
        if (!lines) return Promise.reject(new FakeIpcError('FS_NOT_FOUND'));
        return Promise.resolve({ lines });
      },
    },
    t3: {
      run: (spec: Spec) => {
        seen.push(spec);
        try {
          return Promise.resolve(reply(spec));
        } catch (e) {
          return Promise.reject(e as Error);
        }
      },
    },
  },
  IpcError: FakeIpcError,
}));

const {
  cannotHost, detectRunner, distPath, forgetRunners, gradleVersion, jdkVersion, plainLog, readMarks,
  runTests, sawDownload, tailLog, runners,
} = await import('./index.js');

const out = (over: Partial<ReturnType<typeof reply>> = {}) => ({
  code: 0, stdout: '', stderr: '', workDir: '/w', missing: [], truncated: false, timedOut: false,
  durationMs: 12, ...over,
});

const mark = (result: string, cls: string, name: string, msg = '') =>
  `##CHICKADEE##|${result}|${cls}|${name}|${msg}`;

const spec = (over: Partial<Parameters<typeof runTests>[0]> = {}) => ({
  repoId: 1, lang: 'java' as const, files: [], tests: [], timeoutMs: 60_000, ...over,
});

const GRADLE_REPO = {
  gradlew: ['#!/bin/sh'],
  'gradle/wrapper/gradle-wrapper.properties': [
    'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip',
  ],
};

beforeEach(() => {
  onDisk = { ...GRADLE_REPO };
  seen = [];
  reply = () => out({ stderr: 'openjdk version "21.0.4" 2024-07-16' });
  forgetRunners();
});

describe('탐지 — 없으면 그 단을 게이트에서 뺀다', () => {
  it('래퍼와 JDK 가 다 있으면 켜고 버전을 읽는다', async () => {
    const probe = await detectRunner(1, '/repo');
    expect(probe).toEqual({ ok: true, jdk: '21.0.4', gradle: '8.7' });
  });

  it('Gradle 래퍼가 없으면 `java` 를 아예 부르지 않는다', async () => {
    onDisk = {};
    const probe = await detectRunner(1, '/repo');
    expect(probe).toEqual({ ok: false, reason: 'no-gradle-wrapper' });
    expect(seen).toEqual([]);
  });

  it('JDK 가 없는 기계 — 맥의 빈 껍데기는 버전 줄을 못 낸다', async () => {
    reply = () => out({ code: 1, stderr: 'Unable to locate a Java Runtime.' });
    const probe = await detectRunner(1, '/repo');
    expect(probe).toEqual({ ok: false, reason: 'no-jdk', gradle: '8.7' });
  });

  it('`java` 라는 프로그램조차 없으면 그것도 사실이지 사고가 아니다', async () => {
    reply = () => {
      throw new FakeIpcError('RUN_SPAWN');
    };
    const probe = await detectRunner(1, '/repo');
    expect(probe.ok).toBe(false);
    expect(probe.reason).toBe('no-jdk');
  });

  it('탐지는 복사도 안 하고 리포도 안 본다 — 빈 작업본에서 `java -version` 하나', async () => {
    await detectRunner(1, '/repo');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ rootPath: '', program: 'java', args: ['-version'], files: [] });
  });
});

describe('실행', () => {
  it('탐지 전에는 no-runner 다 — 오류가 아니다', async () => {
    const r = await runTests(spec());
    expect(r.status).toBe('no-runner');
    expect(seen).toEqual([]);
  });

  it('탐지에 실패한 리포도 no-runner 다', async () => {
    onDisk = {};
    await detectRunner(1, '/repo');
    expect((await runTests(spec())).status).toBe('no-runner');
  });

  it('전부 통과하면 passed 이고 개수를 센다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({
      stdout: [mark('SUCCESS', 'x.AuthTest', 'logs_in'), mark('SUCCESS', 'x.AuthTest', 'rejects')].join('\n'),
      durationMs: 4200,
    });
    const r = await runTests(spec());
    expect(r).toMatchObject({ status: 'passed', passed: 2, failed: 0, failures: [], durationMs: 4200 });
  });

  it('실패한 테스트는 이름과 메시지를 그대로 낸다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({
      stdout: [
        mark('SUCCESS', 'x.AuthTest', 'logs_in'),
        mark('FAILURE', 'x.AuthTest', 'rejects', 'java.lang.AssertionError: expected 401 but was 200'),
      ].join('\n'),
    });
    const r = await runTests(spec());
    expect(r.status).toBe('failed');
    expect(r.passed).toBe(1);
    expect(r.failures).toEqual([
      { test: 'x.AuthTest.rejects', message: 'java.lang.AssertionError: expected 401 but was 200' },
    ]);
  });

  it('한 줄도 안 나오면 「실패」가 아니라 「못 쟀다」다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({ code: 1, stderr: 'error: cannot find symbol' });
    const r = await runTests(spec());
    expect(r.status).toBe('error');
    expect(r.log).toContain('cannot find symbol');
  });

  it('시간이 넘으면 timeout 이고 그때까지 센 것은 남는다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({ code: null, timedOut: true, stdout: mark('SUCCESS', 'x.T', 'a') });
    const r = await runTests(spec());
    expect(r.status).toBe('timeout');
    expect(r.passed).toBe(1);
  });

  it('답안·테스트·초기화 스크립트가 작업본으로 함께 간다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({ stdout: mark('SUCCESS', 'x.T', 'a') });
    await runTests(spec({
      files: [{ path: 'src/main/java/A.java', text: 'class A {}' }],
      tests: [{ path: 'src/test/java/ATest.java', text: 'class ATest {}' }],
    }));
    const sent = seen[1];
    expect(sent?.files.map(([p]) => p)).toEqual([
      'src/main/java/A.java', 'src/test/java/ATest.java', 'chickadee-run.gradle',
    ]);
    expect(sent?.rootPath).toBe('/repo');
    expect(sent?.workId).toBe('repo-1');
    expect(sent?.program).toBe('./gradlew');
    // 리포가 자기 래퍼를 `.gitignore` 에 넣어 두어도 작업본에는 와야 한다 (실측).
    expect(sent?.keep).toContain('gradlew');
    expect(sent?.keep).toContain('gradle/wrapper/gradle-wrapper.jar');
  });

  it('네트워크를 끄는 인자가 붙는다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({ stdout: mark('SUCCESS', 'x.T', 'a') });
    await runTests(spec());
    const args = seen[1]?.args ?? [];
    expect(args).toContain('--offline');
    expect(args).toContain('--no-daemon');
    expect(args).toContain('-Dorg.gradle.java.installations.auto-download=false');
    expect(args[args.length - 1]).toBe('test');
  });

  it('타임아웃은 부르는 쪽이 정한 값 그대로 내려간다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({ stdout: mark('SUCCESS', 'x.T', 'a') });
    await runTests(spec({ timeoutMs: 90_000 }));
    expect(seen[1]?.timeoutMs).toBe(90_000);
  });

  it('IPC 가 던지면 error 로 접어서 낸다 — 화면이 죽지 않는다', async () => {
    await detectRunner(1, '/repo');
    reply = () => {
      throw new FakeIpcError('RUN_IO');
    };
    const r = await runTests(spec());
    expect(r.status).toBe('error');
    expect(r.log).toContain('RUN_IO');
  });
});

describe('배포본 내려받기 — 묻기 전에는 안 받는다 (사용자 결정)', () => {
  it('허락이 없으면 배포본 자리를 조건으로 걸고, 없으면 아무것도 안 돌린다', async () => {
    await detectRunner(1, '/repo');
    reply = (s) => out({ missing: s.needs });
    const r = await runTests(spec());
    expect(seen[1]?.needs).toEqual(['.gradle/wrapper/dists/gradle-8.7-bin']);
    // 게이트 밖으로 나갈 뿐 오답이 아니다.
    expect(r.status).toBe('no-runner');
    expect(r.askDownload).toEqual({ name: 'Gradle 8.7' });
  });

  it('허락하면 조건을 걸지 않는다 — 그때만 받는다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({ stdout: mark('SUCCESS', 'x.T', 'a') });
    const r = await runTests(spec({ allowDownload: true }));
    expect(seen[1]?.needs).toEqual([]);
    expect(r.status).toBe('passed');
  });

  it('테스트 실행 자체는 허락과 무관하게 오프라인이다', async () => {
    await detectRunner(1, '/repo');
    reply = () => out({ stdout: mark('SUCCESS', 'x.T', 'a') });
    await runTests(spec({ allowDownload: true }));
    expect(seen[1]?.args).toContain('--offline');
  });

  it('배포본 자리는 버전에서 나온다', () => {
    expect(distPath('8.7')).toBe('.gradle/wrapper/dists/gradle-8.7-bin');
  });

  it('못 받쳐 주는 사정만 no-runner 로 센다 — 컴파일 오류는 아니다', () => {
    expect(cannotHost('No cached version of x available for offline mode')).toBe(true);
    expect(cannotHost('Unable to locate a Java Runtime.')).toBe(true);
    expect(cannotHost('error: cannot find symbol')).toBe(false);
  });
});

describe('출력 읽기', () => {
  it('표시줄만 세고 나머지는 사람이 읽을 로그로 남긴다', () => {
    const text = ['> Task :test', mark('SUCCESS', 'x.T', 'a'), 'BUILD SUCCESSFUL'].join('\n');
    expect(readMarks(text)).toEqual([{ result: 'SUCCESS', test: 'x.T.a', message: '' }]);
    expect(plainLog(text)).toBe('> Task :test\nBUILD SUCCESSFUL');
  });

  it('메시지 안의 `|` 는 잘리지 않는다', () => {
    const [line] = readMarks(mark('FAILURE', 'x.T', 'a', 'expected a|b but was c'));
    expect(line?.message).toBe('expected a|b but was c');
  });

  it('로그는 뒤를 남기고 앞을 자른다 — 실패 원인은 끝에 있다', () => {
    const cut = tailLog(`${'x'.repeat(50)}END`, 10);
    expect(cut.endsWith('END')).toBe(true);
    expect(cut.startsWith('…')).toBe(true);
  });

  it('버전 문자열을 읽는다', () => {
    expect(gradleVersion('distributionUrl=…/gradle-8.7-bin.zip')).toBe('8.7');
    expect(gradleVersion('distributionUrl=…/gradle-8.10.2-all.zip')).toBe('8.10.2');
    expect(gradleVersion('distributionUrl=…/none.zip')).toBeUndefined();
    expect(jdkVersion('openjdk version "21.0.4" 2024-07-16')).toBe('21.0.4');
    expect(jdkVersion('Unable to locate a Java Runtime.')).toBeUndefined();
  });

  it('배포본을 내려받았으면 그 흔적을 읽는다 — 닫지 못한 구멍 하나', () => {
    expect(sawDownload('Downloading https://services.gradle.org/distributions/gradle-8.7-bin.zip')).toBe(true);
    expect(sawDownload('BUILD SUCCESSFUL')).toBe(false);
  });
});

describe('어댑터 등록', () => {
  it('자바 하나가 서 있다 — MVP 의 빈 배열을 대신한다', () => {
    expect(runners.map((r) => r.id)).toEqual(['java']);
  });
});

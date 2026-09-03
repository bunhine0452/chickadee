/**
 * 데스크톱 E2E — `tauri-driver` + WebdriverIO + xvfb (06 §1.1 · §1.5).
 *
 * **리눅스에서만 돈다.** macOS WKWebView 에는 WebDriver 가 없고 Windows 는 릴리스 스모크로
 * 대체한다(D13). 그래서 이 설정은 개발기(macOS)에서 **문법과 타입만** 서고, 실제 구동은
 * CI 의 `e2e-linux` 잡이 처음이다.
 *
 * 한 스펙 파일 = 한 세션이다. 스펙마다 `beforeSession` 이 격리 트리를 지우고 그 시나리오가
 * 요구하는 상태(첫 실행 / 리포 하나 등록됨)로 다시 세운다 — 앞 시나리오가 남긴 DB 위에서
 * 다음 시나리오가 도는 것을 막는다.
 *
 * 재시도는 1 회다 (06 §1.9-3 — E2E·시각 회귀만, 단위·통합·게이트는 0).
 */
import { spawn, spawnSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';

import {
  isolatedEnv, isolatedRoot, repoRoot, resetIsolated, seedAppDb, socketsJson,
} from './helpers/env.js';

const ROOT = repoRoot();

/** `pnpm tauri build --debug` 의 산출물. 릴리스로 재려면 `CHICKADEE_E2E_BIN` 으로 준다. */
function binary(): string {
  const given = process.env['CHICKADEE_E2E_BIN'];
  if (given) return given;
  for (const profile of ['debug', 'release']) {
    const at = join(ROOT, 'target', profile, 'chickadee-app');
    if (existsSync(at)) return at;
  }
  return join(ROOT, 'target', 'debug', 'chickadee-app');
}

/** 스펙 파일 하나가 어떤 앱 상태를 요구하나. */
function needsSeed(specPath: string): boolean {
  // E1~E3 은 「첫 실행」과 「리포 등록」이 대상이라 빈 앱이어야 한다.
  return !/[/\\]e[123]-/.test(specPath);
}

let driver: ChildProcess | null = null;
const say = (line: string): void => void process.stdout.write(`${line}\n`);

export const config = {
  runner: 'local' as const,
  hostname: '127.0.0.1',
  port: 4444,

  // 번호 순서를 고정한다 — 06 §1.5 의 표가 곧 실행 순서다.
  specs: [
    './specs/e1-first-run.e2e.ts',
    './specs/e2-add-repo.e2e.ts',
    './specs/e3-ingest.e2e.ts',
    './specs/e4-home.e2e.ts',
    './specs/e5-session.e2e.ts',
    './specs/e6-escape.e2e.ts',
    './specs/e7-night.e2e.ts',
    './specs/e8-settings.e2e.ts',
  ],

  maxInstances: 1,
  capabilities: [{ 'tauri:options': { application: binary() } }],

  logLevel: 'warn' as const,
  bail: 0,
  waitforTimeout: 20_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 3,

  // 06 §1.9-3. 스펙 **파일** 단위 재시도다 — 앱을 다시 띄우는 것이 곧 재시도다.
  specFileRetries: 1,
  specFileRetriesDelay: 2,

  framework: 'mocha' as const,
  reporters: ['spec' as const],
  mochaOpts: {
    ui: 'bdd' as const,
    // WebKitGTK 는 xvfb 소프트웨어 렌더에서 첫 페인트가 느리다. 8분 예산(06 §5.1) 안이다.
    timeout: 120_000,
  },

  /**
   * 세션이 서기 전에 하는 일. **환경을 여기서 세운다** — `tauri-driver` 가 상속해야
   * 앱의 `app_data_dir()` 이 격리 트리로 간다. 워커에서 세우면 늦다.
   */
  onPrepare(): void {
    if (process.platform !== 'linux') {
      throw new Error(
        `E2E 는 리눅스에서만 돈다 (06 §1.1 · D13). 지금은 ${process.platform} 다.\n` +
        'macOS WKWebView 에는 WebDriver 가 없다 — 여기서는 타입·설정만 확인할 수 있다.',
      );
    }
    const bin = binary();
    if (!existsSync(bin)) {
      throw new Error(`앱 바이너리가 없다: ${bin} — 먼저 \`pnpm tauri build --debug\``);
    }

    mkdirSync(join(ROOT, 'test-results'), { recursive: true });
    resetIsolated();
    for (const [key, value] of Object.entries(isolatedEnv())) process.env[key] = value;
    say(`e2e: 격리 트리 ${isolatedRoot()}`);

    // E1 의 소켓 측정. 드라이버를 띄우기 **전에** 한 번, 세션 밖에서 돈다(스크립트 머리 참고).
    const probe = spawnSync(
      'bash',
      [join(ROOT, 'tests/e2e/scripts/first-run-sockets.sh'), bin, socketsJson(),
        process.env['CHICKADEE_E2E_SOCKET_SECONDS'] ?? '12'],
      { stdio: 'inherit', env: process.env },
    );
    if (probe.status !== 0) say('e2e: 소켓 측정 스크립트가 0 이 아닌 값으로 끝났다 — E1 이 판정한다');

    // 측정이 남긴 첫 실행 DB 를 치우고 세션용으로 다시 첫 실행 상태를 만든다.
    resetIsolated();

    driver = spawn('tauri-driver', ['--port', '4444'], {
      stdio: [null, 'inherit', 'inherit'],
      env: process.env,
    });
    driver.on('error', (e) => {
      say(`e2e: tauri-driver 를 띄우지 못했다 — ${e.message} (cargo install tauri-driver --locked)`);
    });
  },

  /** 스펙 파일마다 앱 상태를 새로 만든다. */
  beforeSession(_config: unknown, _caps: unknown, specs: string[]): void {
    resetIsolated();
    const spec = specs[0] ?? '';
    if (needsSeed(spec)) {
      seedAppDb((path) => new Database(path));
      say(`e2e: ${spec.split('/').at(-1) ?? spec} — 리포 하나가 등록된 DB 를 깔았다`);
    } else {
      say(`e2e: ${spec.split('/').at(-1) ?? spec} — 첫 실행 상태`);
    }
  },

  onComplete(): void {
    driver?.kill();
    driver = null;
  },
};

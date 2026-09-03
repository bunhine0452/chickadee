/**
 * E2E 가 앱을 가두는 자리 (06 §1.5 · §3.1).
 *
 * 「전부 지우기 후 파일 부재」(E8)를 개발자의 진짜 `~/.local/share` 에서 확인할 수는 없다 —
 * 지워야 하는 것이 사용자의 실제 학습 DB 이기 때문이다. 그래서 앱을 **격리된 XDG 트리**로
 * 띄운다. 리눅스에서 Tauri 의 `app_data_dir()` 은 `dirs::data_dir()/identifier` 이고
 * `dirs::data_dir()` 은 `$XDG_DATA_HOME`(없으면 `$HOME/.local/share`)을 읽는다.
 *
 * 그 격리가 **실제로 먹었는지**는 추측하지 않는다 — 앱이 `app_paths` 로 스스로 말하는
 * `dataDir` 을 스펙이 받아서 이 트리 아래인지 확인한다(`assertIsolated`). 격리가 안 먹으면
 * E8 은 「파일이 없다」를 통과시키는 대신 그 자리에서 죽어야 한다.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

/** Tauri `identifier` (`tauri.conf.json`). `app_data_dir` 의 마지막 칸이다. */
export const APP_ID = 'dev.chickadee.app';

/** 리포 루트 — `pnpm-workspace.yaml` 이 있는 곳. `process.cwd()` 를 믿지 않는다. */
export function repoRoot(): string {
  let at = resolve(process.cwd());
  for (;;) {
    if (existsSync(join(at, 'pnpm-workspace.yaml'))) return at;
    const up = dirname(at);
    if (up === at) throw new Error('pnpm-workspace.yaml 을 못 찾았다 — 리포 안에서 돌려라.');
    at = up;
  }
}

/** 격리 트리의 뿌리. 생성물이라 `test-results/` 아래 둔다. */
export const isolatedRoot = (): string => join(repoRoot(), 'test-results', 'e2e');

/**
 * E1 의 소켓 측정 결과가 놓이는 자리. **격리 트리 밖**이다 — 스펙 파일마다 트리를 통째로
 * 지우므로 안에 두면 E1 스펙이 자기 측정을 읽기 전에 사라진다.
 */
export const socketsJson = (): string => join(repoRoot(), 'test-results', 'e1-sockets.json');

/** 앱에 물릴 XDG 환경. `onPrepare` 가 `tauri-driver` 를 띄우기 **전에** 세운다. */
export function isolatedEnv(): Record<string, string> {
  const root = isolatedRoot();
  return {
    XDG_DATA_HOME: join(root, 'data'),
    XDG_CONFIG_HOME: join(root, 'config'),
    XDG_CACHE_HOME: join(root, 'cache'),
    XDG_STATE_HOME: join(root, 'state'),
  };
}

/** 앱이 쓸 `<app_data>`. 격리가 먹었다면 앱의 `app_paths().dataDir` 이 이것과 같다. */
export const appDataDir = (): string => join(isolatedRoot(), 'data', APP_ID);

/** 앱이 만드는 실제 파일 이름들 (01 §7 · 06 §3.1). */
export const DB_FILE = 'chickadee.db';
export const WIPED_ENTRIES = [
  DB_FILE, `${DB_FILE}-wal`, `${DB_FILE}-shm`, 'backups', 'dict-cache', 'logs', 'exports',
];

/** 트리를 통째로 비운다. 스펙 파일 하나마다 첫 실행 상태로 되돌리는 데 쓴다. */
export function resetIsolated(): void {
  rmSync(isolatedRoot(), { recursive: true, force: true });
  for (const dir of Object.values(isolatedEnv())) mkdirSync(dir, { recursive: true });
  mkdirSync(appDataDir(), { recursive: true });
}

/**
 * 앱이 말한 `dataDir` 이 격리 트리 안인지. E8·E1 이 「파일이 없다」를 말하기 전에 먼저
 * 통과해야 하는 문 — 격리가 안 먹었으면 앱은 개발자의 진짜 폴더를 쓰고 있고, 그 폴더에
 * 우리 파일이 없는 것은 당연하다(그리고 그 통과는 거짓이다).
 */
export function assertIsolated(dataDirFromApp: string): void {
  const want = appDataDir();
  if (resolve(dataDirFromApp) !== resolve(want)) {
    throw new Error(
      `격리가 먹지 않았다: 앱은 ${dataDirFromApp} 를 쓰고 우리는 ${want} 를 봤다.\n` +
      'XDG_DATA_HOME 이 tauri-driver 로 전달되지 않았거나, 이 플랫폼의 app_data_dir 이 XDG 를 읽지 않는다.',
    );
  }
}

/** `<app_data>` 아래 파일 전부(디렉터리 제외). 없으면 빈 목록. */
export function listAppFiles(dir = appDataDir()): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (at: string): void => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(dir);
  return out;
}

/**
 * 산출 파일 전부에서 문자열을 찾는다 — 06 §3.5 의 「모의 키를 넣고 산출 파일 전부 grep」.
 *
 * **바이트로 읽는다.** DB 는 텍스트가 아니고, 로그·내보내기는 한국어(UTF-8)다. 텍스트로
 * 읽으면 sqlite 페이지가 깨진 문자로 바뀌면서 그 안의 ASCII 키를 놓칠 수 있다.
 */
export function grepAppData(needle: string): string[] {
  const bytes = Buffer.from(needle, 'utf8');
  return listAppFiles().filter((file) => {
    try {
      return statSync(file).isFile() && readFileSync(file).includes(bytes);
    } catch {
      return false;
    }
  });
}

/**
 * 브라우저 게이트가 굽는 시드(D108)를 앱의 DB 자리에 깐다.
 *
 * 왜 필요한가: E4~E8 은 홈·설정 화면을 지나야 하는데, 리포를 등록하는 유일한 길이 **네이티브
 * 폴더 대화상자**다(`plugin-dialog`). WebDriver 는 GTK 대화상자를 못 만진다(E2 가 skip 인 이유가
 * 그것이다). 그래서 「이미 리포가 하나 등록된 앱」을 DB 로 만들어 준다 — 앱이 만든 행이지
 * 손으로 넣은 행이 아니다(시드는 Rust 덤프에서 앱 코드가 파생한다).
 *
 * `root_path` 는 시드에서 `/w/tiny` 라는 가짜 경로다. 앱은 목록을 그릴 때 `repo_probe` 로
 * 폴더가 살아 있는지 보므로, 실제 픽스처 경로로 바꿔 준다 — 아니면 리포가 「없어짐」으로 뜬다.
 */
export function seedAppDb(makeDb: (path: string) => SeedDb): void {
  const seed = join(repoRoot(), '.seed', 'ui.sqlite');
  if (!existsSync(seed)) {
    throw new Error(`시드가 없다: .seed/ui.sqlite — 먼저 \`pnpm test:seed\` 를 돌려라 (D108).`);
  }
  const target = join(appDataDir(), DB_FILE);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(seed, target);

  const fixture = join(repoRoot(), 'fixtures', 'repos', 'tiny');
  if (!existsSync(join(fixture, '.git'))) {
    throw new Error(
      `픽스처가 없다: fixtures/repos/tiny — 먼저 \`bash scripts/make-fixture-repo.sh tiny\` (06 §1.2).`,
    );
  }
  const db = makeDb(target);
  try {
    db.prepare('UPDATE repo SET root_path = ?').run(fixture);
  } finally {
    db.close();
  }
}

/** `better-sqlite3` 에서 우리가 쓰는 만큼만. 타입 의존을 여기 한 곳에 가둔다. */
export interface SeedDb {
  prepare: (sql: string) => { run: (value: string) => unknown };
  close: () => void;
}

/** 조건에 맞는 산출 파일이 생길 때까지. 화면의 토스트를 믿지 않고 **디스크**를 본다. */
export async function waitForAppFile(
  match: (relative: string) => boolean,
  timeoutMs = 30_000,
): Promise<string> {
  const until = Date.now() + timeoutMs;
  for (;;) {
    const hit = listAppFiles().map(shortPath).find(match);
    if (hit !== undefined) return hit;
    if (Date.now() > until) {
      throw new Error(
        `${timeoutMs}ms 안에 기대한 산출 파일이 안 생겼다. 지금 있는 것: ` +
        `${listAppFiles().map(shortPath).join(' · ') || '(없음)'}`,
      );
    }
    await new Promise((resolve_) => setTimeout(resolve_, 250));
  }
}

/** 디버그 출력에 쓰는 짧은 경로 — 절대 경로를 로그에 싣지 않는다(01 §6). */
export const shortPath = (file: string): string =>
  file.split(`${APP_ID}${sep}`).at(-1) ?? file.split(sep).at(-1) ?? file;

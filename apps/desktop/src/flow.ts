/**
 * 화면이 부르는 흐름 (01 §3.3 · 03 §1.7). 리포를 고르고, 읽고, 파생하고, 홈을 다시 그린다.
 *
 * 여기가 IPC 를 아는 유일한 앱 코드다 — 화면 컴포넌트는 props 만 본다.
 */
import { fillCommits, listRepos, registerRepo, recountUnknown, runIngest, writeUnitNodes }
  from '@chickadee/concepts';
import { loadDict } from '@chickadee/dictionary';
import { IpcError, log } from '@chickadee/ipc-client';
import { dayKey } from '@chickadee/scheduler';
import { errorCopy, isInternal } from '@chickadee/ui';

import { loadHome } from './screens/home/data.js';
import { useUi } from './store.js';

/** 하루 경계 04:00 (D12). 오늘이 언제인지는 스케줄러가 정한다. */
const ROLLOVER_HOUR = 4;

/** `dayKey` 는 벽시계 규칙이다 (D54) — 존은 시스템 것을 쓴다. */
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const todayKey = (now = Date.now()): string => dayKey(now, TZ, ROLLOVER_HOUR);

/** 오류를 화면 문구로 바꾼다. 내부 오류는 토스트로 띄우지 않고 로그로만 (01 §6). */
export function report(e: unknown, where: string): void {
  const err = e instanceof IpcError ? e : null;
  const code = err?.code ?? 'UNKNOWN';
  log.error(`${where} 실패`, { code });
  if (err && isInternal(err.code)) return;
  const copy = errorCopy(code);
  useUi.getState().fail([copy.title, copy.detail].filter(Boolean).join(' '));
}

/** 목록을 다시 읽는다. 리포가 0개면 첫 실행 화면으로 떨어진다. */
export async function refreshRepos(): Promise<void> {
  const repos = await listRepos();
  useUi.getState().setRepos(repos);
}

/** 홈 한 화면치를 다시 읽는다. */
export async function refreshHome(): Promise<void> {
  const { activeId, setHome } = useUi.getState();
  if (activeId === null) return;
  setHome(await loadHome(activeId, todayKey()));
}

/**
 * 폴더 하나를 등록하고 바로 읽는다. 첫 인제스트는 `full` 이고,
 * 그 뒤 재스캔은 `incremental` 이다 (03 §1.7 의 세 시점 중 「리포 열기」).
 */
export async function addRepo(path: string): Promise<void> {
  try {
    const repo = await registerRepo(path, Date.now());
    await refreshRepos();
    useUi.setState({ activeId: repo.id });
    await ingest('full');
  } catch (e) {
    report(e, '리포 등록');
  }
}

/**
 * 지금 리포를 읽고 파생까지 끝낸다. 진행은 store 로 나가고 화면이 시간 비례 큐로 그린다.
 *
 * blame 은 **끝난 뒤 배경에서** 돈다 — 1차 패스에 넣으면 첫 화면이 분 단위가 된다(03 §1.5).
 */
export async function ingest(mode: 'full' | 'incremental'): Promise<void> {
  const ui = useUi.getState();
  const repo = ui.repos.find((r) => r.id === ui.activeId);
  if (!repo) return;
  ui.beginIngest();

  try {
    const report_ = await runIngest({
      repoId: repo.id,
      rootPath: repo.rootPath,
      mode,
      sinceHead: mode === 'incremental' ? repo.headSha : null,
      dependencies: [],
      identities: [],
      now: Date.now(),
      onProgress: (phase, done, total) => useUi.getState().step({ phase, done, total }),
      onWarning: (relPath, reason) => useUi.getState().warn({ relPath, reason }),
    });
    log.info('리포를 읽었다', {
      repoId: repo.id,
      files: report_.files,
      captures: report_.captures,
      commits: report_.commits,
      sites: report_.sites,
      ms: report_.elapsedMs,
    });

    const dict = loadDict();
    await writeUnitNodes(repo.id);
    await recountUnknown(dict, repo.id, []);
    useUi.getState().finishIngest();
    await refreshRepos();
    await refreshHome();
    // 끝나면 홈이다 (05 §2.1). 실패했을 때만 진행 화면에 남아 이유를 보인다.
    useUi.getState().go('home');
    void background(repo.id, repo.rootPath);
  } catch (e) {
    report(e, '리포 읽기');
    useUi.getState().finishIngest(useUi.getState().error);
  }
}

/** 2차 패스. 실패해도 카드는 산다 — 출처가 없을 뿐이다 (03 §1.5). */
async function background(repoId: number, rootPath: string): Promise<void> {
  try {
    const filled = await fillCommits({ repoId, rootPath, now: () => Date.now() });
    log.info('사용처에 출처를 붙였다', { repoId, filled });
    await refreshHome();
  } catch (e) {
    log.warn('출처 채우기를 건너뛴다', { code: e instanceof IpcError ? e.code : 'UNKNOWN' });
  }
}

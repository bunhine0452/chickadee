/**
 * 화면이 부르는 흐름 (01 §3.3 · 03 §1.7). 리포를 고르고, 읽고, 파생하고, 홈을 다시 그린다.
 *
 * 여기가 IPC 를 아는 유일한 앱 코드다 — 화면 컴포넌트는 props 만 본다.
 */
import { fillCommits, listRepos, registerRepo, recountUnknown, runIngest, writeUnitNodes }
  from '@chickadee/concepts';
import { loadDict } from '@chickadee/dictionary';
import { ipc, IpcError, log } from '@chickadee/ipc-client';
import { dayKey } from '@chickadee/scheduler';
import { errorCopy, isInternal } from '@chickadee/ui';

import { stampRun } from './data/maintenance.js';
import { loadSettings } from './data/settings.js';
import { loadHome } from './screens/home/data.js';
import { useUi } from './store.js';

/** 도는 잡의 id. 취소가 그것을 요구한다 (03 §1.8). */
let lastJobId: string | null = null;

/** 하루 경계 04:00 (D12). 오늘이 언제인지는 스케줄러가 정한다. */
const ROLLOVER_HOUR = 4;

/** `dayKey` 는 벽시계 규칙이다 (D54) — 존은 시스템 것을 쓴다. */
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const todayKey = (now = Date.now()): string => dayKey(now, TZ, ROLLOVER_HOUR);

/** 오류를 화면 문구로 바꾼다. 내부 오류는 토스트로 띄우지 않고 로그로만 (01 §6). */
export function report(e: unknown, where: string): void {
  const err = e instanceof IpcError ? e : null;
  const code = err?.code ?? 'UNKNOWN';
  // 코드만 남기면 IPC 밖에서 난 오류가 언제나 `UNKNOWN` 한 줄이 되어 원인을 못 쫓는다.
  // 메시지의 절대 경로는 로거가 줄여 준다 (01 §6).
  log.error(`${where} 실패`, {
    errorCode: code,
    message: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200),
  });
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

  // 내 커밋 판정은 `settings.identities` 가 정한다 (03 §1.2 · D46). 여기서 안 넘기면
  // `isMine()` 이 언제나 거짓이라 **모든 커밋이 남의 것**이 되고 T2 정답지가 0장이 된다.
  // 읽기에 실패했을 때 조용히 빈 목록으로 내려가면 같은 증상이 원인 없이 재현되므로 남긴다.
  const settings = await loadSettings().then(
    (s) => ({ identities: s.identities, excludeGlobs: s.excludeGlobs }),
    () => {
      log.warn('설정을 읽지 못해 내 커밋을 가르지 못한다');
      return { identities: [], excludeGlobs: [] };
    },
  );

  try {
    const report_ = await runIngest({
      repoId: repo.id,
      rootPath: repo.rootPath,
      mode,
      sinceHead: mode === 'incremental' ? repo.headSha : null,
      dependencies: [],
      identities: settings.identities,
      excludeGlobs: settings.excludeGlobs,
      now: Date.now(),
      onJob: (jobId) => { lastJobId = jobId; },
      onProgress: (phase, done, total, currentRelPath) =>
        useUi.getState().step({ phase, done, total }, currentRelPath),
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
    // 06 §6.3 — 이 실행이 무엇으로 읽혔는지를 지문으로 남긴다. 다음에 열 때 지금 빌드의
    // 값과 다르면 홈이 「재인제스트 필요」를 낸다. 실패해도 인제스트는 끝난 것이다.
    await stampRun(repo.id, dict, report_.sites)
      .catch(() => log.warn('인제스트 지문을 남기지 못했다'));
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

/**
 * 인제스트 취소 (03 §1.8). 화면 상태만 잠그던 자리에 **실제 취소**를 붙였다 — 그 전에는
 * 「취소 중」이 뜬 채로 잡이 끝까지 돌았다.
 *
 * `jobId` 는 `runIngest` 안에 있으므로 여기 모듈이 마지막 것을 들고 있는다. 없으면
 * 화면만 잠근다(잡이 이미 끝났다는 뜻이다).
 */
export async function cancelIngest(): Promise<void> {
  useUi.getState().cancel();
  if (lastJobId === null) return;
  await ipc.ingest.cancel(lastJobId).catch((e: unknown) => report(e, '인제스트 취소'));
}

/** 2차 패스. 실패해도 카드는 산다 — 출처가 없을 뿐이다 (03 §1.5). */
async function background(repoId: number, rootPath: string): Promise<void> {
  try {
    const filled = await fillCommits({ repoId, rootPath, now: () => Date.now() });
    log.info('사용처에 출처를 붙였다', { repoId, filled });
    await refreshHome();
  } catch (e) {
    log.warn('출처 채우기를 건너뛴다', { errorCode: e instanceof IpcError ? e.code : 'UNKNOWN' });
  }
}

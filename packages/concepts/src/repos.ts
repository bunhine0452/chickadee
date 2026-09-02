/**
 * 리포 장부 (D65). 등록·목록·이동·삭제는 SELECT·INSERT·UPDATE 와 상태 판정이고,
 * 정본 §5 가 그 종류를 TypeScript 에 넘겼다. Rust 에 남은 것은 `repo_probe` 하나 —
 * 작업 트리 루트를 찾아 신원을 말하는 일뿐이다.
 */
import { IpcError, ipc } from '@chickadee/ipc-client';
import type { RepoInfo } from '@chickadee/store-sql';

/** 행 → 객체. `status` 는 열이 아니라 파생이다. */
function toRepo(row: {
  id: number; root_path: string; name: string; default_branch: string | null;
  head_sha: string | null; primary_lang: string | null; fingerprint: string;
  detached_at: number | null; added_at: number; last_ingest_at: number | null;
}, status: RepoInfo['status']): RepoInfo {
  return {
    id: row.id,
    rootPath: row.root_path,
    name: row.name,
    defaultBranch: row.default_branch,
    headSha: row.head_sha,
    primaryLang: row.primary_lang,
    fingerprint: row.fingerprint,
    status,
    addedAt: row.added_at,
    lastIngestAt: row.last_ingest_at,
  };
}

/** 폴더 이름. 사용자가 리포를 알아보는 이름이고 경로가 바뀌어도 따라가지 않는다. */
const nameOf = (rootPath: string): string =>
  rootPath.replace(/[/\\]+$/, '').split(/[/\\]/).at(-1) ?? rootPath;

/**
 * 폴더를 등록한다. 하위 폴더를 골라도 `repo_probe` 가 루트를 찾아 준다 (03 §1.1).
 * 커밋이 0개여도 열린다 — 워킹트리만으로 T0·T1 이 성립한다 (D44).
 */
export async function registerRepo(path: string, now: number): Promise<RepoInfo> {
  const probe = await ipc.repo.probe(path);
  const [existing] = await ipc.store.query('repo.get_by_root', { rootPath: probe.rootPath });
  if (existing) {
    throw new IpcError('REPO_DUPLICATE', '이미 등록된 리포입니다.', {
      repoId: existing.id,
    });
  }
  await ipc.store.exec('repo.insert', {
    rootPath: probe.rootPath,
    name: nameOf(probe.rootPath),
    defaultBranch: null,
    headSha: probe.headCommit,
    primaryLang: null,
    fingerprint: probe.fingerprint,
    addedAt: now,
  });
  const [row] = await ipc.store.query('repo.get_by_root', { rootPath: probe.rootPath });
  if (!row) throw new IpcError('STORE_CONSTRAINT', '리포를 저장하지 못했습니다.');
  return toRepo(row, 'ok');
}

/**
 * 등록된 리포 전부와 그 상태. 경로가 사라졌으면 `missing` 이고, 그때 화면은
 * 「옮겼다면 위치를 알려 주세요」로 `relocateRepo` 를 부른다 (01 §6).
 */
export async function listRepos(): Promise<RepoInfo[]> {
  const rows = await ipc.store.query('repo.list', {});
  const out: RepoInfo[] = [];
  for (const row of rows) {
    let status: RepoInfo['status'] = row.detached_at === null ? 'ok' : 'detached';
    if (status === 'ok') {
      // 폴더가 그대로 있는지는 열어 봐야 안다 — 경로 존재 확인은 명령 경유다.
      try {
        await ipc.repo.probe(row.root_path);
      } catch {
        status = 'missing';
      }
    }
    out.push(toRepo(row, status));
  }
  return out;
}

/**
 * 옮긴 리포를 다시 붙인다. 첫 커밋이 다르면 다른 리포다 — 여기서 막지 않으면
 * 남의 리포에 내 학습 기록이 붙는다.
 */
export async function relocateRepo(repoId: number, newPath: string): Promise<RepoInfo> {
  const rows = await ipc.store.query('repo.list', {});
  const before = rows.find((r) => r.id === repoId);
  if (!before) throw new IpcError('REPO_NOT_FOUND', '그 리포가 없습니다.');
  const probe = await ipc.repo.probe(newPath);
  // fingerprint 가 빈 문자열이면 커밋이 0개였던 리포다 — 비교할 것이 없다 (D44).
  if (before.fingerprint !== '' && before.fingerprint !== probe.fingerprint) {
    throw new IpcError('REPO_FINGERPRINT_MISMATCH', '다른 리포입니다. 첫 커밋이 다릅니다.');
  }
  await ipc.store.exec('repo.update_path', { id: repoId, rootPath: probe.rootPath });
  const [row] = await ipc.store.query('repo.get_by_root', { rootPath: probe.rootPath });
  if (!row) throw new IpcError('STORE_CONSTRAINT', '리포를 옮기지 못했습니다.');
  return toRepo(row, 'ok');
}

/**
 * 리포를 목록에서 뺀다. `purge` 면 사실과 파생까지 지우되 **카드는 은퇴만** 시킨다 —
 * `review_log.card_id` 가 NOT NULL 이라 지우면 학습 기록이 끊긴다 (D31).
 */
export async function removeRepo(repoId: number, purge: boolean, now: number): Promise<void> {
  const ops = purge
    ? [
        { name: 'repo.retire_cards' as const, params: { id: repoId, at: now } },
        { name: 'repo.purge_gaps' as const, params: { id: repoId } },
        { name: 'repo.purge_units' as const, params: { id: repoId } },
        { name: 'repo.purge_derived' as const, params: { id: repoId } },
        { name: 'repo.purge_commits' as const, params: { id: repoId } },
        { name: 'repo.purge_facts' as const, params: { id: repoId } },
        { name: 'repo.purge_runs' as const, params: { id: repoId } },
        { name: 'repo.remove' as const, params: { id: repoId } },
      ]
    : [{ name: 'repo.detach' as const, params: { id: repoId, detachedAt: now } }];
  await ipc.store.batch(ops);
}

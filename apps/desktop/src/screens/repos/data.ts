/**
 * 서가가 읽고 부르는 것 (D119 · 05 §2.1 `repos`).
 *
 * 목록 한 벌은 `repo.overview` **statement 하나**로 긷는다. `listRepos()` 는 상태를 알려고
 * 리포마다 `repo_probe` 를 부르므로 목록이 리포 수에 비례해 느려진다 — 여기서는 원장에서
 * 아는 것을 한 번에 읽어 그리고, 폴더가 실제로 있는지는 그린 **뒤에** 따로 확인한다.
 *
 * 등록·이동·삭제 자체는 `@chickadee/concepts` 의 `repos.ts` 에 이미 있다. 여기서는 부르기만
 * 한다 (D65).
 */
import { cloneRepo, cloneTargetName, relocateRepo, removeRepo } from '@chickadee/concepts';
import { t } from '@chickadee/i18n';
import { IpcError, ipc } from '@chickadee/ipc-client';
import { dayKey, endOfDay } from '@chickadee/scheduler';
import type { DayKey, RepoInfo } from '@chickadee/store-sql';

import { loadSettings } from '../../data/settings.js';
import { addRepo, report } from '../../flow.js';

/** 서가 카드 한 장. `status` 는 열이 아니라 파생이다 (`concepts/repos.ts` 와 같은 규칙). */
export interface RepoCard {
  id: number;
  name: string;
  rootPath: string;
  status: RepoInfo['status'];
  lastIngestAt: number | null;
  addedAt: number;
  /** 이 리포의 대지에 놓인 개념 수. */
  concepts: number;
  /** 겹 평균. 개념이 0개면 `null` 이라 화면이 칸을 비운다. */
  avgLayer: number | null;
  /** 오늘 만기인 개념 수 — 큐의 복습 몫이다 (`repo.overview` 머리 주석). */
  dueN: number;
}

interface OverviewRow {
  id: number;
  root_path: string;
  name: string;
  detached_at: number | null;
  added_at: number;
  last_ingest_at: number | null;
  concepts: number;
  avg_layer: number | null;
  due_n: number;
}

/**
 * 등록된 리포 전부. 여기서 나오는 `status` 는 `ok` 아니면 `detached` 뿐이다 —
 * `missing` 은 폴더를 열어 봐야 알고, 그것은 `probeMissing()` 이 나중에 한다.
 */
export async function loadShelf(now: number): Promise<RepoCard[]> {
  const settings = await loadSettings();
  const day = dayKey(now, settings.tz, settings.rolloverHour);
  const rows = (await ipc.store.query('repo.overview', {
    eod: endOfDay(day as DayKey, settings.tz, settings.rolloverHour),
    day,
  })) as OverviewRow[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    rootPath: r.root_path,
    status: r.detached_at === null ? 'ok' : 'detached',
    lastIngestAt: r.last_ingest_at,
    addedAt: r.added_at,
    concepts: r.concepts,
    avgLayer: r.avg_layer,
    dueN: r.due_n,
  }));
}

/**
 * 폴더가 아직 그 자리에 있는지. 목록을 **그린 뒤에** 부른다 — 여기가 리포 수에 비례하는
 * 유일한 자리이고, 그래서 첫 그리기를 막지 않는다.
 */
export async function probeMissing(cards: readonly RepoCard[]): Promise<number[]> {
  const gone: number[] = [];
  for (const card of cards) {
    if (card.status !== 'ok') continue;
    try {
      await ipc.repo.probe(card.rootPath);
    } catch {
      gone.push(card.id);
    }
  }
  return gone;
}

/**
 * 폴더 고르기 — 리포로 들어오는 유일한 문이다 (01 §2). 첫 실행과 서가가 같은 것을 부른다.
 * 대화상자를 닫으면 `null` 이고 아무 일도 일어나지 않는다.
 */
export async function pickFolder(): Promise<void> {
  const picked = await ipc.dialog.pickFolder(t('repos.pickFolder'));
  if (picked !== null) await addRepo(picked);
}

/**
 * 주소로 받아 등록까지 (D129). 받을 **부모 폴더**를 고르게 하고 그 아래 주소 끝 이름으로
 * 받는다 — 받은 코드가 사용자가 아는 자리에 남아야 지우는 것도 사용자가 할 수 있다.
 *
 * 받은 뒤는 폴더를 고른 길과 한 글자도 다르지 않다: `addRepo` 가 등록하고 인제스트를 연다.
 * 돌려주는 값은 「무언가 들어왔나」이고, 대화상자를 닫았으면 `false` 이며 아무 일도 없다.
 */
export async function cloneFromUrl(url: string): Promise<boolean> {
  // 못 받을 주소로 폴더 대화상자를 열지 않는다 — 고르고 나서 거절하면 두 걸음이 헛것이 된다.
  if (cloneTargetName(url) === null) {
    report(new IpcError('GIT_URL_UNSUPPORTED', 'https 주소가 아닙니다.', { url }), '리포 받기');
    return false;
  }
  const parent = await ipc.dialog.pickFolder(t('repos.pickClone'));
  if (parent === null) return false;
  try {
    await addRepo(await cloneRepo(url, parent));
    return true;
  } catch (e) {
    report(e, '리포 받기');
    return false;
  }
}

/**
 * 옮긴 리포를 다시 붙인다. 첫 커밋이 다르면 `relocateRepo` 가 막는다 — 남의 리포에 내
 * 학습 기록이 붙는 것을 여기서 막지 않으면 되돌릴 방법이 없다.
 */
export async function relocate(repoId: number): Promise<boolean> {
  const picked = await ipc.dialog.pickFolder(t('repos.pickNew'));
  if (picked === null) return false;
  await relocateRepo(repoId, picked);
  return true;
}

/**
 * 목록에서 빼기(`purge=false`) · 전부 지우기(`purge=true`).
 *
 * `purge` 여도 **카드는 은퇴만** 한다 — `review_log.card_id` 가 NOT NULL 이라 카드를 지우면
 * 「언제 무엇을 찍었는지」가 통째로 끊긴다 (D31). 확인 문구가 그 사실을 말해야 한다.
 */
export const remove = (repoId: number, purge: boolean, now: number): Promise<void> =>
  removeRepo(repoId, purge, now);

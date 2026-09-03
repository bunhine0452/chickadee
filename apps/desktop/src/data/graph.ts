/**
 * T2 구조 판 만들기 — 지도·정답지 원장과 생성기(`@chickadee/cards`) 사이 (04 §7~§8 · D97).
 *
 * `data/blocks.ts`(T1)와 같은 자리에 있고 같은 규칙을 따른다: 규칙은 하나도 여기서 만들지
 * 않는다. 밴드·배치·정답지는 생성기가, 채점은 `@chickadee/grading` 이 한다. 여기 일은 셋
 * 뿐이다 — statement 결과를 생성기의 입력 모양으로 옮기고, 커밋의 **추가된 줄**을 읽고,
 * 나온 카드를 `card` 에 넣는다.
 *
 * **경로는 화면에만 둔다.** T2 는 파일 경로를 다루므로 01 §6 의 로그 금지 필드가 T1 보다
 * 위험하다 — 이 파일의 로그에는 개수만 남긴다.
 */
import {
  generateT2, isT2Card,
  type CommitFileRow, type CommitRow, type GraphEdge, type GraphFile, type T2Card, type T2Kind,
} from '@chickadee/cards';
import { ipc, log } from '@chickadee/ipc-client';
import { estMinFor } from '@chickadee/scheduler';
import type { ConceptId } from '@chickadee/store-sql';

/** 04 §8.1 후보를 고를 때 훑는 커밋 수. 대지에 닿은 것만 세므로 넉넉히 본다. */
export const COMMIT_BUDGET = 60;
/** 04 §8.1 sec ② 「최근 50 커밋」. */
export const COCHANGE_WINDOW = 50;
/**
 * `git_diff_text` 를 부르는 커밋 수의 상한. 후보 커밋 하나마다 파일 수만큼 IPC 가 늘어나므로
 * **실제로 쓸 커밋 하나**에만 부른다 — 04 §8.1 이 그 줄을 보는 곳은 `sec` 판정 한 군데다.
 */
export const DIFF_COMMITS = 1;

export interface GraphDeps {
  repoId: number;
  rootPath: string;
  now: number;
}

/** T2 네 종이 매달리는 개념 — `dictionary/arch/*.yaml` (03 §4.4). */
export const T2_CONCEPTS: Record<T2Kind, ConceptId> = {
  placement: 'arch/placement' as ConceptId,
  radius: 'arch/radius' as ConceptId,
  flow: 'arch/flow' as ConceptId,
  direction: 'arch/direction' as ConceptId,
};

/**
 * 대지 하나의 지도 재료. `t2.unit_files` 는 대지 파일 + **1-hop 이웃**을 함께 주고,
 * `t2.edges` 는 그 집합 **안쪽** 엣지만 준다 — 밖으로 나가는 선은 그릴 자리가 없다.
 */
export async function loadGraph(
  repoId: number,
  unitId: number,
): Promise<{ files: GraphFile[]; edges: GraphEdge[] }> {
  const rows = await ipc.store.query('t2.unit_files', { repoId, unitId });
  const files: GraphFile[] = rows.map((r) => ({
    fileId: r.id, path: r.path, inUnit: r.in_unit === 1,
  }));
  if (files.length === 0) return { files, edges: [] };

  const byId = new Map(files.map((f) => [f.fileId, f.path]));
  const edgeRows = await ipc.store.query('t2.edges', {
    repoId, ids: JSON.stringify(files.map((f) => f.fileId)),
  });
  const edges: GraphEdge[] = [];
  for (const row of edgeRows) {
    const from = byId.get(row.from_file_id);
    const to = byId.get(row.to_file_id);
    // 파일이 그 사이 죽었으면 엣지도 없는 것으로 본다 — 노드 없는 선은 그릴 수 없다.
    if (from === undefined || to === undefined || from === to) continue;
    edges.push({
      from, to,
      kind: row.kind as GraphEdge['kind'],
      confidence: row.confidence as GraphEdge['confidence'],
    });
  }
  return { files, edges };
}

/** 후보 커밋과 그 변경 파일. 04 §8.1 의 필터는 생성기가 돌린다 — 여기서는 긷기만 한다. */
export async function loadCommits(
  deps: GraphDeps,
  unitId: number,
): Promise<{
  commits: CommitRow[];
  filesOf: Map<number, CommitFileRow[]>;
  recent: Map<number, string[]>;
}> {
  const rows = await ipc.store.query('t2.commit_candidates', {
    repoId: deps.repoId, unitId, limit: COMMIT_BUDGET,
  });
  const commits: CommitRow[] = rows.map((r) => ({
    id: r.id, sha: r.sha, authoredAt: r.authored_at, message: r.message,
    filesN: r.files_n, insertions: r.insertions, deletions: r.deletions,
    truncated: r.truncated === 1,
  }));

  const filesOf = new Map<number, CommitFileRow[]>();
  for (const commit of commits) {
    const files = await ipc.store.query('t2.commit_files', { commitId: commit.id });
    filesOf.set(commit.id, files.map((f) => ({
      path: f.path, oldPath: f.old_path, status: f.status as CommitFileRow['status'],
      additions: f.additions, deletions: f.deletions, fileId: f.file_id,
    })));
  }

  const changeRows = await ipc.store.query('t2.recent_changes', {
    repoId: deps.repoId, limit: COCHANGE_WINDOW,
  });
  const recent = new Map<number, string[]>();
  for (const row of changeRows) {
    recent.set(row.commit_id, [...(recent.get(row.commit_id) ?? []), row.path]);
  }
  return { commits, filesOf, recent };
}

/**
 * 커밋 한 건이 각 파일에 **더한 줄**을 채운다 (D98). 04 §8.1 의 「추가 줄이 전부 import 문인
 * 파일도 sec」이 이것만 본다.
 *
 * 못 읽으면 `added` 를 비운 채 둔다 — 생성기는 없으면 그 걸음을 건너뛴다. 여기서 던지면
 * diff 하나 때문에 판이 통째로 안 나온다.
 */
export async function fillAdded(
  deps: GraphDeps,
  sha: string,
  files: readonly CommitFileRow[],
): Promise<CommitFileRow[]> {
  const out: CommitFileRow[] = [];
  let failed = 0;
  for (const file of files) {
    // 지워진 파일에는 더한 줄이 없다.
    if (file.status === 'D') {
      out.push(file);
      continue;
    }
    try {
      const diff = await ipc.git.diffText(deps.rootPath, sha, file.path);
      out.push({ ...file, added: diff.added });
    } catch {
      failed += 1;
      out.push(file);
    }
  }
  // 경로는 싣지 않는다 (01 §6) — 몇 건인지만 남긴다.
  if (failed > 0) log.info('커밋 diff 를 읽지 못했다', { n: failed });
  return out;
}

/**
 * T2 판 한 장을 만들어 넣는다. 만들 수 없으면 `null` — 사유는 로그에만 남긴다.
 *
 * `kind` 를 주면 그 종만, 안 주면 만들 수 있는 첫 종을 만든다. 책임 배치가 먼저인 이유는
 * 그것만 **실제 커밋**을 정답지로 쓰기 때문이다 (정본 §2) — 나머지 셋은 그래프만으로도
 * 나오므로 커밋이 적은 리포의 폴백이다 (04 §8.4).
 */
export async function makeT2Card(
  deps: GraphDeps,
  unit: { id: number; name: string; rootPath: string | null },
  kind?: T2Kind,
): Promise<{ cardId: number; card: T2Card } | null> {
  const { files, edges } = await loadGraph(deps.repoId, unit.id);
  if (files.length === 0) {
    log.info('구조 판을 만들지 못했다', { reason: 'no-files' });
    return null;
  }
  const { commits, filesOf, recent } = await loadCommits(deps, unit.id);

  // 정답지에 실제로 쓸 커밋 하나에만 diff 를 읽는다 — 60건에 부르면 IPC 가 파일 수만큼 는다.
  const newest = commits[0];
  if (newest) {
    const rows = filesOf.get(newest.id);
    if (rows) filesOf.set(newest.id, await fillAdded(deps, newest.sha, rows));
  }

  // **네 종을 다 굽는다** (D107). 시도 순서(책임 배치 → 영향 반경 → 흐름 추적 → 의존성
  // 방향)와 「만들 수 없는 종은 조용히 건너뛴다」는 생성기가 갖고 있으므로 여기서 종을
  // 고르지 않는다 — 04 §8.3·§8.4 를 아는 곳이 둘이 되면 언젠가 갈라진다. 한 종도 못 만드는
  // 리포가 있고 그것이 정상이다(`two-commits` — 파일이 하나라 지도가 없다, D103).
  const made = generateT2({
    repoId: deps.repoId,
    unitId: unit.id,
    unitName: unit.name,
    unitRoot: unit.rootPath ?? '',
    conceptId: T2_CONCEPTS.placement,
    seed: deps.repoId * 1_000 + unit.id,
    files, edges, commits, filesOf, recent,
  }, kind);

  if (!isT2Card(made)) {
    log.info('구조 판을 만들지 못했다', { reason: made.reason });
    return null;
  }

  await ipc.store.exec('card.insert', {
    repoId: deps.repoId,
    unitId: unit.id,
    track: 't2',
    kind: made.kind,
    conceptId: made.conceptId,
    level: 1,
    siteId: null,
    fileId: null,
    commitId: made.commitId,
    payloadJson: JSON.stringify(made.payload),
    genVersion: 1,
    contentHash: made.contentHash,
    createdAt: deps.now,
  });
  const rows = await ipc.store.query('card.by_hash', {
    repoId: deps.repoId, contentHash: made.contentHash,
  });
  const cardId = rows[0]?.id;
  if (cardId === undefined) return null;

  await ipc.store.exec('card.state_upsert', {
    cardId, prints: 0, stage: 1, lastPct: null, estMinEma: null, lastPrintedAt: null,
  });
  return { cardId, card: made };
}

/** 큐가 부를 때의 예상 시간. T2 는 종에 상관없이 한 값이다 (02 §5.1). */
export const t2EstMin = (): number => estMinFor('t2', 'new');

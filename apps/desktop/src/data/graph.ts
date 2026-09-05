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
import { OTHER_UNIT } from '@chickadee/concepts';
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

/** T2 여섯 종이 매달리는 개념 — `dictionary/arch/*.yaml` (03 §4.4). */
export const T2_CONCEPTS: Record<T2Kind, ConceptId> = {
  placement: 'arch/placement' as ConceptId,
  radius: 'arch/radius' as ConceptId,
  flow: 'arch/flow' as ConceptId,
  direction: 'arch/direction' as ConceptId,
  entry: 'arch/entry' as ConceptId,
  role: 'arch/role' as ConceptId,
};

/**
 * 지도가 리포 전체인 종 (04 §7.5 · D142). 이 둘은 대지가 아니라 **리포**를 묻는다.
 *
 * 재료가 다르다 — `loadGraph`(대지 + 1-hop) 대신 `loadRepoGraph`(리포 전량)를 쓴다.
 * 대지 파일만 실어 보내면 「대지 하나짜리 리포 지도」라는 거짓 그림이 나온다.
 */
export const T2_REPO_KINDS: readonly T2Kind[] = ['entry', 'role'];

/**
 * 리포 지도 종을 몇 장까지 굽는가 (D142).
 *
 * 진입점은 리포에 하나뿐인 물음이라 **한 장**이다. 폴더 역할은 물어볼 폴더가 여럿이라
 * 대지 목록을 색인 삼아 회전하되 넷에서 멈춘다 — 04 §7.2 ① 이 이름으로 아는 디렉터리는
 * 열둘이고, 한 리포에서 「이 폴더는 왜 있나」를 다섯 번 넘게 물으면 같은 교훈의 반복이다.
 */
export const REPO_TARGETS: Record<'entry' | 'role', number> = { entry: 1, role: 4 };

/**
 * 굽는 순서 (D140). **종이 바깥 고리다** — 책임 배치를 리포의 모든 대지에 한 바퀴 돌린
 * 뒤에야 영향 반경으로 내려간다. 책임 배치만 실제 커밋을 정답지로 쓰므로(정본 §2) 가장
 * 강한 종을 리포 전체에 먼저 쓰는 것이 맞고, 대지를 옮겨 가는 쪽이 사용자가 보는 변화도
 * 크다 — 같은 대지의 네 종은 같은 지도 위 네 문제다.
 */
export const T2_ORDER: readonly T2Kind[] = [
  'placement', 'radius', 'flow', 'direction', 'entry', 'role',
];

/**
 * 한 세션에 시도해 보는 (대지 × 종) 조합 수. **일괄 생성 금지**의 실제 값이다.
 *
 * 책임 배치 한 번이 `t2.commit_files` 를 후보 커밋 수(≤ 60)만큼 부른다. 20대지를 한 번에
 * 훑으면 1,200 쿼리다. 세션마다 몇 장씩 늘려도 회전은 며칠이면 찬다 — 어차피 T2 자리는
 * 이틀에 한 번이다.
 */
export const BAKE_ATTEMPTS = 3;

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

/**
 * 리포 전체의 지도 재료 (04 §7.5 · D142). 노드를 폴더로 접는 것은 생성기가 한다 —
 * 여기 일은 파일과 엣지를 통째로 긷는 것뿐이다.
 *
 * **새 statement 를 만들지 않았다.** 노드는 `clone.course_files`(리포의 살아 있는 파싱
 * 대상 전량 — 코스가 걸어 다니는 그 집합이 곧 의존성 지도의 노드다), 엣지는 `t2.edges`
 * 에 파일 id 전부를 넘겨 받는다. 카탈로그는 생성 파일이라(D57) 한 줄을 더하려면 다시
 * 구워야 하는데, 이 두 문장으로 필요한 것이 다 나온다.
 */
export async function loadRepoGraph(
  repoId: number,
): Promise<{ files: GraphFile[]; edges: GraphEdge[] }> {
  const rows = await ipc.store.query('clone.course_files', { repoId });
  // `inUnit` 은 대지 + 1-hop 지도에서 「이웃인가」를 가리는 값이다. 리포 지도에는 이웃이
  // 없다 — 전부 이 리포의 파일이다.
  const files: GraphFile[] = rows.map((r) => ({ fileId: r.id, path: r.path, inUnit: true }));
  if (files.length === 0) return { files, edges: [] };

  const byId = new Map(files.map((f) => [f.fileId, f.path]));
  const edgeRows = await ipc.store.query('t2.edges', {
    repoId, ids: JSON.stringify(files.map((f) => f.fileId)),
  });
  const edges: GraphEdge[] = [];
  for (const row of edgeRows) {
    const from = byId.get(row.from_file_id);
    const to = byId.get(row.to_file_id);
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
  targetIndex = 0,
): Promise<{ cardId: number; card: T2Card } | null> {
  const repoScope = kind !== undefined && T2_REPO_KINDS.includes(kind);
  const { files, edges } = repoScope
    ? await loadRepoGraph(deps.repoId)
    : await loadGraph(deps.repoId, unit.id);
  if (files.length === 0) {
    log.info('구조 판을 만들지 못했다', { reason: 'no-files' });
    return null;
  }

  // **커밋은 책임 배치만 본다** (04 §8.3 — 나머지 셋은 그래프만으로 나온다). 종이 정해진
  // 채로 들어왔고 그것이 책임 배치가 아니면 `loadCommits` 를 통째로 건너뛴다. 그 한 번이
  // `t2.commit_files` 를 후보 커밋 수만큼 부르므로, 회전(D140)이 대지를 옮겨 다닐 때
  // 이 갈래가 없으면 쿼리가 종 수만큼 곱해진다.
  const needCommits = kind === undefined || kind === 'placement';
  const { commits, filesOf, recent } = needCommits
    ? await loadCommits(deps, unit.id)
    : { commits: [], filesOf: new Map<number, CommitFileRow[]>(), recent: new Map<number, string[]>() };

  // 정답지에 실제로 쓸 커밋 하나에만 diff 를 읽는다 — 60건에 부르면 IPC 가 파일 수만큼 는다.
  const newest = commits[0];
  if (newest) {
    const rows = filesOf.get(newest.id);
    if (rows) filesOf.set(newest.id, await fillAdded(deps, newest.sha, rows));
  }

  // 종을 안 받았으면 시도 순서(책임 배치 → 영향 반경 → 흐름 추적 → 의존성 방향)와
  // 「만들 수 없는 종은 조용히 건너뛴다」를 **생성기가** 돌린다 — 04 §8.3·§8.4 를 아는 곳이
  // 둘이 되면 언젠가 갈라진다. 한 종도 못 만드는 리포가 있고 그것이 정상이다
  // (`two-commits` — 파일이 하나라 지도가 없다, D103).
  const made = generateT2({
    repoId: deps.repoId,
    unitId: unit.id,
    unitName: unit.name,
    unitRoot: unit.rootPath ?? '',
    conceptId: T2_CONCEPTS.placement,
    seed: deps.repoId * 1_000 + unit.id,
    targetIndex,
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

/** 아직 안 구운 (대지, 종) 하나. `bakeNextT2` 가 무엇을 시도할지 이 순서로 정한다. */
export interface T2Todo {
  unit: { id: number; name: string; rootPath: string | null };
  kind: T2Kind;
  /** 리포 지도 종에서 몇 번째 후보 폴더를 물을 것인가 (D142). 나머지 넷에는 뜻이 없다. */
  targetIndex: number;
}

/**
 * 아직 판이 없는 (대지 × 종) 을 굽는 순서대로 편다 (D140 · D142).
 *
 * 순수 함수다 — 세션 큐가 이 순서를 테스트로 못박을 수 있도록 조회에서 떼어 놨다.
 *
 * 리포 지도 두 종(`entry`·`role`)은 지도가 대지마다 다르지 않다. 그래서 대지를 **회전
 * 커서**로만 쓴다: `made` 의 키가 `대지:종` 이라 「같은 종을 두 번 굽지 않는다」를 그
 * 표로 그대로 세려면 서로 다른 대지에 매달 수밖에 없고, 몇 번째 후보를 물을지는
 * `targetIndex` 가 들고 간다. 대지가 `기타` 하나뿐인 리포에서는 두 종 다 내지 않는다 —
 * 접어 봐야 한 덩어리라 지도가 서지 않는다.
 */
export function t2Todo(
  units: readonly { id: number; name: string; rootPath: string | null }[],
  made: ReadonlySet<string>,
): T2Todo[] {
  const out: T2Todo[] = [];
  const mapStands = units.some((u) => u.name !== OTHER_UNIT);
  for (const kind of T2_ORDER) {
    const repo = kind === 'entry' || kind === 'role';
    if (repo && !mapStands) continue;
    const limit = repo ? Math.min(units.length, REPO_TARGETS[kind]) : units.length;
    for (const [at, unit] of units.slice(0, limit).entries()) {
      if (!made.has(`${unit.id}:${kind}`)) out.push({ unit, kind, targetIndex: repo ? at : 0 });
    }
  }
  return out;
}

/**
 * 큐의 T2 자리가 비었을 때 **한 장 더** 굽는다 (D140 · #b-for-unit · #b-four-kinds).
 *
 * 「비었다」는 `queue.next_track_card` 가 최근 7일 안에 안 찍은 판을 못 찾았다는 뜻이다.
 * 그때만 이 함수가 돌고, 돌 때마다 굽는 판은 **한 장**이다. 이미 구운 조합은
 * `queue.t2_made` 로 걸러 같은 판을 두 번 만들지 않는다(`UNIQUE (repo_id, content_hash)`
 * 가 어차피 막지만, 막힌 뒤에 아는 것보다 묻지 않는 편이 싸다).
 *
 * 다 구웠으면 `null` 이다. 그날 T2 자리는 비고 T0 이 그 시간을 쓴다 — 만기 T2 복습은
 * `queue.due` 로 오므로 이 `null` 이 복습을 막지는 않는다.
 */
export async function bakeNextT2(
  deps: GraphDeps,
): Promise<{ cardId: number; card: T2Card } | null> {
  const [unitRows, madeRows] = await Promise.all([
    ipc.store.query('queue.units', { repoId: deps.repoId }),
    ipc.store.query('queue.t2_made', { repoId: deps.repoId }),
  ]);
  const units = unitRows.map((u) => ({ id: u.id, name: u.name, rootPath: u.root_path }));
  const made = new Set(madeRows.map((r) => `${r.unit_id}:${r.kind}`));

  let tried = 0;
  for (const todo of t2Todo(units, made)) {
    if (tried >= BAKE_ATTEMPTS) break;
    tried += 1;
    const card = await makeT2Card(deps, todo.unit, todo.kind, todo.targetIndex);
    if (card !== null) return card;
  }
  // 경로도 대지 이름도 싣지 않는다 (01 §6) — 몇 번 시도했는지만 남긴다.
  log.info('구울 구조 판이 남지 않았다', { n: tried });
  return null;
}

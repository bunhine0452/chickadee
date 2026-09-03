/**
 * T2 구조 카드 생성기 (04 §7~§8 · D97).
 *
 *   buildGraph(1차) → candidates → buildKey → buildGraph(2차, 정답지를 접지 않게)
 *   → payload → contentHash
 *
 * **지도를 두 번 짓는 이유**: 24 노드 축약은 「정답지(core·sec)에 든 파일을 절대 접지
 * 않는다」(04 §7.4)인데 정답지를 도출하려면 밴드가 먼저 있어야 한다(힌트 ①이 「core 가
 * 걸친 밴드 수」다). 1차는 밴드를 얻으려고, 2차는 그 정답지를 지키며 접으려고 짓는다.
 * 노드가 24개까지라 두 번 짓는 값은 예산 안이다 (04 §9 — 배치 < 5ms).
 *
 * 종의 순서는 책임 배치 → 영향 반경 → 흐름 추적 → 의존성 방향이다. 책임 배치가 먼저인
 * 이유는 그것만 **실제 커밋**을 정답지로 쓰기 때문이고(정본 §2 「LLM 채점이 아니라 실제
 * 커밋」), 나머지 셋이 뒤인 이유는 그래프만으로 나와 커밋이 적은 리포의 폴백이기
 * 때문이다 (04 §8.4).
 */
import type { ConceptId } from '@chickadee/store-sql';

import { contentHash } from './hash.js';
import { GEN_VERSION } from './payload.js';
import { buildGraph } from './t2-graph.js';
import { buildKey, candidates, question } from './t2-key.js';
import { buildDirection, buildFlow, buildRadius, type QuizInput } from './t2-quiz.js';
import type { NoPlate } from './types.js';
import {
  MIN_COMMITS_FOR_PLACEMENT,
  type AnswerKey, type Band, type Graph, type T2Card, type T2Kind, type T2Payload,
  type T2Request,
} from './t2-types.js';

/** 종마다 매달리는 개념 (03 §4.4 `dictionary/arch/*.yaml`). */
const CONCEPT_OF: Record<T2Kind, string> = {
  placement: 'arch/placement',
  radius: 'arch/radius',
  flow: 'arch/flow',
  direction: 'arch/direction',
};

/** 시도 순서. 앞의 것이 만들어지면 거기서 멈춘다. */
const ORDER: T2Kind[] = ['placement', 'radius', 'flow', 'direction'];

/**
 * 대지 하나로 T2 판 한 장을 굽는다. `kind` 를 주면 그 종만 시도한다.
 *
 * 만들 수 없으면 `NoPlate` — 사유는 화면이 아니라 로그로 간다 (「판이 없는 문법」 패널은
 * 개념 단위이고 이것은 대지 단위다).
 */
export function generateT2(req: T2Request, kind?: T2Kind): T2Card | NoPlate {
  const kinds = kind === undefined ? ORDER : [kind];
  const reasons: string[] = [];
  for (const one of kinds) {
    const made = one === 'placement' ? placement(req) : quiz(req, one);
    if ('payload' in made) return made;
    reasons.push(`${one}: ${made.reason}`);
  }
  return { noPlate: true, reason: reasons.join(' · ') };
}

// ───────── 책임 배치 (04 §8.1) ─────────

function placement(req: T2Request): T2Card | NoPlate {
  const unitPaths = req.files.filter((f) => f.inUnit).map((f) => f.path);
  const picked = candidates({ commits: req.commits, filesOf: req.filesOf, unitPaths });
  if (picked.length < MIN_COMMITS_FOR_PLACEMENT) {
    // 04 §8.4 — 정답지가 커밋 1건이면 「정답 하나뿐인 정답지」다. 그래프 3종으로 넘긴다.
    return { noPlate: true, reason: `후보 커밋 ${picked.length}건 — ${MIN_COMMITS_FOR_PLACEMENT}건은 있어야 한다` };
  }
  const commit = picked[0];
  const files = commit === undefined ? undefined : req.filesOf.get(commit.id);
  if (commit === undefined || files === undefined) {
    return { noPlate: true, reason: '후보 커밋의 변경 파일을 찾지 못했다' };
  }

  const first = buildGraph({ files: req.files, edges: req.edges, unitRoot: req.unitRoot });
  const key = buildKey({
    commit,
    files,
    mapPaths: spread(first),
    edges: req.edges.map((e) => ({ from: e.from, to: e.to })),
    unitRoot: req.unitRoot,
    unitPaths,
    recent: req.recent,
    bandOf: bandOf(first),
  });

  const graph = buildGraph({
    files: req.files,
    edges: req.edges,
    unitRoot: req.unitRoot,
    keep: [...Object.keys(key.core), ...Object.keys(key.sec)],
    newFiles: key.newFiles,
  });

  const payload: T2Payload = {
    track: 't2',
    kind: 'placement',
    q: question(key.subject),
    hint: '지도에서 파일 상자를 클릭해 고릅니다. 정답 개수는 비공개입니다.',
    bands: graph.bands,
    files: graph.files,
    edges: graph.edges,
    commit: key.commit,
    core: onMap(key.core, graph),
    sec: onMap(key.sec, graph),
    trap: onMapFlat(key.trap, graph),
    hints: key.hints,
  };
  return card('placement', req, payload, commit.id);
}

// ───────── 그래프만으로 만드는 3종 (04 §8.3) ─────────

function quiz(req: T2Request, kind: Exclude<T2Kind, 'placement'>): T2Card | NoPlate {
  const graph = buildGraph({ files: req.files, edges: req.edges, unitRoot: req.unitRoot });
  const paths = graph.files.map((f) => f.p);
  if (paths.length < 3) return { noPlate: true, reason: `지도 노드 ${paths.length}개 — 너무 작다` };

  const input: QuizInput = {
    paths,
    edges: req.edges,
    bandOf: bandOf(graph),
    unitPaths: req.files.filter((f) => f.inUnit).map((f) => f.path),
    seed: req.seed,
  };
  const base = {
    track: 't2' as const,
    bands: graph.bands,
    files: graph.files,
    edges: graph.edges,
  };

  if (kind === 'radius') {
    const made = buildRadius(input);
    if (made === null) return { noPlate: true, reason: '들어오는 화살표가 있는 대지 파일이 없다' };
    return card('radius', req, {
      ...base, kind: 'radius', q: made.q, hint: made.hint,
      core: made.core, sec: made.sec, trap: made.trap, hints: made.hints,
    }, null);
  }

  if (kind === 'flow') {
    const made = buildFlow(input);
    if (made === null) return { noPlate: true, reason: '3개 이상 이어지는 경로가 없다' };
    return card('flow', req, {
      ...base, kind: 'flow', q: made.q, hint: made.hint,
      core: {}, sec: {}, trap: {}, hints: made.hints,
      flow: { answer: made.answer, deck: made.deck },
    }, null);
  }

  const made = buildDirection(input);
  if (made === null) return { noPlate: true, reason: '방향을 물을 쌍이 5개가 안 된다' };
  return card('direction', req, {
    ...base, kind: 'direction', q: made.q, hint: made.hint,
    core: {}, sec: {}, trap: {}, hints: made.hints,
    pairs: made.pairs,
  }, null);
}

// ───────── 공통 ─────────

function card(
  kind: T2Kind,
  req: T2Request,
  payload: T2Payload,
  commitId: number | null,
): T2Card {
  const conceptId = (CONCEPT_OF[kind] ?? req.conceptId) as ConceptId;
  return {
    kind,
    conceptId,
    unitId: req.unitId,
    commitId,
    payload,
    // `siteId` 자리에 대지 id 를 넣는다 — T2 는 사용처가 아니라 대지에 매달린다.
    contentHash: contentHash({
      conceptId, kind, siteId: req.unitId, genVersion: GEN_VERSION, payload,
    }),
  };
}

/** 경로 → 밴드. 접힌 폴더 안 파일은 그 폴더 노드의 밴드로 본다. */
function bandOf(graph: Graph): (path: string) => Band {
  const table = new Map<string, Band>();
  for (const file of graph.files) {
    table.set(file.p, file.r);
    for (const inner of graph.foldedOf[file.p] ?? []) table.set(inner, file.r);
  }
  // 지도 밖 노드는 가장 아래 층으로 본다 — 고립이라 위쪽에 놓을 근거가 없다.
  return (path) => table.get(path) ?? 3;
}

/** 지도가 실제로 아는 경로 전부 — 접힌 폴더 안까지 편다. `trap` 이 이 안에서만 나온다. */
function spread(graph: Graph): string[] {
  const out: string[] = [];
  for (const file of graph.files) {
    out.push(file.p);
    out.push(...(graph.foldedOf[file.p] ?? []));
  }
  return out;
}

/**
 * 정답지를 지도에 남은 노드로 좁힌다.
 *
 * 접히거나 「지도 밖」으로 빠진 파일이 `core` 에 남아 있으면 **고를 수 없는 정답**이 되어
 * 분모만 키운다 — 04 §8.2 의 `pct = |found|/|core|` 가 영원히 100 이 안 된다.
 * 2차 배치가 `keep` 으로 core·sec 를 지키므로 보통은 아무것도 안 지운다.
 */
function onMap(
  table: Record<string, [string, string]>,
  graph: Graph,
): Record<string, [string, string]> {
  const nodes = new Set(graph.files.map((f) => f.p));
  const out: Record<string, [string, string]> = {};
  for (const [path, value] of Object.entries(table)) if (nodes.has(path)) out[path] = value;
  return out;
}

function onMapFlat(table: Record<string, string>, graph: Graph): Record<string, string> {
  const nodes = new Set(graph.files.map((f) => f.p));
  const out: Record<string, string> = {};
  for (const [path, value] of Object.entries(table)) if (nodes.has(path)) out[path] = value;
  return out;
}

export type { AnswerKey };

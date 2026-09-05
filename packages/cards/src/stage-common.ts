/**
 * 코스 생성기들이 나눠 쓰는 부품 (D164) — 시드·해시·창·경로 순서·식별자 뽑기.
 *
 * 문법 이름을 아는 것은 `exec-facts` 뿐이라는 규칙을 여기서도 지킨다: 이 파일의 식별자
 * 뽑기는 **글자**(정규식)로만 본다. AST 가 필요한 것(`reorder`)은 `AstLite` 를 받는다.
 */
import { mulberry32, seedOf, shuffle } from '@chickadee/text';
import type { Hop } from '@chickadee/concepts';
import type { CardPayload, CodeLine, ConceptId, StageNo } from '@chickadee/store-sql';

import { contentHash } from './hash.js';
import { codeLines, promptLines } from './lines.js';
import type { Span } from './lines.js';
import { GEN_VERSION } from './payload.js';
import { KIND_OF, STAGE_OF } from './stage-types.js';
import type { StageCard, StageFile, StageRequest, StageType } from './stage-types.js';
import type { FocusLine, LineWindow } from './types.js';
import { baseName } from './vars.js';

/**
 * 유형별 기본 개념 id — 카드는 개념에 매달려야 한다(`card.concept_id NOT NULL`). 2단 이후의
 * 결과는 겹이 아니라 `stage_log` 로 가므로(D165) 여기의 개념은 이름표에 가깝다. 전부 번들 사전에
 * 있는 id 다 — `materializeDict` 가 행을 만든다.
 */
export const STAGE_CONCEPTS: Readonly<Record<StageType, string>> = {
  point: 'exec/order', twin: 'exec/order', blank: 'exec/order',
  exec: 'exec/order', hop: 'arch/flow', origin: 'common/variable-binding', caller: 'arch/radius',
  'trace-table': 'common/reassignment',
  cut: 'common/conditional-branch', reorder: 'exec/order', contract: 'proto/http-method',
  'patch-line': 'arch/flow', 'patch-place': 'exec/order', rollback: 'arch/flow',
  'reimpl-spec': 'arch/flow', 'reimpl-layer': 'arch/flow', handoff: 'arch/flow',
  order: 'exec/order',
};

export const conceptFor = (req: StageRequest, type: StageType): ConceptId =>
  (req.conceptIds?.[type] ?? STAGE_CONCEPTS[type]) as ConceptId;

/** 04 §0 `seedOf(repoId, kind, targetId, attempt, dictVersion)` — `kind` 자리에 유형을 넣는다. */
export const stageSeed = (req: StageRequest, type: StageType, key: string): number =>
  seedOf(req.repoId, type, key, req.attempt, req.dictVersion);

/** 시드로 고정한 난수. 보기 순서에만 쓴다 — 정답지 자체는 난수를 안 탄다. */
export const rngOf = (seed: number): (() => number) => mulberry32(seed);

/** 보기를 섞고 정답 자리를 다시 찾는다. */
export function shuffled<T>(items: readonly T[], answerAt: number, seed: number): { items: T[]; answer: number } {
  const tagged = items.map((it, i) => ({ it, i }));
  const out = shuffle(tagged, rngOf(seed));
  return { items: out.map((o) => o.it), answer: out.findIndex((o) => o.i === answerAt) };
}

export interface FinishInput {
  req: StageRequest;
  type: StageType;
  /** 시드·해시의 대상 키 — 사용처 키·블록 해시·`path:line` 처럼 줄이 밀려도 안 바뀌는 것. */
  key: string;
  conceptId?: ConceptId;
  fileId?: number | null;
  siteId?: number | null;
  commitId?: number | null;
  payload: CardPayload;
}

export function finishStage(input: FinishInput): StageCard {
  const { req, type } = input;
  const conceptId = input.conceptId ?? conceptFor(req, type);
  const siteId = input.siteId ?? null;
  const stageNo: StageNo = STAGE_OF[type];
  const kind = KIND_OF[type];
  return {
    track: 't3',
    kind,
    type,
    stageNo,
    conceptId,
    unitId: req.unitId,
    fileId: input.fileId ?? null,
    siteId,
    commitId: input.commitId ?? null,
    payload: input.payload,
    // `siteId` 자리에 유형·키를 섞어 넣는다 — 사용처가 없는 카드끼리 해시가 겹치지 않게.
    contentHash: contentHash({
      conceptId, kind: `${kind}/${type}`, siteId: siteId ?? 0, genVersion: GEN_VERSION,
      payload: { ...input.payload, key: input.key },
    }),
    gen: { seed: stageSeed(req, type, input.key), dictVersion: req.dictVersion, attempt: req.attempt, key: input.key },
  };
}

/** `path:line`. 줄이 없으면 경로만 — 요청 줄기의 마지막 칸이 그렇다. */
export const nodeId = (path: string, line: number | null): string =>
  line === null ? path : `${path}:${line}`;

export const shortNode = (path: string, line: number | null): string =>
  line === null ? baseName(path) : `${baseName(path)}:${line}`;

/**
 * 경로 → 요청 흐름에서의 자리(작을수록 앞). 여러 줄기에 나오면 가장 앞자리다.
 * 「요청이 흐르는 순서」(course.md §4 ②)가 이 표 하나로 정해진다.
 */
export function hopOrder(paths: readonly Hop[][]): ReadonlyMap<string, number> {
  const out = new Map<string, number>();
  for (const path of paths) {
    path.forEach((hop, i) => {
      const at = out.get(hop.path);
      if (at === undefined || i < at) out.set(hop.path, i);
    });
  }
  return out;
}

/** 경로 위 파일만, 요청 순서대로. 같은 자리면 경로 이름순. */
export function pathFiles(req: StageRequest): StageFile[] {
  const order = hopOrder(req.paths);
  return [...order.entries()]
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([path]) => req.files.get(path))
    .filter((f): f is StageFile => f !== undefined);
}

export const lineOf = (file: StageFile, n: number): FocusLine | undefined =>
  file.lines.find((l) => l.n === n);

/** 판에 보이는 창 — 초점 ±2(감싸는 블록을 주면 그 블록) 와 프롬프트 줄(±4, D8). */
export function viewOf(
  file: StageFile,
  focus: number,
  spans: readonly Span[] = [],
  block?: LineWindow | undefined,
): { lines: CodeLine[]; promptLines: string[] } {
  return {
    lines: codeLines(file.lines, focus, spans, block),
    promptLines: promptLines(file.lines, focus),
  };
}

const IDENT = /[A-Za-z_$][A-Za-z0-9_$]*/g;
const STOP = new Set([
  'if', 'else', 'for', 'while', 'return', 'new', 'const', 'let', 'var', 'function', 'true', 'false',
  'null', 'undefined', 'this', 'import', 'from', 'export', 'default', 'class', 'public', 'private',
  'protected', 'static', 'final', 'void', 'int', 'long', 'boolean', 'String', 'throw', 'throws', 'try',
  'catch', 'finally', 'await', 'async', 'def', 'self', 'None', 'True', 'False', 'and', 'or', 'not', 'in',
  'is', 'elif', 'pass', 'with', 'as', 'select', 'from', 'where', 'and', 'or', 'insert', 'update', 'set',
  'delete', 'into', 'values', 'AND', 'OR', 'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'SET', 'DELETE',
  'INTO', 'VALUES', 'NULL', 'NOT', 'IS', 'id', 'type', 'name',
]);

/** 줄 하나의 식별자(글자 기준, 두 글자 이상, 예약어 제외). 순서 유지 · 중복 제거. */
export function identsOf(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(IDENT)) {
    const w = m[0];
    if (w.length < 2 || STOP.has(w) || out.includes(w)) continue;
    out.push(w);
  }
  return out;
}

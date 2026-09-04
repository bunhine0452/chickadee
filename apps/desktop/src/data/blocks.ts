/**
 * T1 필사 판 만들기 — 블록 원장과 생성기(`@chickadee/cards`) 사이 (04 §3 · D86).
 *
 * 블록 행은 인제스트가 이미 써 두었다(`packages/concepts` 의 `writeBlocks`). 여기서 하는
 * 일은 셋이다: 후보를 긷고, 그 블록의 **원문을 읽고**, 나온 카드를 `card` 에 넣는다.
 *
 * `data/cards.ts`(T0)와 같은 자리에 있고 같은 규칙을 따른다 — 규칙은 하나도 여기서
 * 만들지 않는다. 순위·마스크·스펙 카드는 생성기가, 판정은 `@chickadee/grading` 이 한다.
 */
import {
  generateT1, isT1Card, type BlockCandidate, type BlockConcept, type FocusLine, type T1Card,
  makeExecCard,
} from '@chickadee/cards';
import type { Dict } from '@chickadee/dictionary';
import { ipc, log, type AstLite } from '@chickadee/ipc-client';
import { estMinFor, type Candidate } from '@chickadee/scheduler';
import { astLiteSchema, type ConceptId } from '@chickadee/store-sql';

/** 한 번에 볼 블록 후보 수. 순위는 TS 가 매기므로 넉넉히 긷고 그 안에서 고른다. */
export const BLOCK_BUDGET = 40;
/** 04 §3.1 상한 — 41줄 이상은 분절되고, 원문 읽기는 그 상한 + 여유까지만 본다. */
export const MAX_BLOCK_LINES = 80;

export interface BlockDeps {
  repoId: number;
  rootPath: string;
  dict: Dict;
  dictVersion: string;
  now: number;
}

/** `block.candidates` 한 행 → 생성기의 후보. 원문(`lines`)은 아직 비어 있다. */
export function toCandidate(row: {
  id: number;
  file_id: number;
  path: string;
  grammar: string | null;
  rev: string | null;
  name: string;
  kind: string;
  line_start: number;
  line_end: number;
  text_hash: string;
  last_commit_at: number | null;
  concepts_json: string;
}): BlockCandidate {
  return {
    blockId: row.id,
    fileId: row.file_id,
    path: row.path,
    rev: row.rev,
    // `block.name` 은 NOT NULL 이라 이름 없는 블록이 빈 문자열로 온다. 생성기는 그 구분을
    // `null` 로 받는다(`payload.fn` 폴백이 본다).
    name: row.name === '' ? null : row.name,
    kind: row.kind,
    lineStart: row.line_start,
    lineEnd: row.line_end,
    textHash: row.text_hash,
    lastCommitAt: row.last_commit_at,
    concepts: parseConcepts(row.concepts_json),
    lines: [],
  };
}

function parseConcepts(json: string): BlockConcept[] {
  try {
    const rows = JSON.parse(json) as BlockConcept[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/**
 * 후보와 그 원문. **여기가 유일하게 파일을 읽는 자리**다 — 카드가 만들어진 뒤에는 원문이
 * `payload.original` 에 구워져 있어 판을 넘길 때 IPC 가 0회다 (05 §10).
 *
 * 01 §3.2 의 `file_read_block` 이 아니라 `file_read_lines` 를 쓴다: 02 `block` 은 줄 범위만
 * 저장하고 바이트 오프셋 열이 없다. 04 §3.1 이 말한 「원본 텍스트는 `file_read_block`」은
 * 어느 명령으로 읽으라는 뜻이 아니라 **원문은 리포에서 읽는다**는 뜻으로 읽었다.
 */
export async function loadCandidates(
  deps: BlockDeps,
): Promise<{ grammar: string; blocks: BlockCandidate[] }[]> {
  const rows = await ipc.store.query('block.candidates', {
    repoId: deps.repoId, limit: BLOCK_BUDGET,
  });
  // 문법별로 나눈다. 마스크 표(04 §3.2)가 문법마다 다르므로 한 번의 생성에 한 문법만
  // 넘긴다 — 섞어 넘기면 순위 1등이 파이썬인데 ts 표로 마스킹하는 일이 생긴다.
  const groups = new Map<string, BlockCandidate[]>();
  for (const row of rows) {
    const candidate = toCandidate(row);
    const span = candidate.lineEnd - candidate.lineStart + 1;
    if (span < 1 || span > MAX_BLOCK_LINES) continue;
    const lines = await readLines(deps.rootPath, candidate);
    if (lines.length === 0) continue;
    const grammar = row.grammar ?? 'typescript';
    groups.set(grammar, [...(groups.get(grammar) ?? []), { ...candidate, lines }]);
  }
  return [...groups.entries()]
    .map(([grammar, blocks]) => ({ grammar, blocks }))
    .sort((a, b) => b.blocks.length - a.blocks.length);
}

async function readLines(rootPath: string, block: BlockCandidate): Promise<string[]> {
  try {
    const chunk = await ipc.file.readLines({
      rootPath,
      relPath: block.path,
      from: block.lineStart,
      to: block.lineEnd + 1,
      ...(block.rev === null ? {} : { rev: block.rev }),
    });
    return chunk.lines;
  } catch {
    // 파일이 사라졌거나 못 읽으면 그 후보만 버린다 — 다음 후보가 있다.
    return [];
  }
}

/**
 * 필사 판 한 장을 만들어 넣는다. 만들 수 없으면 `null` — 사유는 로그에만 남긴다
 * (T1 은 「판이 없는 문법」 패널에 자리가 없다. 그 패널은 개념 단위이고 이것은 블록 단위다).
 */
export async function makeT1Card(
  deps: BlockDeps,
  stage: 1 | 2 | 3,
  whyOwn: readonly string[] = [],
): Promise<{ cardId: number; card: T1Card } | null> {
  const groups = await loadCandidates(deps);
  if (groups.length === 0) return null;

  const essential = essentialOf(deps.dict);
  let result: T1Card | null = null;
  for (const group of groups) {
    const made = generateT1({
      repoId: deps.repoId,
      dictVersion: deps.dictVersion,
      concepts: deps.dict.concepts,
      essential,
      grammar: group.grammar,
      candidates: group.blocks,
      stage,
      ...(whyOwn.length > 0 ? { whyOwn } : {}),
    });
    if (isT1Card(made)) {
      result = made;
      break;
    }
    log.info('필사 판을 만들지 못했다', { reason: made.reason });
  }
  if (result === null) return null;

  await ipc.store.exec('card.insert', {
    repoId: deps.repoId,
    unitId: null,
    track: 't1',
    kind: 'transcribe',
    conceptId: result.conceptId,
    level: stage,
    siteId: null,
    fileId: result.fileId,
    commitId: null,
    payloadJson: JSON.stringify(result.payload),
    genVersion: 1,
    contentHash: result.contentHash,
    createdAt: deps.now,
  });
  const rows = await ipc.store.query('card.by_hash', {
    repoId: deps.repoId, contentHash: result.contentHash,
  });
  const cardId = rows[0]?.id;
  if (cardId === undefined) return null;

  // 부수 개념은 겹에 반영되지 않는다 — 미지 개념 계산이 이 행들을 읽는다 (D27).
  for (const conceptId of result.secondary) {
    await ipc.store.exec('block.card_concept_insert', { cardId, conceptId });
  }
  // 첫 단계는 1 이다. 이후 단계는 판을 마칠 때 `card.state_upsert` 가 움직인다 (02 §4).
  await ipc.store.exec('card.state_upsert', {
    cardId, prints: 0, stage, lastPct: null, estMinEma: null, lastPrintedAt: null,
  });
  return { cardId, card: result };
}

/** `_lang.yaml.essential` 을 전부 합친 집합. D27 의 첫 조건이다. */
export function essentialOf(dict: Dict): Set<string> {
  const out = new Set<string>();
  for (const lang of dict.langs.values()) for (const id of lang.essential) out.add(id);
  // `_lang.yaml` 이 없는 네임스페이스(`common/`·`arch/`)는 개념의 `essential` 을 본다.
  for (const concept of dict.concepts.values()) if (concept.essential) out.add(concept.id);
  return out;
}

// ───────── 판을 걸 때 (04 §4.5) ─────────

/**
 * 원본 블록의 AST. 있으면 캐시를 쓰고 없으면 한 번 파싱해 `block.ast_json` 에 굽는다
 * (04 §3.1 · D14). 실패는 던지지 않는다 — AST 가 없으면 정규식층만 도는 것이 04 §4.5 의
 * 폴백이고, 그것이 「이 언어는 글자 비교만 합니다」로 화면에 나온다.
 */
export async function originalAst(
  blockId: number,
  grammar: string,
  text: string,
): Promise<AstLite | null> {
  const rows = await ipc.store.query('block.get', { id: blockId });
  const cached = rows[0]?.ast_json;
  if (cached !== null && cached !== undefined && cached !== '') {
    const parsed = astLiteSchema.safeParse(JSON.parse(cached));
    if (parsed.success) return parsed.data as AstLite;
  }
  const fresh = await parseSnippet(grammar, text);
  if (fresh === null) return null;
  await ipc.store.exec('block.ast_set', { id: blockId, astJson: JSON.stringify(fresh) });
  return fresh;
}

/** 답안 블록을 한 번 파싱한다 (04 §4.5 — 채점 시 1회). */
export async function parseSnippet(grammar: string, text: string): Promise<AstLite | null> {
  try {
    const result = await ipc.parse.snippet({ grammar, text });
    return result.ast;
  } catch (e) {
    log.warn('답안을 파싱하지 못했다 — 글자 비교만 한다', {
      errorCode: e instanceof Error && 'code' in e ? String(e.code) : 'UNKNOWN',
    });
    return null;
  }
}

/** T1 판 하나를 큐에 걸 후보로. `role` 은 인쇄 횟수가 가른다. */
export const toQueueCandidate = (
  cardId: number,
  conceptId: ConceptId,
  prints: number,
  ema: number | null,
): Candidate => ({
  cardId,
  conceptId,
  track: 't1',
  role: prints > 0 ? 'review' : 'new',
  estMin: estMinFor('t1', prints > 0 ? 'review' : 'new', ema),
});

// ───────── 실행 추적 (D151) ─────────

/** 한 세션에 시도해 보는 블록 수. `bakeNextT2` 의 `BAKE_ATTEMPTS` 와 같은 이유 — 일괄 생성 금지. */
const EXEC_ATTEMPTS = 6;

/** 지금 있는 추적 개념. 늘어나면 여기 붙는다. */
const EXEC_CONCEPT = 'exec/order';

/**
 * 추적 카드를 **한 장** 굽는다 (D151). 없으면 `null`.
 *
 * 블록마다 굽지 않는다 — 일괄 생성 금지(D140 과 같은 이유)이고, 추적은 어차피 세션에 한두
 * 장이면 된다. 짧은 함수에서는 생성기가 사유를 내고 물러나므로 몇 개를 시도해 본다.
 *
 * 실패해도 던지지 않는다: 추적 판이 한 장 안 나오는 것이 세션을 막을 이유는 없다.
 */
export async function bakeNextExec(deps: BlockDeps): Promise<number | null> {
  const concept = deps.dict.concepts.get(EXEC_CONCEPT);
  if (concept === undefined) return null;

  const groups = await loadCandidates(deps);
  let tried = 0;
  for (const { grammar, blocks } of groups) {
    for (const block of blocks) {
      if (tried >= EXEC_ATTEMPTS) return null;
      tried += 1;

      // T1 은 원문 줄(`BlockCandidate.lines`)을 쓰고 추적 생성기는 **줄 번호가 붙은** 줄을
      // 받는다. 읽어 온 첫 줄이 `block.lineStart` 이므로 i 번째가 `lineStart + i` 다
      // (`cards.ts` 의 `readContext` 와 같은 규약).
      const lines: FocusLine[] = block.lines.map((t, i) => ({ n: block.lineStart + i, t }));
      const text = block.lines.join('\n');
      const ast = await originalAst(block.blockId, grammar, text);
      if (ast === null) continue;

      const out = makeExecCard({
        repoId: deps.repoId,
        dictVersion: deps.dictVersion,
        attempt: 0,
        concept,
        concepts: deps.dict.concepts,
        ly: 0,
        lines,
        ast,
        grammar,
        path: block.path,
        window: { from: block.lineStart, to: block.lineEnd },
        blockHash: block.textHash,
      });
      if ('reason' in out) continue;

      // 같은 블록에서 이미 구운 판은 `content_hash` UNIQUE 가 막는다 — 넣어 보고 조회한다.
      await ipc.store.exec('card.insert', {
        repoId: deps.repoId,
        unitId: null,
        track: 't0',
        kind: out.card.kind,
        conceptId: out.card.conceptId,
        level: 1,
        siteId: null,
        fileId: block.fileId,
        commitId: null,
        payloadJson: JSON.stringify(out.card.payload),
        genVersion: 1,
        contentHash: out.card.contentHash,
        createdAt: deps.now,
      });
      const rows = await ipc.store.query('card.by_hash', {
        repoId: deps.repoId, contentHash: out.card.contentHash,
      });
      const cardId = rows[0]?.id;
      if (cardId !== undefined) return cardId;
    }
  }
  return null;
}

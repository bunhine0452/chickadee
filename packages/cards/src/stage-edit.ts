/**
 * 편집형 — 4단 수정(`patch-line`·`patch-place`·`rollback`) · 5단 재구현(`reimpl-spec`·
 * `reimpl-layer`·`handoff`) (D164 · `exercises.md` §2·§3).
 *
 * 4단의 정답지는 **실제 `fix:` 커밋의 hunk** 다 — 사람이 실제로 고친 것이라 지어낼 필요가 없다
 * (README §2 「테스트 통과의 대안은 커밋 원장」). 5단은 블록 원문이 참조 답이고 채점은 T1 사다리다.
 * 둘 다 **문법이 없는 언어에서는 안 낸다** (§3 — AST 승격이 선택이 아니다).
 *
 * 4단 막힘의 프롬프트 창은 앞뒤 4줄 그대로다(정본 §3-1 ④). `promptLines` 가 그 창이다.
 */
import { t } from '@chickadee/i18n';
import type { Hop } from '@chickadee/concepts';
import type { CardPayload } from '@chickadee/store-sql';

import { PROMPT_WINDOW } from './lines.js';
import { finishStage, hopOrder, identsOf } from './stage-common.js';
import type {
  Hunk, HunkLine, StageBlock, StageCard, StageCommit, StageDrop, StageFile, StageRequest,
} from './stage-types.js';
import { buildSpec } from './t1-spec.js';
import { baseName } from './vars.js';

type Repair = Extract<CardPayload, { kind: 'repair' }>;
type Reimpl = Extract<CardPayload, { kind: 'reimpl' }>;

/** 재구현 대상의 크기 (`chapter-login.md` §7-6 「30~120줄」을 T1 블록 하한 12 로 완화). */
export const MIN_REIMPL_LINES = 12;
export const MAX_REIMPL_LINES = 120;
/** 챕터당 5단 문항 상한 3 — 유형마다 한 장. 4단도 같다. */
export const MAX_PER_TYPE = 1;

const FIX = /^(fix|bugfix|hotfix)\b/i;
/** `fix(scope)!: 제목` → `제목`. */
export const fixSubject = (message: string): string =>
  message.replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, '').trim();

const side = (hunk: Hunk, keep: readonly HunkLine['sign'][]): string[] =>
  hunk.lines.filter((l) => keep.includes(l.sign)).map((l) => l.text);

/** 창 안 `target` 줄의 앞뒤 4줄 — 4단 프롬프트 창 (D8). */
const around = (lines: readonly string[], target: number): string[] =>
  lines.slice(Math.max(0, target - PROMPT_WINDOW), target + PROMPT_WINDOW + 1);

/** 경로 위 파일을 고친 fix 커밋 — 최근 것부터, 같은 날이면 sha 순. */
function fixCommits(req: StageRequest): StageCommit[] {
  const onPath = new Set(hopOrder(req.paths).keys());
  return (req.commits ?? [])
    .filter((c) => FIX.test(c.message) && c.files.some((f) => onPath.has(f.path) && f.hunks.length > 0))
    .sort((a, b) => b.date.localeCompare(a.date) || a.sha.localeCompare(b.sha));
}

export function buildRepairs(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const commits = fixCommits(req);
  if (commits.length === 0) return { cards, drops: [{ type: 'patch-line', reason: t('stage.patchNoFix') }] };
  const onPath = hopOrder(req.paths);
  const done = { line: 0, place: 0, back: 0 };

  for (const commit of commits) {
    const goal = fixSubject(commit.message);
    const meta = { h: commit.sha.slice(0, 7), d: commit.date, m: goal };
    for (const f of commit.files) {
      if (!onPath.has(f.path)) continue;
      const file = req.files.get(f.path);
      if (file === undefined || file.grammar === null) continue;
      const grammar = file.grammar;
      for (const hunk of f.hunks) {
        const plus = hunk.lines.filter((l) => l.sign === '+');
        const minus = hunk.lines.filter((l) => l.sign === '-');
        const keyBase = `${commit.sha}:${f.path}:${hunk.oldStart}`;

        if (done.line < MAX_PER_TYPE && plus.length === 1 && minus.length === 1) {
          const before = side(hunk, [' ', '-']);
          const target = hunk.lines.filter((l) => l.sign !== '+').findIndex((l) => l.sign === '-');
          const payload: Repair = {
            track: 't3', kind: 'repair', type: 'patch-line', stage: 4, file: f.path, grammar, goal, commit: meta,
            q: t('stage.patchLineQ', { goal, line: String(hunk.oldStart + target) }),
            lines: before, from: hunk.oldStart, target, expected: [(plus[0] as HunkLine).text],
            promptLines: around(before, target),
          };
          cards.push(finishStage({ req, type: 'patch-line', key: `${keyBase}#line`, fileId: file.fileId, commitId: commit.id, payload }));
          done.line += 1;
          continue;
        }
        if (done.place < MAX_PER_TYPE && plus.length === 1 && minus.length === 0) {
          const afterAll = hunk.lines.filter((l) => l.sign !== '-');
          const idx = afterAll.findIndex((l) => l.sign === '+');
          const lines = afterAll.filter((_, i) => i !== idx).map((l) => l.text);
          const payload: Repair = {
            track: 't3', kind: 'repair', type: 'patch-place', stage: 4, file: f.path, grammar, goal, commit: meta,
            q: t('stage.patchPlaceQ', { text: (plus[0] as HunkLine).text.trim() }),
            lines, from: hunk.newStart, target: idx, expected: [(plus[0] as HunkLine).text],
            promptLines: around(lines, idx),
          };
          cards.push(finishStage({ req, type: 'patch-place', key: `${keyBase}#place`, fileId: file.fileId, commitId: commit.id, payload }));
          done.place += 1;
          continue;
        }
        if (done.back < MAX_PER_TYPE && minus.length >= 1 && plus.length >= 1) {
          const after = side(hunk, [' ', '+']);
          const before = side(hunk, [' ', '-']);
          const target = hunk.lines.filter((l) => l.sign !== '-').findIndex((l) => l.sign === '+');
          const payload: Repair = {
            track: 't3', kind: 'repair', type: 'rollback', stage: 4, file: f.path, grammar, goal, commit: meta,
            q: t('stage.rollbackQ', { goal }),
            lines: after, from: hunk.newStart, target, expected: before,
            promptLines: around(after, target),
          };
          cards.push(finishStage({ req, type: 'rollback', key: `${keyBase}#back`, fileId: file.fileId, commitId: commit.id, payload }));
          done.back += 1;
        }
      }
    }
  }
  if (cards.length === 0) drops.push({ type: 'patch-line', reason: t('stage.patchNoHunk') });
  return { cards, drops };
}

// ───────── 5단 · 재구현 ─────────

const blockLines = (file: StageFile, block: StageBlock): string[] =>
  file.lines.filter((l) => l.n >= block.window.from && l.n <= block.window.to).map((l) => l.t);

/** 재구현 후보 — 경로 위, 이름 있는 블록, 크기 안. 개념이 많은 것부터, 같으면 짧은 것부터. */
function candidates(req: StageRequest): { block: StageBlock; file: StageFile }[] {
  const order = hopOrder(req.paths);
  return (req.blocks ?? [])
    .filter((b) => b.name !== null && order.has(b.path))
    .map((block) => ({ block, file: req.files.get(block.path) }))
    .filter((c): c is { block: StageBlock; file: StageFile } => c.file !== undefined && c.file.grammar !== null)
    .filter(({ block }) => {
      const n = block.window.to - block.window.from + 1;
      return n >= MIN_REIMPL_LINES && n <= MAX_REIMPL_LINES;
    })
    .sort((a, b) => b.block.concepts.length - a.block.concepts.length
      || (a.block.window.to - a.block.window.from) - (b.block.window.to - b.block.window.from)
      || (order.get(a.block.path) ?? 0) - (order.get(b.block.path) ?? 0));
}

const promptAt = (file: StageFile, from: number): string[] =>
  file.lines.filter((l) => Math.abs(l.n - from) <= PROMPT_WINDOW).map((l) => l.t);

const MAPPER_ID = /\bid\s*=\s*["']([A-Za-z_][\w]*)["']/g;

/**
 * 연결 검사의 이름들 — 이 블록과 이웃 층이 **같이 쓰는** 식별자. 호출 이름·SQL `id`·파라미터가
 * 여기서 나온다 (`exercises.md` §3 ⓑⓒⓓ). 세 글자 이상, 긴 것부터, 최대 여섯.
 */
export function linksBetween(block: readonly string[], neighbors: readonly string[]): string[] {
  const mine = new Set(block.flatMap(identsOf).filter((w) => w.length >= 3));
  const theirs = new Set(neighbors.flatMap(identsOf).filter((w) => w.length >= 3));
  for (const text of [...block, ...neighbors]) {
    for (const m of text.matchAll(MAPPER_ID)) theirs.add(m[1] as string);
  }
  return [...mine].filter((w) => theirs.has(w)).sort((a, b) => b.length - a.length || a.localeCompare(b)).slice(0, 6);
}

/** 이 파일의 이웃 칸 — 줄기에서 바로 앞·뒤. 그 칸의 간선 줄 ±4 가 사양이 된다. */
function neighborsOf(req: StageRequest, path: string): { file: string; lines: string[] }[] {
  const out: { file: string; lines: string[] }[] = [];
  const seen = new Set<string>();
  for (const hops of req.paths) {
    const at = hops.findIndex((h) => h.path === path);
    if (at < 0) continue;
    for (const hop of [hops[at - 1], hops[at + 1]]) {
      if (hop === undefined || seen.has(hop.path)) continue;
      const file = req.files.get(hop.path);
      if (file === undefined) continue;
      seen.add(hop.path);
      const focus = hop.line ?? (hops[at - 1] === hop ? (hops[at - 1] as Hop).line : null) ?? file.lines[0]?.n ?? 1;
      out.push({ file: hop.path, lines: file.lines.filter((l) => Math.abs(l.n - focus) <= 6).map((l) => l.t) });
    }
  }
  return out;
}

export function buildReimpls(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const pool = candidates(req);
  const first = pool[0];
  if (first === undefined) {
    return { cards, drops: [{ type: 'reimpl-spec', reason: t('stage.reimplNoBlock', { min: String(MIN_REIMPL_LINES), max: String(MAX_REIMPL_LINES) }) }] };
  }

  // reimpl-spec + handoff — 같은 블록. 「내가 쓴 것이 진짜 도는지」는 그 블록에 대해 묻는다.
  {
    const { block, file } = first;
    const original = blockLines(file, block);
    const spec = buildSpec({ lines: original, grammar: block.grammar, concepts: block.concepts, dict: req.concepts, path: block.path });
    const fn = block.name as string;
    const base: Omit<Reimpl, 'type' | 'question' | 'links' | 'context'> = {
      track: 't3', kind: 'reimpl', stage: 5, file: block.path, grammar: block.grammar, fn,
      original, from: block.window.from, signature: spec.signature, mustHold: spec.mustHold,
      promptLines: promptAt(file, block.window.from), blockId: block.blockId,
    };
    cards.push(finishStage({
      req, type: 'reimpl-spec', key: block.hash, fileId: file.fileId,
      payload: { ...base, type: 'reimpl-spec', question: t('stage.reimplSpecQ', { fn }), links: [], context: [] },
    }));
    cards.push(finishStage({
      req, type: 'handoff', key: block.hash, fileId: file.fileId,
      payload: { ...base, type: 'handoff', question: t('stage.handoffQ', { fn }), links: [], context: [] },
    }));
  }

  // reimpl-layer — 이웃 층이 있는 블록. 첫 후보와 같아도 된다(문항이 다르다).
  const layered = pool.map((c) => ({ ...c, context: neighborsOf(req, c.block.path) }))
    .map((c) => ({ ...c, links: linksBetween(blockLines(c.file, c.block), c.context.flatMap((n) => n.lines)) }))
    .find((c) => c.context.length > 0 && c.links.length > 0);
  if (layered === undefined) {
    drops.push({ type: 'reimpl-layer', reason: t('stage.reimplNoNeighbor') });
    return { cards, drops };
  }
  {
    const { block, file } = layered;
    const original = blockLines(file, block);
    const spec = buildSpec({ lines: original, grammar: block.grammar, concepts: block.concepts, dict: req.concepts, path: block.path });
    const fn = block.name as string;
    cards.push(finishStage({
      req, type: 'reimpl-layer', key: block.hash, fileId: file.fileId,
      payload: {
        track: 't3', kind: 'reimpl', type: 'reimpl-layer', stage: 5, file: block.path, grammar: block.grammar, fn,
        original, from: block.window.from, signature: spec.signature, mustHold: spec.mustHold,
        links: layered.links, context: layered.context,
        question: t('stage.reimplLayerQ', { file: baseName(block.path), fn }),
        promptLines: promptAt(file, block.window.from), blockId: block.blockId,
      },
    }));
  }
  return { cards, drops };
}

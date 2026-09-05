/**
 * 2단 추적 (D164) — `hop` · `caller` · `exec`.
 *
 * 셋 다 **예전 판 모양을 빌린다** (`exercises.md` §5 표): `hop` 은 흐름 추적(`flow`, t2 지도)에
 * 노드를 파일이 아니라 `path:line` 으로 두고, `caller` 는 영향 반경(`radius`, t2 지도)에 「부르는
 * 쪽」을 정답으로 두며, `exec` 은 실행 추적 카드(`t0-exec`, t0 지목형)를 그대로 굽는다.
 * 채점기도 그대로다 — `gradeFlow`·`gradePicks`·`gradeT0`. 2단은 통과가 「전부 맞음」이므로
 * `gradeStage` 가 그 위에서 한 번 더 자른다.
 */
import { t } from '@chickadee/i18n';
import type { Hop } from '@chickadee/concepts';
import type { CardPayload, EdgeKind } from '@chickadee/store-sql';

import { makeExecCard, EXEC_SITE_ID } from './t0-exec.js';
import { finishStage, hopOrder, nodeId, pathFiles } from './stage-common.js';
import type { StageCard, StageDrop, StageFile, StageRequest } from './stage-types.js';
import { bandNames, type Band } from './t2-types.js';
import { FLOW_DECOYS, FLOW_MAX } from './t2-quiz.js';
import { isFailure } from './types.js';
import { baseName } from './vars.js';

type T2Payload = Extract<CardPayload, { track: 't2' }>;

export const MAX_HOP = 12;
export const MAX_CALLER = 2;
export const MAX_EXEC = 3;

/** 파일 이름·확장자로 층을 짐작한다 — 지도의 세로 자리일 뿐 정답지에는 안 든다. */
export function layerOf(path: string, index: number, total: number): Band {
  const base = baseName(path).toLowerCase();
  if (/\.(vue|jsx?|tsx?|html|css)$/.test(base)) return 0;
  if (/controller|router|route|handler|resource|endpoint/.test(base)) return 1;
  if (/service|usecase|manager|util|filter|config|security/.test(base)) return 2;
  if (/\.(xml|sql)$|dao|mapper|repository|entity|model|dto|schema/.test(base)) return 3;
  return Math.min(3, Math.floor((index * 4) / Math.max(1, total))) as Band;
}

/** 매퍼(언어가 바뀌는 자리)의 첫 칸. 없으면 -1. */
const mapperAt = (hops: readonly Hop[]): number =>
  hops.findIndex((h) => /\.(xml|sql)$/i.test(h.path));

interface HopQuiz {
  hops: Hop[];
  label: string;
}

/**
 * 줄기를 판 크기(`FLOW_MAX`)로 자른다. 자르는 자리는 매퍼 — 경로에서 언어가 바뀌는 유일한
 * 지점이다 (`exercises.md` §2). 매퍼가 없으면 가운데서 자른다.
 */
export function splitHops(hops: readonly Hop[]): HopQuiz[] {
  if (hops.length <= FLOW_MAX) return [{ hops: [...hops], label: '' }];
  const cut = mapperAt(hops);
  const at = cut > 1 && cut < hops.length - 1 ? cut : Math.ceil(hops.length / 2);
  return [
    { hops: hops.slice(0, Math.min(at + 1, FLOW_MAX)), label: t('stage.hopDown') },
    { hops: hops.slice(at, at + FLOW_MAX), label: t('stage.hopUp') },
  ];
}

export function buildHops(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  if (req.paths.length === 0) return { cards, drops: [{ type: 'hop', reason: t('stage.noPaths') }] };
  const bands = bandNames().map((l, i) => ({ l, s: String(i) }));

  for (const path of req.paths) {
    if (cards.length >= MAX_HOP) break;
    if (path.length < 2) { drops.push({ type: 'hop', reason: t('stage.hopTooShort') }); continue; }
    const parts = splitHops(path);
    for (const part of parts) {
      const answer = part.hops.map((h) => nodeId(h.path, h.line));
      // 함정 형제 — 같은 파일의 다른 요청이 지나는 줄. 「같은 컨트롤러의 다른 라우트」다.
      const siblings = req.paths.filter((p) => p !== path)
        .flatMap((p) => p.map((h) => nodeId(h.path, h.line)))
        .filter((id, i, all) => !answer.includes(id) && all.indexOf(id) === i
          && part.hops.some((h) => id.startsWith(`${h.path}:`)))
        .sort()
        .slice(0, FLOW_DECOYS);
      const deck = [...answer, ...siblings].sort();
      const files: T2Payload['files'] = deck.map((id) => {
        const hopAt = part.hops.findIndex((h) => nodeId(h.path, h.line) === id);
        const filePath = id.replace(/:\d+$/, '');
        const idx = hopAt >= 0 ? hopAt : part.hops.findIndex((h) => h.path === filePath);
        return { p: id, r: layerOf(filePath, Math.max(0, idx), part.hops.length) };
      });
      const edges: [string, string, EdgeKind][] = [];
      for (let i = 0; i + 1 < part.hops.length; i += 1) {
        const from = part.hops[i] as Hop;
        const to = part.hops[i + 1] as Hop;
        edges.push([nodeId(from.path, from.line), nodeId(to.path, to.line), from.kind ?? 'static']);
      }
      const trap: Record<string, string> = {};
      for (const id of siblings) trap[id] = t('stage.hopTrapSibling');
      const first = part.hops[0] as Hop;
      const last = part.hops[part.hops.length - 1] as Hop;
      const key = `${answer[0] ?? ''}>${answer[answer.length - 1] ?? ''}`;
      const payload: T2Payload = {
        track: 't2', kind: 'flow',
        q: (part.label === '' ? '' : `${part.label} — `)
          + t('stage.hopQ', { first: baseName(first.path), last: baseName(last.path) }),
        hint: t('stage.hopHint'),
        bands, files, edges, core: {}, sec: {}, trap,
        hints: [
          t('stage.hopHint1', { n: String(answer.length) }),
          t('stage.hopHint2'),
          t('stage.hopHint3', { first: baseName(first.path) }),
        ],
        flow: { answer, deck },
      };
      cards.push(finishStage({
        req, type: 'hop', key, fileId: req.files.get(first.path)?.fileId ?? null, payload,
      }));
    }
  }
  return { cards, drops };
}

/**
 * 「이 파일을 부르는 자리는」. 대상 = 경로 위 파일 중 기능 안에서 불리는 것 — 불리는 수가
 * 적은 것부터(「리포 전체에서 여기 하나뿐이다」가 가장 좋은 문항이다). 함정 = 대상이 **쓰는**
 * 파일(방향이 반대다). 지도는 대상·부르는 쪽·함정·기능의 다른 파일 몇 장으로 작게 그린다.
 */
export function buildCallers(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const order = hopOrder(req.paths);
  const inUnit = new Set(req.files.keys());
  const inbound = new Map<string, string[]>();
  const outbound = new Map<string, string[]>();
  for (const e of req.edges) {
    if (e.kind === 'type' || !inUnit.has(e.from) || !inUnit.has(e.to) || e.from === e.to) continue;
    inbound.set(e.to, [...new Set([...(inbound.get(e.to) ?? []), e.from])].sort());
    outbound.set(e.from, [...new Set([...(outbound.get(e.from) ?? []), e.to])].sort());
  }
  // 불리는 수가 적은 것부터(「리포 전체에서 여기 하나뿐이다」), 깊은 층부터, 코드 파일부터 —
  // 매퍼 XML 을 「부르는」 것은 이름공간 결합이라 문항으로는 덜 가르친다.
  const isCode = (p: string): number => (/\.(xml|sql|json|ya?ml)$/i.test(p) ? 1 : 0);
  const targets = pathFiles(req).map((f) => f.path)
    .filter((p) => (inbound.get(p)?.length ?? 0) > 0 && (order.get(p) ?? 0) > 0)
    .sort((a, b) => (inbound.get(a)?.length ?? 0) - (inbound.get(b)?.length ?? 0)
      || isCode(a) - isCode(b) || (order.get(b) ?? 0) - (order.get(a) ?? 0) || a.localeCompare(b));
  if (targets.length === 0) return { cards, drops: [{ type: 'caller', reason: t('stage.callerNone') }] };
  const bands = bandNames().map((l, i) => ({ l, s: String(i) }));

  for (const target of targets.slice(0, MAX_CALLER)) {
    const callers = inbound.get(target) ?? [];
    const traps = (outbound.get(target) ?? []).filter((p) => !callers.includes(p));
    const others = [...inUnit].filter((p) => p !== target && !callers.includes(p) && !traps.includes(p))
      .sort().slice(0, Math.max(0, 4 - traps.length));
    const nodes = [target, ...callers, ...traps, ...others];
    const files: T2Payload['files'] = nodes.map((p) => ({ p, r: layerOf(p, order.get(p) ?? 0, 4) }));
    const edges: [string, string, EdgeKind][] = [];
    for (const c of callers) edges.push([c, target, 'static']);
    for (const p of traps) edges.push([target, p, 'static']);
    const name = baseName(target);
    const core: Record<string, [string, string]> = {};
    for (const c of callers) core[c] = ['', t('stage.callerCore', { target: name })];
    const trap: Record<string, string> = {};
    for (const p of traps) trap[p] = t('stage.callerTrap', { target: name });
    const payload: T2Payload = {
      track: 't2', kind: 'radius',
      q: t('stage.callerQ', { target: name }), hint: t('stage.callerHint'),
      bands, files, edges, core, sec: {}, trap,
      hints: [
        t('stage.callerHint1', { n: String(callers.length) }),
        t('stage.callerHint2'),
        t('stage.callerHint3', { target: name }),
      ],
    };
    cards.push(finishStage({
      req, type: 'caller', key: target, fileId: req.files.get(target)?.fileId ?? null, payload,
    }));
  }
  return { cards, drops };
}

/**
 * 실행 추적 — `t0-exec` 을 그대로 부르고 코스 카드로 다시 싼다. 개념은 `exec/order` 이고,
 * 사전에 그 개념이 없으면 안 낸다(사전 3층·`ok`·`rule` 을 그 개념이 댄다).
 */
export function buildExecs(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  const concept = req.concepts.get('exec/order');
  if (concept === undefined) return { cards, drops: [{ type: 'exec', reason: t('exec.noGrammar') }] };
  const order = hopOrder(req.paths);
  const blocks = (req.blocks ?? []).filter((b) => b.ast !== null && order.has(b.path))
    .sort((a, b) => (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0) || a.window.from - b.window.from);
  const seenFile = new Set<string>();

  for (const block of blocks) {
    if (cards.length >= MAX_EXEC) break;
    if (seenFile.has(block.path)) continue;
    const file = req.files.get(block.path) as StageFile;
    const lines = file.lines.filter((l) => l.n >= block.window.from && l.n <= block.window.to);
    const out = makeExecCard({
      repoId: req.repoId, dictVersion: req.dictVersion, attempt: req.attempt,
      concept, concepts: req.concepts, ly: 0,
      lines, ast: block.ast as NonNullable<typeof block.ast>, grammar: block.grammar,
      path: block.path, window: block.window, blockHash: block.hash,
    });
    if (isFailure(out)) { drops.push({ type: 'exec', reason: out.reason }); continue; }
    cards.push(finishStage({
      req, type: 'exec', key: block.hash, conceptId: out.card.conceptId,
      fileId: file.fileId, siteId: EXEC_SITE_ID, payload: out.card.payload,
    }));
    seenFile.add(block.path);
  }
  return { cards, drops };
}

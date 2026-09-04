/**
 * 판 만들기 — 생성기(`@chickadee/cards`)와 원장 사이 (04 §1 · 02 §6.2).
 *
 * 생성기는 순수 함수라 사용처·맥락 줄·사전을 전부 받아야 한다. 그것을 긷고, 나온 카드를
 * `card` 에 넣고, 안 나오면 그 개념을 「판이 없는 문법」에 사유와 함께 남기는 것이 여기 일이다.
 */
import {
  generateKind, generateT0, isFailure, isNoPlate, makeSyntheticCard, windowOf,
  type FocusLine, type GenResult, type LineWindow, type NoPlate, type OtherUse,
  type SiteInput, type T0Card,
} from '@chickadee/cards';
import { CARD_ONLY_SITE_ID } from '@chickadee/concepts';
import type { Dict } from '@chickadee/dictionary';
import { ipc } from '@chickadee/ipc-client';
import { estMinFor, type Candidate } from '@chickadee/scheduler';
import { fromConceptSiteRow, type ConceptId, type ConceptSite, type Layer } from '@chickadee/store-sql';

import { makeT1Card } from './blocks.js';
import { bakeNextT2 } from './graph.js';
import type { CardMaker } from './session.js';

/** 카드 하나에 볼 사용처 수. 사슬이 몇 번 미끄러져도 이 안에서 끝난다 (04 §1.4). */
export const SITE_BUDGET = 6;
/** 사다리 3단·`{{other.*}}` 에 쓸 다른 자리 수 (04 §2.4). */
export const OTHER_USES = 3;
/**
 * 창을 못 찾았을 때 읽는 폭이자 **언제나 읽어야 하는 최소 폭**이다.
 *
 * 창은 D141 부터 초점을 감싸는 블록이지만, `payload.promptLines` 는 창이 아무리 좁아도
 * 초점 ±4 를 담아야 한다 (정본 §3-1 · D8). 그래서 읽는 범위는 창 ∪ 초점 ±4 다.
 */
export const CONTEXT_RADIUS = 4;

export interface MakerDeps {
  repoId: number;
  rootPath: string;
  dict: Dict;
  dictVersion: string;
  /** 개념 → 현재 겹. 유형 선호(04 §1.4)와 카드 `level`(02 §6.2)이 이것으로 갈린다. */
  layerOf: (conceptId: ConceptId) => Layer;
  now: number;
}

/**
 * 세션 큐가 쓰는 카드 포트. 복습은 있는 카드를 고르고, 없으면 새로 만든다 —
 * 「같은 개념이 점점 복잡한 자기 코드로 나온다」가 여기서 성립한다 (02 §6.2).
 */
export function cardMaker(deps: MakerDeps): CardMaker {
  return {
    async forReview(conceptId, layer) {
      const level = levelForLayer(layer);
      const rows = await ipc.store.query('queue.pick_card', {
        repoId: deps.repoId, conceptId, level,
      });
      const found = rows[0];
      if (found) {
        return {
          cardId: found.id,
          conceptId,
          track: found.track as Candidate['track'],
          role: 'review',
          estMin: estMinFor(found.track as Candidate['track'], 'review'),
        };
      }
      // 그 겹에 맞는 카드가 아직 없다 — 지금 만든다.
      const made = await makeCard(deps, conceptId, null, level);
      return made === null
        ? null
        : { cardId: made, conceptId, track: 't0', role: 'review', estMin: estMinFor('t0', 'review') };
    },

    async forNew(conceptId, siteId) {
      // 사용처 없이 이미 구워진 카드 (D154 · 추적). 만들 것이 아니라 **찾을** 것이다 —
      // `makeCard` 를 부르면 없는 사용처를 읽으려다 사유 없이 실패한다.
      if (siteId === CARD_ONLY_SITE_ID) {
        const rows = await ipc.store.query('queue.pick_card', {
          repoId: deps.repoId, conceptId, level: 1,
        });
        const id = rows[0]?.id;
        return id === undefined
          ? null
          : { cardId: id, conceptId, track: 't0', role: 'new', estMin: estMinFor('t0', 'new') };
      }
      const made = await makeCard(deps, conceptId, siteId, 1);
      return made === null
        ? null
        : { cardId: made, conceptId, track: 't0', role: 'new', estMin: estMinFor('t0', 'new') };
    },

    async forBlock() {
      // T1 은 개념이 아니라 **블록**에서 나온다 (04 §3.1) — 그 경로는 `data/blocks.ts` 다.
      // 첫 판은 언제나 1단계(보고 치기)다.
      const made = await makeT1Card(
        { repoId: deps.repoId, rootPath: deps.rootPath, dict: deps.dict, dictVersion: deps.dictVersion, now: deps.now },
        1,
      );
      return made === null
        ? null
        : {
            cardId: made.cardId,
            conceptId: made.card.conceptId,
            track: 't1',
            role: 'new',
            estMin: estMinFor('t1', 'new'),
          };
    },

    async forUnit() {
      // T2 는 개념이 아니라 **대지**에서 나온다 (04 §7.4) — 그 경로는 `data/graph.ts` 다.
      // 무엇을 언제 굽는지(대지 × 종 회전 · 세션당 한 장)는 D140 대로 `bakeNextT2` 가 안다.
      // 전에는 여기서 `home.units` 를 훑어 **늘 첫 대지**를 골랐고, 그 위에 큐가 이미 있는
      // 카드만 돌려주는 문장이 겹쳐 판이 리포당 한 장에서 멈췄다.
      const made = await bakeNextT2({
        repoId: deps.repoId, rootPath: deps.rootPath, now: deps.now,
      });
      return made === null ? null : {
        cardId: made.cardId,
        conceptId: made.card.conceptId,
        track: 't2' as const,
        role: 'new' as const,
        estMin: estMinFor('t2', 'new'),
      };
    },
  };
}

/** 02 §6.2 끝 — 첫 노출 1, 2겹부터 2, 3겹부터 3. */
const levelForLayer = (layer: number): 1 | 2 | 3 => (layer <= 1 ? 1 : layer === 2 ? 2 : 3);

/**
 * 카드 한 장을 만들어 넣는다. 만들 수 없으면 사유를 `gap.reason` 에 적고 `null` —
 * **사유 없는 「불가」는 없다**(04 §1.4). 그 사유가 곧 사전 기여 표면이다.
 */
export async function makeCard(
  deps: MakerDeps,
  conceptId: ConceptId,
  preferSiteId: number | null,
  level: 1 | 2 | 3,
  attempt = 0,
  kind?: 'point' | 'blank' | 'meaning',
): Promise<number | null> {
  const concept = deps.dict.concepts.get(conceptId);
  if (concept === undefined) return null;

  const sites = await loadSiteInputs(deps, conceptId, preferSiteId);
  if (sites.length === 0) return null;

  const request = {
    repoId: deps.repoId,
    dictVersion: deps.dictVersion,
    attempt,
    concept,
    concepts: deps.dict.concepts,
    ly: deps.layerOf(conceptId),
    sites,
    ...langDefaults(deps.dict, conceptId),
  };

  // `generateKind` 는 사슬을 타지 않는다 — 재출제가 같은 유형을 고집할 때만 쓴다 (04 §2.3).
  const result = kind
    ? toCard(generateKind(request, kind, sites[0] as SiteInput))
    : generateT0(request);
  if (isNoPlate(result)) {
    await noteNoPlate(deps.repoId, conceptId, result.reason);
    return null;
  }
  const card = result;

  await ipc.store.exec('card.insert', {
    repoId: deps.repoId,
    unitId: null,
    track: 't0',
    kind: card.kind,
    conceptId,
    level,
    siteId: card.siteId,
    fileId: null,
    commitId: null,
    payloadJson: JSON.stringify(card.payload),
    genVersion: 1,
    contentHash: card.contentHash,
    createdAt: deps.now,
  });
  const rows = await ipc.store.query('card.by_hash', {
    repoId: deps.repoId, contentHash: card.contentHash,
  });
  const id = rows[0]?.id ?? null;
  if (id !== null) {
    await ipc.store.exec('card.gap_close', {
      repoId: deps.repoId, conceptId, status: 'card_made',
    });
  }
  return id;
}

/**
 * 합성 예제 판 한 장 (D137 · 방안 E-4).
 *
 * `makeCard` 가 판을 못 낸 개념에만 쓴다 — 사용처는 있는데 미지가 많아 아직 못 여는
 * 자리다. `previewSiteId` 는 **필수**이고, 그 값이 곧 「곧 여기서 봅니다」의 대상이다.
 * 예고할 자리가 없으면 이 함수를 부를 수 없다(타입이 막는다).
 *
 * 원장의 `card.site_id` 는 **NULL** 이다 — 대응하는 `concept_site` 행이 없다. 생성기가
 * 쓰는 자리표(`SYNTHETIC_SITE_ID`)를 그대로 넣으면 외래키가 깨진다.
 */
export async function makeSyntheticPlate(
  deps: MakerDeps,
  conceptId: ConceptId,
  previewSiteId: number,
): Promise<number | null> {
  const concept = deps.dict.concepts.get(conceptId);
  if (concept === undefined) return null;

  const result = makeSyntheticCard({
    repoId: deps.repoId,
    dictVersion: deps.dictVersion,
    attempt: 0,
    concept,
    concepts: deps.dict.concepts,
    ly: deps.layerOf(conceptId),
    previewSiteId,
    ...langDefaults(deps.dict, conceptId),
  });
  if (isFailure(result)) {
    await noteNoPlate(deps.repoId, conceptId, result.reason);
    return null;
  }
  const card = result.card;

  await ipc.store.exec('card.insert', {
    repoId: deps.repoId,
    unitId: null,
    track: 't0',
    kind: card.kind,
    conceptId,
    level: 1,
    siteId: null,
    fileId: null,
    commitId: null,
    payloadJson: JSON.stringify(card.payload),
    genVersion: 1,
    contentHash: card.contentHash,
    createdAt: deps.now,
  });
  const rows = await ipc.store.query('card.by_hash', {
    repoId: deps.repoId, contentHash: card.contentHash,
  });
  return rows[0]?.id ?? null;
}

/** `GenResult` → `T0Card | NoPlate`. 실패 사유를 그대로 나른다. */
function toCard(r: GenResult): T0Card | NoPlate {
  return isFailure(r) ? { noPlate: true, reason: r.reason } : r.card;
}

/** 04 §2.3 재출제 — 같은 개념·다른 사용처·`attempt+1`. */
export async function makeRetryCard(
  deps: MakerDeps,
  conceptId: ConceptId,
  siteId: number,
  kind: 'point' | 'blank' | 'meaning',
  attempt: number,
): Promise<number | null> {
  return makeCard(deps, conceptId, siteId, levelForLayer(deps.layerOf(conceptId)), attempt, kind);
}

async function noteNoPlate(repoId: number, conceptId: ConceptId, reason: string): Promise<void> {
  await ipc.store.exec('card.gap_reason', { repoId, conceptId, reason });
}

/** `_lang.yaml.diag_default` — 지목형 진단 폴백 (04 §2.1). */
function langDefaults(dict: Dict, conceptId: string): { diagDefault?: { point: string; blank: string } } {
  const lang = conceptId.split('/')[0] ?? '';
  const meta = dict.langs.get(lang);
  return meta ? { diagDefault: meta.diag_default } : {};
}

/**
 * 사용처와 그 둘레. **여기가 유일하게 파일을 읽는 자리**다 — 카드가 만들어진 뒤에는
 * 맥락 줄이 `payload` 에 구워져 있어 판을 넘길 때 IPC 가 0회다 (05 §10).
 */
async function loadSiteInputs(
  deps: MakerDeps,
  conceptId: ConceptId,
  preferSiteId: number | null,
): Promise<SiteInput[]> {
  const rows = await ipc.store.query('card.sites_for_concept', {
    repoId: deps.repoId, conceptId, limit: SITE_BUDGET,
  });
  if (rows.length === 0) return [];

  const ordered = preferSiteId === null
    ? rows
    : [...rows].sort((a, b) => Number(b.id === preferSiteId) - Number(a.id === preferSiteId));

  const others: OtherUse[] = ordered.slice(1, 1 + OTHER_USES).map((r) => ({
    siteId: r.id, file: r.path, line: r.line_start, text: r.excerpt,
  }));

  const out: SiteInput[] = [];
  const blocks = new Map<number, LineWindow[]>();
  for (const row of ordered) {
    const site = fromConceptSiteRow(row) as ConceptSite;
    const block = enclosingBlock(
      await blocksOfFile(row.file_id, blocks), row.line_start,
    );
    const lines = await readContext(deps.rootPath, row.path, row.line_start, row.excerpt, block);
    const lineSites = await ipc.store.query('card.sites_on_line', {
      repoId: deps.repoId, fileId: row.file_id, lineStart: row.line_start,
      lineEnd: row.line_end, exceptId: row.id,
    });
    out.push({
      site,
      path: row.path,
      lines,
      ...(block === undefined ? {} : { block }),
      lineSites: lineSites.map((r) => fromConceptSiteRow(r) as ConceptSite),
      others: others.filter((o) => o.siteId !== row.id),
    });
  }
  return out;
}

/**
 * 한 파일의 살아 있는 블록 (02 `block`). 사용처 여섯이 같은 파일에 몰리는 일이 흔해
 * 파일마다 한 번만 묻는다 — 새 statement 는 만들지 않았다. T1 이 쓰던 `block.by_file` 이
 * 필요한 것(줄 범위)을 이미 준다 (D141).
 */
async function blocksOfFile(
  fileId: number,
  cache: Map<number, LineWindow[]>,
): Promise<LineWindow[]> {
  const hit = cache.get(fileId);
  if (hit !== undefined) return hit;
  let rows: LineWindow[] = [];
  try {
    const found = await ipc.store.query('block.by_file', { fileId });
    rows = found.map((r) => ({ from: r.line_start, to: r.line_end }));
  } catch {
    // 블록을 못 읽어도 카드는 나와야 한다 — 창이 초점 ±2 로 떨어질 뿐이다.
  }
  cache.set(fileId, rows);
  return rows;
}

/**
 * 초점을 감싸는 **최소** 블록. 함수가 클래스 안에 있으면 함수가 이긴다 — 창은 「감싸는
 * 최소 의미 단위」이지 「가장 바깥 단위」가 아니다 (D141). 감싸는 것이 없으면 `undefined`.
 */
function enclosingBlock(blocks: readonly LineWindow[], focus: number): LineWindow | undefined {
  let best: LineWindow | undefined;
  for (const b of blocks) {
    if (b.from > focus || b.to < focus) continue;
    if (best === undefined || b.to - b.from < best.to - best.from) best = b;
  }
  return best;
}

/**
 * 창(감싸는 블록) ∪ 초점 ±4. 파일이 사라졌거나 못 읽으면 **`excerpt` 한 줄로 대신한다** —
 * 앞뒤 맥락이 없는 카드는 좁지만, 코드 줄이 아예 없는 카드는 빈 판이라 아무것도 못 묻는다.
 *
 * `windowOf` 로 한 번 자르고 읽는다 — 373줄짜리 블록을 통째로 읽어 40줄만 쓰는 일을 막는다.
 */
async function readContext(
  rootPath: string,
  relPath: string,
  focus: number,
  excerpt: string,
  block?: LineWindow | undefined,
): Promise<FocusLine[]> {
  const win = windowOf(focus, block);
  const from = Math.max(1, Math.min(win.from, focus - CONTEXT_RADIUS));
  const to = Math.max(win.to, focus + CONTEXT_RADIUS);
  try {
    const chunk = await ipc.file.readLines({ rootPath, relPath, from, to });
    if (chunk.lines.length > 0) return chunk.lines.map((t, i) => ({ n: from + i, t }));
  } catch {
    // 아래 폴백으로 내려간다. 읽기 실패는 카드를 못 만들 이유가 아니다.
  }
  return excerpt === '' ? [] : [{ n: focus, t: excerpt }];
}

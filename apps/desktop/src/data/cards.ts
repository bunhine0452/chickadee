/**
 * 판 만들기 — 생성기(`@chickadee/cards`)와 원장 사이 (04 §1 · 02 §6.2).
 *
 * 생성기는 순수 함수라 사용처·맥락 줄·사전을 전부 받아야 한다. 그것을 긷고, 나온 카드를
 * `card` 에 넣고, 안 나오면 그 개념을 「판이 없는 문법」에 사유와 함께 남기는 것이 여기 일이다.
 */
import {
  generateKind, generateT0, isFailure, isNoPlate,
  type FocusLine, type GenResult, type NoPlate, type OtherUse, type SiteInput, type T0Card,
} from '@chickadee/cards';
import type { Dict } from '@chickadee/dictionary';
import { ipc } from '@chickadee/ipc-client';
import { estMinFor, type Candidate } from '@chickadee/scheduler';
import { fromConceptSiteRow, type ConceptId, type ConceptSite, type Layer } from '@chickadee/store-sql';

import { makeT1Card } from './blocks.js';
import { makeT2Card } from './graph.js';
import type { CardMaker } from './session.js';

/** 카드 하나에 볼 사용처 수. 사슬이 몇 번 미끄러져도 이 안에서 끝난다 (04 §1.4). */
export const SITE_BUDGET = 6;
/** 사다리 3단·`{{other.*}}` 에 쓸 다른 자리 수 (04 §2.4). */
export const OTHER_USES = 3;
/** 04 §1 — 맥락은 초점 ±4, 최대 9줄. */
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
      // T2 는 개념이 아니라 **대지**에서 나온다 (04 §7.4 「범위 = 유닛 + 1-hop 이웃」) —
      // 그 경로는 `data/graph.ts` 다. 대지를 고르는 규칙은 「오늘 걸 만한 것 중 첫 번째」이고,
      // 순서는 `unit.order_idx` 다(홈이 대지를 세우는 순서와 같아야 「그 대지」로 읽힌다).
      const units = await ipc.store.query('home.units', { repoId: deps.repoId });
      const seen = new Set<number>();
      for (const row of units) {
        if (seen.has(row.unit_id)) continue;
        seen.add(row.unit_id);
        const made = await makeT2Card(
          { repoId: deps.repoId, rootPath: deps.rootPath, now: deps.now },
          { id: row.unit_id, name: row.name, rootPath: row.root_path },
        );
        if (made === null) continue;
        return {
          cardId: made.cardId,
          conceptId: made.card.conceptId,
          track: 't2' as const,
          role: 'new' as const,
          estMin: estMinFor('t2', 'new'),
        };
      }
      return null;
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
  for (const row of ordered) {
    const site = fromConceptSiteRow(row) as ConceptSite;
    const lines = await readContext(deps.rootPath, row.path, row.line_start, row.excerpt);
    const lineSites = await ipc.store.query('card.sites_on_line', {
      repoId: deps.repoId, fileId: row.file_id, lineStart: row.line_start,
      lineEnd: row.line_end, exceptId: row.id,
    });
    out.push({
      site,
      path: row.path,
      lines,
      lineSites: lineSites.map((r) => fromConceptSiteRow(r) as ConceptSite),
      others: others.filter((o) => o.siteId !== row.id),
    });
  }
  return out;
}

/**
 * 초점 ±4 줄. 파일이 사라졌거나 못 읽으면 **`excerpt` 한 줄로 대신한다** — 앞뒤 맥락이 없는
 * 카드는 좁지만, 코드 줄이 아예 없는 카드는 빈 판이라 아무것도 못 묻는다.
 */
async function readContext(
  rootPath: string,
  relPath: string,
  focus: number,
  excerpt: string,
): Promise<FocusLine[]> {
  const from = Math.max(1, focus - CONTEXT_RADIUS);
  try {
    const chunk = await ipc.file.readLines({
      rootPath, relPath, from, to: focus + CONTEXT_RADIUS,
    });
    if (chunk.lines.length > 0) return chunk.lines.map((t, i) => ({ n: from + i, t }));
  } catch {
    // 아래 폴백으로 내려간다. 읽기 실패는 카드를 못 만들 이유가 아니다.
  }
  return excerpt === '' ? [] : [{ n: focus, t: excerpt }];
}

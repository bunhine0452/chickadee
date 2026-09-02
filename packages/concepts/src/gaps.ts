/**
 * 문법 구멍 지도 (03 §6). 홈의 「판이 없는 문법」 패널이 읽는 값이 여기서 나온다.
 *
 * 패널의 정의는 「**내 코드엔 있는데** 아직 안 찍은 문법」이다 — 그래서 `count == 0` 인
 * 필수 문법은 패널에 나오지 않는다. 그런 개념은 사용자가 그 언어를 처음 볼 때만
 * 「0장 — 이 언어의 바닥」으로 따로 안내한다.
 */
import type { Dict } from '@chickadee/dictionary';

import { isTestPath } from './ingest-defaults.js';

/** 집계에 필요한 사용처의 최소 모양. */
export interface CountableSite {
  conceptId: string;
  path: string;
  siteKey: string;
  unknown: number;
}

export interface GapRow {
  conceptId: string;
  siteCount: number;
  minUnknown: number;
  bestSiteKey: string | null;
  /** 언어 파일이 충분한데 표본이 모자라면 사다리 3단을 끄는 신호다. */
  thin: boolean;
  /** 같은 일을 하는 다른 표기가 이 리포에 몇 곳 있는가 (`alternatives`). */
  alternative: { conceptId: string; count: number; note: string | null } | null;
  hot: boolean;
}

/** 이 횟수 이상이면 패널에서 눈에 띄게 (03 §6). */
export const HOT_COUNT = 10;

export interface GapInput {
  lang: string;
  sites: readonly CountableSite[];
  /** 그 언어의 인제스트된 파일 수 — `thin` 판정의 분모다. */
  langFileCount: number;
  layerOf: (conceptId: string) => number;
}

/**
 * 필수 문법마다 사용처를 세고, 겹이 0인 것만 구멍으로 돌려준다.
 * 테스트 파일의 사용처는 세지 않는다 — 테스트에만 있는 개념을 「내 앱의 핵심 문법」으로
 * 세면 지도가 거짓말을 한다 (D60).
 */
export function buildGaps(dict: Dict, input: GapInput): GapRow[] {
  const meta = dict.langs.get(input.lang);
  if (!meta) return [];
  const counted = input.sites.filter((s) => !isTestPath(s.path));
  const byConcept = new Map<string, CountableSite[]>();
  for (const site of counted) {
    const at = byConcept.get(site.conceptId) ?? [];
    at.push(site);
    byConcept.set(site.conceptId, at);
  }

  const thinRule = meta.thin_threshold;
  const bigEnough = input.langFileCount >= thinRule.small_repo_files;
  const rows: GapRow[] = [];
  for (const conceptId of meta.essential) {
    const sites = byConcept.get(conceptId) ?? [];
    if (sites.length === 0) continue;
    if (input.layerOf(conceptId) > 0) continue;
    const files = new Set(sites.map((s) => s.path)).size;
    const best = [...sites].sort((a, b) => a.unknown - b.unknown
      || a.siteKey.localeCompare(b.siteKey))[0];
    const alt = meta.alternatives.find((a) => a.gap === conceptId);
    const altCount = alt ? (byConcept.get(alt.present)?.length ?? 0) : 0;
    rows.push({
      conceptId,
      siteCount: sites.length,
      minUnknown: best?.unknown ?? 0,
      bestSiteKey: best?.siteKey ?? null,
      // 작은 리포는 한 곳만 있어도 충분하다 — 표본 부족은 큰 리포에서만 뜻이 있다.
      thin: bigEnough && (files < thinRule.min_files || sites.length < thinRule.min_sites),
      alternative: alt && altCount > 0
        ? { conceptId: alt.present, count: altCount, note: alt.note ?? null }
        : null,
      hot: sites.length >= HOT_COUNT,
    });
  }
  rows.sort((a, b) => b.siteCount - a.siteCount || a.conceptId.localeCompare(b.conceptId));
  // 「가장 많이 나오는 하나」는 count 가 작아도 눈에 띈다 (03 §6).
  const first = rows[0];
  if (first) first.hot = true;
  return rows;
}

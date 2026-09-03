/**
 * blame 2차 패스 (03 §1.5). 1차 패스는 blame 없이 끝나고 카드가 만들어진다 —
 * blame 은 파일×커밋 수에 비례해 대형 리포에서 분 단위이고, 첫 화면을 3분 기다리게 한
 * 실패가 이 분리의 이유다.
 *
 * 파일 하나씩, 배경에서, 실패하면 그 파일만 포기한다. 출처가 없어도 카드는 산다.
 */
import { ipc } from '@chickadee/ipc-client';

import { inBatches } from './batch.js';

/** 03 §7 — 2차 패스 전체 예산. 이보다 오래 걸리면 남은 파일은 다음 인제스트로 미룬다. */
export const BLAME_BUDGET_MS = 60_000;

export interface BlameOptions {
  repoId: number;
  rootPath: string;
  now: () => number;
  onFile?: (path: string, filled: number) => void;
}

/**
 * 사용처가 있는 파일마다 blame 을 부르고 `concept_site.commit_id` 를 채운다.
 * 돌려주는 값은 채운 사용처 수다.
 */
export async function fillCommits(options: BlameOptions): Promise<number> {
  const rows = await ipc.store.query('derive.sites_for_rank', { repoId: options.repoId });
  const byPath = new Map<string, { siteKey: string; line: number }[]>();
  for (const row of rows) {
    const at = byPath.get(row.path) ?? [];
    at.push({ siteKey: row.site_key, line: row.line_start });
    byPath.set(row.path, at);
  }

  const started = options.now();
  let filled = 0;
  for (const [path, sites] of byPath) {
    if (options.now() - started > BLAME_BUDGET_MS) break;
    let hunks;
    try {
      ({ hunks } = await ipc.git.blameLines(options.rootPath, path));
    } catch {
      // 타임아웃이거나 읽을 수 없는 파일 — 출처 없이 카드를 유지한다 (01 §6).
      continue;
    }
    const ops = [];
    for (const site of sites) {
      const hunk = hunks.find((h) => h.start <= site.line && site.line <= h.end);
      if (!hunk) continue;
      ops.push({
        name: 'derive.blame_fill' as const,
        params: { repoId: options.repoId, siteKey: site.siteKey, sha: hunk.sha },
      });
    }
    // 200 op 상한을 넘기면 `BAD_INPUT` 이고, 그 오류는 배경 패스의 catch 에 먹혀
    // 출처가 영영 안 채워진다. 사용처가 많은 파일 하나면 바로 넘는다.
    if (ops.length > 0) await inBatches(ops);
    filled += ops.length;
    options.onFile?.(path, filled);
  }
  return filled;
}

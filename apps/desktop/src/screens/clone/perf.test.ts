/**
 * 코스 성능 게이트 (`clone-gates-perf`).
 *
 * 기준은 T2 해석기와 같은 값이다 — 04 §9 「2,000 파일 해석 < 1.5s」. 코스의 목차도 리포
 * 전체를 한 번 훑는 계산이고, 사용자가 「코스」를 누르고 첫 조각이 뜰 때까지가 그 시간이다.
 *
 * `packages/cards/src/t2-perf.test.ts` 와 같은 규칙이다: 잡으려는 것은 「20 % 느려짐」이
 * 아니라 **자릿수가 바뀌는 사고**다 — 파일마다 전체 목록을 다시 훑는 코드로 바뀌는 것 같은.
 *
 * 목차만 잰다. 조각 나누기는 목차에 들어가지 않는다 — 파일에 닿을 때 한 번씩 하는
 * 지연 생성이고(`materializeFile`), 그것이 이 예산을 지키는 방법 자체다. 리포 전체를 열
 * 때 자르면 2,000 파일에 IPC 가 2,000회다.
 */
import { courseOrder, type CommitTouch, type CourseEdge, type CourseFile } from '@chickadee/concepts';
import { describe, expect, test } from 'vitest';

import { foldToc, type CloneRun, type CloneStepRow } from './data.js';

/** 04 §9 — 2,000 파일 < 1.5s. */
const BUDGET_MS = 1_500;
const FILES = 2_000;
/** 파일 하나가 거는 import. 위상 정렬의 간선 수가 이것으로 정해진다. */
const EDGES_PER_FILE = 8;
/** 목차를 접는 것은 매 조각마다 도는 자리라 예산이 훨씬 빡빡하다 — 프레임 하나 안. */
const FOLD_BUDGET_MS = 16;

/** 40개 폴더에 2,000 파일, 대지 40개. 경로가 서로 다르므로 동률 깨기가 실제로 돈다. */
function repo(): { files: CourseFile[]; edges: CourseEdge[]; touches: CommitTouch[] } {
  const files = Array.from({ length: FILES }, (_, i) => ({
    fileId: i + 1,
    path: `src/features/f${String(i % 40).padStart(2, '0')}/mod${String(i).padStart(4, '0')}.ts`,
    unitId: (i % 40) + 1,
  }));
  const edges: CourseEdge[] = [];
  for (let i = 0; i < FILES; i += 1) {
    for (let k = 1; k <= EDGES_PER_FILE; k += 1) {
      edges.push({ fromFileId: i + 1, toFileId: ((i * 7 + k * 13) % FILES) + 1 });
    }
  }
  const touches = files.map((f, i) => ({
    sha: `c${String(i % 500).padStart(4, '0')}`,
    authoredAt: i % 500,
    path: f.path,
    fileId: f.fileId,
  }));
  return { files, edges, touches };
}

const units = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1, name: `f${String(i).padStart(2, '0')}`, orderIdx: i,
}));

describe('코스 성능 (04 §9)', () => {
  test(`2,000 파일 목차가 위상 폴백으로 ${BUDGET_MS}ms 안에 선다`, () => {
    const { files, edges } = repo();
    const at = performance.now();
    const out = courseOrder({ files, commitCount: 3, touches: [], units, edges });
    const ms = performance.now() - at;
    // 순서가 실제로 서고 있는지 먼저 본다 — 0건이면 빠른 게 아니라 안 도는 것이다.
    expect(out.mode).toBe('dep');
    expect(out.steps).toHaveLength(FILES);
    expect(new Set(out.steps.map((s) => s.path)).size).toBe(FILES);
    expect(ms).toBeLessThan(BUDGET_MS);
  });

  test(`2,000 파일 목차가 커밋 순으로도 ${BUDGET_MS}ms 안에 선다`, () => {
    const { files, edges, touches } = repo();
    const at = performance.now();
    const out = courseOrder({ files, commitCount: 500, touches, units, edges });
    const ms = performance.now() - at;
    expect(out.mode).toBe('commit');
    expect(out.steps).toHaveLength(FILES);
    expect(ms).toBeLessThan(BUDGET_MS);
  });

  test(`목차 접기는 조각마다 도는 자리라 ${FOLD_BUDGET_MS}ms 안이어야 한다`, () => {
    const { files, edges } = repo();
    const order = courseOrder({ files, commitCount: 3, touches: [], units, edges });
    const run = { id: 1, steps: order.steps } as CloneRun;
    // 앞선 100 파일이 이미 잘렸다고 본다 — 지연 생성이라 목차 전체가 조각을 갖지 않는다.
    const steps: CloneStepRow[] = [];
    for (let seq = 0; seq < 100; seq += 1) {
      for (let part = 0; part < 3; part += 1) {
        steps.push({
          id: seq * 3 + part, run_id: 1, seq, part, file_id: seq + 1, block_id: 1,
          line_start: 1, line_end: 20, text_hash: 'x',
          status: part === 0 ? 'done' : 'pending', pct: part === 0 ? 92 : null,
          elapsed_s: 0, draft_text: null, session_item_id: null, review_log_id: null,
          done_at: null, path: order.steps[seq]?.path ?? '', grammar: 'typescript',
        });
      }
    }
    const names = new Map(units.map((u) => [u.id, u.name]));
    const at = performance.now();
    const toc = foldToc(run, steps, names);
    const ms = performance.now() - at;
    expect(toc.files).toBe(FILES);
    expect(toc.cut).toBe(300);
    expect(toc.cutDone).toBe(100);
    expect(ms).toBeLessThan(FOLD_BUDGET_MS);
  });
});

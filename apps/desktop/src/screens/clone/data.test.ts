/**
 * 코스 화면의 데이터 층. 두 가지를 본다: **목차 접기**(순수 함수)와 **다시 자르기**
 * (`clone-resume-stale`).
 *
 * 원장은 `data/clone.ts` 가 이미 자기 테스트를 갖고 있으므로 여기서는 모의한다 —
 * 재는 것은 「무효가 된 자리를 만나면 무엇을 부르는가」이지 SQL 이 도는지가 아니다.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { CloneRun, CloneStepRow } from '../../data/clone.js';

const execs: { name: string; params: unknown }[] = [];
const materialized: { seq: number; partFrom: number }[] = [];

let nextSteps: (CloneStepRow | null)[] = [];
let builds: unknown[] = [];
let stepsAt: CloneStepRow[] = [];
let progress = { total: 0, done: 0, elapsedS: 0 };

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: () => Promise.resolve([]),
      exec: (name: string, params: unknown) => {
        execs.push({ name, params });
        return Promise.resolve({ changes: 1, lastId: 1 });
      },
    },
    file: { readLines: () => Promise.reject(new Error('FS_NOT_FOUND')) },
  },
  log: { warn: () => undefined, error: () => undefined },
}));

vi.mock('../../data/clone.js', () => ({
  nextStep: () => Promise.resolve(nextSteps.shift() ?? null),
  buildCoursePlate: () => Promise.resolve(builds.shift() ?? null),
  courseStepsAt: () => Promise.resolve(stepsAt),
  courseProgress: () => Promise.resolve(progress),
  courseSteps: () => Promise.resolve([]),
  materializeFile: (_d: unknown, _r: unknown, seq: number, partFrom = 0) => {
    materialized.push({ seq, partFrom });
    return Promise.resolve(1);
  },
  gradeCourseStep: () => Promise.resolve(null),
  openCourse: () => Promise.resolve(null),
  startCourse: () => Promise.resolve(null),
  saveDraft: () => Promise.resolve(null),
  closeCourse: () => Promise.resolve(undefined),
}));

vi.mock('../../data/settings.js', () => ({
  loadSettings: () => Promise.resolve({ tz: 'Asia/Seoul', rolloverHour: 4, desiredRetention: 0.9 }),
  loadScheduler: () => Promise.resolve({}),
}));

vi.mock('../../data/session.js', () => ({ today: () => '2026-09-04' }));

vi.mock('@chickadee/dictionary', () => ({
  loadDict: () => ({ locale: 'ko', langs: new Map(), concepts: new Map() }),
  textOf: (v: { ko: string }) => ({ text: v.ko, fellBack: false }),
}));

const { foldToc, nextPlate } = await import('./data.js');

function step(over: Partial<CloneStepRow> = {}): CloneStepRow {
  return {
    id: 1, run_id: 1, seq: 0, part: 0, file_id: 7, block_id: 3,
    line_start: 1, line_end: 20, text_hash: 'h', status: 'pending', pct: null,
    elapsed_s: 0, draft_text: null, session_item_id: null, review_log_id: null,
    done_at: null, path: 'src/a.ts', grammar: 'typescript',
    ...over,
  } as CloneStepRow;
}

const run = {
  id: 1,
  steps: [
    { fileId: 7, path: 'src/a.ts', unitId: 10 },
    { fileId: 8, path: 'src/b.ts', unitId: null },
  ],
} as CloneRun;

beforeEach(() => {
  execs.length = 0;
  materialized.length = 0;
  nextSteps = [];
  builds = [];
  stepsAt = [];
  progress = { total: 0, done: 0, elapsedS: 0 };
});

describe('목차 접기', () => {
  const names = new Map([[10, '핵심']]);

  test('대지가 바뀔 때만 묶음이 갈린다 — 파일 순서는 order_json 그대로다', () => {
    const toc = foldToc(run, [], names, '대지 밖');
    expect(toc.units.map((u) => u.name)).toEqual(['핵심', '대지 밖']);
    expect(toc.units[0]?.files.map((f) => f.path)).toEqual(['src/a.ts']);
    expect(toc.files).toBe(2);
  });

  test('아직 안 연 파일은 조각이 0 이다 — 지연 생성이라 목차가 먼저 선다', () => {
    const toc = foldToc(run, [step({ id: 1, seq: 0, part: 0 })], names);
    expect(toc.units[0]?.files[0]?.total).toBe(1);
    expect(toc.units[1]?.files[0]?.total).toBe(0);
    expect(toc.cut).toBe(1);
  });

  test('stale 은 분모에서 뺀다 — 무효가 된 자리를 세면 100% 가 영영 안 온다', () => {
    const toc = foldToc(run, [
      step({ id: 1, seq: 0, part: 0, status: 'stale' }),
      step({ id: 2, seq: 0, part: 1, status: 'done', pct: 91 }),
    ], names);
    const file = toc.units[0]?.files[0];
    expect(file?.total).toBe(1);
    expect(file?.done).toBe(1);
    // 목차에는 남는다 — 무엇이 무효가 됐는지가 보여야 한다.
    expect(file?.parts).toHaveLength(2);
    expect(toc.filesDone).toBe(1);
    expect(toc.cutDone).toBe(1);
  });

  test('끝나지 않은 조각이 하나라도 있으면 그 파일은 안 끝난 것이다', () => {
    const toc = foldToc(run, [
      step({ id: 1, seq: 0, part: 0, status: 'done', pct: 88 }),
      step({ id: 2, seq: 0, part: 1, status: 'pending' }),
    ], names);
    expect(toc.filesDone).toBe(0);
    expect(toc.cutDone).toBe(1);
    expect(toc.cut).toBe(2);
  });
});

describe('다시 자르기 (clone-resume-stale)', () => {
  test('원본이 바뀐 조각을 만나면 그 파일을 무효로 하고 남은 번호 뒤에 다시 자른다', async () => {
    const stale = step({ id: 1, seq: 0, part: 0 });
    const fresh = step({ id: 9, seq: 0, part: 2 });
    nextSteps = [stale, fresh];
    builds = [{ stale: true }, { step: fresh, conceptId: null }];
    // 이 파일에는 이미 조각 둘(part 0·1)이 있다 — 새 조각은 2 부터다.
    stepsAt = [step({ id: 1, part: 0 }), step({ id: 2, part: 1 })];

    const out = await nextPlate({} as never, run);

    expect(out.at).toBe('plate');
    expect(out.at === 'plate' && out.recut).toBe(true);
    expect(execs.map((e) => e.name)).toEqual(['clone.step_stale']);
    expect(execs[0]?.params).toEqual({ runId: 1, fileId: 7 });
    // `UNIQUE (run_id, seq, part)` 위에 덮어쓰지 않고 이어 붙인다.
    expect(materialized).toEqual([{ seq: 0, partFrom: 2 }]);
  });

  test('블록이 사라진 조각도 같은 길로 간다 — 그 조각은 다시 만들어질 수 없다', async () => {
    nextSteps = [step({ id: 1 }), step({ id: 5, part: 1 })];
    builds = [null, { step: step({ id: 5 }), conceptId: null }];
    stepsAt = [step({ id: 1, part: 0 })];

    const out = await nextPlate({} as never, run);
    expect(out.at).toBe('plate');
    expect(materialized).toEqual([{ seq: 0, partFrom: 1 }]);
  });

  test('조각이 하나도 안 나오면 `nothing` — 「끝났다」와 가른다', async () => {
    nextSteps = [null];
    progress = { total: 0, done: 0, elapsedS: 0 };
    expect((await nextPlate({} as never, run)).at).toBe('nothing');
  });

  test('조각이 있었고 남은 것이 없으면 `done`', async () => {
    nextSteps = [null];
    progress = { total: 4, done: 4, elapsedS: 120 };
    expect((await nextPlate({} as never, run)).at).toBe('done');
  });

  test('자를 때마다 조각이 안 나오는 파일에서도 무한히 돌지 않는다', async () => {
    nextSteps = Array.from({ length: 40 }, () => step());
    builds = Array.from({ length: 40 }, () => ({ stale: true }));
    stepsAt = [];
    expect((await nextPlate({} as never, run)).at).toBe('nothing');
    // 상한 16 번에서 멈춘다 — 그 이상 자르면 사용자는 빈 화면을 몇 초씩 본다.
    expect(materialized).toHaveLength(16);
  });
});

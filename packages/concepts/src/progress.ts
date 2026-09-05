/**
 * 챕터 진도 — 한 단을 판정하고 원장에 남긴다 (D165 · `docs/program/mastery.md` §3·§5·§6).
 *
 * 앱은 진도를 **잉크 겹**으로 쟀다. 겹은 개념 하나가 시간을 두고 몇 번 다시 맞았는지이고,
 * 「로그인을 이해했는가」에 답할 행은 그 표 어디에도 없다. 이 파일이 그 축을 하나 더 세운다 —
 * `chapter.stage_reached` 0~5 다. 겹은 안 없어지고 1단(어휘)의 판정기로 남는다 (§4 ①).
 *
 * **여기에 문항도 채점도 없다.** 입력은 `stage_log` 수준의 값(`asked`·`correct`·`durationMs`)
 * 이고, 그 값을 무엇으로 만들었는지는 문항 층이 안다. 그래서 이 파일은 문항 유형이 바뀌어도
 * 안 바뀐다.
 *
 * FSRS 도 여기 없다 — `chapter` 행이 `mastery` 와 같은 열을 갖고 있어 스케줄러가 그대로
 * 계산해 넘긴다(`@chickadee/scheduler` 의 `chapter-review.ts`). `concepts` 가 `scheduler` 를
 * import 하면 의존이 거꾸로 선다.
 */
import { ipc } from '@chickadee/ipc-client';

import { inBatches } from './batch.js';
import type { Hop } from './path.js';

/** 1 읽기 · 2 추적 · 3 예측 · 4 수정 · 5 재구현. `stage_log.stage` 의 CHECK 그대로. */
export type ChapterStage = 1 | 2 | 3 | 4 | 5;

/** `stage_log.kind`. 첫 판정이냐 재검이냐. */
export type StageKind = 'first' | 'recheck';

/** 재검 등급 (`mastery.md` §4 ②). Easy(4)는 만들지 않는다 — `fsrs.ts` 와 같은 규약이다. */
export type RecheckGrade = 1 | 2 | 3;

/** `chapter` 행 중 이 파일이 움직이는 열. 나머지(`origin`·`applied_log_id`)는 안 건드린다. */
export interface ChapterProgress {
  unitId: number;
  /** 0 = 아직 · 1~5. 되돌림은 재검 Again 하나뿐이다. */
  stageReached: number;
  passedAt: number | null;
  state: 0 | 1 | 2 | 3;
  stability: number | null;
  difficulty: number | null;
  dueAt: number | null;
  lastReviewAt: number | null;
  reps: number;
  lapses: number;
}

/** 재검이 FSRS 로 계산한 다음 일정. `chapter-review.ts` 가 만든다. */
export interface ChapterSchedule {
  state: 0 | 1 | 2 | 3;
  stability: number | null;
  difficulty: number | null;
  dueAt: number | null;
  lastReviewAt: number | null;
  reps: number;
  lapses: number;
  /** 직전 재검부터 (첫 재검 0). 원장 열 `elapsed_days`. */
  elapsedDays: number;
}

/** 한 단을 판정한 결과. 문항 층이 무엇을 냈든 값은 이 넷으로 줄어든다. */
export interface StageResult {
  unitId: number;
  stage: ChapterStage;
  asked: number;
  correct: number;
  durationMs: number;
  /** `detail_json` 에 그대로 들어간다 — 틀린 칸·제약 이름 같은 것. */
  detail?: unknown;
}

/**
 * 3단 통과선 4/5 (`mastery.md` §3.2). 문항 수가 3~5 라 비율선으로 읽는다 —
 * 5문항이면 4, 3문항이면 3, **4문항이면 4** 다. 4문항이 5문항보다 빡빡해지는 이 자리는
 * 비율선을 쓴 대가이고, 문항은 3 이나 5 로 굽는 것이 낫다.
 */
export const PREDICT_PASS = { num: 4, den: 5 } as const;

/** 세 번 막히면 그날 챕터를 접는다 (`mastery.md` §5). 벌이 아니라 순서 재조정이다. */
export const DUNNO_FOLD_LIMIT = 3;

/** 2단 막힘 — 경로를 이만큼으로 접어 다시 묻는다 (5칸 → 3칸). */
export const FOLD_HOPS = 3;

/**
 * 통과선 (`mastery.md` §3.2). 2·4단에 부분점수가 없는 이유: 다섯 칸 중 넷을 맞혀도 틀린
 * 하나가 `JwtAuthenticationFilter` 라면 「무엇이 언제 도는가」를 놓친 것이다 — 그 필터는
 * 컨트롤러가 import 하지 않아 읽어서는 안 보이고 순서로만 보인다.
 *
 * 1단은 「경로 위 개념 전부가 1겹 이상」이라 `asked`·`correct` 를 `readingTally` 가 만든다.
 */
export function stagePasses(stage: ChapterStage, asked: number, correct: number): boolean {
  if (asked <= 0) return false;
  if (stage === 3) return correct * PREDICT_PASS.den >= asked * PREDICT_PASS.num;
  return correct >= asked;
}

/** 1단 통과선의 재료 — `chapter.reading_layers` 가 준 겹을 세어 `asked`·`correct` 로. */
export function readingTally(
  layers: readonly { layer: number }[],
): { asked: number; correct: number } {
  return { asked: layers.length, correct: layers.filter((r) => r.layer >= 1).length };
}

/**
 * 챕터 통과에 필요한 단 (`mastery.md` §3.2 · D165).
 *
 * **4단을 못 굽는 챕터는 3단까지가 통과다.** 4단 문항은 커밋 원장(`fix:` 의 diff)에서 나오고
 * 커밋이 적은 리포에는 그 재료가 없다 — 통과선을 4로 고정하면 그런 리포의 코스가 통째로
 * 빈다. 대가는 통과선이 챕터마다 달라지는 것이고, 그것이 `mastery.md` §8 의 사용자 결정 자리다.
 */
export function passTarget(hasRepair: boolean): 3 | 4 {
  return hasRepair ? 4 : 3;
}

export interface AdvanceInput {
  row: ChapterProgress;
  result: StageResult;
  kind: StageKind;
  /** 이 챕터에 4단 문항을 구울 수 있나. */
  hasRepair: boolean;
  now: number;
  /** 재검일 때만 — 등급과 FSRS 가 낸 다음 일정. */
  recheck?: { grade: RecheckGrade; schedule: ChapterSchedule };
}

export interface Advance {
  next: ChapterProgress;
  passed: boolean;
  /** 이번 판정이 챕터를 처음 통과시켰나 — 다음 챕터가 여기서 열린다. */
  justPassed: boolean;
  /** 원장에 남길 값. */
  log: { passed: boolean; grade: RecheckGrade | null; elapsedDays: number };
}

/**
 * 한 단의 판정을 챕터 행에 접는다. **순수 함수다** — 시각도 DB 도 인자로 들어온다.
 *
 * 첫 판정은 올라가기만 한다. 되돌림은 재검 Again 하나뿐이고(`stage_reached` −1), 그 이유는
 * 시간이 지나 잃은 것이 진도가 아니라 사실이기 때문이다. `passed_at` 은 한 번 서면 안 지운다 —
 * 해금을 걷으면 「챕터를 내리면 앞으로 못 간다」는 실패 모드(정본 §3-7)가 그대로 선다.
 */
export function advance(input: AdvanceInput): Advance {
  const { row, result, kind, now } = input;
  const passed = stagePasses(result.stage, result.asked, result.correct);
  const grade = input.recheck?.grade ?? null;

  let stageReached = row.stageReached;
  if (kind === 'first') {
    if (passed && result.stage > stageReached) stageReached = result.stage;
  } else if (grade === 1) {
    stageReached = Math.max(0, stageReached - 1);
  }

  const target = passTarget(input.hasRepair);
  const wasPassed = row.passedAt !== null;
  const justPassed = !wasPassed && stageReached >= target;
  const schedule = input.recheck?.schedule;

  return {
    next: {
      unitId: row.unitId,
      stageReached,
      passedAt: wasPassed ? row.passedAt : (justPassed ? now : null),
      state: schedule?.state ?? row.state,
      stability: schedule === undefined ? row.stability : schedule.stability,
      difficulty: schedule === undefined ? row.difficulty : schedule.difficulty,
      dueAt: schedule === undefined ? row.dueAt : schedule.dueAt,
      lastReviewAt: schedule === undefined ? row.lastReviewAt : schedule.lastReviewAt,
      reps: schedule?.reps ?? row.reps,
      lapses: schedule?.lapses ?? row.lapses,
    },
    passed,
    justPassed,
    log: { passed, grade, elapsedDays: schedule?.elapsedDays ?? 0 },
  };
}

// ───────── 막힘 처방 (`mastery.md` §5) ─────────

/**
 * 무엇을 하나. **새 `ladder_event.action` 값을 만들지 않는다** — 목록
 * (`open`·`jump`·`back`·`return`·`prompt_built`·`copied`)이 그대로다.
 */
export interface StuckAction {
  kind: 'prereq' | 'fold' | 'concept-front' | 'prompt' | 'defer';
  /** `ladder_event.rung`. 기존 경로가 이미 기록하는 자리면 `null`. */
  rung: 1 | 2 | 3 | 4 | null;
  action: 'jump' | 'prompt_built' | null;
  /** 접기의 칸 수 (2단만). */
  hops?: number;
}

/**
 * 단마다 처방이 다르다. 1·3단은 **뒤로**(선행), 2단은 **옆으로**(경로 접기), 4단은
 * **밖으로**(사다리 4단 프롬프트). 셋 다 지금 있는 배관을 쓴다.
 *
 * 세 번째 막힘은 단과 무관하게 그날 접는다 — 위상 정렬이 안 맞았다는 신호이고, 계속 밀면
 * 「1000일 연속인데 회화를 못 하는」 자리가 된다.
 */
export function stuckAction(input: { stage: ChapterStage; dunnoCount: number }): StuckAction {
  if (input.dunnoCount >= DUNNO_FOLD_LIMIT) return { kind: 'defer', rung: null, action: null };
  switch (input.stage) {
    // 지금 그대로 — 선행 판으로 깊이 1 점프. 기록도 지금 경로가 한다.
    case 1: return { kind: 'prereq', rung: null, action: null };
    case 2: return { kind: 'fold', rung: 2, action: 'jump', hops: FOLD_HOPS };
    // 그 줄의 1단 개념 판을 큐 앞에 (§3.3). `stage_reached` 는 안 내린다.
    case 3: return { kind: 'concept-front', rung: null, action: null };
    default: return { kind: 'prompt', rung: 4, action: 'prompt_built' };
  }
}

/**
 * 경로를 접는다 — 5칸(프론트 → 컨트롤러 → 서비스 → DAO → 매퍼)을 3칸으로.
 *
 * **양 끝은 남긴다.** 요청은 화면에서 시작해 저장소에서 끝나고, 접는 것은 그 사이의 갈아타는
 * 자리다. 남길 칸을 고르는 규칙은 **고르게 뽑기**라 같은 경로에 늘 같은 답이 나온다.
 */
export function foldPath(hops: readonly Hop[], to: number = FOLD_HOPS): Hop[] {
  if (to < 2 || hops.length <= to) return [...hops];
  const keep: Hop[] = [];
  for (let i = 0; i < to; i += 1) {
    const at = Math.round((i * (hops.length - 1)) / (to - 1));
    const hop = hops[at];
    if (hop !== undefined) keep.push(hop);
  }
  return keep;
}

// ───────── 쓰기 ─────────

export interface RecordInput {
  sessionId: number;
  /** `day_key` — 쓰는 순간 박제한다 (`review_log` 와 같은 규약). */
  dayKey: string;
  now: number;
  row: ChapterProgress;
  result: StageResult;
  kind: StageKind;
  hasRepair: boolean;
  recheck?: { grade: RecheckGrade; schedule: ChapterSchedule };
}

/**
 * 원장 한 행 + 챕터 캐시 한 번. **순서가 규약이다** — `stage.append` 다음에 오는
 * `chapter.apply_last` 가 `last_insert_rowid()` 로 재생 커서를 세운다. 한 배치로 보내야
 * 그 사이에 다른 INSERT 가 끼지 않는다.
 */
export async function recordStageResult(input: RecordInput): Promise<Advance> {
  const moved = advance(input);
  await inBatches([
    {
      name: 'stage.append',
      params: {
        unitId: input.result.unitId,
        sessionId: input.sessionId,
        stage: input.result.stage,
        kind: input.kind,
        asked: input.result.asked,
        correct: input.result.correct,
        passed: moved.log.passed ? 1 : 0,
        grade: moved.log.grade,
        elapsedDays: moved.log.elapsedDays,
        reviewedAt: input.now,
        dayKey: input.dayKey,
        durationMs: input.result.durationMs,
        detailJson: JSON.stringify(input.result.detail ?? {}),
      },
    },
    {
      name: 'chapter.apply_last',
      params: {
        unitId: moved.next.unitId,
        stageReached: moved.next.stageReached,
        passedAt: moved.next.passedAt,
        state: moved.next.state,
        stability: moved.next.stability,
        difficulty: moved.next.difficulty,
        dueAt: moved.next.dueAt,
        lastReviewAt: moved.next.lastReviewAt,
        reps: moved.next.reps,
        lapses: moved.next.lapses,
        updatedAt: input.now,
      },
    },
  ]);
  return moved;
}

/** 그날 이 챕터를 접는다 (`stuckAction` 이 `defer` 를 냈을 때). */
export async function deferChapter(unitId: number, dayKey: string, now: number): Promise<void> {
  await ipc.store.exec('chapter.defer', { unitId, dayKey, updatedAt: now });
}

/** `chapter.get` 행을 이 파일의 모양으로. 열 이름은 DDL 그대로 온다. */
export function fromChapterRow(row: {
  unit_id: number; stage_reached: number; passed_at: number | null; state: number;
  stability: number | null; difficulty: number | null; due_at: number | null;
  last_review_at: number | null; reps: number; lapses: number;
}): ChapterProgress {
  return {
    unitId: row.unit_id,
    stageReached: row.stage_reached,
    passedAt: row.passed_at,
    state: row.state as 0 | 1 | 2 | 3,
    stability: row.stability,
    difficulty: row.difficulty,
    dueAt: row.due_at,
    lastReviewAt: row.last_review_at,
    reps: row.reps,
    lapses: row.lapses,
  };
}

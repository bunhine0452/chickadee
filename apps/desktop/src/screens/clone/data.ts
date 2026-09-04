/**
 * 코스 화면이 읽고 부르는 것 (D120 · 05 §2.1 `clone`).
 *
 * 규칙은 하나도 여기 없다. 순서는 `@chickadee/concepts` 의 `courseOrder`, 조각 나누기는
 * `@chickadee/cards` 의 `segment()`, 판정은 `@chickadee/grading`, 원장은 `data/clone.ts` 다.
 * 이 파일이 하는 일은 셋뿐이다 — **문맥 한 벌을 모으고**, **목차를 그릴 모양으로 접고**,
 * **다음 조각을 찾는 동안 무효가 된 자리를 다시 자른다**.
 */
import { loadDict, textOf, type Dict } from '@chickadee/dictionary';
import { ipc } from '@chickadee/ipc-client';
import type { ConceptId, DayKey, Layer } from '@chickadee/store-sql';

import {
  buildCoursePlate, courseProgress, courseSteps, courseStepsAt, gradeCourseStep,
  materializeFile, nextStep, openCourse, startCourse,
  type CloneDeps, type CloneRun, type CloneScope, type CloneStepRow, type CourseAnswer,
  type CoursePlate,
} from '../../data/clone.js';
import { loadScheduler, loadSettings } from '../../data/settings.js';
import { today } from '../../data/session.js';

export type {
  CloneDeps, CloneRun, CloneScope, CloneStepRow, CourseAnswer, CoursePlate,
} from '../../data/clone.js';
export { closeCourse, courseProgress, courseSteps, saveDraft } from '../../data/clone.js';

/**
 * 원문을 읽을 수 있나. 목차는 섰는데 조각이 하나도 안 나왔을 때 **왜**를 가른다 —
 * 「12줄짜리 함수가 없다」와 「폴더가 옮겨졌다」는 사용자가 할 일이 서로 다르다.
 * `data/clone.ts` 의 `readLines` 는 실패를 삼키므로(빈 조각으로 물러선다) 여기서 한 번 묻는다.
 */
export async function canReadSource(deps: CloneDeps, run: CloneRun): Promise<boolean> {
  const first = run.steps[0];
  if (first === undefined) return false;
  try {
    await ipc.file.readLines({ rootPath: deps.rootPath, relPath: first.path, from: 1, to: 2 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 사전 판본 한 줄. `session-flow.ts` 가 같은 셈을 자기 안에 두고 있지만 그 함수는
 * 모듈 밖으로 나오지 않는다 — 세 줄을 옮기는 편이 남의 파일을 여는 것보다 싸다.
 */
function dictVersionOf(dict: Dict): string {
  return [...dict.langs.values()].map((l) => `${l.lang}@${l.version}`).sort().join(' ');
}

/** 코스 한 판이 쓰는 문맥. 화면이 열릴 때 한 번 모으고 그 뒤로는 바뀌지 않는다. */
export async function courseDeps(
  repoId: number,
  rootPath: string,
  now: number,
): Promise<CloneDeps> {
  const dict = loadDict();
  const settings = await loadSettings();
  return {
    repoId,
    rootPath,
    dict,
    dictVersion: dictVersionOf(dict),
    now,
    day: today(now, settings) as DayKey,
  };
}

/** 채점 한 번이 쓰는 겹 계산기. 설정의 목표 파지율을 그대로 따른다 (02 §3). */
export async function courseScheduler(now: number): ReturnType<typeof loadScheduler> {
  const settings = await loadSettings();
  return loadScheduler(now, settings.desiredRetention);
}

// ───────── 진입 ─────────

/**
 * 이어할 코스가 있으면 그것, 없으면 새로 연다 (P4 `clone-resume-crash`).
 *
 * 강제 종료 뒤에도 같은 문이다 — `clone_run.status` 가 `active` 로 남아 있고
 * `clone.run_open` 이 그것을 집는다. 코스 세션은 처음부터 `done` 이라
 * `session.abandon_stale` 이 며칠 지난 코스를 버리지 못한다 (D120).
 */
export async function enterCourse(
  deps: CloneDeps,
  scope: CloneScope,
): Promise<{ run: CloneRun; resumed: boolean } | null> {
  const open = await openCourse(deps.repoId);
  // 범위가 다르면 남의 코스다 — 대지 코스를 열었는데 리포 코스가 이어지면 목차가 어긋난다.
  if (open !== null && sameScope(open, scope)) return { run: open, resumed: true };
  const made = await startCourse(deps, scope);
  return made === null ? null : { run: made, resumed: false };
}

const sameScope = (run: CloneRun, scope: CloneScope): boolean =>
  scope.kind === 'repo'
    ? run.scope === 'repo'
    : run.scope === 'unit' && run.unitId === scope.unitId;

// ───────── 다음 조각 ─────────

/**
 * 한 번 열 때 다시 자르기를 몇 번까지 허용하나. 재인제스트가 파일 여럿을 바꿨으면
 * 여러 번 도는 것이 맞지만, 자를 때마다 조각이 안 나오는 파일이면 무한히 돈다.
 */
const MAX_RECUT = 16;

export type CourseNext =
  | { at: 'plate'; plate: CoursePlate; recut: boolean }
  /** 목차는 섰는데 조각이 하나도 안 나왔다 — 원문을 못 읽었거나 12줄짜리 함수가 없다. */
  | { at: 'nothing' }
  | { at: 'done' };

/**
 * 다음에 칠 조각과 그 판.
 *
 * `buildCoursePlate` 가 `stale` 을 돌려주면 그 파일을 **다시 자르고** 이어서 찾는다
 * (P4 `clone-resume-stale`). 블록 자체가 사라진 경우(`null`)도 같은 길로 보낸다 —
 * 그 조각은 다시 만들어질 수 없고, 파일을 다시 자르면 남은 블록에서 새 조각이 나온다.
 */
export async function nextPlate(deps: CloneDeps, run: CloneRun): Promise<CourseNext> {
  let recut = false;
  for (let guard = 0; guard < MAX_RECUT; guard += 1) {
    const step = await nextStep(deps, run);
    if (step === null) {
      const { total } = await courseProgress(run.id);
      return { at: total === 0 ? 'nothing' : 'done' };
    }
    const built = await buildCoursePlate(deps, step);
    if (built !== null && !('stale' in built)) return { at: 'plate', plate: built, recut };
    await recutFile(deps, run, step.seq, step.file_id);
    recut = true;
  }
  return { at: 'nothing' };
}

/**
 * 원본이 바뀐 파일을 다시 자른다.
 *
 * 앞서 잘린 조각은 지우지 않고 `stale` 로 남긴다 — 무엇이 무효가 됐는지가 목차에 보여야
 * 하고, 원장은 되돌리지 않는다. 새 조각은 남은 `part` 번호 뒤에 붙는다. **이미 끝낸
 * 조각도 다시 잘린다**: 원문이 바뀌었으므로 그때 친 것과 지금 파일은 같은 글이 아니다.
 */
async function recutFile(
  deps: CloneDeps, run: CloneRun, seq: number, fileId: number,
): Promise<void> {
  const rows = await courseStepsAt(run.id, seq);
  const partFrom = rows.reduce((max, row) => Math.max(max, row.part + 1), 0);
  await ipc.store.exec('clone.step_stale', { runId: run.id, fileId });
  await materializeFile(deps, run, seq, partFrom);
}

/**
 * 판을 걸 때의 겹. 교정지 머리가 「걸 때 → 지금」 두 값을 그리므로 앞의 것이 필요하다
 * (`ProofSheet.ly`). 개념이 없는 조각은 겹이 붙을 자리가 없어 0 이다.
 */
export async function layerOf(conceptId: ConceptId | null): Promise<Layer> {
  if (conceptId === null) return 0;
  const rows = await ipc.store.query('review.mastery_get', {
    conceptIds: JSON.stringify([conceptId]),
  });
  return (rows[0]?.layer ?? 0) as Layer;
}

/**
 * 개념 이름 한 줄. `concept.name` 은 로케일을 풀어도 `{ ko, en }` 으로 남으므로(D118 —
 * `concept.name_ko`·`name_en` 이 원장에서 두 열이다) 여기서 한 언어를 고른다. 사전에 없는
 * 개념은 id 를 그대로 보인다 — 빈 칸보다 낫다.
 */
export function conceptName(deps: CloneDeps, conceptId: ConceptId | null): string | null {
  if (conceptId === null) return null;
  const concept = deps.dict.concepts.get(conceptId);
  return concept === undefined ? conceptId : textOf(concept.name, deps.dict.locale).text;
}

/** 채점 한 번. 판정도 원장도 `data/clone.ts` 가 하고 여기서는 겹 계산기만 붙인다. */
export async function gradeStep(
  deps: CloneDeps,
  run: CloneRun,
  plate: CoursePlate,
  answer: CourseAnswer,
): ReturnType<typeof gradeCourseStep> {
  return gradeCourseStep(deps, run, plate, answer, await courseScheduler(deps.now));
}

// ───────── 목차 ─────────

export interface TocPart {
  id: number;
  part: number;
  status: CloneStepRow['status'];
  pct: number | null;
  lineStart: number;
  lineEnd: number;
}

export interface TocFile {
  seq: number;
  fileId: number;
  path: string;
  parts: TocPart[];
  done: number;
  /** 지금까지 **잘린** 조각 수. 아직 안 연 파일은 0 이다 (지연 생성). */
  total: number;
}

export interface TocUnit {
  unitId: number | null;
  name: string;
  files: TocFile[];
}

export interface Toc {
  units: TocUnit[];
  /** 목차의 파일 수 — 코스를 열 때 정해지는 유일한 분모다. */
  files: number;
  /** 조각이 하나라도 남지 않은 파일. 「몇 번째 파일까지 왔나」의 분자다. */
  filesDone: number;
  cut: number;
  cutDone: number;
}

/** `unit.id` → 이름. 대지가 없는 리포는 빈 표이고 모든 파일이 「대지 밖」에 모인다. */
export const loadUnitNames = async (repoId: number): Promise<Map<number, string>> =>
  new Map((await ipc.store.query('clone.units', { repoId })).map((u) => [u.id, u.name]));

/** 목차 한 벌. 조각은 열린 파일 것만 있으므로 SQL 한 번으로 충분하다. */
export async function loadToc(run: CloneRun, names: Map<number, string>): Promise<Toc> {
  return foldToc(run, await courseSteps(run.id), names);
}

/**
 * 목차를 그릴 모양으로 접는다. **순수 함수다** — 파일 순서는 `order_json` 이 정하고
 * 여기서 다시 정렬하지 않는다(대지 순서는 이미 그 안에 녹아 있다).
 */
export function foldToc(
  run: CloneRun,
  steps: readonly CloneStepRow[],
  names: Map<number, string>,
  noUnitName = '',
): Toc {
  const bySeq = new Map<number, CloneStepRow[]>();
  for (const step of steps) {
    const list = bySeq.get(step.seq);
    if (list === undefined) bySeq.set(step.seq, [step]);
    else list.push(step);
  }

  const units: TocUnit[] = [];
  let filesDone = 0;
  let cut = 0;
  let cutDone = 0;

  for (const [seq, file] of run.steps.entries()) {
    const rows = bySeq.get(seq) ?? [];
    // `stale` 은 셈에서 뺀다 — 무효가 된 자리를 분모에 두면 진행률이 영영 100 이 안 된다.
    const live = rows.filter((r) => r.status !== 'stale');
    const done = live.filter((r) => r.status === 'done').length;
    cut += live.length;
    cutDone += done;
    if (live.length > 0 && done === live.length) filesDone += 1;

    const entry: TocFile = {
      seq,
      fileId: file.fileId,
      path: file.path,
      parts: rows.map((r) => ({
        id: r.id, part: r.part, status: r.status, pct: r.pct,
        lineStart: r.line_start, lineEnd: r.line_end,
      })),
      done,
      total: live.length,
    };

    const last = units.at(-1);
    if (last !== undefined && last.unitId === file.unitId) last.files.push(entry);
    else {
      units.push({
        unitId: file.unitId,
        name: file.unitId === null ? noUnitName : names.get(file.unitId) ?? noUnitName,
        files: [entry],
      });
    }
  }

  return { units, files: run.steps.length, filesDone, cut, cutDone };
}

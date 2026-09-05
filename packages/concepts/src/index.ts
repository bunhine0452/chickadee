export { inBatches } from './batch.js';
export { classify, isAnswerKey, isMine, suggestIdentities, BULK_FILES, BULK_INSERTIONS } from './commits.js';
export { reclassifyCommits, suggestIdentitiesFor } from './identities.js';
export type { ClassifyCount } from './identities.js';
export type { CommitFacts, CommitKind, Identity } from './commits.js';
export { deriveFile, shapeOf, siteKey, SYSTEM_QUERIES } from './derive.js';
export type { ConfidenceOf, DeriveResult, DerivedSite, RawBlock, RawImport } from './derive.js';
export { buildGaps, HOT_COUNT } from './gaps.js';
export type { CountableSite, GapInput, GapRow } from './gaps.js';
export {
  EXCLUDE_DIRS, EXCLUDE_FILES, EXCLUDE_GLOBS, GENERATED_MARKERS, LIMITS,
  OVERSIZE_FILE_LINES, OVERSIZE_SITES_PER_CONCEPT, OVERSIZE_SITE_LINES, isTestPath,
  globProblem, parseGlobs,
} from './ingest-defaults.js';
export type { GlobProblem } from './ingest-defaults.js';
export { commitOrder, courseOrder, depOrder, COMMIT_ORDER_MIN } from './clone-order.js';
export type {
  CourseEdge, CourseFile, CourseOrder, CourseStep, CourseUnit, CommitTouch, OrderInput,
} from './clone-order.js';
export { courseStage, keepCardStage, BLANK_FROM_LAYER, COURSE_STAGE } from './clone-fading.js';
export { assignUnits, entryUnits, planUnits, MIN_FILES_FOR_UNIT, OTHER_UNIT } from './units.js';
export type { EntrySeed, FeatureUnit, UnitPlan } from './units.js';
export type { Assignment, UnitOf } from './units.js';
export {
  chooseFirst, distinctShapes, innermostBlock, knownSet, lineIndex, unknownCount,
  windowRange, windowUnknown,
  WINDOW_MAX_LINES, WINDOW_PAD,
  LONG_SITE_LINES, MAX_UNKNOWN_FOR_NEW, PREREQ_DEPTH, TRANSFER_LAYER, UNCOVERED_THRESHOLD,
} from './unknown-rank.js';
export type {
  ChoosableSite, LayerOf, LineIndex, LineSpan, MasteryRow, RankableSite, WindowSite,
} from './unknown-rank.js';
export {
  CARD_ONLY_SITE_ID, NEWCOMER_CLEAR_OKS, NEWCOMER_MIN_MISSES, NEWCOMER_MIN_ROOT_NEW, UNKNOWN_CAP,
  isRockBottom, levelForLayer, newcomerFlag, rankNewConcepts, transferFrom,
} from './new-rank.js';
export type {
  BestSite, NewCandidate, NewcomerFlag, NewcomerInput, RankInput, RankedConcept, RootResult,
  TransferSource,
} from './new-rank.js';
export {
  ZERO_CHAPTER_MAX, ZERO_CHAPTER_MAX_DEPTH, ZERO_CHAPTER_ORDER, ZERO_CHAPTER_UNIT,
  isDone as zeroChapterDone, rootCleared, shouldOpen as shouldOpenZeroChapter, zeroChapterPlates,
} from './zero-chapter.js';
export type {
  ZeroChapterDoneInput, ZeroChapterInput, ZeroChapterPlate,
} from './zero-chapter.js';
export { topoOrder } from './prereq-graph.js';
export type { GraphNode } from './prereq-graph.js';
export { resolveImports } from './resolve-imports.js';
export type {
  EdgeKind, FileImports, ResolveInput, ResolvedEdge, TsconfigPaths,
} from './resolve-imports.js';
export { registerRepo, cloneRepo, cloneTargetName, listRepos, relocateRepo, removeRepo } from './repos.js';
export { BLAME_BUDGET_MS, fillCommits } from './blame.js';
export type { BlameOptions } from './blame.js';
export {
  deriveRepo, loadMastery, materializeDict, recountUnknown, runIngest, writeUnitNodes,
  writeZeroChapter,
} from './ingest.js';
export type { IngestOptions, IngestReport, Phase } from './ingest.js';

/** 코스 (D162). */
export { buildCourse } from './course.js';
export type { Chapter, CourseOptions } from './course.js';

/** 요청 한 줄기 — 2단 추적의 재료 (D162). 메서드 단위 줄기와 등뼈는 D168. */
export { featurePath, methodPaths, requestPaths, trunk } from './path.js';
export type { Hop, MethodHop } from './path.js';

/** 블록 단위 호출 그래프 · 스키마 (D168 · D169) — 코스 굽기(D172)가 순수 파이프라인으로 쓴다. */
export { buildCallGraph, MODULE_BLOCK } from './calls.js';
export type { BlockRef, CallEdge, CallGraph, CallGraphInput, CallKind, EntryPoint, FileBlocks } from './calls.js';
export { extractSchema } from './schema.js';
export type { ColumnBinding, Schema, SchemaColumn, SchemaFk, SchemaTable } from './schema.js';

/** 챕터 진도 — 단 판정·막힘 처방·원장 (D165). */
export {
  DUNNO_FOLD_LIMIT, FOLD_HOPS, PREDICT_PASS, advance, deferChapter, foldPath, fromChapterRow,
  passTarget, readingTally, recordStageResult, stagePasses, stuckAction,
} from './progress.js';
export type {
  Advance, AdvanceInput, ChapterProgress, ChapterSchedule, ChapterStage, RecheckGrade, RecordInput,
  StageKind, StageResult, StuckAction,
} from './progress.js';

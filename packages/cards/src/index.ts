export { contentHash, fnv1a64 } from './hash.js';
export {
  codeLines, inWindow, promptLines, windowOf,
  LINES_WINDOW, PROMPT_WINDOW, WINDOW_MAX_LINES,
} from './lines.js';
export type { Span } from './lines.js';
export { GEN_VERSION } from './payload.js';
export { generateKind, generateT0, prefer } from './t0.js';
export { genBlank } from './t0-blank.js';
export { genMeaning } from './t0-meaning.js';
export { genPoint } from './t0-point.js';
export {
  ABSENCE_MESSAGE_KEY, absenceReason, isSynthetic, makeAbsentCard, makeSyntheticCard,
  SYNTHETIC_SITE_ID,
} from './t0-synthetic.js';
export type { AbsenceReason, AbsentRequest, SyntheticRequest } from './t0-synthetic.js';
export { buildFirstRun, makeExecCard, renderFirstRun, EXEC_SITE_ID } from './t0-exec.js';
export { makeProtoCard, PROTO_SITE_ID } from './t0-proto.js';
export type { ProtoRequest } from './t0-proto.js';
export type { ExecPick, ExecQuestion, ExecRequest, WrongBecause } from './t0-exec.js';
export {
  DIALECTS, blockOf, dialectOf, execFacts, functionsIn, lineIndex, statementsOf, terminatorAt,
} from './exec-facts.js';
export type { Dialect, ExecFacts } from './exec-facts.js';
export { isFailure, isNoPlate } from './types.js';
export type {
  FocusLine, GenResult, LineWindow, NoPlate, OtherUse, SiteInput,
  T0Card, T0Kind, T0Payload, T0Request,
} from './types.js';
export { baseName } from './vars.js';
export { generateT1, genericWhyHelp, genericWhyQ } from './t1.js';
export {
  pickConcept, rankBlocks, segment, signatureRange,
  FIRST_PRINT_LINES, MAX_BLOCK_LINES, MAX_UNKNOWN_CONCEPTS, MIN_BLOCK_LINES,
} from './t1-block.js';
export type { PickedConcept, PickOptions, RankOptions, RankResult, Segment, SegmentOptions } from './t1-block.js';
export { keepKinds, keepSet, placeholderWidth } from './t1-mask.js';
export type { KeepKind } from './t1-mask.js';
export { buildSpec, EXTRA_LIMIT } from './t1-spec.js';
export type { SpecInput } from './t1-spec.js';
export { isT1Card } from './t1-types.js';
export type {
  BlockCandidate, BlockConcept, SpecCard, T1Card, T1Payload, T1Request,
} from './t1-types.js';

// T2 — 구조 (04 §7~§8 · D97)
export { generateT2 } from './t2.js';
export { buildGraph, condense, isEntry } from './t2-graph.js';
export type { GraphInput, Scc } from './t2-graph.js';
export {
  buildKey, candidates, isExcludedPath, question, subjectOf, trapReason,
  CORE_CHANGED_LINES, CO_CHANGE_CORE, CO_CHANGE_RATIO, MAX_SOURCE_FILES, MIN_SOURCE_FILES,
  MIN_SUBJECT_CHARS,
} from './t2-key.js';
export type { KeyInput } from './t2-key.js';
export {
  buildDirection, buildFlow, buildRadius,
  DIRECTION_PAIRS, FLOW_DECOYS, FLOW_MAX, FLOW_MIN,
} from './t2-quiz.js';
export type { DirectionAnswer, DirectionQuiz, FlowQuiz, QuizInput, RadiusQuiz } from './t2-quiz.js';
export { isT2Card, BANDS, MAX_NODES, MIN_COMMITS_FOR_PLACEMENT } from './t2-types.js';
export type {
  AnswerKey, Band, CommitFileRow, CommitRow, Graph, GraphEdge, GraphFile,
  T2Card, T2Kind, T2Payload, T2Request,
} from './t2-types.js';

// 코스 문항 16유형 (D164)
export { buildCourseCards, buildStageCards, conceptsOnPath, TYPES_OF_STAGE } from './stage.js';
export {
  buildContracts, buildCuts, buildOrigins, buildReorders, buildTwins, findGuards, swapPairs,
  MAX_CONTRACT, MAX_CUT, MAX_ORIGIN, MAX_REORDER, MAX_TWIN,
} from './stage-choice.js';
export { buildCallers, buildExecs, buildHops, layerOf, splitHops, MAX_CALLER, MAX_EXEC, MAX_HOP } from './stage-trace.js';
export {
  buildReimpls, buildRepairs, fixSubject, linksBetween, signatureOf, MAX_PER_TYPE, MAX_REIMPL_LINES,
  MIN_REIMPL_LINES,
} from './stage-edit.js';
export { finishStage, hopOrder, identsOf, nodeId, stageSeed, STAGE_CONCEPTS } from './stage-common.js';
export { KIND_OF, STAGE_OF } from './stage-types.js';
export type {
  Hunk, HunkLine, JudgeTest, NameUse, ResponseKey, StageBlock, StageCard, StageCommit, StageDrop, StageEdge,
  StageFile, StageRequest, StageResult, StageSite, StageTestFile, StageType,
} from './stage-types.js';
// 판정용 테스트 (D180)
export {
  commitTests, contractTest, isTestPath, javaFqn, judgeTests, namedTests, parseJavaSignature, simpleName,
  springTests, JUDGE_PACKAGE,
} from './stage-tests.js';
export type { JudgeTestInput, MethodContract } from './stage-tests.js';

// 기초 문항 — 고르지 않고 적는다 (`docs/program/fundamentals.md`)
export {
  buildAllValueItems, buildValueItems, valueText, FUND_DIALECTS, FUND_LANGS, FUND_SITE_ID,
} from './fundamentals.js';
export type {
  FoldStep, FundDialect, FundDrop, FundItem, FundLang, FundType, FundValue, OverflowRule,
} from './fundamentals.js';

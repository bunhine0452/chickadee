export { contentHash, fnv1a64 } from './hash.js';
export { codeLines, promptLines, LINES_WINDOW, PROMPT_WINDOW } from './lines.js';
export type { Span } from './lines.js';
export { GEN_VERSION } from './payload.js';
export { generateKind, generateT0, prefer } from './t0.js';
export { genBlank } from './t0-blank.js';
export { genMeaning } from './t0-meaning.js';
export { genPoint } from './t0-point.js';
export { isFailure, isNoPlate } from './types.js';
export type {
  FocusLine, GenResult, NoPlate, OtherUse, SiteInput, T0Card, T0Kind, T0Payload, T0Request,
} from './types.js';
export { baseName } from './vars.js';
export { generateT1, GENERIC_WHY_HELP, GENERIC_WHY_Q } from './t1.js';
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

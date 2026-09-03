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

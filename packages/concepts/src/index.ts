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
export { assignUnits, MIN_FILES_FOR_UNIT, OTHER_UNIT } from './units.js';
export type { Assignment, UnitOf } from './units.js';
export {
  chooseFirst, distinctShapes, knownSet, unknownCount,
  LONG_SITE_LINES, MAX_UNKNOWN_FOR_NEW, PREREQ_DEPTH, TRANSFER_LAYER, UNCOVERED_THRESHOLD,
} from './unknown-rank.js';
export type { ChoosableSite, LayerOf, MasteryRow, RankableSite } from './unknown-rank.js';
export {
  NEWCOMER_CLEAR_OKS, NEWCOMER_MIN_MISSES, NEWCOMER_MIN_ROOT_NEW, UNKNOWN_CAP,
  isRockBottom, levelForLayer, newcomerFlag, rankNewConcepts, transferFrom,
} from './new-rank.js';
export type {
  BestSite, NewCandidate, NewcomerFlag, NewcomerInput, RankInput, RankedConcept, RootResult,
  TransferSource,
} from './new-rank.js';
export { topoOrder } from './prereq-graph.js';
export type { GraphNode } from './prereq-graph.js';
export { resolveImports } from './resolve-imports.js';
export type {
  EdgeKind, FileImports, ResolveInput, ResolvedEdge, TsconfigPaths,
} from './resolve-imports.js';
export { registerRepo, listRepos, relocateRepo, removeRepo } from './repos.js';
export { BLAME_BUDGET_MS, fillCommits } from './blame.js';
export type { BlameOptions } from './blame.js';
export { deriveRepo, materializeDict, recountUnknown, runIngest, writeUnitNodes } from './ingest.js';
export type { IngestOptions, IngestReport, Phase } from './ingest.js';

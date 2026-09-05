// 코스 카드 굽기 (D172). `ui → course → cards | concepts` — 01 §2 의 층에 하나 더 선다.
export {
  bakeChapter, bakeCourse, bakeSiteless, dictVersionOf, ensureChapterBaked, loadMaterials,
} from './bake.js';
export type { BakeDeps, ChapterBake, SitelessBake, StageTally } from './bake.js';
export {
  AST_MAX_BLOCKS, AST_MAX_LINES, FULL_READ_MAX, RANGE_PAD, assembleStageRequest, astGrammar, deriveNames,
  deriveResponseKeys, loadedSites, stageBlocks, stageGrammar,
} from './materials.js';
export type { BindingRow, BlockRow, ColumnRow, FileText, Materials } from './materials.js';
export { hopRanges, mergeRanges, toMethodHops, trunkHops } from './hops.js';
export type { HopKind, HopRow, LineRange } from './hops.js';
export { lineDiff, DIFF_CELLS, DIFF_CONTEXT } from './diff.js';
export { borrowedInput, evidenceBlock, lenders, pickLender } from './borrow.js';
export type { LenderSite } from './borrow.js';

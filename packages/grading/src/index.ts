export type { RunnerAdapter } from './t3-adapter.js';
export { runners } from './t3-adapter.js';

// T0 — 판정과 진단 (04 §2.1)
export { gradeT0, pickDiag } from './t0.js';
export type { Diag, T0Card, T0Kind, T0Result, T0Verdict } from './t0.js';

// T0 — 리뷰 로그 이벤트 (04 §2.2)
export { isLifer, outcomeOf, t0Answered, toReviewDetail } from './t0-event.js';
export type { T0Answered, T0AnsweredInput, T0Outcome } from './t0-event.js';

// T0 — 재출제 규칙 (04 §2.3)
export { CONSECUTIVE_WRONG_TO_EASE, nextKind, pickRetrySite, planRetry } from './t0-retry.js';
export type { RetryCandidate, RetryCurrent, RetryRequest } from './t0-retry.js';

// 「모르겠어요」 사다리 (04 §2.4)
export {
  buildDict, buildLadder, buildPrereq, buildPrompt, buildUses,
  fileBaseName, KNOWN_LAYER, MAX_PROMPT_LINES, MAX_USES, plainText, promptCodeLines, selectionLabel,
} from './ladder.js';
export type {
  ConceptRef, Ladder, LadderInput, PrereqFacts, PrereqRung, PrereqRungs, PrereqStatus,
  PromptInput, UseMeta, UseRef,
} from './ladder.js';

// T1 — 판정 엔진 (04 §4)
export { align, GAP, PAIR_MIN, SAME_LINE_MIN, WINDOW } from './t1-align.js';
export type { Alignment, Pair } from './t1-align.js';
export {
  canPromote, cover, ERROR_RATIO_LIMIT, lineAt, lineStarts, MAX_RUN_LINES, promote, runsOf,
  sequence, templateVersusConcat,
} from './t1-ast.js';
export type { AstDetail, AstOutcome, AstPair, Covered, PromoteInput } from './t1-ast.js';
export {
  compareLine, evalLine, GUTTER_WINDOW, indentWidth, isCommentOnly, normalizeQuotes, sim,
  stripTrailingComment, tokenText,
} from './t1-line.js';
export type { LineCompare, LineStatus } from './t1-line.js';
export {
  buildProt, BUILTINS, builtinsFor, freeIdents, isIdent, looksLikeJsx, meaningful, origIdents,
  protectedAt,
} from './t1-prot.js';
export type { ProtInput } from './t1-prot.js';
export { judgeRenames } from './t1-rename.js';
export type { RenameInput, RenameVerdict } from './t1-rename.js';
export { advanceThreshold, gradeT1, nextStage, toT1Detail, verdictOf } from './t1-result.js';
export type { T1Input } from './t1-result.js';
export { REASON_CODES, T1_ENGINE_VERSION } from './t1-types.js';
export type {
  AppealVerdict, Engine, Reason, ReasonCode, Status, T1Result, T1Row, Tick,
} from './t1-types.js';

// T1 — 이의 (04 §5)
export {
  canAppeal, CATALOG, draftAppeal, issueUrl, NEVER_EQUIV, patternKey, ruleLabel, shapeSignature,
  suggest, SUGGEST_MIN,
} from './t1-appeal.js';
export type {
  AppealDraft, CatalogKey, CatalogRule, IssueInput, PatternGroup, PatternInput, Suggestion,
} from './t1-appeal.js';

// T1 — 왜 게이트 (04 §6)
export {
  checkWhy, COPY_SIM_LIMIT, draftWhy, genericHelp, genericQ, hasWord, MIN_CHARS, pickQuestion,
} from './t1-why.js';
export type { Question, QuestionId, WhyCheck, WhyDraft, WhyPayload } from './t1-why.js';

// T2 — 구조 채점 (04 §8.2·§8.3)
export { gradeDirection, gradeFlow, gradePicks, toT2Detail } from './t2.js';
export type { DirectionInput, FlowInput, PicksInput } from './t2.js';
export { cappedNote, foldedNote, T2_ENGINE_VERSION, unchangedNote } from './t2-types.js';
export type { T2Detail, T2Payload, T2Result, T2Row, T2Tier } from './t2-types.js';
export type { T2Kind as T2QuestionKind } from './t2-types.js';

// T2 — 「이것도 맞다」 (04 §8.4)
export { draftT2Appeal, pickRelation, promoteToSec, t2PatternKey, PROMOTE_MIN } from './t2-appeal.js';
export type { PickRelation, T2AppealDraft, T2AppealInput } from './t2-appeal.js';

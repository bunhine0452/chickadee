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
